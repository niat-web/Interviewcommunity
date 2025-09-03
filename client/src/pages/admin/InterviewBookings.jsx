// client/src/pages/admin/InterviewBookings.jsx

import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { getInterviewBookings, deleteInterviewBooking } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';
import { formatDate } from '@/utils/formatters';
import { FiPlus, FiMoreVertical, FiEdit, FiTrash2 } from 'react-icons/fi';

const InterviewBookings = () => {
    const { showError, showSuccess } = useAlert();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getInterviewBookings();
            setBookings(res.data.data);
        } catch (err) {
            showError("Failed to fetch interview bookings.");
        } finally {
            setLoading(false);
        }
    }, [showError]);
    
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        try {
            await deleteInterviewBooking(deleteDialog.id);
            showSuccess('Booking deleted successfully!');
            setDeleteDialog({ isOpen: false, id: null });
            fetchBookings();
        } catch (err) {
            showError('Failed to delete booking.');
        }
    };

    const columns = useMemo(() => [
        { key: 'bookingDate', title: 'Booking Date', render: row => formatDate(row.bookingDate) },
        { key: 'status', title: 'Status', render: row => <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{row.status}</span>},
        { 
            key: 'responses', 
            title: 'Responses', 
            render: row => {
                const submitted = row.interviewers.filter(i => i.status === 'Submitted' || i.status === 'Not Available').length;
                return (
                    <Link to={`/admin/interview-bookings/${row._id}/tracking`} className="text-blue-600 hover:underline font-medium">
                        {`${submitted} / ${row.interviewers.length}`}
                    </Link>
                );
            }
        },
        { key: 'createdBy', title: 'Created By', render: row => `${row.createdBy.firstName} ${row.createdBy.lastName}` },
        { key: 'createdAt', title: 'Created On', render: row => formatDate(row.createdAt) },
        { 
            key: 'actions', title: 'Actions', render: (row) => (
                 <Menu as="div" className="relative inline-block text-left">
                    <div>
                        <Menu.Button className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-transparent text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                           <FiMoreVertical className="h-5 w-5" aria-hidden="true" />
                        </Menu.Button>
                    </div>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button 
                                            onClick={() => navigate(`/admin/bookings/edit/${row._id}`)} 
                                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm w-full text-left`}
                                        >
                                            <FiEdit className="mr-3 h-5 w-5 text-gray-400" />Edit
                                        </button>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <button 
                                            onClick={() => setDeleteDialog({ isOpen: true, id: row._id })} 
                                            className={`${active ? 'bg-red-50 text-red-900' : 'text-red-700'} group flex items-center px-4 py-2 text-sm w-full text-left`}
                                        >
                                            <FiTrash2 className="mr-3 h-5 w-5 text-red-400" />Delete
                                        </button>
                                    )}
                                </Menu.Item>
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            )
        }
    ], [navigate]);

    return (
        <div className="space-y-6">
            <Card
                title="Interview Bookings"
                headerExtra={
                    <Button 
                        variant="primary" 
                        icon={<FiPlus size={20} />} 
                        to="/admin/bookings/new" // Navigate to the new page
                    >
                        New Interview
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    data={bookings}
                    isLoading={loading}
                    emptyMessage="No interview bookings have been created yet."
                />
            </Card>

            <ConfirmDialog 
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="Delete Booking"
                message="Are you sure you want to delete this booking request? This action cannot be undone."
            />
        </div>
    );
};

export default InterviewBookings;
