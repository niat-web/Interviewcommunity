// server/models/PayoutSheet.js
const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

// Generates a 20-digit numeric string
const generateActivityId = customAlphabet('1234567890', 20);

const PayoutSheetSchema = new mongoose.Schema({
  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interviewer',
    required: true,
  },
  monthYear: { // e.g., "July 2024", for upserting
    type: String,
    required: true,
  },
  associationName: {
    type: String,
    required: true,
    default: 'EXTERNAL_INTERVIEWERS_COMMUNITY'
  },
  activityName: {
    type: String,
    required: true,
    default: 'FREELANCER_INTERVIEW_SERVICE'
  },
  activityReferenceId: {
    type: String,
    required: true,
    unique: true,
    default: () => generateActivityId(),
  },
  activityDatetime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  points: { // Represents the total amount
    type: Number,
    required: true,
  },
  pointsVestingDatetime: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, { timestamps: true });

// Ensures that each interviewer has only one payout record per month
PayoutSheetSchema.index({ interviewer: 1, monthYear: 1 }, { unique: true });

module.exports = mongoose.model('PayoutSheet', PayoutSheetSchema);
