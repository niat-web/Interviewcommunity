// client/src/pages/public/Guidelines.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ExclamationCircleIcon, 
  ArrowLeftIcon,
  DocumentCheckIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import GuidelinesQuestionnaireForm from '../../components/forms/GuidelinesQuestionnaireForm';
import { checkApplicationStatus } from '../../api/applicant.api';
import { APPLICATION_STATUS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

const Guidelines = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicant, setApplicant] = useState(null);
  
  useEffect(() => {
    // If auth state is still loading, do nothing yet.
    if (authLoading) return;
    
    // If a user is already logged in, redirect them.
    if (currentUser) {
      const destination = currentUser.role === 'admin' ? '/admin/dashboard' : '/interviewer/dashboard';
      navigate(destination, { replace: true });
      return;
    }
    
    const verifyApplicant = async () => {
      setLoading(true);
      try {
        const response = await checkApplicationStatus(id);
        const applicantData = response.data.data;
        const status = applicantData.status;
        
        // Check if applicant is at the correct stage
        if (status !== APPLICATION_STATUS.GUIDELINES_SENT) {
          setError('This guidelines questionnaire link is no longer valid or has already been completed.');
        } else {
          setApplicant(applicantData);
        }
      } catch (err) {
        setError('Failed to verify application. The link may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };
    
    verifyApplicant();
  }, [id, currentUser, authLoading, navigate]);
  
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-800">Verifying application...</h2>
          <p className="mt-2 text-gray-600">Please wait while we validate your access.</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-red-600 p-6">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-white bg-opacity-25">
                <ExclamationCircleIcon className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
          
          <div className="p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Invalid Link</h3>
            <p className="text-gray-600 mb-6 text-center">{error}</p>
            
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors"
              >
                <ArrowLeftIcon className="mr-2 h-5 w-5" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Interviewer Guidelines</h1>
              <p className="text-sm text-gray-600">Complete the assessment to proceed</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <DocumentCheckIcon className="h-5 w-5 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">Assessment in progress</span>
          </div>
        </div>
      </header>
      
      <main>
        <GuidelinesQuestionnaireForm />
      </main>
    </div>
  );
};

export default Guidelines;
