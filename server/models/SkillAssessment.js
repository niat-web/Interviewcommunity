// server/models/SkillAssessment.js
const mongoose = require('mongoose');

const SkillAssessmentSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Applicant',
    required: true
  },
  currentEmployer: {
    type: String,
    required: [true, 'Current employer is required'],
    trim: true
  },
  jobTitle: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: [0, 'Years of experience cannot be negative']
  },
  technicalSkills: [{
    technology: {
      type: String,
      required: true
    },
    subSkills: {
      type: [String],
      required: true
    }
  }],
  otherSkills: {
    type: String,
    trim: true
  },
  domains: [{
    type: String,
    enum: [
      'MERN', 
      'JAVA', 
      'PYTHON', 
      'DA', 
      'QA', 
      'Other'
    ]
  }],
  autoCategorizedDomain: {
    type: String,
    enum: [
      'MERN', 
      'JAVA', 
      'PYTHON', 
      'DA', 
      'QA', 
      'Other'
    ]
  },
  adminCategorized: {
    type: Boolean,
    default: false
  },
  categorizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed'],
    default: 'Pending'
  },
  additionalNotes: {
    type: String,
    trim: true
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

// Auto-categorize domain based on skills before saving
SkillAssessmentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('technicalSkills')) {
    this.autoCategorizedDomain = this.detectDomain();
    // Only set the domain array if it hasn't been admin-categorized and is currently empty
    if (!this.adminCategorized && (!this.domains || this.domains.length === 0)) {
      this.domains = [this.autoCategorizedDomain];
    }
  }
  next();
});

// Method to detect domain based on skills
SkillAssessmentSchema.methods.detectDomain = function() {
  const allSkills = this.technicalSkills.map(skill => skill.technology.toLowerCase());
  
  // Define keywords for each domain
  const domainKeywords = {
    'MERN': ['react', 'node', 'express', 'mongodb', 'javascript', 'redux', 'mern', 'mern stack'],
    'JAVA': ['java', 'spring', 'hibernate', 'jsp', 'servlet', 'j2ee', 'spring boot', 'java full stack'],
    'PYTHON': ['python', 'django', 'flask', 'fastapi', 'python full stack'],
    'DA': ['sql', 'tableau', 'power bi', 'data analytics', 'data science', 'excel', 'data visualization', 'statistics'],
    'QA': ['testing', 'selenium', 'qa', 'quality assurance', 'junit', 'test automation', 'qa testing(selenium)']
  };
  
  // Count matches for each domain
  const domainMatches = {};
  
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    domainMatches[domain] = 0;
    
    for (const keyword of keywords) {
      for (const skill of allSkills) {
        if (skill.includes(keyword)) {
          domainMatches[domain]++;
          break; // Count each keyword only once per skill
        }
      }
    }
  }
  
  // Find domain with highest matches
  let bestMatch = 'Other';
  let highestCount = 0;
  
  for (const [domain, count] of Object.entries(domainMatches)) {
    if (count > highestCount) {
      highestCount = count;
      bestMatch = domain;
    }
  }
  
  return bestMatch;
};


module.exports = mongoose.model('SkillAssessment', SkillAssessmentSchema);
