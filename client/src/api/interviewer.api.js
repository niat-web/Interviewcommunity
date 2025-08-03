// client/src/api/interviewer.api.js
import api from './axios';

// --- NEW FUNCTION for Push Notifications ---
export const subscribePush = (subscription) => {
    return api.post('/api/interviewer/subscribe', subscription);
};

// --- MODIFICATION START: New APIs for Domain Evaluation Page ---
export const getAssignedDomains = () => {
    return api.get('/api/interviewer/assigned-domains');
};

export const getEvaluationDataForInterviewer = (params) => {
    return api.get('/api/interviewer/evaluation-data', { params });
};

export const updateEvaluationData = (id, data) => {
    return api.put(`/api/interviewer/evaluation-data/${id}`, data);
};
// --- MODIFICATION END ---

// --- MODIFICATION START: New API for Payment History ---
export const getPaymentHistory = (params) => {
    return api.get('/api/interviewer/payment-history', { params });
};
// --- MODIFICATION END ---


export const updateInterviewStatus = (id, status) => {
  return api.put(`/api/interviewer/assigned-interviews/${id}/status`, { status });
};

export const getAssignedInterviews = () => {
  return api.get('/api/interviewer/assigned-interviews');
};

export const getProfile = () => {
  return api.get('/api/interviewer/profile');
};

export const updateProfile = (data) => {
  return api.put('/api/interviewer/profile', data);
};

export const getMetrics = () => {
  return api.get('/api/interviewer/metrics');
};

export const updateBankDetails = (data) => {
  return api.put('/api/interviewer/bank-details', data);
};

export const getBookingRequests = () => {
  return api.get('/api/interviewer/booking-requests');
};

export const submitTimeSlots = (bookingId, data) => {
  return api.post(`/api/interviewer/booking-requests/${bookingId}/slots`, data);
};

export const declineBookingRequest = (bookingId, data) => {
  return api.post(`/api/interviewer/booking-requests/${bookingId}/decline`, data);
};

export const addExperience = (data) => {
  return api.post('/api/interviewer/experience', data);
};
export const updateExperience = (expId, data) => {
  return api.put(`/api/interviewer/experience/${expId}`, data);
};
export const deleteExperience = (expId) => {
  return api.delete(`/api/interviewer/experience/${expId}`);
};
export const addSkill = (data) => {
  return api.post('/api/interviewer/skills', data);
};
export const updateSkill = (skillId, data) => {
  return api.put(`/api/interviewer/skills/${skillId}`, data);
};
export const deleteSkill = (skillId) => {
  return api.delete(`/api/interviewer/skills/${skillId}`);
};
