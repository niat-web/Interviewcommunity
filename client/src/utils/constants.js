// client/src/utils/constants.js
// Application status constants
export const APPLICATION_STATUS = {
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

// Interviewer status constants
export const INTERVIEWER_STATUS = {
  PROBATION: 'On Probation',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Terminated'
};

// Domain constants
export const DOMAINS = [
  { value: 'MERN', label: 'MERN' },
  { value: 'JAVA', label: 'JAVA' },
  { value: 'PYTHON', label: 'PYTHON' },
  { value: 'DA', label: 'DA' },
  { value: 'QA', label: 'QA' },
  { value: 'Other', label: 'Other' }
];

// Payment tier constants
export const PAYMENT_TIERS = [
  { value: 'Tier 1', label: 'Tier 1', amount: 500 },
  { value: 'Tier 2', label: 'Tier 2', amount: 750 },
  { value: 'Tier 3', label: 'Tier 3', amount: 1000 }
];

// Proficiency level constants
export const PROFICIENCY_LEVELS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Expert', label: 'Expert' }
];

// Sourcing channel constants
export const SOURCING_CHANNELS = [
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Job Portal', label: 'Job Portal' },
  { value: 'Website', label: 'Website' },
  { value: 'Other', label: 'Other' }
];

// Days of week constants
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

// Time slots constants (30-minute intervals)
export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  
  const displayHour = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  
  return { value: time, label: displayTime };
});

// *** NEW: Tech Stack options for Main Sheet ***
export const MAIN_SHEET_TECH_STACKS = [
  { value: 'MERN', label: 'MERN' },
  { value: 'Python', label: 'Python' },
  { value: 'React', label: 'React' },
  { value: 'Domain Expert', label: 'Domain Expert' },
  { value: 'Python+SQL', label: 'Python+SQL' },
  { value: 'MERN+Node', label: 'MERN+Node' },
  { value: 'Java + SQL', label: 'Java + SQL' },
  { value: 'JavaScript & C++', label: 'JavaScript & C++' },
  { value: 'May Edition', label: 'May Edition' },
  { value: 'ATCD MERN TR-1', label: 'ATCD MERN TR-1' },
  { value: 'MERN+NextJS', label: 'MERN+NextJS' },
  { value: 'ATCD DSA TR-1', label: 'ATCD DSA TR-1' },
  { value: 'ATCD - React Project', label: 'ATCD - React Project' },
  { value: 'College Plus', label: 'College Plus' },
  { value: 'TCD DSA TR-1', label: 'TCD DSA TR-1' },
  { value: 'TCD MERN TR-1', label: 'TCD MERN TR-1' },
  { value: 'June Edition', label: 'June Edition' },
  { value: 'Java+Spring', label: 'Java+Spring' },
  { value: 'NIAT - React', label: 'NIAT - React' },
  { value: 'TCD - React Project', label: 'TCD - React Project' }
];

// *** NEW: Interview Status options for Main Sheet ***
export const MAIN_SHEET_INTERVIEW_STATUSES = [
  { value: 'Completed', label: 'Completed' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Cancelled', label: 'Cancelled' }
];
