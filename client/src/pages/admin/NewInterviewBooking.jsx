// client/src/pages/admin/NewInterviewBooking.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { useAlert } from '../../hooks/useAlert';
import { createInterviewBooking, updateInterviewBooking, getInterviewBookingDetails } from '../../api/admin.api';
import BookingForm from '../../components/admin/BookingForm';
import Loader from '../../components/common/Loader';

const NewInterviewBooking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const { showSuccess, showError } = useAlert();
    
    const [bookingData, setBookingData] = useState(null);
    const [loading, setLoading] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            getInterviewBookingDetails(id)
                .then(res => setBookingData(res.data.data))
                .catch(() => {
                    showError("Failed to load booking details.");
                    navigate('/admin/bookings/interviewer-bookings');
                })
                .finally(() => setLoading(false));
        }
    }, [id, isEditMode, navigate, showError]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        
        // Convert local date from DatePicker to UTC for consistent storage
        const localDate = new Date(data.bookingDate);
        const utcDate = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));

        const payload = {
            bookingDate: utcDate,
            interviewerIds: data.interviewerIds
        };

        try {
            if (isEditMode) {
                await updateInterviewBooking(id, payload);
                showSuccess("Booking request updated successfully.");
            } else {
                await createInterviewBooking(payload);
                showSuccess("Booking request created successfully.");
            }
            navigate('/admin/bookings/interviewer-bookings');
        } catch (err) {
            showError(`Failed to ${isEditMode ? 'update' : 'create'} booking request.`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader text="Loading booking data..."/></div>;
    }

    return (
        <div className="h-full w-full flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                <div>
                    <Link to="/admin/bookings/interviewer-bookings" className="text-m text-gray-600 hover:text-gray-900 flex items-center mb-1">
                        <FiArrowLeft className="mr-2"/> Back to Bookings
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">
                        {isEditMode ? '' : ''}
                    </h1>
                </div>
                <button
                    type="submit"
                    form="booking-form" // This links the button to the form inside BookingForm component
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-60 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                >
                   {isSubmitting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"/> : <FiSave className="h-4 w-4 mr-2"/>}
                   {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create & Notify')}
                </button>
            </div>

            {/* Form Area */}
            <div className="flex-grow p-6 overflow-y-auto">
                 <BookingForm 
                    onSubmit={onSubmit}
                    initialData={bookingData}
                    isSubmitting={isSubmitting}
                    isEditMode={isEditMode}
                 />
            </div>
        </div>
    );
};

export default NewInterviewBooking;
