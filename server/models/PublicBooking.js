// server/models/PublicBooking.js
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

// A sub-schema to store detailed information about each authorized student
const AllowedStudentSchema = new mongoose.Schema({
    interviewId: { type: String }, 
    hiringName: { type: String, trim: true }, // --- MODIFICATION: Add hiringName ---
    domain: { type: String, trim: true },
    userId: { type: String, trim: true },
    fullName: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    // --- MODIFICATION START ---
    mobileNumber: { type: String, trim: true },
    resumeLink: { type: String, trim: true }
    // --- MODIFICATION END ---
}, { _id: false });


const PublicBookingSchema = new mongoose.Schema({
    publicId: {
        type: String,
        default: () => nanoid(12), // Use nanoid directly with a specified length
        unique: true,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // The specific slots made available for this booking page
    interviewerSlots: [{
        interviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Interviewer',
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        timeSlots: [{
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
            // This will link to the StudentBooking record once a slot is taken
            bookedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'StudentBooking',
                default: null
            }
        }]
    }],
    // The list of students who are allowed to book using this link, now with more detail
    allowedStudents: [AllowedStudentSchema],
    status: {
        type: String,
        enum: ['Active', 'Closed', 'Archived'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('PublicBooking', PublicBookingSchema);
