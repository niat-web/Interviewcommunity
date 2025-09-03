// client/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import InterviewerLayout from './layouts/InterviewerLayout';
import HiringLayout from './layouts/HiringLayout';
import BookingsLayout from './layouts/BookingsLayout';

// Public Pages
import Home from '@/pages/public/Home';
import Login from '@/pages/public/Login';
import ApplicationSuccess from '@/pages/public/ApplicationSuccess';
import SkillAssessment from '@/pages/public/SkillAssessment';
import SkillAssessmentSuccess from '@/pages/public/SkillAssessmentSuccess';
import Guidelines from '@/pages/public/Guidelines';
import GuidelinesSubmissionSuccess from '@/pages/public/GuidelinesSubmissionSuccess';
import CreatePassword from '@/pages/public/CreatePassword';
import ForgotPassword from '@/pages/public/ForgotPassword';
import ResetPassword from '@/pages/public/ResetPassword';
import PublicBookingPage from '@/pages/public/PublicBookingPage';
import PaymentConfirmationPage from '@/pages/public/PaymentConfirmationPage';
import PaymentReceivedConfirmationPage from '@/pages/public/PaymentReceivedConfirmationPage';
import InterviewerApplication from '@/pages/public/InterviewerApplication';
import ApplicationFormPage from '@/pages/public/ApplicationFormPage';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';
import Applicants from '@/pages/admin/Applicants';
import LinkedInReviewPage from '@/pages/admin/LinkedInReviewPage';
import SkillCategorizationPage from '@/pages/admin/SkillCategorizationPage';
import AdminGuidelines from '@/pages/admin/Guidelines';
import Interviewers from '@/pages/admin/Interviewers';
import UserManagement from '@/pages/admin/UserManagement';
import InterviewBookings from '@/pages/admin/InterviewBookings';
import BookingSlots from '@/pages/admin/BookingSlots';
import MainSheet from '@/pages/admin/MainSheet';
import MainSheetForm from '@/pages/admin/MainSheetForm';
import StudentBookings from '@/pages/admin/StudentBookings';
import ConfirmedSlots from '@/pages/admin/ConfirmedSlots';
import EmailTrackingPage from '@/pages/admin/EmailTrackingPage';
import DomainManagement from '@/pages/admin/DomainManagement';
import InterviewerBookingTrackingPage from '@/pages/admin/InterviewerBookingTrackingPage';
import AdminDomainEvaluationPage from '@/pages/admin/AdminDomainEvaluationPage';
import EarningsReportPage from '@/pages/admin/EarningsReportPage';
import CustomEmailPage from '@/pages/admin/CustomEmailPage';
import NewInterviewBooking from '@/pages/admin/NewInterviewBooking'; // --- 1. IMPORT THE NEW PAGE ---

// Interviewer Pages
import InterviewerDashboard from '@/pages/interviewer/Dashboard';
import Profile from '@/pages/interviewer/Profile';
import Availability from '@/pages/interviewer/Availability';
import InterviewEvaluation from '@/pages/interviewer/InterviewEvaluation';
import PaymentDetails from '@/pages/interviewer/PaymentDetails.jsx';
import InterviewerDomainEvaluationPage from '@/pages/interviewer/InterviewerDomainEvaluationPage';

// Route Protection Components
import AdminRoutes from './router/AdminRoutes';
import InterviewerRoutes from './router/InterviewerRoutes';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
      </Route>

      {/* New route for direct application form */}
      <Route path="/applicationform" element={<ApplicationFormPage />} />
      
      <Route path="/InterviewerApplication" element={<InterviewerApplication />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/application-success/:id" element={<ApplicationSuccess />} />
      <Route path="/skill-assessment/:id" element={<SkillAssessment />} />
      <Route path="/skill-assessment-success/:id" element={<SkillAssessmentSuccess />} />
      <Route path="/guidelines/:id" element={<Guidelines />} />
      <Route path="/guidelines-submission-success" element={<GuidelinesSubmissionSuccess />} />
      <Route path="/create-password" element={<CreatePassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route path="/book/:publicId" element={<PublicBookingPage />} /> 
      <Route path="/payment-confirmation" element={<PaymentConfirmationPage />} />
      <Route path="/confirm-payment-received" element={<PaymentReceivedConfirmationPage />} />
      
      <Route element={<AdminRoutes />}>
        {/* NEW HIRING WORKFLOW LAYOUT */}
        <Route path="/admin/hiring" element={<AdminLayout />}>
          <Route path="" element={<Navigate to="applicants" replace />} />
          <Route element={<HiringLayout />}>
            <Route path="applicants" element={<Applicants />} />
            <Route path="linkedin-review" element={<LinkedInReviewPage />} />
            <Route path="skill-categorization" element={<SkillCategorizationPage />} />
            <Route path="guidelines" element={<AdminGuidelines />} />
          </Route>
        </Route>

        {/* NEW BOOKINGS WORKFLOW LAYOUT */}
        <Route path="/admin/bookings" element={<AdminLayout />}>
            <Route path="" element={<Navigate to="interviewer-bookings" replace />} />
            <Route element={<BookingsLayout />}>
                <Route path="interviewer-bookings" element={<InterviewBookings />} />
                <Route path="booking-slots" element={<BookingSlots />} />
                <Route path="student-bookings" element={<StudentBookings />} />
                <Route path="public-bookings/:id/tracking" element={<EmailTrackingPage />} />
                <Route path="confirmed-slots" element={<ConfirmedSlots />} />
            </Route>
        </Route>

        {/* STANDALONE PAGES IN ADMIN LAYOUT */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/main-sheet" element={<MainSheet />} />
          <Route path="/admin/main-sheet/add" element={<MainSheetForm />} />     
          <Route path="/admin/main-sheet/edit/:id" element={<MainSheetForm />} />
          <Route path="/admin/interviewers" element={<Interviewers />} />
          <Route path="/admin/user-management" element={<UserManagement />} />
          <Route path="/admin/interview-bookings/:id/tracking" element={<InterviewerBookingTrackingPage />} />
          <Route path="/admin/public-bookings/:id/tracking" element={<EmailTrackingPage />} />
          <Route path="/admin/evaluation-setup" element={<DomainManagement />} />
          <Route path="/admin/domain-evaluation" element={<AdminDomainEvaluationPage />} />
          <Route path="/admin/custom-email" element={<CustomEmailPage />} />
          {/* --- 2. ADD THE NEW ROUTES HERE --- */}
          <Route path="/admin/bookings/new" element={<NewInterviewBooking />} />
          <Route path="/admin/bookings/edit/:id" element={<NewInterviewBooking />} />
        </Route>
        
        {/* Pages with their own full-screen layout */}
        <Route path="/admin/earnings-report" element={<EarningsReportPage />} />
      </Route>

      <Route element={<InterviewerRoutes />}>
        <Route element={<InterviewerLayout />}>
          <Route path="/interviewer" element={<Navigate to="/interviewer/dashboard" replace />} />
          <Route path="/interviewer/dashboard" element={<InterviewerDashboard />} />
          <Route path="/interviewer/interview-evaluation" element={<InterviewEvaluation />} />
          <Route path="/interviewer/domain-evaluation" element={<InterviewerDomainEvaluationPage />} />
          <Route path="/interviewer/profile" element={<Profile />} />
          <Route path="/interviewer/availability" element={<Availability />} />
          <Route path="/interviewer/payment-details" element={<PaymentDetails />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
