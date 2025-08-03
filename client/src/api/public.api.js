// client/src/api/public.api.js
import api from './axios'; // The public routes don't use the interceptor for auth

// Verify email for a public booking page
export const verifyPublicBookingEmail = (data) => {
    return api.post('/api/public-bookings/verify-email', data);
};

// Get available slots for a public booking page
export const getPublicAvailableSlots = (publicId) => {
    return api.get(`/api/public-bookings/${publicId}/slots`);
};

// Book a slot on a public booking page
export const bookPublicSlot = (publicId, data) => {
    return api.post(`/api/public-bookings/${publicId}/book`, data);
};


// Get payment details for the confirmation page
export const getPaymentConfirmationDetails = (token) => {
    return api.get(`/api/public-bookings/payment-confirmation-details?token=${token}`);
};

// Submit the payment confirmation form
export const submitPaymentConfirmation = (data) => {
    return api.post('/api/public-bookings/payment-confirmation', data);
};

// ** NEW API FUNCTIONS **
// Get details for the "payment received" confirmation page
export const getPaymentReceivedDetails = (token) => {
    return api.get(`/api/public-bookings/payment-received-details?token=${token}`);
};

// Submit the "payment received" confirmation form
export const submitPaymentReceived = (data) => {
    return api.post('/api/public-bookings/payment-received', data);
};
