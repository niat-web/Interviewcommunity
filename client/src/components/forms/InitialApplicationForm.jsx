import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
// --- FIX IS ON THIS LINE ---
import { FiSend, FiUser, FiMail, FiPhone, FiLinkedin, FiUsers } from 'react-icons/fi';
import { submitApplication } from '../../api/applicant.api';
import { useAlert } from '../../hooks/useAlert';
import { SOURCING_CHANNELS } from '../../utils/constants';

const InitialApplicationForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();
  const { 
    register, 
    handleSubmit,
    control,
    formState: { errors, isSubmitting } 
  } = useForm({ mode: 'onBlur' });

  const onSubmit = async (data) => {
    try {
      const response = await submitApplication(data);
      showSuccess('Application submitted successfully!');
      
      if (onSuccess) onSuccess();

      navigate(`/application-success/${response.data.data.id}`);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to submit application. Please try again.');
    }
  };

  // Reusable Tailwind classes for the new dark theme design
  const formInputBaseClasses = "block w-full pl-10 pr-3 py-2.5 border placeholder-gray-500 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm transition-all duration-200 bg-white/5";
  const formInputNormalClasses = "border-gray-700 focus:border-cyan-400 focus:ring-cyan-400/30";
  const formInputErrorClasses = "border-red-500 focus:border-red-500 focus:ring-red-500/30";
  const formLabelClasses = "block text-sm font-semibold text-gray-300 mb-1.5";
  const formErrorClasses = "mt-1.5 text-sm text-red-400";
  const formIconClasses = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500";

  // Custom styles for react-select to match the dark theme
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: state.isFocused ? '#22d3ee' : (errors.sourcingChannel ? '#ef4444' : '#4b5563'),
      borderRadius: '0.5rem',
      paddingLeft: '2.5rem', // Make space for an icon
      paddingTop: '0.30rem',
      paddingBottom: '0.30rem',
      boxShadow: state.isFocused ? `0 0 0 2px rgba(34, 211, 238, 0.2)` : 'none',
      fontSize: '0.875rem',
      transition: 'all 150ms ease-in-out',
      '&:hover': { borderColor: '#9ca3af' },
    }),
    placeholder: (provided) => ({ ...provided, color: '#6b7280' }),
    singleValue: (provided) => ({ ...provided, color: '#d1d5db' }),
    menu: (provided) => ({ ...provided, backgroundColor: '#14162B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#22d3ee' : state.isFocused ? 'rgba(255,255,255,0.1)' : 'transparent',
      color: state.isSelected ? '#111827' : '#d1d5db',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (provided) => ({ ...provided, color: '#6b7280' }),
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        <div>
          <label htmlFor="fullName" className={formLabelClasses}>Full Name <span className="text-red-400">*</span></label>
          <div className="relative"><FiUser className={formIconClasses} /><input id="fullName" type="text" className={`${formInputBaseClasses} ${errors.fullName ? formInputErrorClasses : formInputNormalClasses}`} placeholder="e.g., Jane Doe" {...register('fullName', { required: 'Full name is required' })} /></div>
          {errors.fullName && <p className={formErrorClasses}>{errors.fullName.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className={formLabelClasses}>Email Address <span className="text-red-400">*</span></label>
          <div className="relative"><FiMail className={formIconClasses} /><input id="email" type="email" className={`${formInputBaseClasses} ${errors.email ? formInputErrorClasses : formInputNormalClasses}`} placeholder="you@example.com" {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address' } })} /></div>
          {errors.email && <p className={formErrorClasses}>{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="phoneNumber" className={formLabelClasses}>Phone Number <span className="text-red-400">*</span></label>
          <div className="relative"><FiPhone className={formIconClasses} /><input id="phoneNumber" type="tel" className={`${formInputBaseClasses} ${errors.phoneNumber ? formInputErrorClasses : formInputNormalClasses}`} placeholder="e.g., 9876543210" {...register('phoneNumber', { required: 'Phone number is required', pattern: { value: /^\d{10,15}$/, message: 'Please enter a valid phone number' } })} /></div>
          {errors.phoneNumber && <p className={formErrorClasses}>{errors.phoneNumber.message}</p>}
        </div>
        <div>
          <label htmlFor="whatsappNumber" className={formLabelClasses}>WhatsApp Number</label>
          <div className="relative"><FiPhone className={formIconClasses} /><input id="whatsappNumber" type="tel" className={`${formInputBaseClasses} ${errors.whatsappNumber ? formInputErrorClasses : formInputNormalClasses}`} placeholder="If different from phone" {...register('whatsappNumber')} /></div>
          {errors.whatsappNumber && <p className={formErrorClasses}>{errors.whatsappNumber.message}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="linkedinProfileUrl" className={formLabelClasses}>LinkedIn Profile URL <span className="text-red-400">*</span></label>
        <div className="relative"><FiLinkedin className={formIconClasses} /><input id="linkedinProfileUrl" type="url" className={`${formInputBaseClasses} ${errors.linkedinProfileUrl ? formInputErrorClasses : formInputNormalClasses}`} placeholder="https://linkedin.com/in/your-profile" {...register('linkedinProfileUrl', { required: 'LinkedIn profile URL is required', validate: value => value.includes('linkedin.com/') || 'Please enter a valid LinkedIn profile URL' })} /></div>
        {errors.linkedinProfileUrl && <p className={formErrorClasses}>{errors.linkedinProfileUrl.message}</p>}
      </div>
      <div className="relative">
        <label htmlFor="sourcingChannel" className={formLabelClasses}>How did you hear about us? <span className="text-red-400">*</span></label>
        <Controller name="sourcingChannel" control={control} rules={{ required: 'Please select an option' }}
          render={({ field }) => (
            <Select
              {...field}
              instanceId="sourcing-channel-select" options={SOURCING_CHANNELS}
              value={SOURCING_CHANNELS.find(c => c.value === field.value)}
              onChange={val => field.onChange(val.value)}
              styles={customSelectStyles} placeholder="Select an option"
            />
          )}
        />
        <FiUsers className={`${formIconClasses} top-10`} />
        {errors.sourcingChannel && <p className={formErrorClasses}>{errors.sourcingChannel.message}</p>}
      </div>
      <div>
        <label htmlFor="additionalComments" className={formLabelClasses}>Additional Comments</label>
        <textarea id="additionalComments" className={`${formInputBaseClasses} pl-3 h-24`} placeholder="Anything else you'd like to share..." rows={4} {...register('additionalComments')} />
      </div>
      
      <div className="pt-4 flex justify-end">
        <button
          type="submit" disabled={isSubmitting}
          className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full py-3 px-8 text-base font-semibold text-white shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] disabled:opacity-60"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600"></span>
          <span className="relative flex items-center">
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
            {!isSubmitting && <FiSend className="ml-2 h-5 w-5"/>}
          </span>
        </button>
      </div>
    </form>
  );
};

export default InitialApplicationForm;
