// client/src/pages/public/SkillAssessment.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SkillAssessmentForm from '../../components/forms/SkillAssessmentForm';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';

const SkillAssessment = () => {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  
  useEffect(() => {
    // If a user is already logged in, they should not be on this page.
    if (currentUser) {
      const destination = currentUser.role === 'admin' ? '/admin/dashboard' : '/interviewer/dashboard';
      navigate(destination, { replace: true });
    }
  }, [currentUser, navigate]);
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader text="Loading..." />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <SkillAssessmentForm />
    </div>
  );
};

export default SkillAssessment;
