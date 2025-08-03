// server/models/MainSheetEntry.js
const mongoose = require('mongoose');

const MainSheetEntrySchema = new mongoose.Schema({
    hiringName: { type: String, trim: true, default: '' },
    techStack: { 
        type: String, 
        trim: true, 
        default: ''
    },
    interviewId: { type: String, trim: true, unique: true, sparse: true },
    uid: { type: String, trim: true, default: '' },
    candidateName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, trim: true, default: '' },
    mailId: { type: String, required: true, trim: true, lowercase: true },
    candidateResume: { type: String, trim: true, default: '' },
    meetingLink: { type: String, trim: true, default: '' },
    recordingLink: { type: String, trim: true, default: '' },
    interviewDate: { type: Date },
    interviewTime: { type: String, trim: true, default: '' },
    interviewDuration: { type: String, trim: true, default: '' },
    interviewStatus: {
        type: String,
        enum: ['Completed', 'Scheduled', 'InProgress', 'Cancelled', ''],
        default: 'Scheduled'
    },
    remarks: { type: String, trim: true, default: '' },
    interviewerRemarks: { type: String, trim: true, default: '' },
    interviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interviewer'
    },
    evaluationData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('MainSheetEntry', MainSheetEntrySchema);
