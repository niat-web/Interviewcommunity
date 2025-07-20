// server/middleware/validator.middleware.js
const Joi = require('joi');

// Middleware factory for request validation
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  
  if (error) {
    const message = error.details.map(detail => detail.message).join(', ');
    res.status(400);
    throw new Error(message);
  }
  
  next();
};

// Validation schemas
const schemas = {
  // Auth schemas
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  createPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
  }),
  
  resetPassword: Joi.object({
    email: Joi.string().email().required()
  }),
  
  // Applicant schemas
  initialApplication: Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    whatsappNumber: Joi.string().allow('', null),
    linkedinProfileUrl: Joi.string().required(),
    interestedInJoining: Joi.boolean().default(true),
    sourcingChannel: Joi.string().valid(
      'LinkedIn', 'Referral', 'Job Portal', 'Website', 'Other'
    ).required(),
    additionalComments: Joi.string().allow('', null)
  }),
  
  skillAssessment: Joi.object({
    currentEmployer: Joi.string().required(),
    jobTitle: Joi.string().required(),
    yearsOfExperience: Joi.number().min(0).required(),
    technicalSkills: Joi.array().items(
      Joi.object({
        technology: Joi.string().required(),
        subSkills: Joi.array().items(Joi.string()).min(1).required()
      })
    ).optional(),
    otherSkills: Joi.string().allow('', null)
  }),
  
  guidelinesQuestionnaire: Joi.object({
    answers: Joi.array().items(
      Joi.object({
        questionNumber: Joi.number().min(1).required(),
        selectedOption: Joi.string().required()
      })
    ).min(17).required(),
    completionTime: Joi.number().required()
  }),
  
  // Admin schemas
  linkedInReview: Joi.object({
    decision: Joi.string().valid('approve', 'reject').required(),
    notes: Joi.string().allow('', null),
    rejectionReason: Joi.when('decision', {
      is: 'reject',
      then: Joi.string().required(),
      otherwise: Joi.string().allow('', null)
    })
  }),
  
  skillCategorization: Joi.object({
    domain: Joi.string().valid(
      'MERN', 'JAVA', 'PYTHON', 'DA', 'QA', 'Other'
    ).required(),
    notes: Joi.string().allow('', null)
  }),
  
  manualOnboard: Joi.object({
    reason: Joi.string().required()
  }),
  
  // Interviewer schemas
  availability: Joi.object({
    recurringSlots: Joi.array().items(
      Joi.object({
        dayOfWeek: Joi.number().min(0).max(6).required(),
        startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        isActive: Joi.boolean().default(true)
      })
    ),
    specificSlots: Joi.array().items(
      Joi.object({
        date: Joi.date().min('now').required(),
        startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        isActive: Joi.boolean().default(true)
      })
    ),
    timezone: Joi.string().default('Asia/Kolkata'),
    availabilityNotes: Joi.string().allow('', null)
  }),
  
  updateProfile: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phoneNumber: Joi.string(),
    whatsappNumber: Joi.string().allow('', null),
    currentEmployer: Joi.string(),
    jobTitle: Joi.string(),
    bankDetails: Joi.object({
      accountName: Joi.string(),
      accountNumber: Joi.string(),
      bankName: Joi.string(),
      ifscCode: Joi.string()
    })
  })
};

module.exports = {
  validate,
  schemas
};
