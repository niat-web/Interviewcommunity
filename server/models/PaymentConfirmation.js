const mongoose = require('mongoose');

const PaymentConfirmationSchema = new mongoose.Schema({
    interviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interviewer',
        required: true,
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    monthYear: { // e.g., "July 2024"
        type: String,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    interviewCount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Email Sent', 'Confirmed', 'Disputed'],
        default: 'Email Sent'
    },
    confirmationToken: {
        type: String,
        unique: true,
        sparse: true 
    },
    tokenExpires: {
        type: Date
    },
    remarks: {
        type: String,
        trim: true
    },
    confirmedAt: {
        type: Date
    },
    invoiceEmailSentStatus: {
        type: String,
        enum: ['Not Sent', 'Sent'],
        default: 'Not Sent'
    },
    invoiceEmailSentAt: {
        type: Date
    },
    // --- NEW FIELDS FOR PAYMENT RECEIVED CONFIRMATION ---
    paymentReceivedConfirmationToken: {
        type: String,
        unique: true,
        sparse: true
    },
    paymentReceivedTokenExpires: {
        type: Date
    },
    paymentReceivedStatus: {
        type: String,
        enum: ['Pending', 'Received', 'Not Received'],
        default: 'Pending'
    },
    paymentReceivedRemarks: {
        type: String,
        trim: true
    },
    paymentReceivedEmailSentAt: {
        type: Date
    }
}, { timestamps: true });

// Create a compound index for faster lookups
PaymentConfirmationSchema.index({ interviewer: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('PaymentConfirmation', PaymentConfirmationSchema);
