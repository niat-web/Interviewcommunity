import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
// FIX: FiCalendar has been added to the import list.
import { FiSave, FiUser, FiDollarSign, FiKey, FiEye, FiEyeOff, FiCheckCircle, FiStar, FiCalendar } from 'react-icons/fi';
import { getProfile, updateProfile, updateBankDetails } from '../../api/interviewer.api';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../hooks/useAlert';
import { formatDate } from '../../utils/formatters';

// --- SELF-CONTAINED UI COMPONENTS (DEFINED LOCALLY) ---

const SectionCard = ({ title, icon: Icon, children, footer }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <Icon className="h-5 w-5 mr-3 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="p-6 flex-grow">{children}</div>
        {footer && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                {footer}
            </div>
        )}
    </div>
);

const InputField = React.forwardRef(({ label, name, error, register, ...props }, ref) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
            <input id={name} {...register} {...props} className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} />
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
));

const PasswordInputField = ({ label, name, error, register }) => {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
                <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input id={name} type={show ? 'text' : 'password'} {...register} className={`w-full pl-10 pr-10 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {show ? <FiEyeOff /> : <FiEye />}
                </button>
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
        </div>
    );
};

const InfoField = ({ label, value, icon: Icon, statusColor = '' }) => (
    <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
        <div className="flex items-center mt-1">
            {Icon && <Icon className={`h-4 w-4 mr-2 ${statusColor || 'text-gray-400'}`} />}
            <p className={`text-base font-semibold ${statusColor || 'text-gray-800'}`}>{value}</p>
        </div>
    </div>
);

const LocalButton = ({ children, onClick, type = 'button', isLoading = false, icon: Icon }) => (
    <button type={type} onClick={onClick} disabled={isLoading} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
        {isLoading ? <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : (Icon && <Icon className="mr-2 h-4 w-4" />)}
        {isLoading ? 'Saving...' : children}
    </button>
);

const LocalLoader = () => (
    <div className="flex justify-center items-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div><span className="ml-4 text-gray-500">Loading Profile...</span></div>
);

// --- MAIN PROFILE PAGE COMPONENT ---
const Profile = () => {
  const { currentUser, updateProfile: updateAuthProfile, changePassword } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [submittingSection, setSubmittingSection] = useState(null);
  
  const { register: registerBasic, handleSubmit: handleSubmitBasic, formState: { errors: errorsBasic }, reset: resetBasic } = useForm();
  const { register: registerBank, handleSubmit: handleSubmitBank, formState: { errors: errorsBank }, reset: resetBank } = useForm();
  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: errorsPassword }, reset: resetPasswordHook, watch } = useForm();
  
  const newPassword = watch('newPassword', '');
  
  useEffect(() => {
    getProfile().then(response => {
        setProfile(response.data.data);
        resetBasic({
          firstName: currentUser?.firstName, lastName: currentUser?.lastName,
          phoneNumber: currentUser?.phoneNumber, whatsappNumber: currentUser?.whatsappNumber,
          currentEmployer: response.data.data.currentEmployer, jobTitle: response.data.data.jobTitle
        });
        resetBank({
          accountName: response.data.data.bankDetails?.accountName, accountNumber: response.data.data.bankDetails?.accountNumber,
          bankName: response.data.data.bankDetails?.bankName, ifscCode: response.data.data.bankDetails?.ifscCode
        });
    }).catch(() => showError('Failed to load profile data.'))
    .finally(() => setLoading(false));
  }, [currentUser, resetBasic, resetBank, showError]);
  
  const onSubmitBasicInfo = async (data) => {
    setSubmittingSection('basic');
    try {
      await updateAuthProfile({ firstName: data.firstName, lastName: data.lastName, phoneNumber: data.phoneNumber, whatsappNumber: data.whatsappNumber });
      await updateProfile({ currentEmployer: data.currentEmployer, jobTitle: data.jobTitle });
      showSuccess('Profile updated successfully!');
    } catch (error) { showError('Failed to update profile.'); } 
    finally { setSubmittingSection(null); }
  };
  
  const onSubmitBankDetails = async (data) => {
    setSubmittingSection('bank');
    try {
      await updateBankDetails(data);
      showSuccess('Bank details updated successfully!');
    } catch (error) { showError('Failed to update bank details.'); } 
    finally { setSubmittingSection(null); }
  };
  
  const onSubmitPasswordChange = async (data) => {
    setSubmittingSection('password');
    try {
      await changePassword(data.currentPassword, data.newPassword, data.confirmPassword);
      showSuccess('Password changed successfully!');
      resetPasswordHook();
      setIsPasswordModalOpen(false);
    } catch (error) { showError('Failed to change password. Please check your current password.'); } 
    finally { setSubmittingSection(null); }
  };

  const statusColors = { 'Active': 'text-green-600', 'On Probation': 'text-yellow-600', 'Inactive': 'text-gray-500' };

  if (loading) return <LocalLoader />;

  return (
    <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmitBasic(onSubmitBasicInfo)}>
                <SectionCard title="Personal Details" icon={FiUser} footer={<LocalButton type="submit" isLoading={submittingSection === 'basic'} icon={FiSave}>Save Changes</LocalButton>}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <InputField label="First Name" name="firstName" register={{...registerBasic('firstName', { required: 'First name is required' })}} error={errorsBasic.firstName} />
                        <InputField label="Last Name" name="lastName" register={{...registerBasic('lastName', { required: 'Last name is required' })}} error={errorsBasic.lastName} />
                        <InputField label="Email Address" name="email" value={currentUser?.email || ''} disabled />
                        <InputField label="Phone Number" name="phoneNumber" register={{...registerBasic('phoneNumber', { required: 'Phone number is required' })}} error={errorsBasic.phoneNumber} />
                        <InputField label="WhatsApp Number" name="whatsappNumber" register={{...registerBasic('whatsappNumber')}} error={errorsBasic.whatsappNumber} />
                        <InputField label="Current Employer" name="currentEmployer" register={{...registerBasic('currentEmployer', { required: 'Employer is required' })}} error={errorsBasic.currentEmployer} />
                        <InputField label="Job Title" name="jobTitle" register={{...registerBasic('jobTitle', { required: 'Job title is required' })}} error={errorsBasic.jobTitle} />
                    </div>
                </SectionCard>
            </form>

            <form onSubmit={handleSubmitBank(onSubmitBankDetails)}>
                <SectionCard title="Bank Information" icon={FiDollarSign} footer={<LocalButton type="submit" isLoading={submittingSection === 'bank'} icon={FiSave}>Save Bank Details</LocalButton>}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <InputField label="Account Holder Name" name="accountName" register={{...registerBank('accountName', { required: 'Name is required' })}} error={errorsBank.accountName} />
                        <InputField label="Bank Name" name="bankName" register={{...registerBank('bankName', { required: 'Bank is required' })}} error={errorsBank.bankName} />
                        <InputField label="Account Number" name="accountNumber" register={{...registerBank('accountNumber', { required: 'Account number is required' })}} error={errorsBank.accountNumber} />
                        <InputField label="IFSC Code" name="ifscCode" register={{...registerBank('ifscCode', { required: 'IFSC is required' })}} error={errorsBank.ifscCode} />
                    </div>
                </SectionCard>
            </form>
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
            <SectionCard title="Profile Overview" icon={FiUser}>
                <div className="space-y-4">
                    <InfoField label="Status" value={profile?.status || 'N/A'} icon={FiCheckCircle} statusColor={statusColors[profile?.status]} />
                    <InfoField label="Payment Tier" value={profile?.paymentTier || 'N/A'} icon={FiStar} />
                    <InfoField label="Onboarded On" value={formatDate(profile?.onboardingDate) || 'N/A'} icon={FiCalendar} />
                    <div className="pt-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile Completeness</label>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${profile?.profileCompleteness || 0}%` }}></div></div>
                            <span className="text-sm font-semibold text-gray-700">{profile?.profileCompleteness || 0}%</span>
                        </div>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Security" icon={FiKey}>
                <p className="text-sm text-gray-600 mb-4">Click the button below to update your account password.</p>
                <LocalButton variant="outline" onClick={() => setIsPasswordModalOpen(true)}>Change Password</LocalButton>
            </SectionCard>
        </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setIsPasswordModalOpen(false)}>
              <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
                  <div className="p-5 border-b flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-gray-900">Change Password</h3>
                      <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-800 text-2xl">×</button>
                  </div>
                  <form onSubmit={handleSubmitPassword(onSubmitPasswordChange)}>
                      <div className="p-6 space-y-4">
                          <PasswordInputField label="Current Password" name="currentPassword" register={{...registerPassword('currentPassword', { required: 'Current password is required' })}} error={errorsPassword.currentPassword} />
                          <PasswordInputField label="New Password" name="newPassword" register={{...registerPassword('newPassword', { required: 'New password is required', minLength: { value: 8, message: 'Must be at least 8 characters' } })}} error={errorsPassword.newPassword} />
                          <PasswordInputField label="Confirm New Password" name="confirmPassword" register={{...registerPassword('confirmPassword', { required: 'Please confirm password', validate: value => value === newPassword || 'Passwords do not match' })}} error={errorsPassword.confirmPassword} />
                      </div>
                      <div className="flex items-center justify-end p-4 border-t bg-gray-50 rounded-b-lg">
                          <LocalButton type="submit" isLoading={submittingSection === 'password'} icon={FiSave}>Change Password</LocalButton>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Profile;
