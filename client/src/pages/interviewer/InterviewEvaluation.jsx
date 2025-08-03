// client/src/pages/interviewer/InterviewEvaluation.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getAssignedInterviews, updateInterviewStatus } from '@/api/interviewer.api';
import { useAlert } from '@/hooks/useAlert';
import { formatDate } from '@/utils/formatters';
import { debounce } from '@/utils/helpers';
import Table from '@/components/common/Table';
import SearchInput from '@/components/common/SearchInput';
import FilterDropdown from '@/components/common/FilterDropdown';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { MAIN_SHEET_INTERVIEW_STATUSES } from '@/utils/constants';

const EditableStatusCell = ({ row, onStatusChange, isUpdating }) => {
    const statusOptions = MAIN_SHEET_INTERVIEW_STATUSES;

    const statusColors = {
        'Completed': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        'Scheduled': 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
        'InProgress': 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        'Cancelled': 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
    };
    
    const baseClasses = "w-full text-xs font-semibold px-2 py-1.5 border rounded-md shadow-sm focus:outline-none focus:ring-1 transition-colors cursor-pointer";
    const colorClass = statusColors[row.interviewStatus] || 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    
    return (
        <select
            value={row.interviewStatus || ''}
            onChange={(e) => onStatusChange(row._id, e.target.value)}
            disabled={isUpdating}
            className={`${baseClasses} ${colorClass}`}
            onClick={(e) => e.stopPropagation()} // Prevents row click events if any
        >
            <option value="" disabled>Select Status</option>
            {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                    {status.label}
                </option>
            ))}
        </select>
    );
};

const InterviewEvaluation = () => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null); // Tracks which row is being updated
    const { showSuccess, showError } = useAlert();
    
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');


    const fetchInterviews = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getAssignedInterviews();
            setInterviews(response.data.data);
        } catch (error) {
            showError('Failed to load your assigned interviews.');
            console.error("Error fetching interviews:", error);
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchInterviews();
    }, [fetchInterviews]);

    const filteredInterviews = useMemo(() => {
        return interviews.filter(item => {
            const searchLower = search.toLowerCase();
            const matchesSearch = !search || 
                item.candidateName?.toLowerCase().includes(searchLower) ||
                item.mailId?.toLowerCase().includes(searchLower);

            const matchesStatus = !statusFilter || item.interviewStatus === statusFilter;

            const matchesDate = !dateFilter || 
                (item.interviewDate && new Date(item.interviewDate).toDateString() === new Date(dateFilter).toDateString());
            
            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [interviews, search, statusFilter, dateFilter]);

    const handleStatusChange = useCallback(async (entryId, newStatus) => {
        setUpdatingId(entryId);
        try {
            await updateInterviewStatus(entryId, newStatus);
            fetchInterviews();
            showSuccess('Interview status updated!');
        } catch (error) {
            showError('Failed to update status.');
        } finally {
            setUpdatingId(null);
        }
    }, [showSuccess, showError, fetchInterviews]);

    const columns = useMemo(() => [
        { key: 'techStack', title: 'Domain Name' },
        { key: 'interviewId', title: 'Interview ID' },
        { key: 'uid', title: 'Candidate UID' },
        { key: 'candidateName', title: 'Candidate Name' },
        { key: 'mobileNumber', title: 'Mobile Number' },
        { key: 'mailId', title: 'Mail ID' },
        {
            key: 'meetingLink',
            title: 'Meeting Link',
            render: (row) => row.meetingLink ? (
                <a
                    href={row.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    title={row.meetingLink}
                >
                    {row.meetingLink}
                </a>
            ) : (
                'N/A'
            ),
        },
        { key: 'interviewDate', title: 'Interview Date', render: (row) => formatDate(row.interviewDate) },
        { key: 'interviewTime', title: 'Interview Time' },
        { key: 'interviewDuration', title: 'Interview Duration' },
        {
            key: 'interviewStatus',
            title: 'Interview Status',
            render: (row) => (
                <EditableStatusCell
                    row={row}
                    onStatusChange={handleStatusChange}
                    isUpdating={updatingId === row._id}
                />
            ),
        },
    ], [handleStatusChange, updatingId]);
    
    const statusOptions = [{ value: '', label: 'All Statuses' }, ...MAIN_SHEET_INTERVIEW_STATUSES];

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className='flex items-center gap-4 w-full sm:w-auto'>
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search Candidate or Mail ID..."
                        className="w-full sm:w-64"
                    />
                     <DatePicker 
                        selected={dateFilter} 
                        onChange={(date) => setDateFilter(date)} 
                        isClearable 
                        placeholderText="Filter by date" 
                        className="form-input w-full sm:w-48 py-2"
                        popperClassName="z-20"
                    />
                </div>
                <div className='w-full sm:w-auto'>
                     <FilterDropdown
                        label="Status"
                        options={statusOptions}
                        selectedValue={statusFilter}
                        onChange={setStatusFilter}
                    />
                </div>
            </div>
            
            <div className="overflow-auto flex-grow">
                <Table
                    columns={columns}
                    data={filteredInterviews}
                    isLoading={loading}
                    emptyMessage="You have no interviews matching the current filters."
                />
            </div>
        </div>
    );
};

export default InterviewEvaluation;
