// server/services/email.service.js
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const { createTransporter } = require('../config/email');
const Communication = require('../models/Communication');
const { logEvent, logError } = require('../middleware/logger.middleware');
const { EMAIL_TEMPLATES } = require('../config/constants');

// Cache for compiled templates
const templateCache = {};

// Get and compile email template
const getTemplate = async (templateName) => {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }

  try {
    const templatePath = path.join(
      __dirname,
      '../templates/emails',
      `${templateName}.html`
    );
    
    const templateContent = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateContent);
    
    // Cache the compiled template
    templateCache[templateName] = compiledTemplate;
    
    return compiledTemplate;
  } catch (error) {
    logError('email_template_read_failed', error, { templateName });
    throw new Error(`Failed to read email template: ${templateName}`);
  }
};

// Send email and track in database
const sendEmail = async (options) => {
  try {
    const {
      recipient,
      recipientModel,
      recipientEmail,
      templateName,
      subject,
      templateData,
      relatedTo,
      sentBy,
      isAutomated = true,
      metadata = {}
    } = options;

    // Get email template
    const template = await getTemplate(templateName);
    const htmlContent = template(templateData);

    // Create transporter
    const transporter = createTransporter();

    // Send email
    const result = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: recipientEmail,
      subject,
      html: htmlContent
    });

    // Log communication to database
    const communication = await Communication.create({
      recipient,
      recipientModel,
      recipientEmail,
      recipientPhone: templateData.phoneNumber,
      communicationType: 'Email',
      templateName,
      subject,
      content: htmlContent,
      status: result.accepted.length > 0 ? 'Sent' : 'Failed',
      relatedTo,
      sentBy,
      isAutomated,
      metadata,
      sentAt: new Date()
    });

    logEvent('email_sent', {
      communicationId: communication._id,
      recipientEmail,
      subject,
      templateName
    });

    return {
      success: true,
      communicationId: communication._id
    };
  } catch (error) {
    logError('email_send_failed', error, {
      recipientEmail: options.recipientEmail,
      templateName: options.templateName
    });
    
    // Try to log the failed communication
    try {
      await Communication.create({
        recipient: options.recipient,
        recipientModel: options.recipientModel,
        recipientEmail: options.recipientEmail,
        communicationType: 'Email',
        templateName: options.templateName,
        subject: options.subject,
        content: 'Failed to generate content',
        status: 'Failed',
        relatedTo: options.relatedTo,
        sentBy: options.sentBy,
        isAutomated: options.isAutomated || true,
        metadata: {
          ...options.metadata,
          error: error.message
        }
      });
    } catch (dbError) {
      logError('email_log_failed', dbError);
    }

    return {
      success: false,
      error: error.message
    };
  }
};

// Send account creation email with token
const sendAccountCreationEmail = async (user, token, applicant) => {
  const setupLink = `${process.env.CLIENT_URL}/create-password?token=${token}`;
  
  return await sendEmail({
    recipient: applicant._id,
    recipientModel: 'Applicant',
    recipientEmail: user.email,
    templateName: 'accountCreation',
    subject: 'Complete Your NxtWave Interviewer Account Setup',
    templateData: {
      firstName: user.firstName,
      lastName: user.lastName,
      setupLink,
      expiryHours: 24
    },
    relatedTo: 'Account Creation',
    isAutomated: true,
    metadata: {
      userId: user._id
    }
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, token) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  
  return await sendEmail({
    recipient: user._id,
    recipientModel: user.role === 'interviewer' ? 'Interviewer' : 'User',
    recipientEmail: user.email,
    templateName: 'passwordReset',
    subject: 'Reset Your NxtWave Interviewer Password',
    templateData: {
      firstName: user.firstName,
      lastName: user.lastName,
      resetLink,
      expiryMinutes: 10
    },
    relatedTo: 'Password Reset',
    isAutomated: true
  });
};

// Send welcome email with credentials
const sendNewInterviewerWelcomeEmail = async (user, interviewer, password) => {
  const loginLink = `${process.env.CLIENT_URL}/login`;

  return await sendEmail({
    recipient: interviewer._id,
    recipientModel: 'Interviewer',
    recipientEmail: user.email,
    templateName: EMAIL_TEMPLATES.NEW_INTERVIEWER_WELCOME,
    subject: 'Welcome to the NxtWave Interviewer Team!',
    templateData: {
        firstName: user.firstName,
        email: user.email,
        password: password, // The plaintext temporary password
        loginLink,
    },
    relatedTo: 'Onboarding',
    isAutomated: true,
    metadata: { userId: user._id, interviewerId: interviewer._id },
  });
};

// ** NEW FUNCTION **
// Send booking invitation to students
const sendStudentBookingInvitationEmail = async (email, bookingId, publicBookingId) => {
    const bookingLink = `${process.env.CLIENT_URL}/book/${publicBookingId}`;

    return await sendEmail({
        recipient: bookingId, // Here recipient can be the PublicBooking ID
        recipientModel: 'PublicBooking',
        recipientEmail: email,
        templateName: EMAIL_TEMPLATES.STUDENT_BOOKING_INVITATION,
        subject: 'Interview Invitation from NxtWave',
        templateData: {
            bookingLink,
        },
        relatedTo: 'Student Booking',
        isAutomated: true,
        metadata: { publicBookingId },
    });
};


module.exports = {
  sendEmail,
  sendAccountCreationEmail,
  sendPasswordResetEmail,
  sendNewInterviewerWelcomeEmail,
  sendStudentBookingInvitationEmail,
};
