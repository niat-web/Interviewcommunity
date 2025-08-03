// client/src/pages/admin/EmailTrackingPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiSend, FiMail, FiAlertTriangle, FiX } from 'react-icons/fi';
import { getPublicBookingDetails, sendBookingReminders } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';

// --- SELF-CONTAINED UI COMPONENTS (NO EXTERNAL DEPENDENCIES) ---

const LocalLoader = ({ text }) => (
    <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        {text && <p className="mt-4 text-lg text-gray-600">{text}</p>}
    </div>
);

const LocalButton = ({ children, onClick, isLoading = false, icon, variant = 'primary', disabled = false, ...props }) => {
    const baseClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    };
    const className = `${baseClasses} ${variantClasses[variant]}`;

    // FIX: Clone the icon element to correctly apply classes, instead of treating it as a component.
    const iconElement = icon && !isLoading ? React.cloneElement(icon, {
        className: `mr-2 h-4 w-4 ${icon.props.className || ''}`.trim()
    }) : null;

    return (
        <button onClick={onClick} disabled={isLoading || disabled} className={className} {...props}>
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
            ) : (
                iconElement
            )}
            {isLoading ? "Loading..." : children}
        </button>
    );
};


const LocalCard = ({ children }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {children}
    </div>
);

const LocalTable = ({ columns, data, isLoading, emptyMessage }) => {
    if (isLoading) {
        return <div className="p-10"><LocalLoader text="Loading data..." /></div>;
    }

    if (!data || data.length === 0) {
        return <div className="text-center py-16 text-gray-500">{emptyMessage}</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map(col => (
                            <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {col.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, index) => (
                        <tr key={row._id || index} className="hover:bg-gray-50">
                            {columns.map(col => (
                                <td key={col.key} className="px-6 py-1 whitespace-nowrap text-sm text-gray-700">
                                    {col.render ? col.render(row, index) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const LocalModal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <FiX className="h-5 w-5 text-gray-500" />
                    </button>
                </div>
                <div className="flex-grow p-6 overflow-y-auto">
                    {children}
                </div>
                {footer && (
                    <div className="flex-shrink-0 px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- PAGE-SPECIFIC COMPONENTS ---

const StatusDisplay = ({ status }) => {
    let colorClasses = '';
    switch (status) {
        case 'Submitted':
            colorClasses = 'text-green-700 bg-green-100';
            break;
        case 'Not Submitted':
            colorClasses = 'text-red-700 bg-red-100';
            break;
        default:
            colorClasses = 'text-gray-700 bg-gray-100';
    }
    return (
        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
            {status}
        </span>
    );
};

const ReminderModal = ({ isOpen, onClose, onConfirm, isLoading, students = [] }) => {
    return (
        <LocalModal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirm Reminders"
            footer={
                <div className="flex justify-end gap-3">
                    <LocalButton variant="outline" onClick={onClose} disabled={isLoading}>Cancel</LocalButton>
                    <LocalButton variant="primary" icon={<FiSend/>} onClick={onConfirm} isLoading={isLoading}>
                        {`Send ${students.length} Reminder(s)`}
                    </LocalButton>
                </div>
            }
        >
            <p className="text-sm text-gray-600 mb-4">
                You are about to send a reminder email to the following <span className="font-bold">{students.length}</span> student(s) who have not yet booked their slot. Please confirm.
            </p>
            <div className="border border-gray-200 rounded-lg max-h-[50vh] overflow-y-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email ID</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student, index) => (
                            <tr key={index}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{student.domain}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{student.userId}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{student.fullName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </LocalModal>
    );
};


// --- MAIN PAGE COMPONENT ---
const EmailTrackingPage = () => {
    const { id } = useParams();
    const { showSuccess, showError, showInfo } = useAlert();
    const [loading, setLoading] = useState(true);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [studentsToRemind, setStudentsToRemind] = useState([]);


    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const response = await getPublicBookingDetails(id);
                setBookingDetails(response.data.data);
            } catch (err) {
                showError("Failed to fetch booking details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, showError]);

    const handleOpenReminderModal = () => {
        const notSubmitted = (bookingDetails?.trackedEmails || []).filter(
            student => student.status === 'Not Submitted'
        );

        if (notSubmitted.length > 0) {
            setStudentsToRemind(notSubmitted);
            setIsReminderModalOpen(true);
        } else {
            showInfo("All authorized students have already booked their slots. No reminders to send.");
        }
    };
    
    const handleSendReminders = async () => {
        setIsSending(true);
        try {
            const response = await sendBookingReminders(id);
            showSuccess(response.data.message || "Reminders sent successfully!");
            setIsReminderModalOpen(false);
        } catch (err) {
            showError(err.response?.data?.message || "Failed to send reminders.");
        } finally {
            setIsSending(false);
        }
    };

    const columns = useMemo(() => [
        { key: 'index', title: 'No', render: (row, index) => index + 1 },
        { key: 'hiringName', title: 'Hiring Name', render: row => row.hiringName || '' },
        { key: 'domain', title: 'Domain' },
        { key: 'userId', title: 'User ID' },
        { key: 'interviewId', title: 'Int ID', render: row => row.interviewId || 'N/A' },
        { key: 'fullName', title: 'Full Name' },
        { key: 'email', title: 'Email ID' },
        { key: 'mobileNumber', title: 'Mobile Number', render: row => row.mobileNumber || '' },
        { key: 'resumeLink', title: 'Resume Link', render: (row) => row.resumeLink ? <a href={row.resumeLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a> : 'N/A' },
        { key: 'status', title: 'Submitted', render: (row) => <StatusDisplay status={row.status} /> },
    ], []);

    if (loading) {
        return <div className="flex justify-center items-center py-20"><LocalLoader text="Loading Tracking Details..." /></div>;
    }

    if (!bookingDetails) {
        return (
            <div className="text-center py-10 p-6">
                <p>Booking details not found.</p>
                <Link to="/admin/student-bookings" className="mt-4 inline-block text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md">
                    Back to Bookings
                </Link>
            </div>
        );
    }
    
    const studentData = bookingDetails.trackedEmails || [];

    return (
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                <Link to="/admin/student-bookings" className="text-blue-600 hover:text-blue-700 flex items-center font-medium">
                    <FiArrowLeft className="mr-2"/> Back to Student Bookings
                </Link>
                <LocalButton
                    onClick={handleOpenReminderModal}
                    isLoading={isSending}
                    icon={<FiSend />}
                >
                    Send Reminders
                </LocalButton>
            </div>
            
            <LocalCard>
                <LocalTable
                    columns={columns}
                    data={studentData}
                    isLoading={loading}
                    emptyMessage="No students have been authorized for this link yet."
                />
            </LocalCard>

            <ReminderModal
                isOpen={isReminderModalOpen}
                onClose={() => setIsReminderModalOpen(false)}
                onConfirm={handleSendReminders}
                students={studentsToRemind}
                isLoading={isSending}
            />
        </div>
    );
};

export default EmailTrackingPage;
