// server/routes/interviewer.routes.js
const express = require('express');
const { 
  getProfile, 
  updateProfile,
  getMetrics, 
  updateBankDetails,
  getBookingRequests,
  submitTimeSlots,
  declineBookingRequest,
  addExperience,
  updateExperience,
  deleteExperience,
  addSkill,
  updateSkill,
  deleteSkill,
  getAssignedInterviews,
  updateAssignedInterviewStatus,
  // --- MODIFICATION START: Import new functions ---
  getAssignedDomains,
  getEvaluationDataForInterviewer,
  updateEvaluationData,
  getPaymentHistory,
  subscribeToPushNotifications // NEW
  // --- MODIFICATION END ---
} = require('../controllers/interviewer.controller');
const { protect, interviewerOnly } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validator.middleware');

const router = express.Router();

router.use(protect);
router.use(interviewerOnly);

// Route for push notification subscription
router.post('/subscribe', subscribeToPushNotifications); // NEW

// Existing routes for "Assigned Interviews" page
router.get('/assigned-interviews', getAssignedInterviews);
router.put('/assigned-interviews/:id/status', updateAssignedInterviewStatus);

// --- MODIFICATION START: New routes for the "Domain Evaluation" page ---
router.get('/assigned-domains', getAssignedDomains);
router.get('/evaluation-data', getEvaluationDataForInterviewer);
router.put('/evaluation-data/:id', updateEvaluationData);
// --- MODIFICATION END ---

// --- MODIFICATION START: New route for payment history ---
router.get('/payment-history', getPaymentHistory);
// --- MODIFICATION END ---

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/bank-details', updateBankDetails);

router.get('/booking-requests', getBookingRequests);
router.post('/booking-requests/:bookingId/slots', submitTimeSlots);
router.post('/booking-requests/:bookingId/decline', declineBookingRequest);

router.route('/experience')
    .post(addExperience);

router.route('/experience/:expId')
    .put(updateExperience)
    .delete(deleteExperience);

router.route('/skills')
    .post(addSkill);
    
router.route('/skills/:skillId')
    .put(updateSkill)
    .delete(deleteSkill);

router.get('/metrics', getMetrics);

module.exports = router;
