// server/models/Interviewer.js
const mongoose = require('mongoose');

const InterviewerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Applicant',
    required: true
  },
  currentEmployer: {
    type: String,
    required: true,
    trim: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  yearsOfExperience: {
    type: Number,
    required: true,
    min: 0
  },
  domains: [{
    type: String,
    enum: [
      'MERN Stack', 
      'Java Full Stack', 
      'Python Full Stack', 
      'Data Science', 
      'Data Analytics', 
      'DevOps', 
      'QA', 
      'Mobile Development',
      'Other'
    ],
    required: true
  }],
  primaryDomain: {
    type: String,
    enum: [
      'MERN Stack', 
      'Java Full Stack', 
      'Python Full Stack', 
      'Data Science', 
      'Data Analytics', 
      'DevOps', 
      'QA', 
      'Mobile Development',
      'Other'
    ],
    required: true
  },
  skills: [{
    skill: {
      type: String,
      required: true
    },
    proficiencyLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['On Probation', 'Active', 'Inactive', 'Suspended', 'Terminated'],
    default: 'On Probation'
  },
  paymentTier: {
    type: String,
    enum: ['Tier 1', 'Tier 2', 'Tier 3'],
    default: 'Tier 1'
  },
  paymentAmount: {
    type: String,
    trim: true,
    default: ''
  },
  bankDetails: {
    accountName: {
      type: String,
      trim: true
    },
    accountNumber: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    ifscCode: {
      type: String,
      trim: true
    }
  },
  metrics: {
    interviewsCompleted: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    completionRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    cancellationRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  },
  onboardingDate: {
    type: Date,
    default: Date.now
  },
  probationEndDate: {
    type: Date,
    default: function() {
      // Set probation end date to 1 month after onboarding
      const date = new Date(this.onboardingDate);
      date.setMonth(date.getMonth() + 1);
      return date;
    }
  },
  profileCompleteness: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Check for tier promotion based on metrics
InterviewerSchema.pre('save', function(next) {
  const { interviewsCompleted, averageRating, completionRate } = this.metrics;
  
  // Tier 2 requirements
  if (this.paymentTier === 'Tier 1' &&
      interviewsCompleted >= 20 &&
      averageRating >= 4.0 &&
      completionRate >= 90) {
    this.paymentTier = 'Tier 2';
  }
  
  // Tier 3 requirements
  if (this.paymentTier === 'Tier 2' &&
      interviewsCompleted >= 50 &&
      averageRating >= 4.5 &&
      completionRate >= 95) {
    this.paymentTier = 'Tier 3';
  }
  
  next();
});

// Calculate profile completeness
InterviewerSchema.pre('save', function(next) {
  let completeness = 0;
  const totalFields = 7; // Count of important fields
  
  if (this.user) completeness += 1;
  if (this.domains && this.domains.length > 0) completeness += 1;
  if (this.primaryDomain) completeness += 1;
  if (this.skills && this.skills.length > 0) completeness += 1;
  if (this.bankDetails && this.bankDetails.accountNumber) completeness += 1;
  if (this.currentEmployer) completeness += 1;
  if (this.jobTitle) completeness += 1;
  
  this.profileCompleteness = Math.round((completeness / totalFields) * 100);
  next();
});

module.exports = mongoose.model('Interviewer', InterviewerSchema);