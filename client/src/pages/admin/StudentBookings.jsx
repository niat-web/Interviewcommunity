import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiInfo, FiSend } from 'react-icons/fi';

import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Textarea from '@/components/common/Textarea';
import { getPublicBookings, updatePublicBookingLink, getConfirmedStudentBookings } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';
import { formatDateTime, formatDate } from '@/utils/formatters';

// --- Sub-component for the "Manage Public Links" Tab ---
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
            // Initialize email inputs to be empty
            const initialEmails = response.data.data.reduce((acc, booking) => {
                acc[booking._id] = '';
                return acc;
            }, {});
            setEmailInputs(initialEmails);
        } catch (err) {
            showError("Failed to fetch public booking links.");
        } finally {
            setLoading(false);
        }
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
            fetchPublicBookings(); // Refresh the data to show updated counts etc.
        } catch (err) {
            showError('Failed to send invitations.');
        } finally {
            setSavingId(null);
        }
    };

    const columns = useMemo(() => [
        { key: 'createdAt', title: 'Created', render: row => formatDateTime(row.createdAt), minWidth: '180px' },
        { key: 'publicId', title: 'Public Link', render: row => (
            <a href={`/book/${row.publicId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">
                /book/{row.publicId}
            </a>
        )},
        { key: 'interviewers', title: 'Interviewers', render: (row) => {
            const uniqueInterviewers = [...new Set(row.interviewerSlots.map(s => `${s.interviewer.user.firstName} ${s.interviewer.user.lastName}`))];
            return (
                <div className="relative group flex items-center gap-2">
                    <span className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md text-xs">{uniqueInterviewers.length} Assigned</span>
                    <FiInfo className="text-gray-400 cursor-pointer"/>
                    <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <ul className="list-disc list-inside">{uniqueInterviewers.map((name, index) => <li key={index}>{name}</li>)}</ul>
                    </div>
                </div>
            );
        }},
        { key: 'emails', title: 'Authorize & Invite Emails', minWidth: "300px", render: row => (
            <Textarea 
                value={emailInputs[row._id] || ''} 
                onChange={(e) => handleEmailChange(row._id, e.target.value)} 
                rows={2} 
                placeholder="john@doe.com, jane@doe.com" 
                className="mb-0 text-sm"
            />
        )},
        { key: 'actions', title: 'Actions', render: row => (
            <div className="flex items-center gap-2">
                <Button isLoading={savingId === row._id} onClick={() => handleSaveAndSend(row._id)} icon={<FiSend/>} className="!text-xs !py-1.5">
                    Send Invites
                </Button>
                <Button variant="outline" onClick={() => navigate(`/admin/public-bookings/${row._id}/tracking`)} className="!p-2">
                    <FiEye/>
                </Button>
            </div>
        )},
    ], [emailInputs, savingId]);

    return <Table columns={columns} data={publicBookings} isLoading={loading} emptyMessage="No public links have been created yet." />;
};

// --- Sub-component for the "Confirmed Slots" Tab ---
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
    
    return <Table columns={columns} data={studentBookings} isLoading={loading} emptyMessage="No students have booked a slot yet." />;
};

// --- Main Page Component ---
const StudentBookings = () => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = useMemo(() => [
        { label: "Manage Public Links", content: <ManagePublicLinks /> },
        { label: "Confirmed Student Slots", content: <ConfirmedStudentSlots /> }
    ], []);

    return (
        <div className="h-full flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">

            {/* Tab Navigation */}
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
            
            {/* Tab Content Area (Scrollable) */}
            <div className="flex-grow p-4 overflow-y-auto">
                {tabs[activeTab].content}
            </div>
        </div>
    );
};

export default StudentBookings;
