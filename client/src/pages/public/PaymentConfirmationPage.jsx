import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getPaymentConfirmationDetails, submitPaymentConfirmation } from '@/api/public.api';
import { useAlert } from '@/hooks/useAlert';
import { FiCheckCircle, FiAlertTriangle, FiLoader } from 'react-icons/fi';

// Self-contained components to avoid dependency issues
const Loader = ({ text }) => (
    <div className="flex flex-col items-center justify-center text-center">
        <FiLoader className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-gray-600">{text}</p>
    </div>
);

const PaymentConfirmationPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { showSuccess, showError } = useAlert();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmationData, setConfirmationData] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const token = new URLSearchParams(location.search).get('token');

    const fetchData = useCallback(async () => {
        if (!token) {
            setError('No confirmation token provided. This link is invalid.');
            setLoading(false);
            return;
        }
        try {
            const response = await getPaymentConfirmationDetails(token);
            const data = response.data.data;
            if (data.status !== 'Email Sent') {
                 setIsSubmitted(true); // If already confirmed or disputed, show success message
            }
            setConfirmationData(data);
        } catch (err) {
            setError(err.response?.data?.message || 'The confirmation link is invalid or has expired.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onSubmit = async (formData) => {
        try {
            await submitPaymentConfirmation({
                token,
                status: formData.confirmationStatus,
                remarks: formData.remarks
            });
            showSuccess('Your confirmation has been submitted successfully!');
            setIsSubmitted(true);
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to submit confirmation. Please try again.');
        }
    };
    
    const renderContent = () => {
        if (loading) {
            return <Loader text="Verifying your confirmation link..." />;
        }
        if (error) {
            return (
                <div className="text-center">
                    <FiAlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">An Error Occurred</h2>
                    <p className="mt-2 text-gray-600">{error}</p>
                </div>
            );
        }
        if (isSubmitted || !confirmationData) {
            return (
                 <div className="text-center">
                    <FiCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">Thank You</h2>
                    <p className="mt-2 text-gray-600">Your response has been recorded. You may now close this page.</p>
                </div>
            );
        }

        return (
             <>
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Payment Confirmation</h1>
                    <p className="mt-2 text-gray-600">For {confirmationData.monthYear}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 space-y-2">
                     <p><strong>Name:</strong> {confirmationData.name}</p>
                     <p><strong>Total Interviews:</strong> {confirmationData.interviewCount}</p>
                     <p><strong>Total Amount:</strong> ₹{confirmationData.totalAmount}</p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block font-medium text-gray-800 mb-2">Kindly confirm if the interview count and payment amount are accurate from your end.</label>
                        <select
                            {...register('confirmationStatus', { required: 'Please select a confirmation option.'})}
                            className={`w-full p-2 border rounded-md ${errors.confirmationStatus ? 'border-red-500' : 'border-gray-300'}`}
                        >
                            <option value="Confirmed">Confirmed</option>
                            <option value="Disputed">Not Confirmed (Disputed)</option>
                        </select>
                        {errors.confirmationStatus && <p className="mt-1 text-xs text-red-600">{errors.confirmationStatus.message}</p>}
                    </div>
                     <div>
                        <label className="block font-medium text-gray-800 mb-2">Any Remarks (Optional)</label>
                         <textarea
                            {...register('remarks')}
                            rows="3"
                            placeholder="If not confirmed, please provide details here."
                            className="w-full p-2 border border-gray-300 rounded-md"
                         ></textarea>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                        {isSubmitting ? 'Submitting...' : 'Submit Confirmation'}
                    </button>
                </form>
             </>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-lg border p-8">
                {renderContent()}
            </div>
        </div>
    );
};

export default PaymentConfirmationPage;
