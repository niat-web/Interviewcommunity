// client/src/pages/admin/AdminDomainEvaluationPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getDomains, getEvaluationDataForAdmin } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';
import { formatDate } from '@/utils/formatters';
import { debounce } from '@/utils/helpers';
import Select from 'react-select';
import { FiSearch, FiExternalLink, FiDownload, FiX } from 'react-icons/fi';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

// --- Reusable Local Components ---
const LocalLoader = ({ text }) => ( <div className="h-full w-full flex items-center justify-center text-gray-500"><div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div><span className="ml-4">{text}</span></div>);

const StatusBadge = ({ status }) => {
    const statusColors = {
        'Completed': 'bg-green-100 text-green-800',
        'Scheduled': 'bg-yellow-100 text-yellow-800',
        'InProgress': 'bg-blue-100 text-blue-800',
        'Cancelled': 'bg-red-100 text-red-800'
    };
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
            {status || ''}
        </span>
    );
};

const RemarksModal = ({ isOpen, onClose, content }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-lg bg-white rounded-lg shadow-xl" 
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Interviewer Remarks</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200">
                        <FiX className="h-5 w-5"/>
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end rounded-b-lg">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


const AdminDomainEvaluationPage = () => {
    const { showError, showSuccess } = useAlert();
    const [loading, setLoading] = useState(true);
    const [domains, setDomains] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [search, setSearch] = useState('');
    const [evaluationData, setEvaluationData] = useState({ evaluationSheet: null, interviews: [] });
    const [remarksModal, setRemarksModal] = useState({ isOpen: false, content: '' });

    useEffect(() => {
        getDomains()
            .then(res => setDomains(res.data.data.map(d => ({ value: d.name, label: d.name }))))
            .catch(() => showError('Failed to load domains.'));
    }, [showError]);
    
    const fetchData = useCallback(async () => {
        if (!selectedDomain) {
            setEvaluationData({ evaluationSheet: null, interviews: [] });
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const params = { domain: selectedDomain.value, search };
            const res = await getEvaluationDataForAdmin(params);
            setEvaluationData(res.data.data);
        } catch (err) {
            showError("Failed to fetch evaluation data for this domain.");
            setEvaluationData({ evaluationSheet: null, interviews: [] });
        } finally {
            setLoading(false);
        }
    }, [selectedDomain, search, showError]);

    useEffect(() => {
        const handler = debounce(fetchData, 300);
        handler();
        return () => handler.cancel();
    }, [fetchData]);
    
    const openRemarksModal = useCallback((remarks) => {
        setRemarksModal({ isOpen: true, content: remarks });
    }, []);

    const closeRemarksModal = useCallback(() => {
        setRemarksModal({ isOpen: false, content: '' });
    }, []);

    const staticColumns = useMemo(() => [
        { key: 'techStack', title: 'Domain', minWidth: '150px' },
        { key: 'interviewId', title: 'Interview ID', minWidth: '120px' },
        { key: 'uid', title: 'Candidate UID', minWidth: '280px' },
        { key: 'candidateName', title: 'Candidate', minWidth: '180px' },
        { key: 'mobileNumber', title: 'Mobile', minWidth: '120px' },
        { key: 'mailId', title: 'Mail ID', minWidth: '220px' },
        { key: 'candidateResume', title: 'Resume', minWidth: '100px', render: (row) => row.candidateResume ? <a href={row.candidateResume} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a> : '' },
        { key: 'meetingLink', title: 'Meeting Link', minWidth: '250px', render: (row) => row.meetingLink ? <a href={row.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-[250px]" title={row.meetingLink}>{row.meetingLink}</a> : '' },
        { key: 'interviewDate', title: 'Date', minWidth: '120px', render: (row) => formatDate(row.interviewDate)},
        { key: 'interviewTime', title: 'Time', minWidth: '110px' },
        { key: 'interviewDuration', title: 'Duration', minWidth: '100px' },
        { key: 'interviewStatus', title: 'Status', minWidth: '130px', render: (row) => <StatusBadge status={row.interviewStatus} /> },
        { 
            key: 'interviewerRemarks', 
            title: 'Interviewer Remarks', 
            minWidth: '250px', 
            render: (row) => {
                const remarks = row.interviewerRemarks;
                const charLimit = 50;
                if (!remarks) {
                    return <div className="p-1"></div>;
                }
                
                if (remarks.length <= charLimit) {
                    return <div className="p-1 truncate" title={remarks}>{remarks}</div>;
                }

                return (
                    <div className="p-1 flex items-center justify-start overflow-hidden">
                        <span className="truncate" title={remarks}>
                            {remarks.substring(0, charLimit)}...
                        </span>
                        <button 
                            onClick={() => openRemarksModal(remarks)} 
                            className="ml-1 text-blue-600 hover:underline text-xs font-semibold flex-shrink-0"
                        >
                            more
                        </button>
                    </div>
                );
            } 
        },
    ], [openRemarksModal]);

    const handleExport = () => {
        if (!evaluationData.interviews || evaluationData.interviews.length === 0) {
            showError("No data to export.");
            return;
        }

        const dataToExport = evaluationData.interviews.map(interview => {
            let rowData = {};

            // Map static column data
            staticColumns.forEach(col => {
                let value = interview[col.key];
                if (col.key === 'interviewDate' && value) {
                    value = formatDate(value);
                }
                if (col.key === 'interviewerRemarks') {
                    rowData[col.title] = interview.interviewerRemarks || '';
                } else if (col.render && typeof value !== 'string' && value !== null) {
                    rowData[col.title] = interview[col.key] || '';
                } else {
                    rowData[col.title] = value || '';
                }
            });

            // Map dynamic evaluation data
            (evaluationData.evaluationSheet?.columnGroups || []).forEach(group => {
                group.columns.forEach(col => {
                    const headerTitle = col.header ? `${group.title} - ${col.header}` : group.title;
                    const headerKey = col.header || group.title;
                    rowData[headerTitle] = interview.evaluationData?.[headerKey] || '';
                });
            });
            return rowData;
        });
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Evaluations');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        
        const fileName = `Evaluation_Data_${selectedDomain.label}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        saveAs(blob, fileName);
        showSuccess("Export started successfully.");
    };
    
    const selectStyles = { 
        menuPortal: base => ({ ...base, zIndex: 9999 }),
        control: base => ({...base, fontSize: '0.875rem'}),
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
                 <h1 className="text-xl font-bold text-gray-800">Domain Evaluation Review</h1>
                 <div className="flex items-center gap-4">
                    <div className="relative w-full sm:w-64">
                         <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search records..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <Select
                        options={domains}
                        value={selectedDomain}
                        onChange={setSelectedDomain}
                        isClearable
                        placeholder="Select a Domain to View..."
                        className="w-full sm:w-64 text-sm"
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={selectStyles}
                        menuPosition={'fixed'}
                    />
                     <button
                        onClick={handleExport}
                        disabled={!selectedDomain || loading || !evaluationData.interviews || evaluationData.interviews.length === 0}
                        className="p-2 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Export to Excel"
                    >
                        <FiDownload className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div className="flex-grow overflow-auto">
                {!selectedDomain ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        <p>Please select a domain to review evaluation data.</p>
                    </div>
                ) : loading ? (
                    <LocalLoader text="Loading evaluation data..." />
                ) : (
                    <table className="min-w-full text-sm border-collapse">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                {staticColumns.map(col => (
                                    <th key={col.key} className="p-2 border border-gray-300 align-middle text-left" rowSpan={2} style={{minWidth: col.minWidth}}>
                                        {col.title}
                                    </th>
                                ))}
                                {evaluationData.evaluationSheet?.columnGroups.map(group => {
                                    const hasSubHeaders = group.columns.some(col => col.header && col.header.trim() !== '');
                                    return (
                                        <th key={group.title} 
                                            colSpan={group.columns.length || 1} 
                                            rowSpan={hasSubHeaders ? 1 : 2}
                                            className="p-2 border border-gray-300 text-center font-semibold bg-gray-200 align-middle"
                                        >
                                            {group.title}
                                        </th>
                                    );
                                })}
                            </tr>
                            
                            <tr>
                                {evaluationData.evaluationSheet?.columnGroups.flatMap(group => {
                                    const hasSubHeaders = group.columns.some(col => col.header && col.header.trim() !== '');
                                    if (!hasSubHeaders) return null;

                                    return group.columns.map(col => (
                                        <th 
                                            key={col.header} 
                                            className="p-2 border border-gray-300 font-semibold align-middle" 
                                            style={{minWidth: '180px'}}
                                        >
                                            {col.header}
                                        </th>
                                    ));
                                })}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {evaluationData.interviews.map(interview => (
                                <tr key={interview._id} className="even:bg-gray-50 align-top">
                                    {staticColumns.map(col => (
                                        <td key={`${col.key}-${interview._id}`} className="p-2 border border-gray-300 text-xs whitespace-nowrap align-middle">
                                            {col.render ? col.render(interview) : interview[col.key]}
                                        </td>
                                    ))}
                                    {evaluationData.evaluationSheet?.columnGroups.flatMap(group => group.columns.map(col => {
                                        const dataKey = col.header || group.title;
                                        return (
                                            <td key={`${dataKey}-${interview._id}`} className="p-2 border border-gray-300 text-xs align-middle">
                                                { interview.evaluationData?.[dataKey] || '' }
                                            </td>
                                        )
                                    }))}
                                </tr>
                            ))}
                             {Array.from({ length: Math.max(0, 1000 - evaluationData.interviews.length) }).map((_, i) => (
                                <tr key={`empty-${i}`} className="h-[45px] even:bg-gray-50">
                                    <td colSpan={staticColumns.length + (evaluationData.evaluationSheet?.columnGroups.flatMap(g => g.columns).length || 0)} className="border border-gray-200"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <RemarksModal
                isOpen={remarksModal.isOpen}
                onClose={closeRemarksModal}
                content={remarksModal.content}
            />
        </div>
    );
};

export default AdminDomainEvaluationPage;
