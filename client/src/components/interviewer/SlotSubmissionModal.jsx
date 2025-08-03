// client/src/components/interviewer/SlotSubmissionModal.jsx
import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAlert } from '@/hooks/useAlert';
import { FiPlus, FiTrash2, FiSave, FiInfo, FiX, FiLoader } from 'react-icons/fi';
import { TIME_SLOTS } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';
import { submitTimeSlots } from '@/api/interviewer.api';

// --- SELF-CONTAINED UI COMPONENTS (NO EXTERNAL DEPENDENCIES) ---

// 1. Local Modal Component
const LocalModal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                <div 
                    className="relative w-full max-w-2xl my-8 flex flex-col bg-white shadow-xl rounded-2xl max-h-[90vh] transform transition-all"
                    onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
                >
                    {/* Header */}
                    <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-xl font-semibold leading-6 text-gray-900" id="modal-title">{title}</h3>
                        <button type="button" className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none" onClick={onClose}>
                            <FiX className="h-6 w-6" />
                        </button>
                    </div>
                    {/* Body */}
                    <div className="flex-1 p-4 overflow-y-auto">{children}</div>
                    {/* Footer */}
                    {footer && (
                        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 2. Local Button Component
const LocalButton = ({ children, onClick, type = 'button', isLoading = false, variant = 'primary', icon: Icon, disabled = false, className = '', ...props }) => {
    const baseClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm transition-all duration-200";
    const variantClasses = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
        outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        ghost: 'text-gray-500 hover:bg-gray-100 focus:ring-gray-300 shadow-none'
    };

    return (
        <button type={type} onClick={onClick} disabled={isLoading || disabled} className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
            {isLoading ? (<FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5" />) : (Icon && <Icon className="mr-2 h-4 w-4" />)}
            {isLoading ? 'Saving...' : children}
        </button>
    );
};


// 3. Local Textarea Component
const LocalTextarea = React.forwardRef(({ label, error, ...props }, ref) => (
    <div>
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <textarea
            ref={ref}
            {...props}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 text-sm ${
                error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
            }`}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
));
LocalTextarea.displayName = 'LocalTextarea';

// 4. Local Alert Component
const LocalAlert = ({ message, icon: Icon }) => (
    <div className="rounded-md border-l-4 border-blue-400 bg-blue-50 p-4">
        <div className="flex">
            <div className="flex-shrink-0">{Icon && <Icon className="h-5 w-5 text-blue-500" />}</div>
            <div className="ml-3"><p className="text-sm text-blue-800">{message}</p></div>
        </div>
    </div>
);


// --- MAIN COMPONENT ---
const SlotSubmissionModal = ({ isOpen, onClose, request, onSuccess }) => {
    const { showSuccess, showError } = useAlert();
    const { register, control, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm({
        defaultValues: { slots: [{ startTime: '', endTime: '' }], remarks: '' }
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'slots' });

    const validateEndTime = (endTime, index) => {
        const startTime = watch(`slots.${index}.startTime`);
        if (!startTime || !endTime) return true;
        return endTime > startTime || 'End time must be after the start time.';
    };

    const onSubmit = async (data) => {
        const validSlots = data.slots.filter(slot => slot.startTime && slot.endTime);
        if (validSlots.length === 0) {
            return showError('Please provide at least one complete time slot.');
        }
        try {
            await submitTimeSlots(request.bookingId, { ...data, slots: validSlots });
            showSuccess('Availability submitted successfully!');
            onSuccess();
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to submit time slots.');
        }
    };
    
    const selectInputClass = "w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm";
    const errorInputClass = "border-red-500 focus:border-red-500";

    return (
        <LocalModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Provide Availability for ${formatDate(request.bookingDate)}`}
            footer={
                <div className="flex justify-end gap-3">
                    <LocalButton variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</LocalButton>
                    <LocalButton type="submit" form="slot-submission-form" icon={FiSave} isLoading={isSubmitting}>Submit Slots</LocalButton>
                </div>
            }
        >
            <form id="slot-submission-form" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-6">
                    <LocalAlert
                        icon={FiInfo}
                        message="Provide one or more time slots when you are available. All times are considered in your local timezone."
                    />

                    <div className="space-y-4">
                        {/* --- MODIFICATION: Header row is now a flex container --- */}
                        <div className="flex justify-between items-center">
                            <div className="grid grid-cols-10 gap-x-14">
                                <div className="col-span-5"><label className="text-sm font-semibold text-gray-800">Start Time</label></div>
                                <div className="col-span-5"><label className="text-sm font-semibold text-gray-800">End Time</label></div>
                            </div>
                            <LocalButton
                                type="button"
                                variant="outline"
                                className="!py-1 !px-3"
                                onClick={() => append({ startTime: '', endTime: '' })}
                                icon={FiPlus}
                            >
                                Add Slot
                            </LocalButton>
                        </div>


                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-x-4 items-center">
                                <div className="col-span-5">
                                    <select {...register(`slots.${index}.startTime`, { required: 'Start time is required.' })} className={`${selectInputClass} ${errors.slots?.[index]?.startTime ? errorInputClass : ''}`} defaultValue="">
                                        <option value="" disabled>Select a start time</option>
                                        {TIME_SLOTS.map(slot => <option key={slot.value + '-start'} value={slot.value}>{slot.label}</option>)}
                                    </select>
                                    {errors.slots?.[index]?.startTime && <p className="mt-1 text-xs text-red-600">{errors.slots[index].startTime.message}</p>}
                                </div>
                                <div className="col-span-5">
                                    <select {...register(`slots.${index}.endTime`, { required: 'End time is required.', validate: (value) => validateEndTime(value, index) })} className={`${selectInputClass} ${errors.slots?.[index]?.endTime ? errorInputClass : ''}`} defaultValue="">
                                        <option value="" disabled>Select an end time</option>
                                        {TIME_SLOTS.map(slot => <option key={slot.value + '-end'} value={slot.value}>{slot.label}</option>)}
                                    </select>
                                    {errors.slots?.[index]?.endTime && <p className="mt-1 text-xs text-red-600">{errors.slots[index].endTime.message}</p>}
                                </div>
                                <div className="col-span-2 flex items-center justify-center">
                                     <LocalButton type="button" variant="ghost" className="!p-2 text-red-500 hover:!bg-red-50" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                         <FiTrash2 />
                                     </LocalButton>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* The centered "Add Another Slot" button has been moved to the header */}

                    <div>
                       <LocalTextarea label="Remarks (Optional)" placeholder="Add any notes for the admin regarding your availability..." rows="3" {...register('remarks')} />
                    </div>
                </div>
            </form>
        </LocalModal>
    );
};

export default SlotSubmissionModal;
