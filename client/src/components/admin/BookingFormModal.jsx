// client/src/components/admin/BookingFormModal.jsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { FiCalendar, FiUsers, FiX, FiLoader, FiSave, FiEdit3 } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import StatusBadge from '@/components/common/StatusBadge';
import { useAlert } from '@/hooks/useAlert';
import { getInterviewers, createInterviewBooking, updateInterviewBooking } from '@/api/admin.api';
import Select from 'react-select';

const BookingFormModal = ({ isOpen, onClose, onSuccess, bookingData = null }) => {
    const isEditMode = !!bookingData;
    const { showSuccess, showError } = useAlert();
    const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();
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
        <div className="flex justify-between items-center py-1">
            <span className="text-gray-900 font-medium">{label}</span>
            {status && <StatusBadge status={status} />}
        </div>
    );

    // Custom styles for react-select with Tailwind
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
            borderRadius: '0.5rem',
            padding: '0.25rem',
            minHeight: '48px',
            '&:hover': {
                borderColor: '#9CA3AF'
            }
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#EFF6FF',
            borderRadius: '0.375rem',
            border: '1px solid #DBEAFE'
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: '#1E40AF',
            fontWeight: '500'
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: '#6B7280',
            '&:hover': {
                backgroundColor: '#FEE2E2',
                color: '#DC2626'
            }
        }),
        menuPortal: (provided) => ({
            ...provided,
            zIndex: 9999
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '0.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected 
                ? '#3B82F6' 
                : state.isFocused 
                    ? '#EFF6FF' 
                    : 'white',
            color: state.isSelected ? 'white' : '#374151',
            padding: '12px 16px',
            '&:hover': {
                backgroundColor: state.isSelected ? '#3B82F6' : '#EFF6FF'
            }
        })
    };
    
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

    if (!isOpen) {
        return null;
    }
    
    return (
        <div className="relative z-50">
            {/* Modal Overlay */}
            <div 
                className="fixed inset-0 bg-gradient-to-br from-gray-900/50 to-gray-900/70 backdrop-blur-sm transition-opacity duration-300" 
                aria-hidden="true" 
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                <div className="relative w-full max-w-2xl my-8 flex flex-col bg-white shadow-2xl rounded-2xl border border-gray-100 transform transition-all duration-300 scale-100">
                    {/* Header */}
                    <div className="flex-shrink-0 px-8 py-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl border-b border-gray-100">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    {isEditMode ? (
                                        <FiEdit3 className="h-6 w-6 text-indigo-600" />
                                    ) : (
                                        <FiCalendar className="h-6 w-6 text-indigo-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {isEditMode ? 'Edit Interview Booking' : 'Create New Interview Booking'}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {isEditMode ? 'Update booking details below' : 'Schedule a new interview session'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                onClick={onClose}
                            >
                                <FiX className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8">
                        <div className="space-y-8">
                            {/* Booking Date */}
                            <div className="space-y-2">
                                <label className="flex items-center text-sm font-medium text-gray-700">
                                    <FiCalendar className="mr-2 h-4 w-4 text-gray-500" />
                                    Booking Date
                                </label>
                                <Controller
                                    control={control}
                                    name="bookingDate"
                                    rules={{ required: 'Please select a booking date' }}
                                    render={({ field }) => (
                                        <div className="relative">
                                            <DatePicker
                                                placeholderText="Select a date (mm/dd/yyyy)"
                                                onChange={(date) => field.onChange(date)}
                                                selected={field.value}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-colors duration-200"
                                                minDate={new Date()}
                                                dateFormat="MMMM d, yyyy"
                                                showPopperArrow={false}
                                            />
                                        </div>
                                    )}
                                />
                                {errors.bookingDate && (
                                    <p className="text-red-500 text-sm flex items-center mt-1">
                                        <span className="h-4 w-4 text-red-500 mr-1">⚠</span>
                                        {errors.bookingDate.message}
                                    </p>
                                )}
                            </div>
                            
                            {/* Interviewers Selection */}
                            <div className="space-y-2">
                                <label className="flex items-center text-sm font-medium text-gray-700">
                                    <FiUsers className="mr-2 h-4 w-4 text-gray-500" />
                                    Select Interviewers
                                </label>
                                <Controller
                                    name="interviewers"
                                    control={control}
                                    rules={{ 
                                        required: 'Please select at least one interviewer',
                                        validate: value => value?.length > 0 || 'At least one interviewer must be selected'
                                    }}
                                    render={({ field }) => (
                                        <div className="relative">
                                            <Select
                                                {...field}
                                                isMulti
                                                options={interviewerOptions}
                                                isLoading={loadingInterviewers}
                                                placeholder="Choose interviewers for this booking..."
                                                formatOptionLabel={formatOptionLabel}
                                                menuPortalTarget={document.body}
                                                styles={customSelectStyles}
                                                menuPosition={'fixed'}
                                                loadingMessage={() => (
                                                    <div className="flex items-center justify-center py-4">
                                                        <FiLoader className="animate-spin mr-2 h-4 w-4" />
                                                        Loading interviewers...
                                                    </div>
                                                )}
                                                noOptionsMessage={() => "No interviewers available"}
                                            />
                                        </div>
                                    )}
                                />
                                {errors.interviewers && (
                                    <p className="text-red-500 text-sm flex items-center mt-1">
                                        <span className="h-4 w-4 text-red-500 mr-1">⚠</span>
                                        {errors.interviewers.message}
                                    </p>
                                )}
                                {!loadingInterviewers && interviewerOptions.length === 0 && (
                                    <p className="text-amber-600 text-sm flex items-center mt-1 bg-amber-50 p-3 rounded-lg">
                                        <span className="h-4 w-4 text-amber-500 mr-1">⚠</span>
                                        No active interviewers found. Please check interviewer status.
                                    </p>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <span className="h-5 w-5 text-blue-500">ℹ</span>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-blue-800">
                                            <strong>Note:</strong> Selected interviewers will receive notifications to provide their available time slots for this booking date.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
                            <button 
                                type="button" 
                                className="px-6 py-3 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform hover:scale-105"
                                disabled={isSubmitting || loadingInterviewers}
                            >
                                {isSubmitting ? (
                                    <>
                                        <FiLoader className="animate-spin mr-2 h-5 w-5" />
                                        {isEditMode ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="mr-2 h-5 w-5" />
                                        {isEditMode ? 'Save Changes' : 'Create Booking'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookingFormModal;
