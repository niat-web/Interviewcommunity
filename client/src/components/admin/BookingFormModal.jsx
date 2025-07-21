// client/src/components/admin/BookingFormModal.jsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Select from 'react-select';

import { getInterviewers, createInterviewBooking, updateInterviewBooking } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Alert from '@/components/common/Alert';
import StatusBadge from '@/components/common/StatusBadge';

const BookingFormModal = ({ isOpen, onClose, onSuccess, bookingData = null }) => {
    const isEditMode = !!bookingData;
    const { showSuccess, showError } = useAlert();
    const { 
        control, 
        handleSubmit, 
        formState: { errors, isSubmitting }, 
        reset 
    } = useForm();
    
    const [interviewerOptions, setInterviewerOptions] = useState([]);
    const [loadingInterviewers, setLoadingInterviewers] = useState(true);
    
    useEffect(() => {
        if (isOpen) {
            setLoadingInterviewers(true);
            getInterviewers({ limit: 500, status: 'Active,On Probation' }) 
                .then(res => {
                    const options = (res.data.data.interviewers || []).map(i => ({
                        value: i._id,
                        label: `${i.user.firstName} ${i.user.lastName}`,
                        status: i.status 
                    }));
                    setInterviewerOptions(options);

                    if (isEditMode && bookingData) {
                        const preselectedInterviewers = options.filter(option => 
                            bookingData.interviewers.some(interviewer => interviewer.interviewer._id === option.value)
                        );
                        reset({
                            bookingDate: new Date(bookingData.bookingDate),
                            interviewers: preselectedInterviewers
                        });
                    } else {
                        reset({ bookingDate: null, interviewers: [] });
                    }
                })
                .catch(() => showError("Failed to load interviewers"))
                .finally(() => setLoadingInterviewers(false));
        }
    }, [isOpen, isEditMode, bookingData, showError, reset]);

    const formatOptionLabel = ({ label, status }) => (
        <div className="flex justify-between items-center">
            <span>{label}</span>
            {status && <StatusBadge status={status} />}
        </div>
    );
    
    const onSubmit = async (data) => {
        const payload = {
            bookingDate: data.bookingDate,
            interviewerIds: data.interviewers.map(i => i.value)
        };

        try {
            if (isEditMode) {
                await updateInterviewBooking(bookingData._id, payload);
                showSuccess("Booking request updated successfully.");
            } else {
                await createInterviewBooking(payload);
                showSuccess("Booking request created successfully.");
            }
            onSuccess();
        } catch (err) {
            showError(`Failed to ${isEditMode ? 'update' : 'create'} booking request.`);
        }
    };
    
    // This style ensures the portaled menu appears above the modal's overlay.
    const selectStyles = {
        menuPortal: base => ({ ...base, zIndex: 9999 })
    };
    
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Interview Booking' : 'Create New Interview Booking'}
            size="lg"
            footer={
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        form="booking-form" 
                        variant="primary" 
                        isLoading={isSubmitting || loadingInterviewers}
                    >
                        {isEditMode ? 'Save Changes' : 'Create Booking'}
                    </Button>
                </div>
            }
        >
            <form id="booking-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Booking Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="bookingDate">
                        Booking Date <span className="text-red-500">*</span>
                    </label>
                    <Controller
                        control={control}
                        id="bookingDate"
                        name="bookingDate"
                        rules={{ required: 'Please select a booking date' }}
                        render={({ field }) => (
                            <DatePicker
                                placeholderText="Select a date"
                                onChange={(date) => field.onChange(date)}
                                selected={field.value}
                                className="form-input" // Using a common class from index.css
                                minDate={new Date()}
                                dateFormat="MMMM d, yyyy"
                            />
                        )}
                    />
                    {errors.bookingDate && <p className="form-error">{errors.bookingDate.message}</p>}
                </div>
                
                {/* Interviewers Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="interviewers">
                        Select Interviewers <span className="text-red-500">*</span>
                    </label>
                    <Controller
                        name="interviewers"
                        id="interviewers"
                        control={control}
                        rules={{
                            required: 'Please select at least one interviewer',
                            validate: value => (value && value.length > 0) || 'At least one interviewer must be selected'
                        }}
                        render={({ field }) => (
                            <Select
                                {...field}
                                isMulti
                                options={interviewerOptions}
                                isLoading={loadingInterviewers}
                                placeholder="Choose one or more interviewers..."
                                formatOptionLabel={formatOptionLabel}
                                noOptionsMessage={() => "No active interviewers found"}
                                // These props are the solution to display the menu outside the modal
                                menuPortalTarget={document.body}
                                styles={selectStyles}
                                menuPosition={'fixed'}
                            />
                        )}
                    />
                    {errors.interviewers && <p className="form-error">{errors.interviewers.message}</p>}
                </div>

                {/* Info Alert */}
                <Alert
                    type="info"
                    message="Selected interviewers will be notified to provide their available time slots for the chosen date."
                />
            </form>
        </Modal>
    );
};

export default BookingFormModal;
