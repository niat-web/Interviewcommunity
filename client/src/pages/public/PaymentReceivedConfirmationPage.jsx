import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getPaymentReceivedDetails, submitPaymentReceived } from '@/api/public.api';
import { useAlert } from '@/hooks/useAlert';
import { FiCheckCircle, FiAlertTriangle, FiLoader, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';

// Self-contained components
const Loader = ({ text }) => (
    <div className="flex flex-col items-center justify-center text-center">
        <FiLoader className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-gray-600">{text}</p>
    </div>
);

const PaymentReceivedConfirmationPage = () => {
    const location = useLocation();
    const { showSuccess, showError } = useAlert();
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
        defaultValues: { status: '' }
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pageData, setPageData] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const token = new URLSearchParams(location.search).get('token');
    const selectedStatus = watch('status');

    const fetchData = useCallback(async () => {
        if (!token) {
            setError('This link is invalid or missing a required token.');
            setLoading(false);
            return;
        }
        try {
            const response = await getPaymentReceivedDetails(token);
            setPageData(response.data.data);
            if (response.data.data.status !== 'Pending') {
                setIsSubmitted(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'This confirmation link is invalid or has expired.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onSubmit = async (formData) => {
        if (!formData.status) {
            return showError("Please select whether you've received the payment.");
        }
        try {
            await submitPaymentReceived({
                token,
                status: formData.status,
                remarks: formData.remarks
            });
            showSuccess('Thank you! Your response has been recorded.');
            setIsSubmitted(true);
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to submit confirmation. Please try again.');
        }
    };

    const renderContent = () => {
        if (loading) {
            return <Loader text="Verifying link..." />;
        }
        if (error) {
            return (
                <div className="text-center">
                    <FiAlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">Link Error</h2>
                    <p className="mt-2 text-gray-600">{error}</p>
                </div>
            );
        }
        if (isSubmitted || !pageData) {
            return (
                <div className="text-center">
                    <FiCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">Response Recorded</h2>
                    <p className="mt-2 text-gray-600">Thank you for your confirmation. You may now close this page.</p>
                </div>
            );
        }

        return (
             <>
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Payment Received Confirmation</h1>
                    <p className="mt-2 text-gray-600">Hi {pageData.name}, please confirm payment for <strong>{pageData.monthYear}</strong>.</p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block font-medium text-gray-800 mb-2">Could you please confirm whether you have received the payment for the {pageData.monthYear} interviews?</label>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${selectedStatus === 'Received' ? 'bg-green-100 border-green-500 ring-2 ring-green-500' : 'bg-white border-gray-300'}`}>
                                <input {...register('status', { required: true })} type="radio" value="Received" className="hidden"/>
                                <FiThumbsUp className={`h-6 w-6 mr-3 ${selectedStatus === 'Received' ? 'text-green-600' : 'text-gray-500'}`}/>
                                <span className="font-semibold text-gray-800">Received</span>
                            </label>
                            <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${selectedStatus === 'Not Received' ? 'bg-red-100 border-red-500 ring-2 ring-red-500' : 'bg-white border-gray-300'}`}>
                                <input {...register('status', { required: true })} type="radio" value="Not Received" className="hidden"/>
                                <FiThumbsDown className={`h-6 w-6 mr-3 ${selectedStatus === 'Not Received' ? 'text-red-600' : 'text-gray-500'}`}/>
                                <span className="font-semibold text-gray-800">Not Received</span>
                            </label>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="remarks" className="block font-medium text-gray-800 mb-2">Any Remarks (Optional)</label>
                         <textarea
                            id="remarks"
                            {...register('remarks')}
                            rows="3"
                            placeholder="If not received, please provide details (e.g., date checked, specific issues)."
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                         ></textarea>
                    </div>
                    <button type="submit" disabled={isSubmitting || !selectedStatus} className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
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

export default PaymentReceivedConfirmationPage;
