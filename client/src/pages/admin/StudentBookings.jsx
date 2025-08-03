// client/src/pages/admin/StudentBookings.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select'; // --- MODIFICATION: Import Select for the new filter ---
import { FiEye, FiInfo, FiSend, FiInbox, FiLink, FiUsers, FiVideo, FiUpload, FiClipboard, FiCheckCircle, FiAlertTriangle, FiTrash2, FiSearch, FiFilter, FiX } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from 'xlsx';
import {
    getPublicBookings, updatePublicBookingLink, getStudentPipeline, updateStudentBooking, getUniqueHostEmails, generateGoogleMeetLink,
    getDomains
} from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';
import { formatDateTime, formatDate } from '@/utils/formatters';

// --- SELF-CONTAINED UI COMPONENTS (Kept from previous version as they are fine) ---
const LocalButton = ({ children, onClick, isLoading = false, variant = 'primary', icon: Icon, className = '', disabled = false, type = 'button' }) => {
    const baseClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm";
    const variantClasses = { primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm', outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm', };
    return ( <button type={type} onClick={onClick} disabled={isLoading || disabled} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{isLoading ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Loading...</>) : (<>{Icon && <Icon className="mr-2 h-4 w-4" />}{children}</>)}</button> );
};
const LocalSearchInput = ({ value, onChange, placeholder }) => ( <div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" value={value} onChange={onChange} placeholder={placeholder} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" /></div>);
const LocalLoader = () => ( <div className="flex justify-center items-center py-20 text-center text-gray-500"><div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div><span className="ml-4">Loading data...</span></div>);
const LocalEmptyState = ({ message, icon: Icon }) => (<div className="text-center py-20 text-gray-500"><Icon className="mx-auto h-10 w-10 text-gray-400 mb-2" /><h3 className="font-semibold text-gray-700">No Data Found</h3><p className="text-sm">{message}</p></div>);
const LocalTable = ({ columns, data, isLoading, emptyMessage, emptyIcon }) => (<div className="w-full overflow-x-auto"><table className="min-w-full bg-white divide-y divide-gray-200"><thead className="bg-gray-50"><tr>{columns.map(col => (<th key={col.key} scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: col.minWidth}}>{col.title}</th>))}</tr></thead><tbody className="divide-y divide-gray-200">{isLoading ? (<tr><td colSpan={columns.length}><LocalLoader /></td></tr>) : data.length === 0 ? (<tr><td colSpan={columns.length}><LocalEmptyState message={emptyMessage} icon={emptyIcon} /></td></tr>) : (data.map((row, rowIndex) => (<tr key={row._id || rowIndex} className="hover:bg-gray-50 transition-colors"> {columns.map(col => (<td key={col.key} className={`px-4 whitespace-nowrap text-sm text-gray-700 align-middle`}>{col.render ? col.render(row, rowIndex) : row[col.key]}</td>))}</tr>)))}</tbody></table></div>);


const AuthorizeStudentsModal = ({ isOpen, onClose, onSave, publicBookingId }) => {
    const { showError, showSuccess } = useAlert();
    const fileInputRef = useRef(null);
    const [pastedText, setPastedText] = useState('');
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setPastedText('');
            setStudents([]);
            setIsLoading(false);
            if(fileInputRef.current) fileInputRef.current.value = null;
        }
    }, [isOpen]);

    const processData = (data) => {
        if (!data) return;
        const rows = data.trim().split('\n');
        const parsed = rows
            .map(row => {
                const columns = row.split(/\t|,/);
                if (columns.length > 0 && columns.some(c => c.trim() !== '')) {
                    return {
                        hiringName: columns[0]?.trim() || '',
                        domain: columns[1]?.trim() || '',
                        userId: columns[2]?.trim() || '',
                        fullName: columns[3]?.trim() || '',
                        email: columns[4]?.trim().toLowerCase() || '',
                        mobileNumber: columns[5]?.trim() || '',
                        resumeLink: columns[6]?.trim() || ''
                    };
                }
                return null;
            }).filter(Boolean);

        const validated = parsed.map(student => {
            if (!student.email || !/\S+@\S+\.\S+/.test(student.email)) return { ...student, _isValid: false, _error: 'Invalid or missing email.' };
            if (!student.fullName) return { ...student, _isValid: false, _error: 'Full Name is required.' };
            return { ...student, _isValid: true, _error: null };
        });

        setStudents(validated);
        setPastedText(data);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => processData(event.target.result);
            reader.readAsText(file);
        }
    };

    const handleClear = () => {
        setStudents([]);
        setPastedText('');
        if(fileInputRef.current) fileInputRef.current.value = null;
    };
    
    const handleSave = async () => {
        const validStudents = students.filter(s => s._isValid).map(({ _isValid, _error, ...rest }) => rest);
        if (validStudents.length === 0) return showError("No valid student data found.");
        
        setIsLoading(true);
        await onSave(publicBookingId, validStudents);
        setIsLoading(false);
        onClose();
    };

    const validCount = students.filter(s => s._isValid).length;
    const invalidCount = students.length - validCount;
    
    return isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-7xl bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Authorize & Invite Students</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><FiX size={20}/></button>
                </div>
                
                <div className="p-6 flex-grow overflow-y-auto space-y-5 bg-gray-50/50">

                    <div className="relative">
                        <textarea
                            value={pastedText}
                            onChange={(e) => processData(e.target.value)}
                            placeholder="Paste your student data here..."
                            className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm resize-none"
                        />
                         <div className="absolute top-4 right-4">
                             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" id="csv-upload" />
                             <label htmlFor="csv-upload" className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-full px-3 py-1.5 cursor-pointer hover:bg-blue-50">
                                <FiUpload size={14}/>
                                Upload CSV
                            </label>
                         </div>
                    </div>

                    {students.length > 0 && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                                <div className="flex items-center gap-4 text-sm font-medium">
                                    {validCount > 0 && <span className="flex items-center text-green-700"><FiCheckCircle className="mr-1.5"/>{validCount} Valid</span>}
                                    {invalidCount > 0 && <span className="flex items-center text-red-700"><FiAlertTriangle className="mr-1.5"/>{invalidCount} Invalid</span>}
                                </div>
                                <LocalButton variant="outline" icon={FiTrash2} onClick={handleClear} className="!text-xs !py-1 !px-2">Clear Data</LocalButton>
                            </div>
                            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-100 sticky top-0"><tr className="text-left text-xs font-semibold text-gray-600 uppercase">
                                        <th className="p-2 w-12 text-center">Status</th>
                                        <th className="p-2">Hiring Name</th>
                                        <th className="p-2">Domain</th>
                                        <th className="p-2">User ID</th>
                                        <th className="p-2">Full Name</th>
                                        <th className="p-2">Email ID</th>
                                        <th className="p-2">Mobile Number</th>
                                        <th className="p-2">Resume Link</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {students.map((s, i) => (
                                            <tr key={i} className={!s._isValid ? 'bg-red-50' : 'bg-white'}>
                                                <td className="p-2 text-center">{s._isValid ? <FiCheckCircle className="text-green-500 mx-auto"/> : <FiAlertTriangle className="text-red-500 mx-auto" title={s._error}/>}</td>
                                                <td className="p-2">{s.hiringName}</td>
                                                <td className="p-2">{s.domain}</td>
                                                <td className="p-2">{s.userId}</td>
                                                <td className="p-2 font-medium">{s.fullName}</td>
                                                <td className="p-2 text-gray-600">{s.email}</td>
                                                <td className="p-2 text-gray-600">{s.mobileNumber}</td>
                                                <td className="p-2 text-gray-600">
                                                    {s.resumeLink ? <a href={s.resumeLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a> : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl border-t">
                    <LocalButton variant="outline" onClick={onClose}>Cancel</LocalButton>
                    <LocalButton variant="primary" icon={FiSend} onClick={handleSave} isLoading={isLoading} disabled={validCount === 0}>
                        {isLoading ? 'Processing...' : `Save & Invite ${validCount} Students`}
                    </LocalButton>
                </div>
            </div>
        </div>
    ) : null;
};

const EditableDomainCell = ({ booking, domainOptions, onSave }) => {
    const { showSuccess, showError } = useAlert();
    const [currentValue, setCurrentValue] = useState(booking.domain || '');
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => { setCurrentValue(booking.domain || ''); }, [booking.domain]);
    const handleSave = async (newDomain) => {
        if (newDomain === currentValue) return;
        setIsLoading(true); setCurrentValue(newDomain);
        try { await updateStudentBooking(booking._id, { domain: newDomain }); onSave(booking._id, 'domain', newDomain); showSuccess("Domain updated successfully."); }
        catch (err) { showError("Failed to update domain."); setCurrentValue(booking.domain || ''); }
        finally { setIsLoading(false); }
    };
    return ( <select value={currentValue} onChange={(e) => handleSave(e.target.value)} disabled={isLoading} className={`w-full text-xs font-semibold px-2 py-1.5 border rounded-md shadow-sm focus:outline-none focus:ring-1 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 ${isLoading ? 'opacity-50' : ''}`} onClick={(e) => e.stopPropagation()}><option value="" disabled>Select Domain</option>{domainOptions.map(opt => (opt.value && <option key={opt.value} value={opt.value}>{opt.label}</option>))}</select>);
};
const EditableHostEmail = ({ booking, hostEmails, onSave }) => {
    const [value, setValue] = useState(booking.hostEmail ? { label: booking.hostEmail, value: booking.hostEmail } : null);
    const [isLoading, setIsLoading] = useState(false);
    const { showSuccess, showError } = useAlert();
    const options = hostEmails.map(email => ({ label: email, value: email }));
    const selectStyles = { menuPortal: base => ({ ...base, zIndex: 9999 }), control: (base) => ({...base, fontSize: '0.875rem', minHeight: '38px' }), menu: (base) => ({ ...base, fontSize: '0.875rem' }) };
    const handleChange = (newValue) => { setValue(newValue); handleSave(newValue); };
    const handleSave = async (selectedOption) => {
        const newEmail = selectedOption ? selectedOption.value : ''; if (newEmail === (booking.hostEmail || '')) return;
        setIsLoading(true);
        try { await updateStudentBooking(booking._id, { hostEmail: newEmail }); onSave(booking._id, 'hostEmail', newEmail); showSuccess("Host email updated.");
        } catch (err) { showError("Failed to update host email."); setValue(booking.hostEmail ? { label: booking.hostEmail, value: booking.hostEmail } : null); }
        finally { setIsLoading(false); }
    };
    return ( <CreatableSelect isClearable isDisabled={isLoading} isLoading={isLoading} onChange={handleChange} value={value} options={options} placeholder="Add or select email..." className="min-w-[250px]" menuPortalTarget={document.body} menuPosition={'fixed'} styles={selectStyles}/> );
};
const EditableInputCell = ({ booking, fieldKey, value, onSave }) => {
    const [currentValue, setCurrentValue] = useState(value || '');
    const [isLoading, setIsLoading] = useState(false);
    const { showSuccess, showError } = useAlert();
    useEffect(() => { setCurrentValue(value || ''); }, [value]);
    const handleSave = async () => {
        const originalValue = value || ''; if (currentValue.trim() === originalValue.trim()) return;
        setIsLoading(true);
        try { await updateStudentBooking(booking._id, { [fieldKey]: currentValue.trim() }); onSave(booking._id, fieldKey, currentValue.trim()); showSuccess("Field updated successfully.");
        } catch (err) { showError(`Failed to update ${fieldKey}.`); setCurrentValue(originalValue); } 
        finally { setIsLoading(false); }
    };
    return ( <input type="text" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} onBlur={handleSave} disabled={isLoading} placeholder="Event Title (auto-generated)" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm disabled:bg-gray-100" /> );
};
const MeetLinkCell = ({ booking, onLinkGenerated }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { showSuccess, showError } = useAlert();
    const canGenerate = booking.studentEmail && booking.interviewerEmail && booking.hostEmail && booking.eventTitle;
    const handleGenerate = async () => {
        setIsLoading(true);
        try { const response = await generateGoogleMeetLink(booking._id); onLinkGenerated(booking._id, 'meetLink', response.data.data.meetLink); showSuccess('Google Meet link generated!');
        } catch (error) { showError(error.response?.data?.message || 'Failed to generate Meet link.'); } 
        finally { setIsLoading(false); }
    };
    return (<LocalButton onClick={handleGenerate} isLoading={isLoading} disabled={!canGenerate} icon={FiVideo} className="!text-xs !py-1.5" title={!canGenerate ? 'All emails and event title are required to generate a link.' : 'Generate Google Meet link'}>Generate</LocalButton>);
};

const ManagePublicLinks = () => {
    const { showSuccess, showError } = useAlert();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [publicBookings, setPublicBookings] = useState([]);
    const [modal, setModal] = useState({ isOpen: false, id: null });
    const [savingId, setSavingId] = useState(null);

    const fetchPublicBookings = useCallback(async () => {
        setLoading(true);
        try { const response = await getPublicBookings(); setPublicBookings(response.data.data);
        } catch (err) { showError("Failed to fetch public booking links."); } 
        finally { setLoading(false); }
    }, [showError]);
    
    useEffect(() => { fetchPublicBookings(); }, [fetchPublicBookings]);

    const handleAuthorize = async (id, students) => {
        setSavingId(id);
        try {
            const response = await updatePublicBookingLink(id, { students });
            showSuccess(response.data.message || 'Invitations processed successfully!');
            fetchPublicBookings();
        } catch (err) { showError('Failed to send invitations.'); } 
        finally { setSavingId(null); }
    };
    
    const columns = useMemo(() => [
        { key: 'createdAt', title: 'Created', render: row => formatDateTime(row.createdAt), minWidth: '180px' },
        { key: 'publicId', title: 'Public Link', render: row => <a href={`/book/${row.publicId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">/book/{row.publicId}</a> },
        { key: 'interviewers', title: 'Interviewers', render: (row) => { const uniqueInterviewers = [...new Set(row.interviewerSlots.map(s => `${s.interviewer.user.firstName} ${s.interviewer.user.lastName}`))]; return ( <div className="relative group flex items-center gap-2"><span className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md text-xs">{uniqueInterviewers.length} Assigned</span><FiInfo className="text-gray-400 cursor-pointer"/><div className="absolute left-0 bottom-full mb-2 w-max max-w-xs p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"><ul className="list-disc list-inside">{uniqueInterviewers.map((name, index) => <li key={index}>{name}</li>)}</ul></div></div> ); }},
        { key: 'authorizedCount', title: 'Authorized Students', render: row => `${row.allowedStudents?.length || 0} students`},
        { key: 'actions', title: 'Actions', render: row => ( <div className="flex items-center gap-2"><LocalButton isLoading={savingId === row._id} onClick={() => setModal({isOpen: true, id: row._id})} icon={FiUsers} className="!text-xs !py-1.5">Authorize & Invite</LocalButton><LocalButton variant="outline" onClick={() => navigate(`/admin/public-bookings/${row._id}/tracking`)} className="!p-2"><FiEye/></LocalButton></div>)},
    ], [navigate, savingId]);

    return <>
        <LocalTable columns={columns} data={publicBookings} isLoading={loading} emptyMessage="No public links have been created yet." emptyIcon={FiLink} />
        <AuthorizeStudentsModal isOpen={modal.isOpen} onClose={() => setModal({isOpen: false, id: null})} onSave={handleAuthorize} publicBookingId={modal.id} />
    </>;
};
const ConfirmedStudentSlots = () => {
    const { showError } = useAlert();
    const [loading, setLoading] = useState(true);
    const [studentBookings, setStudentBookings] = useState([]);
    const [hostEmails, setHostEmails] = useState([]);
    const [domainsList, setDomainsList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    // --- MODIFICATION: Added publicId to filter state ---
    const [tempFilters, setTempFilters] = useState({ date: null, domain: '', publicId: '' });
    const [activeFilters, setActiveFilters] = useState({ date: null, domain: '', publicId: '' });
    const [publicBookingOptions, setPublicBookingOptions] = useState([]); // State for dropdown options

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [pipelineRes, emailsRes, domainsRes, publicBookingsRes] = await Promise.all([
                getStudentPipeline(),
                getUniqueHostEmails(),
                getDomains(),
                getPublicBookings() // Fetch public bookings for the filter dropdown
            ]);
            setStudentBookings(pipelineRes.data.data);
            setHostEmails(emailsRes.data.data);
            setDomainsList(domainsRes.data.data);

            const options = (publicBookingsRes.data.data || []).map(b => ({
                value: b.publicId,
                label: `ID: ${b.publicId} (Created: ${formatDate(b.createdAt)})`,
            }));
            setPublicBookingOptions(options);

        } catch (err) {
            showError("Failed to load student pipeline or filter data.");
        } finally {
            setLoading(false);
        }
    }, [showError]);
    
    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);
    
    // --- MODIFICATION: Added publicId filtering logic ---
    const filteredBookings = useMemo(() => {
        let data = [...studentBookings];
        if (searchTerm) { const lowercasedFilter = searchTerm.toLowerCase(); data = data.filter(item => { const interviewerName = item.bookedInterviewer ? `${item.bookedInterviewer.user.firstName} ${item.bookedInterviewer.user.lastName}` : ''; return Object.values({ studentName: item.studentName, studentEmail: item.studentEmail, interviewer: interviewerName, userId: item.userId, domain: item.domain, }).some(value => String(value).toLowerCase().includes(lowercasedFilter)); }); }
        if (activeFilters.date) { const filterDate = new Date(activeFilters.date).toDateString(); data = data.filter(item => { if (!item.bookingDate) return false; const itemDate = new Date(item.bookingDate).toDateString(); return itemDate === filterDate; }); }
        if (activeFilters.domain) { data = data.filter(item => item.domain === activeFilters.domain); }
        if (activeFilters.publicId) { data = data.filter(item => item.publicBookingId === activeFilters.publicId); }
        return data;
    }, [studentBookings, searchTerm, activeFilters]);

    const handleApplyFilters = () => { setActiveFilters(tempFilters); setIsFilterMenuOpen(false); };
    
    // --- MODIFICATION: Clear the new publicId filter as well ---
    const handleClearFilters = () => {
        setTempFilters({ date: null, domain: '', publicId: '' });
        setActiveFilters({ date: null, domain: '', publicId: '' });
        setIsFilterMenuOpen(false);
    };

    const isFilterActive = activeFilters.date || activeFilters.domain || activeFilters.publicId;

    const domainOptions = useMemo(() => [{ value: '', label: 'All Domains' }, ...domainsList.map(domain => ({ value: domain.name, label: domain.name })) ], [domainsList]);
    const handleCellSave = (bookingId, fieldKey, newValue) => { setStudentBookings(prev => prev.map(booking => booking._id === bookingId ? { ...booking, [fieldKey]: newValue } : booking)); if (fieldKey === 'hostEmail' && newValue && !hostEmails.includes(newValue)) { setHostEmails(prev => [...prev, newValue].sort()); } };
    
    const columns = useMemo(() => [
        { key: 'hiringName', title: 'Hiring Name', minWidth: '150px' },
        { key: 'domain', title: 'Domain', minWidth: '150px', render: (row) => ( <EditableDomainCell booking={row} domainOptions={domainOptions} onSave={handleCellSave} />)},
        { key: 'userId', title: 'User ID' },
        { key: 'interviewId', title: 'Int ID', minWidth: '120px' },
        { key: 'studentName', title: 'Student Name' }, { key: 'studentEmail', title: 'Student Email' },
        { key: 'mobileNumber', title: 'Mobile Number', render: row => row.mobileNumber || row.studentPhone || '' },
        { key: 'resumeLink', title: 'Resume', render: (row) => row.resumeLink ? <a href={row.resumeLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a> : '' },
        { key: 'publicLink', title: 'Public Link', minWidth: '120px', render: (row) => row.publicBookingId ? (<a href={`/book/${row.publicBookingId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs" title={`Public Link ID: ${row.publicBookingId}`}>{row.publicBookingId}</a>) : (<div className="flex items-center h-[38px] text-xs text-gray-500 italic">N/A</div>) },
        { key: 'interviewer', title: 'Interviewer', render: row => row.bookedInterviewer ? `${row.bookedInterviewer.user.firstName} ${row.bookedInterviewer.user.lastName}` : <div className="flex items-center h-[38px] text-xs text-gray-500 italic">Pending Booking</div>  },
        { key: 'interviewerEmail', title: 'Interviewer Email', render: row => row.interviewerEmail ? row.interviewerEmail : <div className="flex items-center h-[38px] text-xs text-gray-500 italic"></div>  },
        { key: 'bookingDate', title: 'Interview Date', render: row => row.bookingDate ? formatDate(row.bookingDate) : <div className="flex items-center h-[38px] text-xs text-gray-500 italic"></div>  },
        { key: 'slot', title: 'Slot', render: row => row.bookedSlot ? `${row.bookedSlot.startTime} - ${row.bookedSlot.endTime}` : <div className="flex items-center h-[38px] text-xs text-gray-500 italic"></div>  },
        { key: 'hostEmail', title: 'Host Email', render: row => row.bookedInterviewer ? <EditableHostEmail booking={row} hostEmails={hostEmails} onSave={handleCellSave} /> : <div className="flex items-center h-[38px] text-xs text-gray-500 italic"></div>},
        { key: 'eventTitle', title: 'Event Title', minWidth: "250px", render: row => row.bookedInterviewer ? <EditableInputCell booking={row} fieldKey="eventTitle" value={row.eventTitle} onSave={handleCellSave} /> : <div className="flex items-center h-[38px] text-xs text-gray-500 italic"></div> },
        { key: 'meet', title: 'Meet', render: (row) => !row.meetLink && row.bookedInterviewer ? <MeetLinkCell booking={row} onLinkGenerated={handleCellSave} /> : <div className="flex items-center h-[38px] text-xs text-gray-500 italic"></div>  },
        { key: 'meetLink', title: 'Meet Link', render: (row) => row.meetLink ? (<a href={row.meetLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{row.meetLink}</a>) : <div className="flex items-center h-[38px] text-xs text-gray-500 italic"></div>  }
    ], [hostEmails, handleCellSave, domainOptions]);
    
    return (
    <div className="space-y-4">
        <div className="flex justify-between items-center gap-4">
            <div className="w-full max-w-sm"><LocalSearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search slots..."/></div>
            <div className="relative">
                <LocalButton variant="outline" onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}>
                    <FiFilter className="h-4 w-4 mr-2 text-blue-600"/><span className="text-blue-600">Filter</span>
                    {isFilterActive && <span onClick={(e) => { e.stopPropagation(); handleClearFilters(); }} className="ml-2 p-1 rounded-full hover:bg-gray-200"><FiX className="h-3 w-3 text-gray-500" /></span>}
                </LocalButton>
                {isFilterMenuOpen && (
                     <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-md shadow-lg border z-10 p-4">
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Interview Date</label><DatePicker selected={tempFilters.date} onChange={(date) => setTempFilters(prev => ({ ...prev, date }))} isClearable placeholderText="Select a date" className="w-full p-2 border border-gray-300 rounded-md text-sm"/></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Domain</label><select value={tempFilters.domain} onChange={(e) => setTempFilters(prev => ({...prev, domain: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white">{domainOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                            {/* --- MODIFICATION: New Filter UI --- */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Public ID</label>
                                <Select
                                    options={publicBookingOptions}
                                    value={publicBookingOptions.find(opt => opt.value === tempFilters.publicId) || null}
                                    onChange={(selectedOption) => setTempFilters(prev => ({ ...prev, publicId: selectedOption ? selectedOption.value : '' }))}
                                    isClearable
                                    isSearchable
                                    placeholder="Search or select a Public ID..."
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({...base, fontSize: '0.875rem'}), menu: base => ({...base, fontSize: '0.875rem'})}}
                                    menuPortalTarget={document.body}
                                    menuPosition={'fixed'}
                                />
                            </div>
                            {/* --- MODIFICATION END --- */}
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                            <LocalButton variant="outline" onClick={handleClearFilters} className="!text-xs">Clear</LocalButton>
                            <LocalButton variant="primary" onClick={handleApplyFilters} className="!text-xs">Apply</LocalButton>
                        </div>
                    </div>
                )}
            </div>
        </div>
        <LocalTable columns={columns} data={filteredBookings} isLoading={loading} emptyMessage="No students found in the pipeline." emptyIcon={FiUsers}/>
    </div>
    );
};
const StudentBookings = () => {
    const [activeTab, setActiveTab] = useState(0);
    const tabs = useMemo(() => [ { label: "Manage Public Links", content: <ManagePublicLinks /> }, { label: "Confirmed Student Slots", content: <ConfirmedStudentSlots /> }], []);
    return ( <div className="h-full w-full flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"><div className="px-4 border-b border-gray-200 flex-shrink-0"><nav className="-mb-px flex space-x-6">{tabs.map((tab, index) => ( <button key={tab.label} onClick={() => setActiveTab(index)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === index ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{tab.label}</button>))}</nav></div><div className="flex-grow p-4 overflow-y-auto">{tabs[activeTab].content}</div></div>);
};

export default StudentBookings;
