// client/src/components/forms/InitialApplicationForm.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiSend, FiUser, FiMail, FiPhone, FiLinkedin, FiHelpCircle } from 'react-icons/fi';
import Button from '../common/Button';
import { submitApplication } from '../../api/applicant.api';
import { useAlert } from '../../hooks/useAlert';
import { SOURCING_CHANNELS } from '../../utils/constants';

const InitialApplicationForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm({ mode: 'onBlur' });

  const onSubmit = async (data) => {
    try {
      const response = await submitApplication(data);
      showSuccess('Application submitted successfully!');
      
      if (onSuccess) {
        onSuccess();
      }

      navigate(`/application-success/${response.data.data.id}`);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to submit application. Please try again.');
    }
  };

  // --- Reusable Tailwind classes for consistent styling ---
  const formInputBaseClasses = "block w-full pl-10 pr-3 py-2.5 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white shadow-sm";
  const formInputNormalClasses = "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500";
  const formInputErrorClasses = "border-red-400 focus:border-red-500 focus:ring-red-500";
  const formLabelClasses = "block text-sm font-semibold text-gray-700 mb-1.5";
  const formErrorClasses = "mt-1.5 text-sm text-red-600";
  const formHelpTextClasses = "mt-1.5 text-xs text-gray-500";
  const formIconClasses = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className={formLabelClasses}>Full Name <span className="text-red-500">*</span></label>
          <div className="relative">
            <FiUser className={formIconClasses} />
            <input
              id="fullName"
              type="text"
              className={`${formInputBaseClasses} ${errors.fullName ? formInputErrorClasses : formInputNormalClasses}`}
              placeholder="e.g., Jane Doe"
              {...register('fullName', { required: 'Full name is required' })}
            />
          </div>
          {errors.fullName && <p className={formErrorClasses}>{errors.fullName.message}</p>}
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="email" className={formLabelClasses}>Email Address <span className="text-red-500">*</span></label>
          <div className="relative">
            <FiMail className={formIconClasses} />
            <input
              id="email"
              type="email"
              className={`${formInputBaseClasses} ${errors.email ? formInputErrorClasses : formInputNormalClasses}`}
              placeholder="you@example.com"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address'
                }
              })}
            />
          </div>
          {errors.email && <p className={formErrorClasses}>{errors.email.message}</p>}
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className={formLabelClasses}>Phone Number <span className="text-red-500">*</span></label>
          <div className="relative">
            <FiPhone className={formIconClasses} />
            <input
              id="phoneNumber"
              type="tel"
              className={`${formInputBaseClasses} ${errors.phoneNumber ? formInputErrorClasses : formInputNormalClasses}`}
              placeholder="e.g., 9876543210"
              {...register('phoneNumber', { 
                required: 'Phone number is required',
                pattern: {
                  value: /^\d{10,15}$/,
                  message: 'Please enter a valid phone number'
                }
              })}
            />
          </div>
          {errors.phoneNumber && <p className={formErrorClasses}>{errors.phoneNumber.message}</p>}
        </div>

        {/* WhatsApp Number */}
        <div>
          <label htmlFor="whatsappNumber" className={formLabelClasses}>WhatsApp Number</label>
          <div className="relative">
            <FiPhone className={formIconClasses} />
            <input
              id="whatsappNumber"
              type="tel"
              className={`${formInputBaseClasses} ${errors.whatsappNumber ? formInputErrorClasses : formInputNormalClasses}`}
              placeholder="If different from phone"
              {...register('whatsappNumber')}
            />
          </div>
          <p className={formHelpTextClasses}>Leave blank if same as phone number.</p>
          {errors.whatsappNumber && <p className={formErrorClasses}>{errors.whatsappNumber.message}</p>}
        </div>
      </div>

      {/* LinkedIn Profile URL */}
      <div>
        <label htmlFor="linkedinProfileUrl" className={formLabelClasses}>LinkedIn Profile URL <span className="text-red-500">*</span></label>
        <div className="relative">
          <FiLinkedin className={formIconClasses} />
          <input
            id="linkedinProfileUrl"
            type="url"
            className={`${formInputBaseClasses} ${errors.linkedinProfileUrl ? formInputErrorClasses : formInputNormalClasses}`}
            placeholder="https://linkedin.com/in/your-profile"
            {...register('linkedinProfileUrl', { 
              required: 'LinkedIn profile URL is required',
              validate: value => 
                value.includes('linkedin.com/') || 'Please enter a valid LinkedIn profile URL'
            })}
          />
        </div>
        {errors.linkedinProfileUrl && <p className={formErrorClasses}>{errors.linkedinProfileUrl.message}</p>}
      </div>
      
      {/* Sourcing Channel (Select) */}
      <div>
        <label htmlFor="sourcingChannel" className={formLabelClasses}>How did you hear about us? <span className="text-red-500">*</span></label>
        <div className="relative">
          <FiHelpCircle className={formIconClasses} />
          <select
            id="sourcingChannel"
            className={`${formInputBaseClasses} ${errors.sourcingChannel ? formInputErrorClasses : formInputNormalClasses}`}
            {...register('sourcingChannel', { required: 'Please select an option' })}
            defaultValue=""
          >
            <option value="" disabled>Select an option</option>
            {SOURCING_CHANNELS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        {errors.sourcingChannel && <p className={formErrorClasses}>{errors.sourcingChannel.message}</p>}
      </div>

      {/* Additional Comments (Textarea) */}
      <div>
        <label htmlFor="additionalComments" className={formLabelClasses}>Additional Comments</label>
        <textarea
          id="additionalComments"
          className={`${formInputBaseClasses} pl-3 h-24`} // Textarea doesn't need an icon
          placeholder="Any additional information you'd like to share..."
          rows={4}
          {...register('additionalComments')}
        />
      </div>

      {/* Checkbox */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="interestedInJoining"
            type="checkbox"
            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            {...register('interestedInJoining')}
            defaultChecked={true}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="interestedInJoining" className="font-medium text-gray-700">
            I am interested in joining NxtWave as a freelance technical interviewer.
          </label>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="pt-4 flex justify-end">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          icon={<FiSend />}
          iconPosition="left"
          className="w-full md:w-auto text-base py-3 px-6"
        >
          Submit Application
        </Button>
      </div>
    </form>
  );
};

export default InitialApplicationForm;
