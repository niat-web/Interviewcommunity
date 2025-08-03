// client/src/pages/interviewer/InterviewerDomainEvaluationPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAssignedDomains, getEvaluationDataForInterviewer, updateEvaluationData, updateInterviewStatus } from '@/api/interviewer.api';
import { useAlert } from '@/hooks/useAlert';
import { formatDate } from '@/utils/formatters';
import { debounce } from '@/utils/helpers';
import Select from 'react-select';
import { FiSearch, FiExternalLink } from 'react-icons/fi';
import { MAIN_SHEET_INTERVIEW_STATUSES } from '@/utils/constants';

const LocalLoader = ({ text }) => ( <div className="flex h-full w-full items-center justify-center text-gray-500"><div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div><span className="ml-4">{text}</span></div>);

const EditableStatusCell = ({ interview, onStatusChange, isUpdating }) => {
    const statusOptions = MAIN_SHEET_INTERVIEW_STATUSES;
    const statusColors = {
        'Completed': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        'Scheduled': 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
        'InProgress': 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        'Cancelled': 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
    };
    
    const baseClasses = "w-full text-xs font-semibold px-2 py-1.5 border rounded-md shadow-sm focus:outline-none focus:ring-1 transition-colors cursor-pointer";
    const colorClass = statusColors[interview.interviewStatus] || 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    
    return (
        <select
            value={interview.interviewStatus || ''}
            onChange={(e) => onStatusChange(interview._id, e.target.value)}
            disabled={isUpdating}
            className={`${baseClasses} ${colorClass}`}
            onClick={(e) => e.stopPropagation()}
        >
            <option value="" disabled>Select Status</option>
            {statusOptions.map(status => (<option key={status.value} value={status.value}>{status.label}</option>))}
        </select>
    );
};

const EditableRemarksCell = ({ interview, onSave, isUpdating }) => {
    const [value, setValue] = useState(interview.interviewerRemarks || '');
    
    useEffect(() => { setValue(interview.interviewerRemarks || '') }, [interview.interviewerRemarks]);

    const handleBlur = () => {
        if (value !== (interview.interviewerRemarks || '')) {
            onSave(interview._id, value);
        }
    };
    
    return (
        <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={handleBlur}
            disabled={isUpdating}
            placeholder="Add remarks..."
            className="w-full bg-transparent text-sm border-0 focus:ring-1 focus:ring-blue-500 rounded h-full min-h-[45px] resize-none"
        />
    );
};


const InterviewerDomainEvaluationPage = () => {
    const { showError, showSuccess } = useAlert();
    const [loading, setLoading] = useState(true);
    const [domains, setDomains] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [search, setSearch] = useState('');
    const [evaluationData, setEvaluationData] = useState({ evaluationSheet: null, interviews: [] });
    const [savingStates, setSavingStates] = useState({});
    const [updatingStatusId, setUpdatingStatusId] = useState(null);

    const getOptionStyle = (value) => {
        const stringValue = String(value || '').trim();
        switch (stringValue) {
            case '5': return 'text-green-700 font-bold';
            case '4': return 'text-green-600 font-medium';
            case '3': return 'text-yellow-600 font-medium';
            case '2': return 'text-red-500 font-medium';
            case '1': return 'text-red-700 font-bold';
            default: return 'text-gray-800';
        }
    };

    useEffect(() => {
        getAssignedDomains()
            .then(res => setDomains(res.data.data.map(d => ({ value: d, label: d }))))
            .catch(() => showError('Failed to load assigned domains.'));
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
            const res = await getEvaluationDataForInterviewer(params);
            setEvaluationData(res.data.data);
        } catch (err) {
            showError("Failed to fetch evaluation data.");
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

    const handleSaveEvaluation = (interviewId, fieldHeader, value) => {
        const stateKey = `${interviewId}-${fieldHeader}`;
        setSavingStates(prev => ({ ...prev, [stateKey]: true }));
        
        setEvaluationData(currentData => {
            const originalInterviews = currentData.interviews;
            const interviewIndex = originalInterviews.findIndex(i => i._id === interviewId);

            if (interviewIndex === -1) {
                showError("Error: Could not find interview to update.");
                setSavingStates(prev => ({ ...prev, [stateKey]: false }));
                return currentData; 
            }

            const newEvaluationPayload = {
                ...originalInterviews[interviewIndex].evaluationData,
                [fieldHeader]: value,
            };

            const apiPayload = { evaluationData: newEvaluationPayload };
            
            const updatedInterview = {
                ...originalInterviews[interviewIndex],
                evaluationData: newEvaluationPayload
            };
            const newInterviewsArray = [...originalInterviews];
            newInterviewsArray[interviewIndex] = updatedInterview;

            updateEvaluationData(interviewId, apiPayload)
                .catch(() => {
                    showError("Save failed. Reverting change.");
                    setEvaluationData({ ...currentData, interviews: originalInterviews });
                })
                .finally(() => {
                    setSavingStates(prev => ({ ...prev, [stateKey]: false }));
                });
            
            return { ...currentData, interviews: newInterviewsArray };
        });
    };
    
    const handleStatusChange = async (interviewId, newStatus) => {
        setUpdatingStatusId(interviewId);
        try {
            await updateInterviewStatus(interviewId, newStatus);
            setEvaluationData(prevData => ({
                ...prevData,
                interviews: prevData.interviews.map(interview => 
                    interview._id === interviewId 
                        ? { ...interview, interviewStatus: newStatus } 
                        : interview
                ),
            }));
            showSuccess('Status updated!');
        } catch(err) {
            showError("Failed to update status.");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleRemarkSave = async (interviewId, remarks) => {
        const stateKey = `${interviewId}-interviewerRemarks`;
        setSavingStates(prev => ({ ...prev, [stateKey]: true }));
        
        const originalRemarks = evaluationData.interviews.find(i => i._id === interviewId)?.interviewerRemarks || '';
        
        setEvaluationData(prev => ({
            ...prev,
            interviews: prev.interviews.map(i => 
                i._id === interviewId ? { ...i, interviewerRemarks: remarks } : i
            )
        }));
    
        try {
            await updateEvaluationData(interviewId, { interviewerRemarks: remarks });
        } catch (error) {
            showError('Failed to save remarks.');
            setEvaluationData(prev => ({
                ...prev,
                interviews: prev.interviews.map(i => 
                    i._id === interviewId ? { ...i, interviewerRemarks: originalRemarks } : i
                )
            }));
        } finally {
            setSavingStates(prev => ({ ...prev, [stateKey]: false }));
        }
    };

    const renderCellContent = (interview, column, group) => {
        const fieldHeader = column.header || group.title;
        const savedValue = interview.evaluationData ? interview.evaluationData[fieldHeader] : undefined;
        const currentStyle = getOptionStyle(savedValue);

        if (column.options && column.options.length > 0) {
            return (
                <select
                    value={savedValue || ''}
                    onChange={(e) => handleSaveEvaluation(interview._id, fieldHeader, e.target.value)}
                    className={`w-full bg-transparent p-2 text-sm border-0 focus:ring-1 focus:ring-blue-500 rounded ${currentStyle}`}
                    disabled={savingStates[`${interview._id}-${fieldHeader}`]}
                >
                    <option value="" className="text-gray-400">Select...</option>
                    {column.options.map((opt, i) => (
                        <option key={i} value={opt.value} className={getOptionStyle(opt.value)}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );
        }
        
        return (
            <input
                type="text"
                defaultValue={savedValue || ''}
                onBlur={(e) => handleSaveEvaluation(interview._id, fieldHeader, e.target.value)}
                className="w-full bg-transparent p-2 text-sm border-0 focus:ring-1 focus:ring-blue-500 rounded"
                disabled={savingStates[`${interview._id}-${fieldHeader}`]}
            />
        );
    };

    const staticColumns = [
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
        { key: 'interviewStatus', title: 'Status', minWidth: '150px', render: (row) => <EditableStatusCell interview={row} onStatusChange={handleStatusChange} isUpdating={updatingStatusId === row._id} /> },
        {
            key: 'interviewerRemarks',
            title: 'Any Remarks',
            minWidth: '250px',
            isCustomCell: true,
            render: (row) => <EditableRemarksCell interview={row} onSave={handleRemarkSave} isUpdating={savingStates[`${row._id}-interviewerRemarks`]} />
        },
    ];
    
    const selectStyles = { 
        menuPortal: base => ({ ...base, zIndex: 9999 }),
        control: base => ({...base, fontSize: '0.875rem'}),
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                </div>
                <Select
                    options={domains} value={selectedDomain} onChange={setSelectedDomain} isClearable
                    placeholder="Select a Domain to Evaluate..." className="w-full sm:w-64 text-sm" classNamePrefix="react-select"
                    menuPortalTarget={document.body} styles={selectStyles} menuPosition={'fixed'}
                />
            </div>
            <div className="flex-grow overflow-auto">
                {!selectedDomain ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        <p>Please select a domain to view and evaluate interviews.</p>
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
                                    {staticColumns.map(col => {
                                        const cellContent = col.render ? col.render(interview) : interview[col.key];
                                        return (
                                            <td key={`${col.key}-${interview._id}`} className={`border border-gray-300 text-xs whitespace-nowrap align-middle ${col.isCustomCell ? 'p-0' : 'p-1'}`}>
                                                {col.isCustomCell ? cellContent : <div className="px-1">{cellContent}</div>}
                                            </td>
                                        );
                                    })}
                                    {evaluationData.evaluationSheet?.columnGroups.flatMap(group => group.columns.map(col => (
                                        <td key={`${col.header || group.title}-${interview._id}`} className="p-0 border border-gray-300 align-middle">
                                            {renderCellContent(interview, col, group)}
                                        </td>
                                    )))}
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
        </div>
    );
};

export default InterviewerDomainEvaluationPage;
