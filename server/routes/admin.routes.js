// server/routes/admin.routes.js
const express = require('express');
const { 
  getDashboardStats, getApplicants, createApplicant, getApplicantDetails,
  updateApplicant, deleteApplicant, exportApplicants, processLinkedInReview, 
  processSkillCategorization, manualOnboard, updateApplicantStatus,
  getSkillAssessments, getGuidelinesSubmissions, processGuidelinesReview,
  getInterviewers, getInterviewerDetails, createInterviewer, updateInterviewer,
  deleteInterviewer, getUsers, getUserDetails, createUser, updateUser, deleteUser,
  createInterviewBooking, getInterviewBookings, getBookingSlots,
  getInterviewBookingDetails,
  resetBookingSubmission,
  updateInterviewBooking,
  deleteInterviewBooking,
  getMainSheetEntryById,
  getMainSheetEntries,
  bulkUpdateMainSheetEntries,
  deleteMainSheetEntry,
  bulkDeleteMainSheetEntries,
  createPublicBooking,
  getPublicBookings,
  updatePublicBooking,
  getStudentPipeline,
  getPublicBookingDetails,
  updateStudentBooking,
  getUniqueHostEmails,
  generateMeetLink,
  sendBookingReminders,
  getUniqueHiringNames,
  getDomains,
  createDomain,
  updateDomain,
  deleteDomain,
  getEvaluationSheetByDomain,
  updateEvaluationSheet,
  getEvaluationDataForAdmin,
  getEarningsReport,
  getPaymentRequests, 
  sendPaymentEmail,
  sendInvoiceMail,
  sendPaymentReceivedEmail,
  refreshRecordingLinks,
  // --- ADDITIONS START ---
  createCustomEmailTemplate,
  getCustomEmailTemplates,
  getCustomEmailTemplateById,
  updateCustomEmailTemplate,
  deleteCustomEmailTemplate,
  sendBulkCustomEmail
  // --- ADDITIONS END ---
} = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validator.middleware');

const router = express.Router();

router.use(protect);
router.use(adminOnly);

// --- ADDITIONS START: Custom Email Feature Routes ---
router.route('/custom-email-templates')
    .post(createCustomEmailTemplate)
    .get(getCustomEmailTemplates);

router.route('/custom-email-templates/:id')
    .get(getCustomEmailTemplateById)
    .put(updateCustomEmailTemplate)
    .delete(deleteCustomEmailTemplate);
    
router.post('/custom-email/send', sendBulkCustomEmail);
// --- ADDITIONS END ---


// Dashboard stats
router.get('/stats/dashboard', getDashboardStats);
router.get('/earnings-report', getEarningsReport);
router.get('/payment-requests', getPaymentRequests); 
router.post('/payment-requests/send-email', sendPaymentEmail); 
router.post('/payment-requests/send-invoice-mail', sendInvoiceMail);
router.post('/payment-requests/send-received-mail', sendPaymentReceivedEmail); 


// Applicant management
router.route('/applicants').get(getApplicants).post(createApplicant);
router.get('/applicants/export', exportApplicants);
router.route('/applicants/:id').get(getApplicantDetails).put(updateApplicant).delete(deleteApplicant);
router.post('/applicants/:id/linkedin-review', validate(schemas.linkedInReview), processLinkedInReview);
router.post('/applicants/:id/manual-onboard', validate(schemas.manualOnboard), manualOnboard);
router.put('/applicants/:id/status', updateApplicantStatus);

// Skill assessment review
router.get('/skill-assessments', getSkillAssessments);
router.post('/skill-assessments/:id/categorize', validate(schemas.skillCategorization), processSkillCategorization);

// Guidelines Submissions
router.get('/guidelines', getGuidelinesSubmissions);
router.post('/guidelines/:id/review', processGuidelinesReview);

// Interviewer Management
router.route('/interviewers').get(getInterviewers).post(createInterviewer);
router.route('/interviewers/:id').get(getInterviewerDetails).put(updateInterviewer).delete(deleteInterviewer);

// User Management
router.route('/users').get(getUsers).post(createUser);
router.route('/users/:id').get(getUserDetails).put(updateUser).delete(deleteUser);

// Interview Booking Management
router.route('/bookings').get(getInterviewBookings).post(createInterviewBooking);
router.route('/bookings/:id').get(getInterviewBookingDetails).put(updateInterviewBooking).delete(deleteInterviewBooking);
router.delete('/bookings/:bookingId/submissions/:submissionId', resetBookingSubmission);
router.get('/booking-slots', getBookingSlots);

// Main Sheet Routes
router.route('/main-sheet').get(getMainSheetEntries);
router.route('/main-sheet/bulk').post(bulkUpdateMainSheetEntries).delete(bulkDeleteMainSheetEntries);
router.get('/main-sheet/hiring-names', getUniqueHiringNames); 
router.post('/main-sheet/refresh-recordings', refreshRecordingLinks);
router.route('/main-sheet/:id').get(getMainSheetEntryById).delete(deleteMainSheetEntry); 

// Student Booking System Routes
router.route('/public-bookings').get(getPublicBookings).post(createPublicBooking);
router.route('/public-bookings/:id').get(getPublicBookingDetails).put(updatePublicBooking);
router.post('/public-bookings/:id/reminders', sendBookingReminders);
router.get('/student-bookings/pipeline', getStudentPipeline);
router.put('/student-bookings/:id', updateStudentBooking);
router.get('/student-bookings/host-emails', getUniqueHostEmails);
router.post('/student-bookings/:id/generate-meet', generateMeetLink);

// Domain & Evaluation Sheet Management Routes
router.route('/domains').get(getDomains).post(createDomain);
router.route('/domains/:id').put(updateDomain).delete(deleteDomain);
router.route('/evaluation-sheet/:domainId').get(getEvaluationSheetByDomain).put(updateEvaluationSheet);

router.get('/evaluation-data', getEvaluationDataForAdmin);

module.exports = router;
