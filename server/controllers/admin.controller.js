// server/controllers/admin.controller.js
const asyncHandler = require('express-async-handler');
const Applicant = require('../models/Applicant');
const SkillAssessment = require('../models/SkillAssessment');
const Interviewer = require('../models/Interviewer');
const User = require('../models/User');
const Guidelines = require('../models/Guidelines');
const InterviewBooking = require("../models/InterviewBooking");
const MainSheetEntry = require('../models/MainSheetEntry');
const PublicBooking = require('../models/PublicBooking');
const StudentBooking = require('../models/StudentBooking');
const { APPLICATION_STATUS, INTERVIEWER_STATUS, EMAIL_TEMPLATES } = require("../config/constants");
const { sendEmail, sendAccountCreationEmail, sendNewInterviewerWelcomeEmail, sendStudentBookingInvitationEmail } = require('../services/email.service');
const { sendWelcomeWhatsApp } = require('../services/whatsapp.service');
const { logEvent } = require('../middleware/logger.middleware');
const crypto = require('crypto');
const { registerUser } = require('../services/auth.service');
const excel = require('exceljs');


// @desc    Get dashboard statistics
// @route   GET /api/admin/stats/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
    const { period = 'all_time' } = req.query;

    let startDate;
    const now = new Date();
    switch (period) {
        case 'daily': startDate = new Date(now.setHours(0, 0, 0, 0)); break;
        case 'weekly': startDate = new Date(); startDate.setDate(now.getDate() - 7); break;
        case 'monthly': startDate = new Date(); startDate.setMonth(now.getMonth() - 1); break;
        default: startDate = null;
    }

    const dateFilter = startDate ? { createdAt: { $gte: startDate } } : {};

    const [ totalApplicants, pendingReviews, activeInterviewers, platformEarningsData ] = await Promise.all([
        Applicant.countDocuments(dateFilter),
        Applicant.countDocuments({ status: { $in: [APPLICATION_STATUS.SUBMITTED, APPLICATION_STATUS.UNDER_REVIEW, APPLICATION_STATUS.SKILLS_ASSESSMENT_COMPLETED, APPLICATION_STATUS.GUIDELINES_REVIEWED] } }),
        Interviewer.countDocuments({ status: INTERVIEWER_STATUS.ACTIVE }),
        Interviewer.aggregate([{ $group: { _id: null, total: { $sum: '$metrics.totalEarnings' } } }])
    ]);

    const totalPlatformEarnings = platformEarningsData[0]?.total || 0;

    res.json({
        success: true,
        data: { totalApplicants, pendingReviews, activeInterviewers, totalPlatformEarnings }
    });
});

// @desc    Get all applicants with pagination and filters
// @route   GET /api/admin/applicants
// @access  Private/Admin
const getApplicants = asyncHandler(async (req, res) => {
  const { status, domain, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const query = {};
  if (status) { if (status.includes(',')) { query.status = { $in: status.split(',').map(s => s.trim()) }; } else { query.status = status; } }
  if (search) { query.$or = [ { fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } } ]; }
  if (domain) { const assessments = await SkillAssessment.find({ domains: domain }).select('applicant'); const applicantIds = assessments.map(sa => sa.applicant); query._id = { $in: applicantIds }; }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const totalDocs = await Applicant.countDocuments(query);
  const applicants = await Applicant.find(query).sort(sort).skip(skip).limit(parseInt(limit));
  const applicantDomains = {};
  if (applicants.length > 0) {
      const skills = await SkillAssessment.find({ applicant: { $in: applicants.map(a => a._id) } }).select('applicant domains');
      skills.forEach(skill => { applicantDomains[skill.applicant.toString()] = skill.domains || []; });
  }
  res.json({ success: true, data: { applicants: applicants.map(applicant => ({ ...applicant.toObject(), domain: applicantDomains[applicant._id.toString()]?.[0] || null, domains: applicantDomains[applicant._id.toString()] || [] })), page: parseInt(page), limit: parseInt(limit), totalDocs, totalPages: Math.ceil(totalDocs / parseInt(limit)) } });
});

// @desc    Create a new applicant from admin panel
// @route   POST /api/admin/applicants
// @access  Private/Admin
const createApplicant = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, whatsappNumber, linkedinProfileUrl, interestedInJoining, sourcingChannel, status } = req.body;
  const existingApplicant = await Applicant.findOne({ email });
  if (existingApplicant) { res.status(400); throw new Error('An application with this email already exists'); }
  const applicant = await Applicant.create({ fullName, email, phoneNumber, whatsappNumber, linkedinProfileUrl, interestedInJoining, sourcingChannel, status: status || APPLICATION_STATUS.SUBMITTED });
  logEvent('applicant_created_by_admin', { applicantId: applicant._id, adminId: req.user._id });
  res.status(201).json({ success: true, data: applicant });
});

// @desc    Update a single applicant's details
// @route   PUT /api/admin/applicants/:id
// @access  Private/Admin
const updateApplicant = asyncHandler(async (req, res) => {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) { res.status(404); throw new Error('Applicant not found'); }
    const { fullName, email, phoneNumber, whatsappNumber, linkedinProfileUrl, interestedInJoining, sourcingChannel, status } = req.body;
    if (email && email !== applicant.email) {
        const existingApplicant = await Applicant.findOne({ email });
        if (existingApplicant) { res.status(400); throw new Error('An application with this email already exists'); }
        applicant.email = email;
    }
    applicant.fullName = fullName || applicant.fullName;
    applicant.phoneNumber = phoneNumber || applicant.phoneNumber;
    applicant.whatsappNumber = whatsappNumber || applicant.whatsappNumber;
    applicant.linkedinProfileUrl = linkedinProfileUrl || applicant.linkedinProfileUrl;
    if (interestedInJoining !== undefined) applicant.interestedInJoining = interestedInJoining;
    applicant.sourcingChannel = sourcingChannel || applicant.sourcingChannel;
    applicant.status = status || applicant.status;
    const updatedApplicant = await applicant.save();
    logEvent('applicant_updated', { applicantId: updatedApplicant._id, updatedBy: req.user._id });
    res.json({ success: true, data: updatedApplicant });
});

// @desc    Delete an applicant
// @route   DELETE /api/admin/applicants/:id
// @access  Private/Admin
const deleteApplicant = asyncHandler(async (req, res) => {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) { res.status(404); throw new Error('Applicant not found'); }
    await applicant.deleteOne();
    logEvent('applicant_deleted', { applicantId: req.params.id, deletedBy: req.user._id });
    res.json({ success: true, message: 'Applicant deleted successfully' });
});

// @desc    Export applicants to CSV/XLSX
// @route   GET /api/admin/applicants/export
// @access  Private/Admin
const exportApplicants = asyncHandler(async (req, res) => {
    const { status, search } = req.query; const query = {};
    if (status) query.status = status; if (search) { query.$or = [ { fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } } ]; }
    const applicants = await Applicant.find(query).sort({ createdAt: -1 });
    const workbook = new excel.Workbook(); const worksheet = workbook.addWorksheet('Applicants');
    worksheet.columns = [
        { header: 'Full Name', key: 'fullName', width: 30 }, { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone Number', key: 'phoneNumber', width: 20 }, { header: 'WhatsApp Number', key: 'whatsappNumber', width: 20 },
        { header: 'LinkedIn URL', key: 'linkedinProfileUrl', width: 40 }, { header: 'Interested', key: 'interestedInJoining', width: 15 },
        { header: 'Source', key: 'sourcingChannel', width: 15 }, { header: 'Status', key: 'status', width: 25 },
        { header: 'Applied On', key: 'createdAt', width: 20 },
    ];
    worksheet.addRows(applicants);
    res.setHeader( 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' );
    res.setHeader( 'Content-Disposition', `attachment; filename="applicants_${new Date().toISOString()}.xlsx"` );
    await workbook.xlsx.write(res); res.end();
});

// @desc    Get all interviewers with pagination and filters
// @route   GET /api/admin/interviewers
// @access  Private/Admin
const getInterviewers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, status, domain, paymentTier, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};

    if (status) {
        if (status.includes(',')) {
            query.status = { $in: status.split(',').map(s => s.trim()) };
        } else {
            query.status = status;
        }
    }
    
    if (paymentTier) query.paymentTier = paymentTier;
    if (domain) query.domains = domain;

    const pipeline = [];

    pipeline.push({
      $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userInfo' }
    });
    pipeline.push({ $unwind: '$userInfo' });

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { 'userInfo.firstName': searchRegex },
        { 'userInfo.lastName': searchRegex },
        { 'userInfo.email': searchRegex }
      ];
    }
    
    pipeline.push({ $match: query });
    
    const countPipeline = [...pipeline, { $count: 'totalDocs' }];
    const totalResult = await Interviewer.aggregate(countPipeline);
    const totalDocs = totalResult[0]?.totalDocs || 0;
    
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    pipeline.push({ $sort: sort });
    pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
    pipeline.push({ $limit: parseInt(limit) });
    
    // *** MODIFICATION START: Added all requested fields to the projection ***
    pipeline.push({
      $project: {
          user: {
              _id: '$userInfo._id',
              firstName: '$userInfo.firstName',
              lastName: '$userInfo.lastName',
              email: '$userInfo.email',
              phoneNumber: '$userInfo.phoneNumber',
              whatsappNumber: '$userInfo.whatsappNumber'
          },
          _id: 1, 
          status: 1, 
          primaryDomain: 1, 
          domains: 1, 
          paymentTier: 1, 
          paymentAmount: 1,
          currentEmployer: 1,
          jobTitle: 1,
          bankDetails: 1,
          'metrics.interviewsCompleted': 1, 
          onboardingDate: 1, 
          createdAt: 1
      }
    });
    // *** MODIFICATION END ***

    const interviewers = await Interviewer.aggregate(pipeline);

    res.json({
        success: true,
        data: {
            interviewers,
            page: parseInt(page), limit: parseInt(limit), totalDocs,
            totalPages: Math.ceil(totalDocs / parseInt(limit))
        }
    });
});

// @desc    Get interviewer details by ID
// @route   GET /api/admin/interviewers/:id
// @access  Private/Admin
const getInterviewerDetails = asyncHandler(async (req, res) => {
    const interviewer = await Interviewer.findById(req.params.id).populate('user');
    if (!interviewer) { res.status(404); throw new Error('Interviewer not found'); }
    res.json({ success: true, data: interviewer });
});

// @desc    Create a new interviewer
// @route   POST /api/admin/interviewers
// @access  Private/Admin
const createInterviewer = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phoneNumber, whatsappNumber, ...interviewerData } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User with this email already exists.');
    }

    const applicant = await Applicant.create({
        fullName: `${firstName} ${lastName}`,
        email,
        phoneNumber,
        whatsappNumber: whatsappNumber || phoneNumber,
        linkedinProfileUrl: 'https://linkedin.com/in/placeholder-admin-created',
        sourcingChannel: 'Other',
        status: APPLICATION_STATUS.ONBOARDED
    });

    const newUser = await User.create({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        whatsappNumber,
        role: 'interviewer'
    });
    
    const newInterviewer = await Interviewer.create({
        ...interviewerData,
        user: newUser._id,
        applicant: applicant._id,
        primaryDomain: interviewerData.domains[0] || 'Other'
    });
    
    await sendNewInterviewerWelcomeEmail(newUser, newInterviewer, password);
    
    if (newUser.whatsappNumber || applicant.whatsappNumber) {
        await sendWelcomeWhatsApp(newUser, applicant);
    }

    logEvent('interviewer_created_by_admin', {
        interviewerId: newInterviewer._id,
        adminId: req.user._id
    });
    
    res.status(201).json({ success: true, data: newInterviewer });
});

// @desc    Update interviewer details
// @route   PUT /api/admin/interviewers/:id
// @access  Private/Admin
const updateInterviewer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, ...interviewerData } = req.body;
    const interviewer = await Interviewer.findById(id).populate('user');
    if (!interviewer) { res.status(404); throw new Error('Interviewer not found'); }
    const user = interviewer.user;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== user._id.toString()) { res.status(400); throw new Error("Email is already in use."); }
        user.email = email;
    }
    await user.save();
    Object.assign(interviewer, interviewerData);
    const updatedInterviewer = await interviewer.save();
    res.json({ success: true, data: updatedInterviewer });
});

// @desc    Delete an interviewer
// @route   DELETE /api/admin/interviewers/:id
// @access  Private/Admin
const deleteInterviewer = asyncHandler(async (req, res) => {
    const interviewer = await Interviewer.findById(req.params.id);
    if (!interviewer) { res.status(404); throw new Error('Interviewer not found.'); }
    await User.findByIdAndDelete(interviewer.user);
    await interviewer.deleteOne();
    res.json({ success: true, message: 'Interviewer and associated user deleted.' });
});

// @desc    Get applicant details
// @route   GET /api/admin/applicants/:id
// @access  Private/Admin
const getApplicantDetails = asyncHandler(async (req, res) => {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) { res.status(404); throw new Error('Applicant not found'); }
    const skillAssessment = await SkillAssessment.findOne({ applicant: applicant._id });
    let interviewer = null;
    if (applicant.interviewer) {
        interviewer = await Interviewer.findById(applicant.interviewer).populate('user', 'email firstName lastName');
    }
    res.json({ success: true, data: { applicant, skillAssessment, interviewer } });
});

// @desc    Update applicant status
// @route   PUT /api/admin/applicants/:id/status
// @access  Private/Admin
const updateApplicantStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const applicant = await Applicant.findById(req.params.id);
  if (!applicant) { res.status(404); throw new Error('Applicant not found'); }
  applicant.status = status;
  if (notes) { applicant.reviewNotes = (applicant.reviewNotes || '') + `\n--- Status Update to '${status}' ---\n${notes}`; }
  await applicant.save();
  logEvent('applicant_status_updated', { applicantId: applicant._id, newStatus: status, updatedBy: req.user._id });
  res.json({ success: true, data: applicant, message: 'Applicant status updated successfully' });
});

// @desc    Process LinkedIn profile review
// @route   POST /api/admin/applicants/:id/linkedin-review
// @access  Private/Admin
const processLinkedInReview = asyncHandler(async (req, res) => {
  const { decision, notes, rejectionReason } = req.body;
  const applicant = await Applicant.findById(req.params.id);
  if (!applicant) { res.status(404); throw new Error('Applicant not found'); }
  if (applicant.status !== APPLICATION_STATUS.SUBMITTED && applicant.status !== APPLICATION_STATUS.UNDER_REVIEW) { res.status(400); throw new Error('Applicant is not at the LinkedIn review stage'); }
  if (decision === 'approve') {
    applicant.status = APPLICATION_STATUS.PROFILE_APPROVED;
    if (notes) applicant.reviewNotes = notes;
    await applicant.save();
    await sendEmail({ recipient: applicant._id, recipientModel: 'Applicant', recipientEmail: applicant.email, templateName: 'skillAssessmentInvitation', subject: 'Next Steps: Skill Assessment - NxtWave Interviewer Program', templateData: { name: applicant.fullName, skillAssessmentLink: `${process.env.CLIENT_URL}/skill-assessment/${applicant._id}` }, relatedTo: 'Skill Assessment', sentBy: req.user._id, isAutomated: false });
    applicant.status = APPLICATION_STATUS.SKILLS_ASSESSMENT_SENT;
    await applicant.save();
    logEvent('linkedin_review_approved', { applicantId: applicant._id, reviewedBy: req.user._id, email: applicant.email });
  } else if (decision === 'reject') {
    if (!rejectionReason) { res.status(400); throw new Error('Rejection reason is required'); }
    applicant.status = APPLICATION_STATUS.PROFILE_REJECTED;
    applicant.rejectionReason = rejectionReason;
    if (notes) applicant.reviewNotes = notes;
    await applicant.save();
    await sendEmail({ recipient: applicant._id, recipientModel: 'Applicant', recipientEmail: applicant.email, templateName: 'profileRejection', subject: 'Update on Your NxtWave Interviewer Application', templateData: { name: applicant.fullName, reason: rejectionReason }, relatedTo: 'LinkedIn Review', sentBy: req.user._id, isAutomated: false });
    logEvent('linkedin_review_rejected', { applicantId: applicant._id, reviewedBy: req.user._id, email: applicant.email, reason: rejectionReason });
  } else { res.status(400); throw new Error('Invalid decision'); }
  res.json({ success: true, data: { id: applicant._id, status: applicant.status, message: `Application ${decision === 'approve' ? 'approved' : 'rejected'} successfully` } });
});

// @desc    Process skill categorization
// @route   POST /api/admin/skill-assessments/:id/categorize
// @access  Private/Admin
const processSkillCategorization = asyncHandler(async (req, res) => {
    const { domains, notes } = req.body; // Expecting 'domains' as an array of strings
    const skillAssessment = await SkillAssessment.findById(req.params.id);
    if (!skillAssessment) { 
        res.status(404); 
        throw new Error('Skill assessment not found'); 
    }
    skillAssessment.domains = domains; 
    skillAssessment.adminCategorized = true; 
    skillAssessment.categorizedBy = req.user._id; 
    skillAssessment.status = 'Reviewed';
    if (notes) skillAssessment.additionalNotes = notes;
    await skillAssessment.save();

    const applicant = await Applicant.findById(skillAssessment.applicant);
    if (!applicant) { 
        res.status(404); 
        throw new Error('Associated applicant not found'); 
    }

    applicant.status = APPLICATION_STATUS.GUIDELINES_SENT;
    await applicant.save();

    await sendEmail({
        recipient: applicant._id,
        recipientModel: 'Applicant',
        recipientEmail: applicant.email,
        templateName: 'guidelinesInvitation',
        subject: 'Final Step: Interview Guidelines - NxtWave Interviewer Program',
        templateData: { name: applicant.fullName, guidelinesLink: `${process.env.CLIENT_URL}/guidelines/${applicant._id}` },
        relatedTo: 'Guidelines',
        sentBy: req.user._id,
        isAutomated: false
    });
    logEvent('skill_assessment_categorized', { skillAssessmentId: skillAssessment._id, applicantId: applicant._id, categorizedBy: req.user._id, domains });
    res.json({ success: true, data: { id: skillAssessment._id, domains: skillAssessment.domains, applicantId: applicant._id, applicantStatus: applicant.status, message: 'Skill assessment categorized successfully' } });
});

// @desc    Process guidelines review and onboard applicant
// @route   POST /api/admin/guidelines/:id/review
// @access  Private/Admin
const processGuidelinesReview = asyncHandler(async (req, res) => {
    const { decision, rejectionReason } = req.body;
    const guidelines = await Guidelines.findById(req.params.id);
    if (!guidelines) { res.status(404); throw new Error('Guidelines submission not found'); }
    const applicant = await Applicant.findById(guidelines.applicant);
    if (!applicant) { res.status(404); throw new Error('Associated applicant not found'); }
    if (decision === 'approve') {
      const skillAssessment = await SkillAssessment.findOne({ applicant: applicant._id });
      if (!skillAssessment) { res.status(404); throw new Error('Skill assessment not found for this applicant. Cannot onboard.'); }
      const userData = { firstName: applicant.fullName.split(' ')[0], lastName: applicant.fullName.split(' ').slice(1).join(' ') || applicant.fullName.split(' ')[0], email: applicant.email, password: crypto.randomBytes(10).toString('hex'), phoneNumber: applicant.phoneNumber, whatsappNumber: applicant.whatsappNumber, role: 'interviewer' };
      const user = await registerUser(userData, 'interviewer');
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000;
      await user.save();
      const interviewerSkills = (skillAssessment.technicalSkills || []).map(skill => ({ skill: skill.technology, proficiencyLevel: 'Advanced' }));
      const interviewer = await Interviewer.create({ user: user._id, applicant: applicant._id, currentEmployer: skillAssessment.currentEmployer, jobTitle: skillAssessment.jobTitle, yearsOfExperience: skillAssessment.yearsOfExperience, domains: skillAssessment.domains, primaryDomain: skillAssessment.domains[0] || 'Other', skills: interviewerSkills });
      applicant.status = APPLICATION_STATUS.ONBOARDED; applicant.interviewer = interviewer._id; await applicant.save();
      await sendAccountCreationEmail(user, resetToken, applicant);
      if (applicant.whatsappNumber) { await sendWelcomeWhatsApp(user, applicant); }
      logEvent('applicant_onboarded_by_admin', { applicantId: applicant._id, interviewerId: interviewer._id, adminId: req.user._id });
    } else if (decision === 'reject') {
      applicant.status = APPLICATION_STATUS.GUIDELINES_FAILED;
      applicant.rejectionReason = rejectionReason || 'Failed to meet guidelines requirements.';
      await applicant.save();
      logEvent('guidelines_rejected_by_admin', { applicantId: applicant._id, adminId: req.user._id, reason: applicant.rejectionReason });
    } else { res.status(400); throw new Error('Invalid decision'); }
    res.json({ success: true, message: `Applicant has been successfully ${decision === 'approve' ? 'onboarded' : 'rejected'}.` });
});

// @desc    Get skill assessments with pagination and filters
// @route   GET /api/admin/skill-assessments
// @access  Private/Admin
const getSkillAssessments = asyncHandler(async (req, res) => {
    const { status, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'asc' } = req.query;
    let query = {}; if (status) query.status = status;
    const aggregationPipeline = [ { $lookup: { from: 'applicants', localField: 'applicant', foreignField: '_id', as: 'applicantInfo' } }, { $unwind: '$applicantInfo' } ];
    if (search) { query['applicantInfo.fullName'] = { $regex: search, $options: 'i' }; }
    aggregationPipeline.push({ $match: query });
    const totalDocs = (await SkillAssessment.aggregate(aggregationPipeline)).length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    aggregationPipeline.push( { $sort: sort }, { $skip: skip }, { $limit: parseInt(limit) }, { $project: { status: 1, currentEmployer: 1, jobTitle: 1, yearsOfExperience: 1, autoCategorizedDomain: 1, domains: 1, createdAt: 1, _id: 1, technicalSkills: 1, otherSkills: 1, applicant: { _id: '$applicantInfo._id', fullName: '$applicantInfo.fullName', email: '$applicantInfo.email', status: '$applicantInfo.status', phoneNumber: '$applicantInfo.phoneNumber', linkedinProfileUrl: '$applicantInfo.linkedinProfileUrl' } } } );
    const assessments = await SkillAssessment.aggregate(aggregationPipeline);
    res.json({ success: true, data: { assessments: assessments || [], page: parseInt(page), limit: parseInt(limit), totalDocs, totalPages: Math.ceil(totalDocs / parseInt(limit)) } });
});

// @desc    Manually onboard applicant
// @route   POST /api/admin/applicants/:id/manual-onboard
// @access  Private/Admin
const manualOnboard = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) { res.status(404); throw new Error('Applicant not found'); }
    const skillAssessment = await SkillAssessment.findOne({ applicant: applicant._id });
    if (!skillAssessment) { res.status(400); throw new Error('Cannot onboard: Skill assessment not found'); }
    const user = await User.findOne({ email: applicant.email });
    if(user){ res.status(400); throw new Error('User already exists'); }
    const tempPassword = crypto.randomBytes(10).toString('hex');
    const newUser = await User.create({ firstName: applicant.fullName.split(' ')[0], lastName: applicant.fullName.split(' ').slice(1).join(' ') || applicant.fullName.split(' ')[0], email: applicant.email, password: tempPassword, phoneNumber: applicant.phoneNumber, whatsappNumber: applicant.whatsappNumber, role: 'interviewer' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    newUser.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    newUser.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000;
    await newUser.save();
    const interviewer = await Interviewer.create({ user: newUser._id, applicant: applicant._id, currentEmployer: skillAssessment.currentEmployer, jobTitle: skillAssessment.jobTitle, yearsOfExperience: skillAssessment.yearsOfExperience, domains: skillAssessment.domains, primaryDomain: skillAssessment.domains[0] || 'Other', skills: skillAssessment.technicalSkills.map(skill => ({ skill: skill.skill, proficiencyLevel: skill.proficiencyLevel })) });
    applicant.status = APPLICATION_STATUS.ONBOARDED; applicant.interviewer = interviewer._id; applicant.reviewNotes = `Manually onboarded by admin. Reason: ${reason}`;
    await applicant.save();
    await sendAccountCreationEmail(newUser, resetToken, applicant);
    if (applicant.whatsappNumber) { await sendWelcomeWhatsApp(newUser, applicant); }
    logEvent('applicant_manually_onboarded', { applicantId: applicant._id, userId: newUser._id, interviewerId: interviewer._id, reason, adminId: req.user._id });
    res.json({ success: true, data: { id: applicant._id, status: applicant.status, interviewerId: interviewer._id, message: 'Applicant manually onboarded successfully' } });
});

// @desc    Get all guidelines submissions
// @route   GET /api/admin/guidelines
// @access  Private/Admin
const getGuidelinesSubmissions = asyncHandler(async (req, res) => {
    const { status, domain, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = [];
    query.push({ $lookup: { from: 'applicants', localField: 'applicant', foreignField: '_id', as: 'applicantInfo' } });
    query.push({ $unwind: '$applicantInfo' });
    query.push({ $lookup: { from: 'skillassessments', localField: 'applicant', foreignField: 'applicant', as: 'skillAssessmentInfo' } });
    query.push({ $unwind: { path: '$skillAssessmentInfo', preserveNullAndEmptyArrays: true } });
    const matchCriteria = {};
    if (status) matchCriteria.passed = status === 'passed';
    if (search) matchCriteria['applicantInfo.fullName'] = { $regex: search, $options: 'i' };
    if (domain) matchCriteria['skillAssessmentInfo.domains'] = domain;
    if (Object.keys(matchCriteria).length > 0) { query.push({ $match: matchCriteria }); }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    query.push({ $facet: { paginatedResults: [ { $sort: sort }, { $skip: skip }, { $limit: parseInt(limit) } ], totalCount: [ { $count: 'count' } ] } });
    const results = await Guidelines.aggregate(query);
    const guidelines = results[0].paginatedResults;
    const totalDocs = results[0].totalCount[0] ? results[0].totalCount[0].count : 0;
    const formattedGuidelines = guidelines.map(g => ({ _id: g._id, applicant: { _id: g.applicantInfo._id, fullName: g.applicantInfo.fullName, email: g.applicantInfo.email, }, applicantStatus: g.applicantInfo.status, domains: g.skillAssessmentInfo?.domains || [], score: g.score, passed: g.passed, completionTime: g.completionTime, createdAt: g.createdAt, answers: g.answers }));
    res.json({ success: true, data: { guidelines: formattedGuidelines, page: parseInt(page), limit: parseInt(limit), totalDocs, totalPages: Math.ceil(totalDocs / parseInt(limit)) } });
});

// @desc    Get all users for User Management
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, role, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};
    if (search) { const searchRegex = { $regex: search, $options: 'i' }; query.$or = [ { 'firstName': searchRegex }, { 'lastName': searchRegex }, { 'email': searchRegex }, ]; }
    if (role) { query.role = role; }
    const totalDocs = await User.countDocuments(query);
    const skip = (page - 1) * limit;
    let sortKey = sortBy; if (sortBy === 'fullName') { sortKey = 'firstName'; } const sort = { [sortKey]: sortOrder === 'desc' ? -1 : 1 };
    const users = await User.find(query).sort(sort).skip(skip).limit(parseInt(limit));
    const usersWithDetails = users.map(user => ({ ...user.toObject(), fullName: `${user.firstName} ${user.lastName}` }));
    res.json({ success: true, data: { users: usersWithDetails, page: parseInt(page), limit: parseInt(limit), totalDocs, totalPages: Math.ceil(totalDocs / parseInt(limit)) } });
});

// @desc    Create a new user
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, role, isActive, phoneNumber } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) { res.status(400); throw new Error('User with this email already exists.'); }
    const user = await User.create({ firstName, lastName, email, password, role, isActive, phoneNumber });
    res.status(201).json({ success: true, data: user });
});

// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserDetails = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('User not found'); }
    res.json({ success: true, data: user });
});

// @desc    Update a user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('User not found'); }
    const { firstName, lastName, email, role, isActive } = req.body;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.role = role || user.role;
    user.isActive = isActive !== undefined ? isActive : user.isActive;
    if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists && emailExists._id.toString() !== user._id.toString()) { res.status(400); throw new Error('Email already in use'); }
        user.email = email;
    }
    const updatedUser = await user.save();
    res.json({ success: true, data: updatedUser });
});

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('User not found'); }
    user.isActive = false;
    await user.save();
    res.json({ success: true, message: 'User has been deactivated' });
});

// @desc    Create a new interview booking
// @route   POST /api/admin/bookings
// @access  Private/Admin
const createInterviewBooking = asyncHandler(async (req, res) => {
    const { bookingDate, interviewerIds } = req.body;
    if (!bookingDate || !interviewerIds || interviewerIds.length === 0) { res.status(400); throw new Error('Booking date and at least one interviewer are required.'); }
    const booking = await InterviewBooking.create({ bookingDate, interviewers: interviewerIds.map(id => ({ interviewer: id, status: 'Pending' })), createdBy: req.user._id, });

    const interviewersToNotify = await Interviewer.find({ _id: { $in: interviewerIds }, }).populate("user", "email firstName");

    for (const interviewer of interviewersToNotify) {
        if (interviewer.user && interviewer.user.email) {
            await sendEmail({
                recipient: interviewer._id,
                recipientModel: 'Interviewer',
                recipientEmail: interviewer.user.email,
                templateName: EMAIL_TEMPLATES.BOOKING_REQUEST_NOTIFICATION,
                subject: 'New Interview Availability Request from NxtWave',
                templateData: {
                    name: interviewer.user.firstName,
                    date: new Date(bookingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric'}),
                    portalLink: `${process.env.CLIENT_URL}/interviewer/availability`,
                },
                relatedTo: "Interviewer Booking",
                sentBy: req.user._id,
                isAutomated: true,
            });
        }
    }
    logEvent('interview_booking_created', { bookingId: booking._id, adminId: req.user._id, notifiedCount: interviewersToNotify.length });
    res.status(201).json({ success: true, data: booking });
});

// @desc    Get all interview bookings
// @route   GET /api/admin/bookings
// @access  Private/Admin
const getInterviewBookings = asyncHandler(async (req, res) => {
    const bookings = await InterviewBooking.find().populate({ path: 'interviewers.interviewer', populate: { path: 'user', select: 'firstName lastName' } }).populate('createdBy', 'firstName lastName').sort({ bookingDate: -1 });
    res.json({ success: true, data: bookings });
});

// @desc    Get single interview booking
// @route   GET /api/admin/bookings/:id
// @access  Private/Admin
const getInterviewBookingDetails = asyncHandler(async (req, res) => {
    const booking = await InterviewBooking.findById(req.params.id)
        .populate({ path: 'interviewers.interviewer', populate: { path: 'user', select: 'firstName lastName' } })
        .populate('createdBy', 'firstName lastName');

    if (!booking) {
        res.status(404);
        throw new Error('Interview booking not found.');
    }
    res.json({ success: true, data: booking });
});

// @desc    Reset a specific interviewer's submission in a booking
// @route   DELETE /api/admin/bookings/:bookingId/submissions/:submissionId
// @access  Private/Admin
const resetBookingSubmission = asyncHandler(async (req, res) => {
    const { bookingId, submissionId } = req.params;
    
    const booking = await InterviewBooking.findOneAndUpdate(
        { "_id": bookingId, "interviewers._id": submissionId },
        { 
            "$set": {
                "interviewers.$.status": "Pending",
                "interviewers.$.providedSlots": []
            }
        },
        { new: true }
    );

    if (!booking) {
        res.status(404);
        throw new Error("Booking or submission not found.");
    }

    logEvent('booking_submission_reset', { bookingId, submissionId, adminId: req.user._id });
    res.json({ success: true, message: "Interviewer's slot submission has been reset." });
});

// @desc    Get consolidated booking slots
// @route   GET /api/admin/booking-slots
// @access  Private/Admin
const getBookingSlots = asyncHandler(async (req, res) => {
    const { search, date } = req.query;

    const pipeline = [
        { $unwind: '$interviewers' },
        { $match: { 'interviewers.status': 'Submitted' } },
        { $lookup: { from: 'interviewers', localField: 'interviewers.interviewer', foreignField: '_id', as: 'interviewerInfo' } },
        { $unwind: '$interviewerInfo' },
        { $lookup: { from: 'users', localField: 'interviewerInfo.user', foreignField: '_id', as: 'userInfo' } },
        { $unwind: '$userInfo' }
    ];
    
    const matchCriteria = {};
    if (date) {
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);
        matchCriteria.bookingDate = { $gte: startOfDay, $lte: endOfDay };
    }
    if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        matchCriteria.$or = [
            { 'userInfo.email': searchRegex },
            { $expr: { $regexMatch: { input: { $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"] }, regex: search, options: "i" } } }
        ];
    }
    if (Object.keys(matchCriteria).length > 0) {
        pipeline.push({ $match: matchCriteria });
    }

    pipeline.push({ 
        $project: {
            submissionId: '$interviewers._id',
            bookingId: '$_id',
            interviewerId: '$interviewerInfo._id',
            fullName: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] }, 
            email: '$userInfo.email',
            interviewDate: '$bookingDate', 
            timeSlots: '$interviewers.providedSlots'
        }
    });

    pipeline.push({ $sort: { interviewDate: -1, fullName: 1 } });
    
    const slots = await InterviewBooking.aggregate(pipeline);

    res.json({ success: true, data: slots });
});

// @desc    Update an interview booking
// @route   PUT /api/admin/bookings/:id
// @access  Private/Admin
const updateInterviewBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { bookingDate, interviewerIds } = req.body;

    const booking = await InterviewBooking.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error('Interview booking not found.');
    }

    booking.bookingDate = bookingDate || booking.bookingDate;

    // Smart update for interviewers to preserve their status if they still exist in the list
    if (interviewerIds && Array.isArray(interviewerIds)) {
        const existingInterviewersMap = new Map(booking.interviewers.map(i => [i.interviewer.toString(), i.status]));
        booking.interviewers = interviewerIds.map(interviewerId => ({
            interviewer: interviewerId,
            status: existingInterviewersMap.get(interviewerId) || 'Pending' // Keep existing status or default to Pending
        }));
    }

    const updatedBooking = await booking.save();
    logEvent('interview_booking_updated', { bookingId: updatedBooking._id, adminId: req.user._id });
    res.status(200).json({ success: true, data: updatedBooking });
});

// @desc    Delete an interview booking
// @route   DELETE /api/admin/bookings/:id
// @access  Private/Admin
const deleteInterviewBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const booking = await InterviewBooking.findById(id);

    if (!booking) {
        res.status(404);
        throw new Error('Interview booking not found.');
    }

    await booking.deleteOne();
    logEvent('interview_booking_deleted', { bookingId: id, adminId: req.user._id });
    res.status(200).json({ success: true, message: 'Interview booking deleted successfully.' });
});

// *** CONTROLLERS FOR MAIN SHEET ***

// @desc    Get single Main Sheet entry
// @route   GET /api/admin/main-sheet/:id
// @access  Private/Admin
const getMainSheetEntryById = asyncHandler(async (req, res) => {
    const entry = await MainSheetEntry.findById(req.params.id)
      .populate({
        path: 'interviewer',
        select: 'user',
        populate: {
            path: 'user',
            select: 'firstName lastName email'
        }
      })
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!entry) {
        res.status(404);
        throw new Error('Entry not found');
    }
    res.json({ success: true, data: entry });
});


// @desc    Get all main sheet entries
// @route   GET /api/admin/main-sheet
// @access  Private/Admin
const getMainSheetEntries = asyncHandler(async (req, res) => {
    const { search, page = 1, limit = 25 } = req.query;
    const query = {};
    if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        query.$or = [
            { hiringName: searchRegex },
            { techStack: searchRegex },
            { candidateName: searchRegex },
            { mailId: searchRegex },
            { interviewStatus: searchRegex },
        ];
    }

    const entries = await MainSheetEntry.find(query)
        .populate({
            path: 'interviewer',
            select: 'user',
            populate: {
                path: 'user',
                select: 'firstName lastName email'
            }
        })
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
        
    const totalDocs = await MainSheetEntry.countDocuments(query);

    res.json({ 
        success: true, 
        data: {
            entries,
            page: parseInt(page),
            limit: parseInt(limit),
            totalDocs,
            totalPages: Math.ceil(totalDocs / limit),
        }
    });
});

// @desc    Bulk create/update Main Sheet entries
// @route   POST /api/admin/main-sheet/bulk
// @access  Private/Admin
const bulkUpdateMainSheetEntries = asyncHandler(async (req, res) => {
    const entries = req.body; // Expect an array of entry objects
    const { _id: adminId } = req.user;
    const results = { created: 0, updated: 0, errors: [] };

    for (const entry of entries) {
        try {
            entry.updatedBy = adminId;
            if (entry._id) { // If it has an ID, update it
                await MainSheetEntry.findByIdAndUpdate(entry._id, entry, { new: true, runValidators: true });
                results.updated++;
            } else { // Otherwise, create a new one
                entry.createdBy = adminId;
                await MainSheetEntry.create(entry);
                results.created++;
            }
        } catch (error) {
            results.errors.push({ candidateName: entry.candidateName, error: error.message });
        }
    }

    logEvent('main_sheet_bulk_updated', { ...results, adminId });

    if (results.errors.length > 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Some entries failed to save.', 
            data: results 
        });
    }

    res.status(200).json({ success: true, message: 'Sheet updated successfully.', data: results });
});

// @desc    Delete single Main Sheet entry
// @route   DELETE /api/admin/main-sheet/:id
// @access  Private/Admin
const deleteMainSheetEntry = asyncHandler(async (req, res) => {
    const entry = await MainSheetEntry.findById(req.params.id);
    if (!entry) {
        res.status(404);
        throw new Error('Entry not found');
    }
    await entry.deleteOne();
    logEvent('main_sheet_entry_deleted', { entryId: req.params.id, adminId: req.user._id });
    res.json({ success: true, message: 'Entry deleted successfully' });
});

// @desc    Bulk delete Main Sheet entries
// @route   DELETE /api/admin/main-sheet/bulk
// @access  Private/Admin
const bulkDeleteMainSheetEntries = asyncHandler(async (req, res) => {
    const { ids } = req.body; // Expect an array of entry IDs
    if (!ids || ids.length === 0) {
        res.status(400);
        throw new Error('No entry IDs provided for deletion.');
    }
    const result = await MainSheetEntry.deleteMany({ _id: { $in: ids } });
    
    logEvent('main_sheet_bulk_deleted', { deletedCount: result.deletedCount, adminId: req.user._id });
    
    res.status(200).json({ success: true, message: `${result.deletedCount} entries deleted successfully.` });
});


// *** NEW STUDENT BOOKING SYSTEM CONTROLLERS ***

// @desc    Create a public booking page from selected slots
// @route   POST /api/admin/public-bookings
// @access  Private/Admin
const createPublicBooking = asyncHandler(async (req, res) => {
    const { selectedSlots } = req.body; // Expects an array like [{ interviewerId, date, slots: [...] }]

    const newPublicBooking = await PublicBooking.create({
        createdBy: req.user._id,
        interviewerSlots: selectedSlots.map(s => ({
            interviewer: s.interviewerId,
            date: s.date,
            timeSlots: s.slots.map(ts => ({
                startTime: ts.startTime,
                endTime: ts.endTime
            }))
        }))
    });

    res.status(201).json({ success: true, data: newPublicBooking });
});

// @desc    Get all public booking pages
// @route   GET /api/admin/public-bookings
// @access  Private/Admin
const getPublicBookings = asyncHandler(async (req, res) => {
    const bookings = await PublicBooking.find().populate({
        path: 'interviewerSlots.interviewer',
        select: 'user',
        populate: { path: 'user', select: 'firstName lastName' }
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
});


// @desc    Update a public booking page (e.g., to add authorized emails)
// @route   PUT /api/admin/public-bookings/:id
// @access  Private/Admin
const updatePublicBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { allowedEmails } = req.body;

    const publicBooking = await PublicBooking.findById(id);
    if (!publicBooking) {
        res.status(404);
        throw new Error('Public booking not found.');
    }

    const emailsToAdd = allowedEmails.map(e => e.trim().toLowerCase()).filter(Boolean);

    // Identify only the genuinely new emails not already in the list
    const existingEmailsSet = new Set(publicBooking.allowedEmails);
    const newEmailsToSend = emailsToAdd.filter(email => !existingEmailsSet.has(email));

    if (newEmailsToSend.length > 0) {
        // Add the new, unique emails to the existing list
        publicBooking.allowedEmails.push(...newEmailsToSend);
        
        // Send invitations ONLY to the new emails
        for (const email of newEmailsToSend) {
            await sendStudentBookingInvitationEmail(email, id, publicBooking.publicId);
        }
        await publicBooking.save();
        res.json({ success: true, message: `${newEmailsToSend.length} new invitations sent successfully.`, data: publicBooking });
    } else {
        res.json({ success: true, message: 'No new unique emails to send. List is up to date.', data: publicBooking });
    }
});

// @desc    Get all confirmed student bookings
// @route   GET /api/admin/student-bookings
// @access  Private/Admin
const getStudentBookings = asyncHandler(async (req, res) => {
    const studentBookings = await StudentBooking.find()
        .populate({
            path: 'bookedInterviewer',
            select: 'user',
            populate: { path: 'user', select: 'firstName lastName' }
        })
        .sort({ createdAt: -1 });

    res.json({ success: true, data: studentBookings });
});

// @desc    Get details for a single public booking link
// @route   GET /api/admin/public-bookings/:id
// @access  Private/Admin
const getPublicBookingDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const booking = await PublicBooking.findById(id).lean()
        .populate('createdBy', 'firstName lastName');

    if (!booking) {
        res.status(404);
        throw new Error('Public booking details not found.');
    }

    res.json({ success: true, data: booking });
});

module.exports = {
    getDashboardStats,
    getApplicants,
    createApplicant,
    updateApplicant,
    deleteApplicant,
    exportApplicants,
    getApplicantDetails,
    updateApplicantStatus,
    processLinkedInReview,
    processSkillCategorization,
    manualOnboard,
    getSkillAssessments,
    getGuidelinesSubmissions,
    processGuidelinesReview,
    getInterviewers,
    getInterviewerDetails,
    createInterviewer,
    updateInterviewer,
    deleteInterviewer,
    getUsers,
    getUserDetails,
    createUser,
    updateUser,
    deleteUser,
    createInterviewBooking,
    getInterviewBookings,
    getInterviewBookingDetails,
    resetBookingSubmission,
    updateInterviewBooking,
    deleteInterviewBooking,
    getBookingSlots,
    getMainSheetEntryById,
    getMainSheetEntries, 
    bulkUpdateMainSheetEntries,
    deleteMainSheetEntry,
    bulkDeleteMainSheetEntries,
    createPublicBooking,      
    getPublicBookings,        
    updatePublicBooking,      
    getStudentBookings,
    getPublicBookingDetails,
};
