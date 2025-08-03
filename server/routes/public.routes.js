// server/routes/public.routes.js
const express = require('express');
const {
    verifyEmail,
    getAvailableSlots,
    bookSlot,
    getPaymentConfirmationDetails,
    submitPaymentConfirmation,
    getPaymentReceivedDetails, // ** NEW **
    submitPaymentReceived // ** NEW **
} = require('../controllers/public.controller');

const router = express.Router();

// No 'protect' middleware here since these routes must be public
router.post('/verify-email', verifyEmail);
router.get('/:publicId/slots', getAvailableSlots);
router.post('/:publicId/book', bookSlot);

router.get('/payment-confirmation-details', getPaymentConfirmationDetails);
router.post('/payment-confirmation', submitPaymentConfirmation);

// ** NEW ROUTES for payment received confirmation **
router.get('/payment-received-details', getPaymentReceivedDetails);
router.post('/payment-received', submitPaymentReceived);


module.exports = router;
