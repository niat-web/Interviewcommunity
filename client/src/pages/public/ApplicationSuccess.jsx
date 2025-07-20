// client/src/pages/public/ApplicationSuccess.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiHome, FiMail, FiLinkedin, FiClipboard } from 'react-icons/fi';
import logoSrc from '/logo.svg';

const ApplicationSuccess = () => {
  const { id } = useParams();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(id);
    // You could add a toast notification here for better UX, but this is a simple implementation.
    alert("Application ID copied to clipboard!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background grid pattern for a subtle texture */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
      
      {/* Main content card with enhanced styling */}
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 sm:p-10 border border-slate-200/50 relative overflow-hidden">
        {/* Decorative gradient overlay inside the card */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 via-blue-600/5 to-indigo-600/5 -z-10"></div>
        
        {/* Content */}
        <div className="text-center">
            
            <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-6 ring-8 ring-green-50">
              <FiCheckCircle className="h-12 w-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-800 to-green-700 bg-clip-text text-transparent">
              Application Submitted!
            </h1>
            <p className="mt-2 text-slate-600">
              Thank you for applying to become a NxtWave Interviewer.
            </p>

            <div className="my-8 text-left bg-slate-50/70 p-6 rounded-xl border border-slate-200/80">
              <h3 className="font-semibold text-lg text-slate-800 mb-4">What happens next?</h3>
              <ol className="relative border-l border-slate-200 ml-2">
                <li className="mb-6 ml-6">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-4 ring-white">
                      <FiLinkedin className="w-3 h-3 text-blue-600" />
                  </span>
                  <h4 className="font-semibold text-slate-700">Profile Review</h4>
                  <p className="text-sm text-slate-500">Our team will review your LinkedIn profile within 1 business days.</p>
                </li>
                <li className="ml-6">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-4 ring-white">
                      <FiMail className="w-3 h-3 text-blue-600" />
                  </span>
                  <h4 className="font-semibold text-slate-700">Notification</h4>
                  <p className="text-sm text-slate-500">We'll contact you via email or WhatsApp with the next steps.</p>
                </li>
              </ol>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="group relative w-full sm:w-auto inline-flex justify-center py-3 px-6 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              >
                <FiHome className="mr-2 h-5 w-5" />
                Back to Home
              </Link>
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                  <FiMail className="mr-2 h-5 w-5" />
                  Check Email
              </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSuccess;
