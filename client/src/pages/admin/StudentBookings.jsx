import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// FIX: Added FiLink to the import list
import { FiEye, FiInfo, FiSend, FiInbox, FiLink, FiClock, FiUsers } from 'react-icons/fi'; 
import { getPublicBookings, updatePublicBookingLink, getConfirmedStudentBookings } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';
import { formatDateTime, formatDate } from '@/utils/formatters';

// --- SELF-CONTAINED UI COMPONENTS ---

// A simple, local button component.
const LocalButton = ({ children, onClick, isLoading = false, variant = 'primary', icon: Icon, className = '' }) => {
    const baseClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    };

    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                </>
            ) : (
                <>
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {children}
                </>
            )}
        </button>
    );
};

// A local textarea component.
const LocalTextarea = ({ value, onChange, rows, placeholder, className = '' }) => (
    <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className={`w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm ${className}`}
    />
);

// A local loader component.
const LocalLoader = () => (
    <div className="flex justify-center items-center py-20 text-center text-gray-500">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="ml-4">Loading data...</span>
    </div>
);

// A local empty state component.
const LocalEmptyState = ({ message, icon: Icon }) => (
    <div className="text-center py-20 text-gray-500">
        <Icon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
        <h3 className="font-semibold text-gray-700">No Data Found</h3>
        <p className="text-sm">{message}</p>
    </div>
);

// The main table component.
const LocalTable = ({ columns, data, isLoading, emptyMessage, emptyIcon }) => {
    return (
        <div className="w-full overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map(col => (
                            <th key={col.key} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: col.minWidth}}>
                                {col.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                        <tr><td colSpan={columns.length}><LocalLoader /></td></tr>
                    ) : data.length === 0 ? (
                        <tr><td colSpan={columns.length}><LocalEmptyState message={emptyMessage} icon={emptyIcon} /></td></tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr key={row._id || rowIndex} className="hover:bg-gray-50 transition-colors">
                                {columns.map(col => (
                                    <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 align-top">
                                        {col.render ? col.render(row, rowIndex) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

// --- SUB-COMPONENT FOR THE "MANAGE PUBLIC LINKS" TAB ---
const ManagePublicLinks = () => {
    const { showSuccess, showError } = useAlert();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [publicBookings, setPublicBookings] = useState([]);
    const [emailInputs, setEmailInputs] = useState({});
    const [savingId, setSavingId] = useState(null);

    const fetchPublicBookings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getPublicBookings();
            setPublicBookings(response.data.data);
            const initialEmails = response.data.data.reduce((acc, booking) => {
                acc[booking._id] = '';
                return acc;
            }, {});
            setEmailInputs(initialEmails);
        } catch (err) {
            showError("Failed to fetch public booking links.");
        } finally { setLoading(false); }
    }, [showError]);

    useEffect(() => { fetchPublicBookings(); }, [fetchPublicBookings]);

    const handleEmailChange = (id, value) => setEmailInputs(prev => ({ ...prev, [id]: value }));

    const handleSaveAndSend = async (id) => {
        setSavingId(id);
        const newEmails = emailInputs[id].split(/[,\n]/).map(e => e.trim()).filter(Boolean);
        if (newEmails.length === 0) {
            showError("Please enter at least one email address.");
            setSavingId(null);
            return;
        }

        try {
            const response = await updatePublicBookingLink(id, { allowedEmails: newEmails });
            showSuccess(response.data.message || 'Invitations sent!');
            setEmailInputs(prev => ({ ...prev, [id]: '' }));
            fetchPublicBookings();
        } catch (err) { showError('Failed to send invitations.'); }
        finally { setSavingId(null); }
    };

    const columns = useMemo(() => [
        { key: 'createdAt', title: 'Created', render: row => formatDateTime(row.createdAt), minWidth: '180px' },
        { key: 'publicId', title: 'Public Link', render: row => <a href={`/book/${row.publicId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">/book/{row.publicId}</a> },
        { key: 'interviewers', title: 'Interviewers', render: (row) => {
            const uniqueInterviewers = [...new Set(row.interviewerSlots.map(s => `${s.interviewer.user.firstName} ${s.interviewer.user.lastName}`))];
            return (
                <div className="relative group flex items-center gap-2">
                    <span className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md text-xs">{uniqueInterviewers.length} Assigned</span>
                    <FiInfo className="text-gray-400 cursor-pointer"/>
                    <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <ul className="list-disc list-inside">{uniqueInterviewers.map((name, index) => <li key={index}>{name}</li>)}</ul>
                    </div>
                </div>
            );
        }},
        { key: 'emails', title: 'Authorize & Invite Emails', minWidth: "300px", render: row => (
            <LocalTextarea value={emailInputs[row._id] || ''} onChange={(e) => handleEmailChange(row._id, e.target.value)} rows={2} placeholder="john@doe.com, jane@doe.com" className="min-w-[250px]"/>
        )},
        { key: 'actions', title: 'Actions', render: row => (
            <div className="flex items-center gap-2">
                <LocalButton isLoading={savingId === row._id} onClick={() => handleSaveAndSend(row._id)} icon={FiSend} className="!text-xs !py-1.5">
                    Send Invites
                </LocalButton>
                <LocalButton variant="outline" onClick={() => navigate(`/admin/public-bookings/${row._id}/tracking`)} className="!p-2">
                    <FiEye/>
                </LocalButton>
            </div>
        )},
    ], [emailInputs, savingId]);

    return <LocalTable columns={columns} data={publicBookings} isLoading={loading} emptyMessage="No public links have been created yet." emptyIcon={FiLink} />;
};

// --- SUB-COMPONENT FOR THE "CONFIRMED SLOTS" TAB ---
const ConfirmedStudentSlots = () => {
    const { showError } = useAlert();
    const [loading, setLoading] = useState(true);
    const [studentBookings, setStudentBookings] = useState([]);
    
    useEffect(() => {
        setLoading(true);
        getConfirmedStudentBookings()
            .then(response => setStudentBookings(response.data.data))
            .catch(() => showError("Failed to fetch confirmed student bookings."))
            .finally(() => setLoading(false));
    }, [showError]);
    
    const columns = useMemo(() => [
        { key: 'studentName', title: 'Student Name' },
        { key: 'studentEmail', title: 'Student Email' },
        { key: 'studentPhone', title: 'Student Phone' },
        { key: 'interviewer', title: 'Interviewer', render: row => `${row.bookedInterviewer.user.firstName} ${row.bookedInterviewer.user.lastName}` },
        { key: 'date', title: 'Interview Date', render: row => formatDate(row.bookingDate) },
        { key: 'slot', title: 'Confirmed Slot', render: row => `${row.bookedSlot.startTime} - ${row.bookedSlot.endTime}` },
    ], []);
    
    return <LocalTable columns={columns} data={studentBookings} isLoading={loading} emptyMessage="No students have booked a slot yet." emptyIcon={FiUsers}/>;
};

// --- MAIN PAGE COMPONENT ---
const StudentBookings = () => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = useMemo(() => [
        { label: "Manage Public Links", content: <ManagePublicLinks /> },
        { label: "Confirmed Student Slots", content: <ConfirmedStudentSlots /> }
    ], []);

    return (
        <div className="h-full w-full flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">

            <div className="px-4 border-b border-gray-200 flex-shrink-0">
                <nav className="-mb-px flex space-x-6">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.label}
                            onClick={() => setActiveTab(index)}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === index
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="flex-grow p-4 overflow-y-auto">
                {tabs[activeTab].content}
            </div>
        </div>
    );
};

export default StudentBookings;
