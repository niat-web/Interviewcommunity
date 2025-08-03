// server/controllers/public.controller.js
const asyncHandler = require('express-async-handler');
const PublicBooking = require('../models/PublicBooking');
const StudentBooking = require('../models/StudentBooking');
const mongoose = require('mongoose');
const Domain = require('../models/Domain');
const MainSheetEntry = require('../models/MainSheetEntry');
const PaymentConfirmation = require('../models/PaymentConfirmation'); // --- ADDITION ---
const jwt = require('jsonwebtoken'); // --- ADDITION ---


// @desc    Verify if a student's email is allowed to book a slot
// @route   POST /api/public-bookings/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
    const { email, publicId } = req.body;

    const bookingPage = await PublicBooking.findOne({ publicId, status: 'Active' });
    if (!bookingPage) {
        res.status(404);
        throw new Error("This booking page is not available or could not be found.");
    }

    if (!bookingPage.allowedStudents.some(student => student.email === email.toLowerCase())) {
        res.status(403);
        throw new Error("This email is not authorized to book a slot for this event.");
    }

    // Check if this student has already booked
    const existingBooking = await StudentBooking.findOne({ studentEmail: email.toLowerCase(), publicBooking: bookingPage._id });
    if (existingBooking) {
        return res.json({
            success: true,
            status: 'already_booked',
            booking: existingBooking
        });
    }

    res.json({ success: true, status: 'authorized' });
});

// @desc    Get available slots for a public booking page
// @route   GET /api/public-bookings/:publicId/slots
// @access  Public
const getAvailableSlots = asyncHandler(async (req, res) => {
    const { publicId } = req.params;
    const bookingPage = await PublicBooking.findOne({ publicId }).populate({
        path: 'interviewerSlots.interviewer',
        populate: { path: 'user', select: 'firstName lastName email' } // Ensure email is populated
    });

    if (!bookingPage) {
        res.status(404);
        throw new Error("Booking page not found.");
    }
    
    // Filter out any booked slots
    const availableSlots = bookingPage.interviewerSlots.map(interviewerSlot => ({
        ...interviewerSlot.toObject(),
        timeSlots: interviewerSlot.timeSlots.filter(slot => !slot.bookedBy)
    })).filter(interviewerSlot => interviewerSlot.timeSlots.length > 0); // Only include interviewers who still have slots

    res.json({ success: true, data: availableSlots });
});


// @desc    Book a time slot
// @route   POST /api/public-bookings/:publicId/book
// @access  Public
const bookSlot = asyncHandler(async (req, res) => {
    const { publicId } = req.params;
    const { studentName, studentEmail, studentPhone, interviewerId, slot } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const bookingPage = await PublicBooking.findOne({ publicId }).populate({
             path: 'interviewerSlots.interviewer',
             populate: { path: 'user', select: 'email' }
        }).session(session);

        if (!bookingPage) {
            res.status(404);
            throw new Error("Booking page not found.");
        }

        const allowedStudentData = bookingPage.allowedStudents.find(
            s => s.email === studentEmail.toLowerCase()
        );

        if (!allowedStudentData) {
            await session.abortTransaction();
            session.endSession();
            res.status(403);
            throw new Error("Your email is not authorized for this booking link.");
        }
        
        const interviewerSlot = bookingPage.interviewerSlots.find(is => is.interviewer._id.toString() === interviewerId);
        const timeSlot = interviewerSlot?.timeSlots.find(ts => ts.startTime === slot.startTime && ts.endTime === slot.endTime);
        
        if (!timeSlot || timeSlot.bookedBy) {
            await session.abortTransaction();
            res.status(409);
            throw new Error("Sorry, this time slot has just been booked by someone else. Please select another.");
        }

        const domainDoc = await Domain.findOne({ name: allowedStudentData.domain }).session(session);

        let finalEventTitle = '';
        if (domainDoc && domainDoc.eventTitle) {
            finalEventTitle = `${domainDoc.eventTitle} || ${studentName}`;
        } else {
            finalEventTitle = `${allowedStudentData.domain} Interview || ${studentName}`;
        }

        const newStudentBooking = new StudentBooking({
            publicBooking: bookingPage._id,
            interviewId: allowedStudentData.interviewId, 
            hiringName: allowedStudentData.hiringName,
            domain: allowedStudentData.domain,
            userId: allowedStudentData.userId,
            studentName: studentName,
            studentEmail: studentEmail,
            studentPhone: studentPhone,
            mobileNumber: allowedStudentData.mobileNumber,
            resumeLink: allowedStudentData.resumeLink,
            bookedInterviewer: interviewerId,
            interviewerEmail: interviewerSlot.interviewer.user.email,
            bookedSlot: { startTime: slot.startTime, endTime: slot.endTime },
            bookingDate: new Date(interviewerSlot.date).toLocaleDateString('en-US'),
            eventTitle: finalEventTitle,
        });
        
        await newStudentBooking.save({ session });

        timeSlot.bookedBy = newStudentBooking._id;
        await bookingPage.save({ session });

        const startTimeParts = newStudentBooking.bookedSlot.startTime.split(':');
        const endTimeParts = newStudentBooking.bookedSlot.endTime.split(':');
        const startMinutes = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
        const endMinutes = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
        const duration = endMinutes - startMinutes;

        const mainSheetEntryData = {
            hiringName: newStudentBooking.hiringName,
            techStack: newStudentBooking.domain, 
            interviewId: newStudentBooking.interviewId,
            uid: newStudentBooking.userId, 
            candidateName: newStudentBooking.studentName,
            mobileNumber: newStudentBooking.mobileNumber || newStudentBooking.studentPhone,
            mailId: newStudentBooking.studentEmail,
            candidateResume: newStudentBooking.resumeLink,
            interviewDate: interviewerSlot.date,
            interviewTime: `${newStudentBooking.bookedSlot.startTime} - ${newStudentBooking.bookedSlot.endTime}`,
            interviewDuration: `${duration} mins`,
            interviewStatus: 'Scheduled',
            interviewer: newStudentBooking.bookedInterviewer,
            createdBy: bookingPage.createdBy,
            updatedBy: bookingPage.createdBy
        };
        await MainSheetEntry.create([mainSheetEntryData], { session });
        
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ success: true, message: "Your interview slot has been confirmed!", data: newStudentBooking });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});


// @desc    Get details for a payment confirmation form
// @route   GET /api/public-bookings/payment-confirmation-details
// @access  Public
const getPaymentConfirmationDetails = asyncHandler(async (req, res) => {
    const { token } = req.query;
    if (!token) { res.status(400); throw new Error('Confirmation token is required.'); }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const confirmation = await PaymentConfirmation.findById(decoded.id).populate({
        path: 'interviewer',
        populate: { path: 'user', select: 'firstName lastName' }
    });

    if (!confirmation || confirmation.tokenExpires < new Date()) {
        res.status(400); throw new Error('This confirmation link is invalid or has expired.');
    }
    
    res.json({
        success: true,
        data: {
            name: `${confirmation.interviewer.user.firstName} ${confirmation.interviewer.user.lastName}`,
            monthYear: confirmation.monthYear,
            interviewCount: confirmation.interviewCount,
            totalAmount: confirmation.totalAmount,
            status: confirmation.status
        }
    });
});

// @desc    Submit payment confirmation from an interviewer
// @route   POST /api/public-bookings/payment-confirmation
// @access  Public
const submitPaymentConfirmation = asyncHandler(async (req, res) => {
    const { token, status, remarks } = req.body;
    if (!token) { res.status(400); throw new Error('Confirmation token is missing.'); }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const updatedConfirmation = await PaymentConfirmation.findOneAndUpdate(
        {
            _id: decoded.id,
            confirmationToken: token, // Double-check token to prevent reuse
            tokenExpires: { $gt: new Date() },
            status: 'Email Sent' // Ensure it can only be updated once
        },
        {
            $set: {
                status: status,
                remarks: remarks,
                confirmedAt: new Date(),
            },
            $unset: {
                confirmationToken: 1, // Remove the token fields
                tokenExpires: 1
            }
        },
        { new: true } // Return the updated document
    );

    if (!updatedConfirmation) {
        res.status(400);
        throw new Error('This confirmation has already been submitted or is invalid/expired.');
    }
    
    res.json({ success: true, message: 'Thank you! Your confirmation has been recorded.' });
});

// ** NEW CONTROLLERS **
// @desc    Get details for a "Payment Received" confirmation form
// @route   GET /api/public-bookings/payment-received-details
// @access  Public
const getPaymentReceivedDetails = asyncHandler(async (req, res) => {
    const { token } = req.query;
    if (!token) { res.status(400); throw new Error('Token is required.'); }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'payment_received') {
        res.status(401); throw new Error('Invalid token purpose.');
    }
    
    const confirmation = await PaymentConfirmation.findById(decoded.id).populate({
        path: 'interviewer',
        populate: { path: 'user', select: 'firstName' }
    });

    if (!confirmation || confirmation.paymentReceivedTokenExpires < new Date()) {
        res.status(400); throw new Error('Link is invalid or has expired.');
    }

    res.json({
        success: true,
        data: {
            name: confirmation.interviewer.user.firstName,
            monthYear: confirmation.monthYear,
            status: confirmation.paymentReceivedStatus
        }
    });
});

// @desc    Submit "Payment Received" confirmation
// @route   POST /api/public-bookings/payment-received
// @access  Public
const submitPaymentReceived = asyncHandler(async (req, res) => {
    const { token, status, remarks } = req.body;
    if (!token) { res.status(400); throw new Error('Token is missing.'); }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'payment_received') {
        res.status(401); throw new Error('Invalid token purpose.');
    }
    
    const updatedConfirmation = await PaymentConfirmation.findOneAndUpdate(
        {
            _id: decoded.id,
            paymentReceivedConfirmationToken: token,
            paymentReceivedTokenExpires: { $gt: new Date() },
        },
        {
            $set: {
                paymentReceivedStatus: status,
                paymentReceivedRemarks: remarks,
            },
            $unset: {
                paymentReceivedConfirmationToken: 1,
                paymentReceivedTokenExpires: 1
            }
        },
        { new: true }
    );

    if (!updatedConfirmation) {
        res.status(400);
        throw new Error('This form has already been submitted or the link has expired.');
    }
    
    res.json({ success: true, message: 'Your response has been recorded. Thank you!' });
});


module.exports = { verifyEmail, getAvailableSlots, bookSlot, getPaymentConfirmationDetails, submitPaymentConfirmation, getPaymentReceivedDetails, submitPaymentReceived };
