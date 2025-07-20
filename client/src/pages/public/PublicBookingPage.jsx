import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiMail, FiCheckCircle, FiClock, FiUser, FiPhone, FiCalendar, FiArrowRight } from 'react-icons/fi';
import { verifyPublicBookingEmail, getPublicAvailableSlots, bookPublicSlot } from '@/api/public.api.js';
import { useAlert } from '@/hooks/useAlert';
import { formatDate } from '@/utils/formatters';

const PublicBookingPage = () => {
    const { publicId } = useParams();
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
            showError(err.response?.data?.message || 'Failed to book the slot. It might have just been taken. Please refresh and try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Processing...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans py-4 sm:py-6 px-4 sm:px-8 md:px-12 lg:px-16">
            <div className="w-full h-full">
                {step === 'verify_email' && (
                    <div className="w-full flex items-center justify-center" style={{minHeight: 'calc(100vh - 3rem)'}}>
                        <div className="w-full max-w-md bg-white rounded-lg shadow-md border border-gray-200">
                            <div className="p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-800">Verify Your Email</h2>
                            </div>
                            <form onSubmit={handleSubmit(handleEmailVerification)} className="p-6">
                                <p className="text-gray-600 mb-4 text-sm">
                                    Please enter the email address where you received the interview invitation.
                                </p>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <div className="relative">
                                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="you@example.com"
                                            {...register('email', { required: 'Email is required' })}
                                        />
                                    </div>
                                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex justify-center items-center py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
                                >
                                    {isSubmitting ? 'Verifying...' : 'Proceed'}
                                    {!isSubmitting && <FiArrowRight className="ml-2 h-4 w-4" />}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                
                {step === 'booking_form' && (
                    <form 
                        onSubmit={handleSubmit(handleBookingSubmit)} 
                        className="w-full h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                    >
                        <div className="flex flex-col md:flex-row w-full h-full">
                            {/* Left Side: User Details */}
                            <div className="w-full md:w-[400px] flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-200 p-6 flex flex-col">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b">Your Details</h2>
                                <div className="flex-grow space-y-4">
                                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md">
                                        <FiMail className="h-4 w-4 text-gray-500" />
                                        <p className="text-sm text-gray-800 break-all">{verifiedEmail}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <div className="relative">
                                            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                                {...register('studentName', { required: "Full name is required" })}
                                            />
                                        </div>
                                        {errors.studentName && <p className="mt-1 text-xs text-red-600">{errors.studentName.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <div className="relative">
                                            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="tel"
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                                {...register('studentPhone', { required: "Phone number is required" })}
                                            />
                                        </div>
                                        {errors.studentPhone && <p className="mt-1 text-xs text-red-600">{errors.studentPhone.message}</p>}
                                    </div>
                                </div>
                                <div className="mt-auto pt-6 flex-shrink-0">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex justify-center py-2.5 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
                                    >
                                        {isSubmitting ? 'Booking...' : 'Confirm My Booking'}
                                    </button>
                                </div>
                            </div>

                            {/* Right Side: Slot Selection (Scrollable) */}
                            <div className="w-full md:flex-1 p-6 flex flex-col overflow-hidden">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 pb-4 border-b flex-shrink-0">Select an Available Time Slot</h2>
                                {errors.selectedSlot && <p className="mb-2 text-xs text-red-600 flex-shrink-0">{errors.selectedSlot.message}</p>}
                                <div className="flex-grow overflow-y-auto space-y-6 pr-2">
                                    {availableSlots.length > 0 ? (
                                        availableSlots.map((interviewerSlot) => (
                                            <div key={interviewerSlot._id}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FiCalendar className="h-4 w-4 text-gray-500" />
                                                    <h3 className="text-sm font-semibold text-gray-800">{formatDate(interviewerSlot.date)}</h3>
                                                </div>
                                                <div className="text-xs text-gray-600 mb-3 ml-1">
                                                    <FiUser className="inline-block mr-1 h-3 w-3" />
                                                    {interviewerSlot.interviewer.user.firstName} {interviewerSlot.interviewer.user.lastName}
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                    {interviewerSlot.timeSlots.map((slot) => (
                                                        <label key={slot._id} className="relative block">
                                                            <input
                                                                type="radio"
                                                                className="sr-only peer"
                                                                {...register('selectedSlot', { required: "Please select one time slot" })}
                                                                value={`${interviewerSlot.interviewer._id}|${slot.startTime}|${slot.endTime}`}
                                                            />
                                                            <div className="text-center p-2 border border-gray-300 rounded-md cursor-pointer text-sm text-gray-700 hover:border-blue-500 hover:bg-blue-50 peer-checked:bg-blue-100 peer-checked:border-blue-500 peer-checked:font-semibold peer-checked:text-blue-800">
                                                                {`${slot.startTime} - ${slot.endTime}`}
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                            <FiClock className="h-8 w-8 mb-2" />
                                            <p className="font-semibold">No slots currently available.</p>
                                            <p className="text-sm">Please check back later.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {(step === 'confirmed' || step === 'already_booked') && (
                     <div className="w-full flex items-center justify-center" style={{minHeight: 'calc(100vh - 3rem)'}}>
                        <div className="w-full max-w-xl bg-white rounded-lg shadow-md border border-gray-200">
                             <div className="p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-800">Booking Confirmed</h2>
                            </div>
                            <div className="p-8 text-center">
                                <FiCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                    {step === 'already_booked' ? 'You Have a Previous Booking' : 'Your Interview is Scheduled!'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Please check your email for the meeting link and further details.
                                </p>
                                {confirmedBooking && (
                                    <div className="text-left bg-gray-50 rounded-lg border p-4 space-y-3">
                                        <div className="flex items-center">
                                            <FiUser className="w-4 h-4 mr-3 text-gray-500"/>
                                            <span className="text-sm text-gray-600">Name:</span>
                                            <span className="ml-2 font-medium text-gray-800">{confirmedBooking.studentName}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <FiCalendar className="w-4 h-4 mr-3 text-gray-500"/>
                                            <span className="text-sm text-gray-600">Date:</span>
                                            <span className="ml-2 font-medium text-gray-800">{formatDate(confirmedBooking.bookingDate)}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <FiClock className="w-4 h-4 mr-3 text-gray-500"/>
                                            <span className="text-sm text-gray-600">Time:</span>
                                            <span className="ml-2 font-medium text-gray-800">{`${confirmedBooking.bookedSlot.startTime} - ${confirmedBooking.bookedSlot.endTime}`}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
};

export default PublicBookingPage;
