// client/src/pages/admin/InterviewerBookingTrackingPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiLoader } from 'react-icons/fi';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import { getInterviewBookingDetails } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';
import { formatDate } from '@/utils/formatters';
import Badge from '@/components/common/Badge';

const StatusBadge = ({ status }) => {
    let color;
    switch (status) {
        case 'Submitted':
            color = 'success';
            break;
        case 'Not Available':
            color = 'danger';
            break;
        default:
            color = 'gray';
    }
    return <Badge variant={color}>{status}</Badge>;
};


const InterviewerBookingTrackingPage = () => {
    const { id } = useParams();
    const { showError } = useAlert();
    const [loading, setLoading] = useState(true);
    const [bookingDetails, setBookingDetails] = useState(null);

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getInterviewBookingDetails(id);
            setBookingDetails(res.data.data);
        } catch (error) {
            showError('Failed to fetch booking tracking details.');
        } finally {
            setLoading(false);
        }
    }, [id, showError]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const columns = useMemo(() => [
        { key: 'interviewerId', title: 'Interviewer ID', render: (row) => row.interviewer?.interviewerId || 'N/A' },
        { key: 'name', title: 'Interviewer Name', render: (row) => `${row.interviewer?.user.firstName} ${row.interviewer?.user.lastName}` },
        { key: 'email', title: 'Interviewer Mail', render: (row) => row.interviewer?.user.email },
        { key: 'status', title: 'Provided Status', render: (row) => <StatusBadge status={row.status === 'Submitted' ? 'Available' : row.status} /> },
        { key: 'remarks', title: 'Remarks', render: (row) => <div className="text-wrap min-w-[200px]">{row.remarks || '-'}</div> },
    ], []);

    if (loading) {
        return <div className="flex justify-center p-10"><FiLoader className="animate-spin h-8 w-8 text-primary-600"/></div>;
    }

    return (
        <div className="space-y-4 p-6">
            <div className="flex items-center">
                <Link to="/admin/interview-bookings" className="text-primary-600 hover:text-primary-800 flex items-center font-medium">
                    <FiArrowLeft className="mr-2"/> Back to Bookings
                </Link>
            </div>
            <Card
                
            >
                <Table
                    columns={columns}
                    data={bookingDetails?.interviewers || []}
                    isLoading={loading}
                    emptyMessage="No interviewers found for this booking request."
                />
            </Card>
        </div>
    );
};

export default InterviewerBookingTrackingPage;
