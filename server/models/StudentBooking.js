// server/models/StudentBooking.js
const mongoose = require('mongoose');

const StudentBookingSchema = new mongoose.Schema({
    publicBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PublicBooking',
        required: true
    },
    interviewId: { 
        type: String, 
        index: true 
    },
    hiringName: { // --- MODIFICATION: Add hiringName ---
        type: String,
        trim: true
    },
    domain: {
        type: String,
        trim: true,
    },
    userId: {
        type: String,
        trim: true,
    },
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    studentEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    studentPhone: {
        type: String,
        required: true,
        trim: true
    },
    // --- MODIFICATION START ---
    // These fields will be populated from the authorized student data
    mobileNumber: {
        type: String,
        trim: true
    },
    resumeLink: {
        type: String,
        trim: true
    },
    // --- MODIFICATION END ---
    bookedInterviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interviewer',
        required: true
    },
    // New field to directly store the interviewer's email
    interviewerEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    bookedSlot: {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true }
    },
    // Changed to String to store in MM/DD/YYYY format
    bookingDate: {
        type: String,
        required: true
    },
    hostEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    eventTitle: {
        type: String,
        trim: true,
        default: ''
    },
    meetLink: {
        type: String,
        trim: true,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('StudentBooking', StudentBookingSchema);
