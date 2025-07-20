// client/src/pages/public/SkillAssessment.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SkillAssessmentForm from '../../components/forms/SkillAssessmentForm';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { checkApplicationStatus } from '../../api/applicant.api'; // API call
import { APPLICATION_STATUS } from '../../utils/constants'; // Status constants
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';

const SkillAssessment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicantStatus, setApplicantStatus] = useState(null);

  useEffect(() => {
    // Redirect if user is already logged in
    if (currentUser) {
      const destination = currentUser.role === 'admin' ? '/admin/dashboard' : '/interviewer/dashboard';
      navigate(destination, { replace: true });
      return;
    }
    
    // Function to verify the applicant's status
    const verifyApplicantStatus = async () => {
      try {
        setLoading(true);
        const response = await checkApplicationStatus(id);
        const status = response.data.data.status;
        setApplicantStatus(status);

        // Define all stages that come AFTER submitting the skill assessment
        const completedStages = [
          APPLICATION_STATUS.SKILLS_ASSESSMENT_COMPLETED,
          APPLICATION_STATUS.GUIDELINES_SENT,
          APPLICATION_STATUS.GUIDELINES_REVIEWED,
          APPLICATION_STATUS.GUIDELINES_FAILED,
          APPLICATION_STATUS.ONBOARDED,
          APPLICATION_STATUS.ACTIVE_INTERVIEWER,
        ];
        
        if (completedStages.includes(status)) {
            // If they already submitted, redirect to the success page for a consistent "already done" experience.
            navigate(`/skill-assessment-success/${id}`, { replace: true });
        } else if (status !== APPLICATION_STATUS.SKILLS_ASSESSMENT_SENT && status !== APPLICATION_STATUS.PROFILE_APPROVED) {
            // Check if the applicant is at a valid stage to access this page
            setError('This skill assessment link is not valid for your current application status.');
        }

      } catch (err) {
        setError('Failed to verify your application. The link may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      verifyApplicantStatus();
    }
  }, [id, currentUser, authLoading, navigate]);

  // Main loading state (covers both auth and status checks)
  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader text="Verifying your application status..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
            <Card title="Access Denied">
              <div className="p-6">
                <Alert type="error" title="Invalid Access" message={error} />
                <div className="mt-6 text-center">
                    <Link to="/" className="text-primary-600 hover:underline font-medium">
                      Return to Homepage
                    </Link>
                </div>
              </div>
            </Card>
        </div>
      </div>
    );
  }

  // If status is valid, render the form
  if (applicantStatus === APPLICATION_STATUS.SKILLS_ASSESSMENT_SENT || applicantStatus === APPLICATION_STATUS.PROFILE_APPROVED) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <SkillAssessmentForm />
      </div>
    );
  }
  
  // Fallback for any other state; prevents rendering the form by default
  return null;
};

export default SkillAssessment;
