import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiMail, FiCheckCircle, FiClock, FiUser, FiPhone, FiCalendar, FiArrowRight, FiInfo } from 'react-icons/fi';

import { verifyPublicBookingEmail, getPublicAvailableSlots, bookPublicSlot } from '@/api/public.api.js';
import { useAlert } from '@/hooks/useAlert';
import { formatDate } from '@/utils/formatters';

const PublicBookingPage = () => {
    const { publicId } = useParams();
    // Replaced the 'error' state with showError for toast notifications
    const { showSuccess, showError } = useAlert();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    
    const [step, setStep] = useState('verify_email');
    const [loading, setLoading] = useState(false);
    const [verifiedEmail, setVerifiedEmail] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [confirmedBooking, setConfirmedBooking] = useState(null);

    const handleEmailVerification = async (data) => {
        setLoading(true);
        try {
            const response = await verifyPublicBookingEmail({ email: data.email, publicId });
            setVerifiedEmail(data.email);

            if (response.data.status === 'already_booked') {
                setConfirmedBooking(response.data.booking);
                setStep('already_booked');
            } else {
                const slotsResponse = await getPublicAvailableSlots(publicId);
                setAvailableSlots(slotsResponse.data.data);
                setStep('booking_form');
            }
        } catch (err) {
            // Use the toast-style error message instead of the old banner
            showError(err.response?.data?.message || "Verification failed. Please check your email and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleBookingSubmit = async (data) => {
        setLoading(true);
        const [interviewerId, startTime, endTime] = data.selectedSlot.split('|');

        try {
            const bookingData = {
                studentName: data.studentName,
                studentPhone: data.studentPhone,
                studentEmail: verifiedEmail,
                interviewerId,
                slot: { startTime, endTime },
            };

            const response = await bookPublicSlot(publicId, bookingData);
            setConfirmedBooking(response.data.data);
            showSuccess('Your interview slot has been confirmed!');
            setStep('confirmed');
        } catch (err) {
            // Use the toast-style error message for booking errors as well
            showError(err.response?.data?.message || 'Failed to book the slot. It might have just been taken. Please refresh and try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-base text-gray-600 font-sans">Processing your request...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <main className="flex-grow py-8 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    {/* The static error banner has been removed. Errors will now appear as toast notifications. */}

                    {step === 'verify_email' && (
                        <div className="max-w-md mx-auto">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="bg-indigo-600 px-6 py-4">
                                    <h2 className="text-xl font-bold text-white">Verify Your Email</h2>
                                </div>
                                <form onSubmit={handleSubmit(handleEmailVerification)} className="p-6">
                                    <p className="text-slate-600 mb-6">
                                        Please enter the email where you received the interview invitation.
                                    </p>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FiMail className="text-slate-400" />
                                            </div>
                                            <input
                                                type="email"
                                                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="you@example.com"
                                                {...register('email', { required: 'Email is required' })}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                                        )}
                                    </div>
                                    <div>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? 'Processing...' : (
                                                <>
                                                    Proceed <FiArrowRight className="ml-2" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                    
                    {step === 'booking_form' && (
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <form onSubmit={handleSubmit(handleBookingSubmit)}>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left Column: User Details */}
                                    <div className="lg:col-span-1">
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Details</h2>
                                            <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-md border border-gray-100">
                                                <FiMail className="text-blue-500" />
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">Email:</span> 
                                                    <span className="ml-1 text-blue-600">{verifiedEmail}</span>
                                                </p>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Full Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <FiUser className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                                                            placeholder="Enter your full name"
                                                            {...register('studentName', { required: "Full name is required" })}
                                                        />
                                                    </div>
                                                    {errors.studentName && (
                                                        <p className="mt-1 text-xs text-red-500">{errors.studentName.message}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Phone Number <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <FiPhone className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="tel"
                                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                                                            placeholder="Your contact number"
                                                            {...register('studentPhone', { required: "Phone number is required" })}
                                                        />
                                                    </div>
                                                    {errors.studentPhone && (
                                                        <p className="mt-1 text-xs text-red-500">{errors.studentPhone.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Slot Selection */}
                                    <div className="lg:col-span-2">
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Time Slot</h2>
                                            {errors.selectedSlot && (
                                                <div className="mb-4 p-2 bg-red-50 border-l-2 border-red-500 rounded-md">
                                                    <p className="text-xs text-red-500">{errors.selectedSlot.message}</p>
                                                </div>
                                            )}
                                            <div className="space-y-6 max-h-[500px] overflow-y-auto">
                                                {availableSlots.length > 0 ? (
                                                    availableSlots.map(interviewerSlot => (
                                                        <div key={interviewerSlot._id} className="border-b border-gray-100 last:border-b-0 pb-4">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="bg-blue-50 p-1 rounded-full">
                                                                    <FiCalendar className="h-4 w-4 text-blue-500" />
                                                                </div>
                                                                <h3 className="text-base font-semibold text-gray-800">
                                                                    {formatDate(interviewerSlot.date)}
                                                                </h3>
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-3 ml-1 text-gray-600 text-sm">
                                                                <FiUser className="h-4 w-4" />
                                                                <span>
                                                                    {interviewerSlot.interviewer.user.firstName} {interviewerSlot.interviewer.user.lastName}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                                {interviewerSlot.timeSlots.map(slot => (
                                                                    <label
                                                                        key={slot._id}
                                                                        className="relative flex items-center justify-center p-2 bg-white border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-all duration-200 ease-in-out transform hover:scale-105"
                                                                    >
                                                                        <input
                                                                            type="radio"
                                                                            className="sr-only peer"
                                                                            {...register('selectedSlot', { required: "Please select one slot" })}
                                                                            value={`${interviewerSlot.interviewer._id}|${slot.startTime}|${slot.endTime}`}
                                                                        />
                                                                        <span className="text-sm text-gray-700 peer-checked:text-blue-600 peer-checked:font-medium">
                                                                            {`${slot.startTime} - ${slot.endTime}`}
                                                                        </span>
                                                                        <span className="absolute inset-0 bg-blue-50 rounded-md opacity-0 peer-checked:opacity-100 transition-opacity duration-200 z-[-1]"></span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-10">
                                                        <div className="bg-gray-50 p-2 rounded-full mb-3">
                                                            <FiClock className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                        <p className="text-gray-500 text-base">No slots currently available.</p>
                                                        <p className="text-gray-400 text-sm mt-1">Please check back later or contact support.</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-6">
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSubmitting ? 'Processing...' : 'Confirm My Booking'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {(step === 'confirmed' || step === 'already_booked') && (
                        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="bg-green-600 px-6 py-4">
                                <h2 className="text-xl font-bold text-white">Booking Confirmed</h2>
                            </div>
                            
                            <div className="p-6 sm:p-8">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
                                        <FiCheckCircle className="h-12 w-12 text-green-600" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                                        {step === 'already_booked' ? 'You Already Have a Booking' : 'Your Interview is Scheduled!'}
                                    </h3>
                                    
                                    <p className="text-slate-600 max-w-lg mx-auto">
                                        {step === 'already_booked' 
                                            ? 'You have already booked a slot for this interview.' 
                                            : 'You will receive an email confirmation with calendar details shortly.'
                                        }
                                    </p>
                                </div>
                                
                                {confirmedBooking && (
                                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-100">
                                            <h4 className="font-medium text-slate-700">Booking Details</h4>
                                        </div>
                                        
                                        <div className="p-6 space-y-4">
                                            <div className="flex items-center">
                                                <div className="bg-indigo-100 p-2 rounded-full mr-4">
                                                    <FiUser className="h-5 w-5 text-indigo-600"/>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500">Interviewee</p>
                                                    <p className="font-medium text-slate-800">{confirmedBooking.studentName}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center">
                                                <div className="bg-indigo-100 p-2 rounded-full mr-4">
                                                    <FiCalendar className="h-5 w-5 text-indigo-600"/>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500">Date</p>
                                                    <p className="font-medium text-slate-800">{formatDate(confirmedBooking.bookingDate)}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center">
                                                <div className="bg-indigo-100 p-2 rounded-full mr-4">
                                                    <FiClock className="h-5 w-5 text-indigo-600"/>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500">Time</p>
                                                    <p className="font-medium text-slate-800">{`${confirmedBooking.bookedSlot.startTime} - ${confirmedBooking.bookedSlot.endTime}`}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PublicBookingPage;
