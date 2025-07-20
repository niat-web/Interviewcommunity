// server/config/constants.js
// Application Status Constants
const APPLICATION_STATUS = {
  SUBMITTED: 'Application Submitted',
  UNDER_REVIEW: 'Under Review',
  PROFILE_APPROVED: 'Profile Approved',
  PROFILE_REJECTED: 'Profile Rejected',
  SKILLS_ASSESSMENT_SENT: 'Skills Assessment Sent',
  SKILLS_ASSESSMENT_COMPLETED: 'Skills Assessment Completed',
  GUIDELINES_SENT: 'Guidelines Sent',
  GUIDELINES_REVIEWED: 'Guidelines Reviewed',
  GUIDELINES_FAILED: 'Guidelines Failed',
  ONBOARDED: 'Onboarded',
  ACTIVE_INTERVIEWER: 'Active Interviewer',
  TIME_SLOTS_CONFIRMED: 'Time Slots Confirmed'
};

// Interviewer Status Constants
const INTERVIEWER_STATUS = {
  PROBATION: 'On Probation',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Terminated'
};

// Payment Tier Constants
const PAYMENT_TIERS = {
  TIER_1: {
    name: 'Tier 1',
    ratePerInterview: 500, // in INR
    requirements: {
      interviews: 0,
      rating: 0,
      completionRate: 0
    }
  },
  TIER_2: {
    name: 'Tier 2',
    ratePerInterview: 750, // in INR
    requirements: {
      interviews: 20,
      rating: 4.0,
      completionRate: 90
    }
  },
  TIER_3: {
    name: 'Tier 3',
    ratePerInterview: 1000, // in INR
    requirements: {
      interviews: 50,
      rating: 4.5,
      completionRate: 95
    }
  }
};

// Domain Constants
const DOMAINS = [
  'MERN',
  'JAVA',
  'PYTHON',
  'DA',
  'QA',
  'Other'
];

const GUIDELINES_QUESTIONS = [
  {
    id: 1,
    question: "Why is it important to review the candidate's resume before the interview?",
    options: [
      "To understand the candidate's personal interests",
      "To understand the candidate's skill set and background",
      "To decide if the candidate should be disqualified",
      "To prepare for casual conversation topics"
    ],
    correctAnswer: "To understand the candidate's skill set and background"
  },
  {
    id: 2,
    question: "Why is it important to understand the objective of an interview?",
    options: [
      "To have a casual conversation with the candidate",
      "To focus on key aspects of the interview",
      "To determine the candidate's favorite hobbies",
      "To make the interview process longer"
    ],
    correctAnswer: "To focus on key aspects of the interview"
  },
  {
    id: 3,
    question: "Why is it important to prepare a set of questions before the interview?",
    options: [
      "To fill time during the interview",
      "To assess the candidate's skills and relevant experience effectively.",
      "To make the interview more casual and relaxed",
      "To avoid having to listen to the candidate's responses"
    ],
    correctAnswer: "To assess the candidate's skills and relevant experience effectively."
  },
  {
    id: 4,
    question: "What steps should you take to test the technology before the interview?",
    options: [
      "Check your internet connection, device audio, and video capabilities",
      "Ignore testing as it is not important",
      "Ask the candidate to test their technology",
      "Conduct the interview without any preparation"
    ],
    correctAnswer: "Check your internet connection, device audio, and video capabilities"
  },
  {
    id: 5,
    question: "What are the key considerations for setting up your environment for the interview?",
    options: [
      "Conduct the interview in a noisy place",
      "Find a quiet, well-lit place with a professional background",
      "Use a background with personal items",
      "Conduct the interview outdoors"
    ],
    correctAnswer: "Find a quiet, well-lit place with a professional background"
  },
  {
    id: 6,
    question: "How should you start the interview?",
    options: [
      "Start by asking about the candidate's salary expectations",
      "Start with a friendly greeting and introduce yourself, including your role and experience",
      "Start with difficult technical questions",
      "Start with a casual conversation"
    ],
    correctAnswer: "Start with a friendly greeting and introduce yourself, including your role and experience"
  },
  {
    id: 7,
    question: "Why is it important to ask the candidate for a self-introduction?",
    options: [
      "To understand the candidate's hobbies",
      "To know more about the candidate",
      "To decide if the candidate's voice is pleasant",
      "To pass time"
    ],
    correctAnswer: "To know more about the candidate"
  },
  {
    id: 8,
    question: "How do you assess the candidate's technical skills?",
    options: [
      "By asking questions about their personal interests",
      "By using a mix of theoretical questions and practical problems",
      "By discussing non-technical topics",
      "By avoiding technical questions"
    ],
    correctAnswer: "By using a mix of theoretical questions and practical problems"
  },
  {
    id: 9,
    question: "What are key aspects of maintaining professionalism during the interview?",
    options: [
      "Interrupt the candidate frequently",
      "Be proffessional, attentive, and avoid interruptions",
      "Use slang and casual language",
      "Ignore the candidate's responses"
    ],
    correctAnswer: "Be proffessional, attentive, and avoid interruptions"
  },
  {
    id: 10,
    question: "What should you do if the candidate seems confused about a question?",
    options: [
      "Ignore the candidate and move to the next question",
      "Offer clarifications or rephrase the question",
      "Laugh at the candidate's confusion",
      "End the interview immediately"
    ],
    correctAnswer: "Offer clarifications or rephrase the question"
  },
  {
    id: 11,
    question: "How do you manage time during the interview?",
    options: [
      "Let the interview run as long as it takes",
      "Keep track of time to ensure all key topics are covered",
      "Focus on one topic for the entire interview",
      "Ignore the time constraints"
    ],
    correctAnswer: "Keep track of time to ensure all key topics are covered"
  },
  {
    id: 12,
    question: "How can you make the candidate feel comfortable during the interview?",
    options: [
      "Ignore their responses",
      "Engage with the candidate and acknowledge their responses",
      "Criticize their answers",
      "Maintain a stern and unapproachable demeanor"
    ],
    correctAnswer: "Engage with the candidate and acknowledge their responses"
  },
  {
    id: 13,
    question: "Why are follow-up questions important?",
    options: [
      "To confuse the candidate",
      "To delve deeper into the candidate's expertise and thought process",
      "To extend the duration of the interview unnecessarily",
      "To avoid addressing the candidate's main points"
    ],
    correctAnswer: "To delve deeper into the candidate's expertise and thought process"
  },
  {
    id: 14,
    question: "What should you do immediately after the interview ends?",
    options: [
      "Disconnect without saying anything",
      "Thank the candidate",
      "Ask the candidate to follow up with you",
      "Criticize the candidate's performance"
    ],
    correctAnswer: "Thank the candidate"
  },
  {
    id: 15,
    question: "How do you evaluate the candidate's performance?",
    options: [
      "Based on your personal biases",
      "Based on predefined criteria, including technical skills, problem-solving abilities, and communication skills",
      "By comparing them to previous candidates",
      "By focusing only on their appearance"
    ],
    correctAnswer: "Based on predefined criteria, including technical skills, problem-solving abilities, and communication skills"
  },
  {
    id: 16,
    question: "What is the timeframe within which interviewers are required to complete their evaluation remarks after conducting an interview?",
    options: [
      "1 day",
      "1 hour",
      "1 week",
      "No need to update remarks"
    ],
    correctAnswer: "1 hour"
  },
  {
    id: 17,
    question: "How much advance notice must interviewers provide if they need to cancel a scheduled interview?",
    options: [
      "Before 5 minutes",
      "Before 2 hours",
      "No need to inform",
      "None of the above"
    ],
    correctAnswer: "Before 2 hours"
  }
];

// Email Template Names
const EMAIL_TEMPLATES = {
  APPLICATION_CONFIRMATION: 'applicationConfirmation',
  PROFILE_REJECTION: 'profileRejection',
  SKILL_ASSESSMENT_INVITATION: 'skillAssessmentInvitation',
  GUIDELINES_INVITATION: 'guidelinesInvitation',
  ONBOARDING_WELCOME: 'onboardingWelcome',
  PASSWORD_RESET: 'passwordReset',
  ACCOUNT_CREATION: 'accountCreation',
  INTERVIEW_REMINDER: 'interviewReminder',
  BOOKING_REQUEST_NOTIFICATION: 'bookingRequestNotification',
  NEW_INTERVIEWER_WELCOME: 'newInterviewerWelcome',
  STUDENT_BOOKING_INVITATION: 'studentBookingInvitation', // ** NEW **
};

// WhatsApp Template Names
const WHATSAPP_TEMPLATES = {
  WELCOME: 'welcome',
  NOTIFICATION: 'notification',
  REMINDER: 'reminder'
};

module.exports = {
  APPLICATION_STATUS,
  INTERVIEWER_STATUS,
  PAYMENT_TIERS,
  DOMAINS,
  GUIDELINES_QUESTIONS,
  EMAIL_TEMPLATES,
  WHATSAPP_TEMPLATES
};
