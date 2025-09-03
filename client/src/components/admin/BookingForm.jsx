// client/src/components/admin/BookingForm.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar, FiSearch, FiCheck } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import { getInterviewers } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';
import StatusBadge from '@/components/common/StatusBadge';
import Badge from '../common/Badge';

// --- Sub-components (Updated with new designs) ---

const InterviewerListSkeleton = () => (
    <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="p-2 rounded-lg bg-gray-200 animate-pulse h-[56px]"></div>
        ))}
    </div>
);

const InterviewerListItem = React.memo(({ interviewer, isSelected, onSelect }) => (
    <motion.li
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
            isSelected ? 'bg-blue-100 ring-2 ring-blue-300' : 'hover:bg-gray-100'
        }`}
        onClick={onSelect}
    >
        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
            isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
        }`}>
            {isSelected && <FiCheck className="w-3 h-3 text-white" />}
        </div>
        <div className="grid grid-cols-12 gap-x-4 flex-grow items-center">
            <div className="col-span-4 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate" title={interviewer.label}>{interviewer.label}</p>
                <p className="text-xs text-gray-500 truncate" title={interviewer.email}>{interviewer.email}</p>
            </div>
            <div className="col-span-3">
                <StatusBadge status={interviewer.status} />
            </div>
            <div className="col-span-5 flex flex-wrap gap-1">
                {interviewer.domains.length > 0 ? (
                    interviewer.domains.map((domain, index) => (
                        <Badge key={index} variant="gray" size="sm">{domain}</Badge>
                    ))
                ) : (
                    <span className="text-xs text-gray-400 italic">N/A</span>
                )}
            </div>
        </div>
    </motion.li>
));

const InterviewerList = ({ interviewers, loading, selected, onSelectionChange }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredInterviewers = useMemo(() =>
        interviewers.filter(i =>
            i.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.domains.some(d => d.toLowerCase().includes(searchTerm.toLowerCase()))
        ), [interviewers, searchTerm]
    );
    
    // --- CHANGE START: Logic and state for new "Select Active" feature ---
    const activeCount = useMemo(() => 
        filteredInterviewers.filter(i => i.status === 'Active').length, 
        [filteredInterviewers]
    );

    const handleSelectActive = () => {
        const activeIds = filteredInterviewers
            .filter(i => i.status === 'Active')
            .map(i => i.value);
        onSelectionChange(activeIds); // This sets the selection to ONLY the active interviewers
    };

    const handleSelectAll = () => {
        if (selected.length === filteredInterviewers.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(filteredInterviewers.map(i => i.value));
        }
    };
    
    const isAllSelected = selected.length === filteredInterviewers.length && filteredInterviewers.length > 0;
    // --- CHANGE END ---
    
    return (
        <div className="flex flex-col h-full">
            <div className="relative mb-3 flex-shrink-0">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name, email, or domain..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                />
            </div>
            {/* --- CHANGE START: Updated UI with "Select Active" button --- */}
            <div className="flex items-center justify-between px-2 py-2 border-b border-t border-gray-200 flex-shrink-0">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="select-all"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        disabled={loading || filteredInterviewers.length === 0}
                    />
                    <label htmlFor="select-all" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                        Select All ({filteredInterviewers.length} )
                    </label>
                </div>
                <button
                    type="button"
                    onClick={handleSelectActive}
                    disabled={activeCount === 0 || loading}
                    className="px-3 py-1 text-xs font-medium rounded-md border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                >
                    Select Active ({activeCount})
                </button>
            </div>
            {/* --- CHANGE END --- */}
            <div className="flex-grow overflow-y-auto pr-2 py-2">
                {loading ? <InterviewerListSkeleton /> : (
                    <ul className="space-y-1">
                        <AnimatePresence>
                            {filteredInterviewers.map(interviewer => (
                                <InterviewerListItem
                                    key={interviewer.value}
                                    interviewer={interviewer}
                                    isSelected={selected.includes(interviewer.value)}
                                    onSelect={() => {
                                        const newSelected = new Set(selected);
                                        if (newSelected.has(interviewer.value)) newSelected.delete(interviewer.value);
                                        else newSelected.add(interviewer.value);
                                        onSelectionChange(Array.from(newSelected));
                                    }}
                                />
                            ))}
                        </AnimatePresence>
                    </ul>
                )}
            </div>
        </div>
    );
};

// --- Main Refactored Form Component (no changes needed below this line) ---
const BookingForm = ({ onSubmit, initialData = null }) => {
    const { showError } = useAlert();
    const { control, handleSubmit, formState: { errors }, reset, watch } = useForm();
    
    const [interviewerOptions, setInterviewerOptions] = useState([]);
    const [loadingInterviewers, setLoadingInterviewers] = useState(true);

    const selectedInterviewerIds = watch('interviewerIds', []);
    
    useEffect(() => {
        setLoadingInterviewers(true);
        getInterviewers({ limit: 1000, status: 'Active,On Probation' })
            .then(res => {
                const options = (res.data.data.interviewers || []).map(i => ({
                    value: i._id,
                    label: [i.user.firstName, i.user.lastName].filter(Boolean).join(' '),
                    email: i.user.email,
                    status: i.status,
                    domains: i.domains || [],
                    primaryDomain: i.primaryDomain || 'N/A'
                }));
                setInterviewerOptions(options);

                if (initialData) {
                    reset({
                        bookingDate: new Date(initialData.bookingDate),
                        interviewerIds: initialData.interviewers.map(i => i.interviewer._id)
                    });
                } else {
                    reset({ bookingDate: null, interviewerIds: [] });
                }
            })
            .catch(() => showError("Failed to load interviewers"))
            .finally(() => setLoadingInterviewers(false));
    }, [initialData, showError, reset]);
    
    const selectedInterviewers = useMemo(() =>
        interviewerOptions.filter(opt => selectedInterviewerIds.includes(opt.value)),
        [interviewerOptions, selectedInterviewerIds]
    );

    return (
        <form id="booking-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="flex-grow grid md:grid-cols-2 gap-8 min-h-0">
                <div className="flex flex-col space-y-6 min-h-0">
                    <div className="flex-shrink-0">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Interview Date *</label>
                        <div className="relative">
                            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                            <Controller
                                name="bookingDate"
                                control={control}
                                rules={{ required: 'Please select a date' }}
                                render={({ field }) => (
                                    <DatePicker
                                        selected={field.value}
                                        onChange={(date) => field.onChange(date)}
                                        minDate={new Date()}
                                        dateFormat="EEEE, MMMM d, yyyy"
                                        placeholderText="Select a date for interviews"
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                )}
                            />
                        </div>
                        {errors.bookingDate && <p className="mt-1 text-sm text-red-600">{errors.bookingDate.message}</p>}
                    </div>
                    <div className="flex-grow flex flex-col border border-gray-200 rounded-lg bg-gray-50/50 min-h-0">
                        <div className="p-3 border-b border-gray-200 flex-shrink-0"><h4 className="text-sm font-semibold text-gray-800">Selected Interviewers ({selectedInterviewers.length})</h4></div>
                        <div className="flex-grow overflow-y-auto p-3">
                            {selectedInterviewers.length > 0 ? (
                                <ul className="space-y-2">
                                    {selectedInterviewers.map(interviewer => (
                                        <li key={interviewer.value} className="flex items-center justify-between text-sm p-2 rounded-md bg-white border">
                                            <div>
                                                <span className="font-semibold text-gray-800">{interviewer.label}</span>
                                                <span className="text-gray-500 text-xs ml-2">{interviewer.email}</span>
                                            </div>
                                            <StatusBadge status={interviewer.status} />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center text-sm text-gray-500 h-full flex items-center justify-center">Select interviewers from the list.</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col min-h-0">
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex-shrink-0">Available Interviewers *</label>
                    <div className="flex-grow min-h-0">
                         <Controller
                            name="interviewerIds"
                            control={control}
                            rules={{ required: 'Please select at least one interviewer', validate: val => (val || []).length > 0 || 'Select at least one' }}
                            render={({ field }) => (<InterviewerList interviewers={interviewerOptions} loading={loadingInterviewers} selected={field.value || []} onSelectionChange={field.onChange} />)}
                        />
                    </div>
                    {errors.interviewerIds && <p className="mt-1 text-sm text-red-600">{errors.interviewerIds.message}</p>}
                </div>
            </div>
        </form>
    );
};

export default BookingForm;
