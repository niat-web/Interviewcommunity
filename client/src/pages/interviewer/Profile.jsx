import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiSave, FiUser, FiDollarSign, FiKey, FiEye, FiEyeOff, FiBriefcase, FiLock, FiEdit, FiTrash2, FiPlus, FiPhone, FiMail, FiCalendar, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { getProfile, updateProfile, updateBankDetails, addExperience, updateExperience, deleteExperience, addSkill, updateSkill, deleteSkill } from '../../api/interviewer.api';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../hooks/useAlert';
import { formatDate } from '../../utils/formatters';
import Badge from '../../components/common/Badge';

// --- SELF-CONTAINED UI COMPONENTS ---

const SectionCard = ({ title, icon: Icon, children, footer, className = '' }) => ( <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col ${className}`}> {title && ( <div className="px-6 py-4 border-b border-gray-200 flex items-center">{Icon && <Icon className="h-5 w-5 mr-3 text-blue-600" />}<h3 className="text-lg font-semibold text-gray-800">{title}</h3></div>)}<div className="p-6 flex-grow">{children}</div>{footer && ( <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">{footer}</div>)}</div>);
const InputField = React.forwardRef(({ label, name, error, register, ...props }, ref) => ( <div><label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input id={name} {...register} {...props} className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} />{error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}</div>));
InputField.displayName = 'InputField';
const SelectField = React.forwardRef(({ label, name, error, register, options, ...props }, ref) => (<div><label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><select id={name} {...register} {...props} className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}>{options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>{error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}</div>));
SelectField.displayName = 'SelectField';
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
const LocalButton = ({ children, onClick, type = 'button', isLoading = false, icon: Icon, variant = 'primary' }) => (<button type={type} onClick={onClick} disabled={isLoading} className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-60 ${variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500'}`}>{isLoading ? <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : (Icon && <Icon className="mr-2 h-4 w-4" />)}{isLoading ? 'Saving...' : children}</button>);
const LocalLoader = () => (<div className="flex justify-center items-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div><span className="ml-4 text-gray-500">Loading Profile...</span></div>);

// --- MODALS ---
const ExperienceModal = ({ isOpen, onClose, onSave, experience, isLoading }) => {
    const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm();
    const isPresent = watch('isPresent');
    useEffect(() => {
        if (isOpen) {
            if (experience) {
                reset({ ...experience, skills: (experience.skills || []).join(', '), startDate: experience.startDate ? new Date(experience.startDate) : null, endDate: experience.endDate && !experience.isPresent ? new Date(experience.endDate) : null });
            } else {
                reset({ title: '', company: '', startDate: null, endDate: null, isPresent: false, skills: '' });
            }
        }
    }, [experience, isOpen, reset]);

    const handleFormSubmit = (data) => {
        onSave({ ...data, skills: data.skills.split(',').map(s => s.trim()).filter(Boolean) });
    };

    const datePickerInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

    return isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}><div className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg" onClick={e => e.stopPropagation()}><div className="p-5 border-b flex justify-between items-center"><h3 className="text-xl font-semibold">{experience ? 'Edit' : 'Add'} Experience</h3><button onClick={onClose} className="text-2xl font-light">×</button></div><form onSubmit={handleSubmit(handleFormSubmit)}><div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><InputField label="Job Title" name="title" register={{...register('title', { required: 'Title is required' })}} error={errors.title} /><InputField label="Company" name="company" register={{...register('company', { required: 'Company is required' })}} error={errors.company} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><Controller name="startDate" control={control} rules={{ required: "Start date is required" }} render={({ field }) => <DatePicker {...field} selected={field.value} onChange={(date) => field.onChange(date)} className={datePickerInputClass} dateFormat="MM/yyyy" showMonthYearPicker placeholderText="Select month and year" />} />{errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p>}</div><div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><Controller name="endDate" control={control} render={({ field }) => <DatePicker {...field} selected={field.value} onChange={(date) => field.onChange(date)} className={datePickerInputClass} dateFormat="MM/yyyy" showMonthYearPicker disabled={isPresent} placeholderText="Select month and year" />} /></div></div><div className="flex items-center"><input id="isPresent" type="checkbox" {...register('isPresent')} className="h-4 w-4 text-blue-600 rounded" /><label htmlFor="isPresent" className="ml-2 text-sm">I currently work here</label></div><InputField label="Skills (comma-separated)" name="skills" register={{...register('skills')}} /></div><div className="flex items-center justify-end p-4 border-t bg-gray-50 rounded-b-lg"><LocalButton type="submit" isLoading={isLoading} icon={FiSave}>Save Experience</LocalButton></div></form></div></div>
    ) : null;
};
const SkillModal = ({ isOpen, onClose, onSave, skill, isLoading }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const proficiencyLevels = [{value: 'Beginner', label: 'Beginner'}, {value: 'Intermediate', label: 'Intermediate'}, {value: 'Advanced', label: 'Advanced'}, {value: 'Expert', label: 'Expert'}];
    
    useEffect(() => {
        if (isOpen) { reset(skill || { skill: '', proficiencyLevel: 'Intermediate' }); }
    }, [skill, isOpen, reset]);

    return isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}><div className="relative w-full max-w-md bg-white rounded-lg shadow-lg" onClick={e => e.stopPropagation()}><div className="p-5 border-b flex justify-between items-center"><h3 className="text-xl font-semibold">{skill ? 'Edit' : 'Add'} Skill</h3><button onClick={onClose} className="text-2xl font-light">×</button></div><form onSubmit={handleSubmit(onSave)}><div className="p-6 space-y-4"><InputField label="Skill Name" name="skill" register={{...register('skill', { required: 'Skill name is required' })}} error={errors.skill} /><SelectField label="Proficiency Level" name="proficiencyLevel" register={{...register('proficiencyLevel', { required: 'Level is required' })}} options={proficiencyLevels} error={errors.proficiencyLevel} /></div><div className="flex items-center justify-end p-4 border-t bg-gray-50 rounded-b-lg"><LocalButton type="submit" isLoading={isLoading} icon={FiSave}>Save Skill</LocalButton></div></form></div></div>
    ) : null;
};
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemType, isLoading }) => isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}><div className="relative w-full max-w-md bg-white rounded-lg shadow-lg" onClick={e => e.stopPropagation()}><div className="p-6"><div className="flex items-start"><div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><FiAlertTriangle className="h-6 w-6 text-red-600"/></div><div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"><h3 className="text-lg font-medium text-gray-900">Delete {itemType}</h3><p className="mt-2 text-sm text-gray-500">Are you sure you want to delete this {itemType.toLowerCase()}? This action is permanent and cannot be undone.</p></div></div></div><div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg"><LocalButton variant="danger" onClick={onConfirm} isLoading={isLoading}>Delete</LocalButton><LocalButton variant="outline" onClick={onClose} className="ml-3">Cancel</LocalButton></div></div></div>
) : null;

// --- MAIN PROFILE PAGE COMPONENT ---
const Profile = () => {
  const { currentUser, updateProfile: updateAuthProfile, changePassword } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('Experience');
  const [submittingSection, setSubmittingSection] = useState(null);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, item: null, type: '' });

  
  const { register: registerBasic, handleSubmit: handleSubmitBasic, formState: { errors: errorsBasic }, reset: resetBasic } = useForm();
  const { register: registerBank, handleSubmit: handleSubmitBank, formState: { errors: errorsBank }, reset: resetBank } = useForm();
  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: errorsPassword }, reset: resetPasswordHook, watch } = useForm();
  
  const newPassword = watch('newPassword', '');
  
  const fetchProfileData = useCallback(() => {
    setLoading(true);
    getProfile().then(response => {
        const data = response.data.data;
        setProfile(data);
        resetBasic({
          firstName: currentUser?.firstName, lastName: currentUser?.lastName,
          phoneNumber: currentUser?.phoneNumber, whatsappNumber: currentUser?.whatsappNumber,
          currentEmployer: data.currentEmployer, jobTitle: data.jobTitle,
          yearsOfExperience: data.yearsOfExperience, companyType: data.companyType
        });
        resetBank({
            accountName: data.bankDetails?.accountName, accountNumber: data.bankDetails?.accountNumber,
            bankName: data.bankDetails?.bankName, ifscCode: data.bankDetails?.ifscCode
        });
    }).catch(() => showError('Failed to load profile data.'))
    .finally(() => setLoading(false));
  }, [currentUser, resetBasic, resetBank, showError]);
  
  useEffect(fetchProfileData, [fetchProfileData]);
  
  const onSubmitBasicInfo = async (data) => {
    setSubmittingSection('basic');
    try {
      await updateAuthProfile({ firstName: data.firstName, lastName: data.lastName, phoneNumber: data.phoneNumber, whatsappNumber: data.whatsappNumber });
      // --- MODIFICATION START ---
      await updateProfile({ 
          currentEmployer: data.currentEmployer, 
          jobTitle: data.jobTitle,
          yearsOfExperience: data.yearsOfExperience,
          companyType: data.companyType
      });
      // --- MODIFICATION END ---
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
      setActiveTab('Experience');
    } catch (error) { showError('Failed to change password. Please check your current password.'); } 
    finally { setSubmittingSection(null); }
  };
  
  const onSaveExperience = async (data) => {
      setSubmittingSection('experience');
      try {
          if (editingExperience) {
              await updateExperience(editingExperience._id, data);
              showSuccess("Experience updated!");
          } else {
              await addExperience(data);
              showSuccess("Experience added!");
          }
          fetchProfileData();
          setIsExperienceModalOpen(false);
          setEditingExperience(null);
      } catch (err) { showError("Failed to save experience."); } 
      finally { setSubmittingSection(null); }
  };

  const onSaveSkill = async (data) => {
    setSubmittingSection('skill');
    try {
        if (editingSkill) {
            await updateSkill(editingSkill._id, data);
            showSuccess("Skill updated!");
        } else {
            await addSkill(data);
            showSuccess("Skill added!");
        }
        fetchProfileData();
        setIsSkillModalOpen(false);
        setEditingSkill(null);
    } catch (err) {
        showError("Failed to save skill.");
    } finally {
        setSubmittingSection(null);
    }
  };
  
  const handleDeleteRequest = (item, type) => {
    setDeleteModalState({ isOpen: true, item, type });
  };
  
  const handleConfirmDelete = async () => {
    const { item, type } = deleteModalState;
    if (!item) return;

    setSubmittingSection('delete');
    try {
        if (type === 'Experience') {
            await deleteExperience(item._id);
            showSuccess("Experience deleted.");
        } else if (type === 'Skill') {
            await deleteSkill(item._id);
            showSuccess("Skill deleted.");
        }
        fetchProfileData();
        setDeleteModalState({ isOpen: false, item: null, type: '' });
    } catch (err) {
        showError(`Failed to delete ${type.toLowerCase()}.`);
    } finally {
        setSubmittingSection(null);
    }
  };

  if (loading) return <LocalLoader />;
  
  const tabs = ['Experience', 'Skills', 'Profile Details', 'Security'];
  
  return (
    // --- MODIFICATION START: Add padding classes for full-page layout ---
    <div className="space-y-6 container mx-auto px-4 py-6 lg:px-6 lg:py-8">
        {/* --- MODIFICATION END --- */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-5">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 mb-4 sm:mb-0">
                    {currentUser?.firstName?.charAt(0)}
                </div>
                <div className="flex-grow text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-gray-900">{currentUser?.firstName} {currentUser?.lastName}</h2>
                    <div className="mt-2 flex flex-col sm:flex-row items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center"><FiPhone className="mr-1.5" /> {currentUser?.phoneNumber || 'No phone'}</span>
                        <span className="flex items-center"><FiMail className="mr-1.5" /> {currentUser?.email}</span>
                    </div>
                </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                 <div><label className="font-semibold text-gray-500 block">Status</label><Badge variant={profile?.status === 'Active' ? 'success' : 'warning'}>{profile?.status}</Badge></div>
                 <div><label className="font-semibold text-gray-500 block">Onboarded</label><p>{formatDate(profile?.onboardingDate)}</p></div>
                 <div className="col-span-2 lg:col-span-1"><label className="font-semibold text-gray-500 block">Specialized Domains</label><div className="flex flex-wrap gap-1 mt-1">{profile?.domains?.map(d => <Badge key={d} variant="primary">{d}</Badge>)}</div></div>
                 <div><label className="font-semibold text-gray-500 block">Completeness</label><p>{profile?.profileCompleteness}%</p></div>
            </div>
        </div>
        <div className="border-b border-gray-200"><nav className="-mb-px flex space-x-8">{tabs.map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{tab}</button>))}</nav></div>
        <div>
            {activeTab === 'Experience' && (
                <div className="space-y-4">
                     <SectionCard title="Current Role" icon={FiBriefcase} className="bg-blue-50 border-blue-200">
                        <h3 className="text-lg font-semibold">{profile?.jobTitle}</h3>
                        <p className="text-gray-600">{profile?.currentEmployer}</p>
                    </SectionCard>
                    {profile?.experiences?.map(exp => (
                        <div key={exp._id} className="p-5 bg-white rounded-lg shadow-sm border border-gray-200">
                             <div className="flex justify-between items-start"><div><h3 className="text-lg font-semibold">{exp.title}</h3><p className="text-gray-600">{exp.company}</p><p className="text-sm text-gray-500 mt-1">{formatDate(exp.startDate)} - {exp.isPresent ? 'Present' : (exp.endDate ? formatDate(exp.endDate) : 'N/A')}</p></div><div className="flex items-center gap-4 text-sm"><button onClick={() => { setEditingExperience(exp); setIsExperienceModalOpen(true); }} className="flex items-center text-blue-600 hover:underline"><FiEdit className="mr-1"/> Edit</button><button onClick={() => handleDeleteRequest(exp, 'Experience')} className="flex items-center text-red-600 hover:underline"><FiTrash2 className="mr-1"/> Delete</button></div></div>
                             {exp.skills && exp.skills.length > 0 && <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">{exp.skills.map(skill => <Badge key={skill}>{skill}</Badge>)}</div>}
                        </div>
                    ))}
                    <LocalButton variant="primary" icon={FiPlus} onClick={() => { setEditingExperience(null); setIsExperienceModalOpen(true); }}>Add Experience</LocalButton>
                </div>
            )}
            {activeTab === 'Skills' && (
                <SectionCard>
                    <div className="space-y-3">
                        {profile?.skills?.map(skill => (
                            <div key={skill._id} className="flex justify-between items-center p-3 rounded-md bg-gray-50 border">
                                <div>
                                    <p className="font-semibold text-gray-800">{skill.skill}</p>
                                    <p className="text-xs text-gray-500">{skill.proficiencyLevel}</p>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <button onClick={() => { setEditingSkill(skill); setIsSkillModalOpen(true); }} className="flex items-center text-blue-600 hover:underline"><FiEdit className="mr-1"/> Edit</button>
                                    <button onClick={() => handleDeleteRequest(skill, 'Skill')} className="flex items-center text-red-600 hover:underline"><FiTrash2 className="mr-1"/> Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="mt-4"><LocalButton variant="primary" icon={FiPlus} onClick={() => { setEditingSkill(null); setIsSkillModalOpen(true); }}>Add Skill</LocalButton></div>
                </SectionCard>
            )}
            {activeTab === 'Profile Details' && (
                <div className="space-y-6">
                    <form onSubmit={handleSubmitBasic(onSubmitBasicInfo)}>
                        <SectionCard title="Personal & Professional Details" icon={FiUser} footer={<LocalButton type="submit" isLoading={submittingSection === 'basic'} icon={FiSave}>Save Info</LocalButton>}>
                             {/* --- MODIFICATION START --- */}
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="col-span-full"><h4 className="text-md font-semibold text-gray-700 mb-2 border-b pb-2">Personal Information</h4></div>
                                <InputField label="First Name" name="firstName" register={{...registerBasic('firstName', { required: 'First name is required' })}} error={errorsBasic.firstName} />
                                <InputField label="Last Name" name="lastName" register={{...registerBasic('lastName', { required: 'Last name is required' })}} error={errorsBasic.lastName} />
                                <InputField label="Phone Number" name="phoneNumber" register={{...registerBasic('phoneNumber', { required: 'Phone number is required' })}} error={errorsBasic.phoneNumber} />
                                <InputField label="WhatsApp Number" name="whatsappNumber" register={{...registerBasic('whatsappNumber')}} error={errorsBasic.whatsappNumber} />
                                
                                <div className="col-span-full mt-4"><h4 className="text-md font-semibold text-gray-700 mb-2 border-b pb-2">Professional Information</h4></div>
                                <InputField label="Current Company / Employer" name="currentEmployer" register={{...registerBasic('currentEmployer', { required: 'Current employer is required' })}} error={errorsBasic.currentEmployer}/>
                                <InputField label="Job Title" name="jobTitle" register={{...registerBasic('jobTitle', { required: 'Job title is required' })}} error={errorsBasic.jobTitle} />
                                <InputField label="Total Years of Experience" name="yearsOfExperience" type="number" register={{...registerBasic('yearsOfExperience', { required: 'Experience is required', valueAsNumber: true, min: { value: 0, message: 'Cannot be negative' }})}} error={errorsBasic.yearsOfExperience} />
                                <SelectField label="Company Type" name="companyType" register={{...registerBasic('companyType', { required: 'Company type is required' })}} options={[
                                    { value: 'Product-based', label: 'Product-based'},
                                    { value: 'Service-based', label: 'Service-based'},
                                    { value: 'Startup', label: 'Startup'},
                                    { value: 'Other', label: 'Other'}
                                ]} error={errorsBasic.companyType} />
                            </div>
                             {/* --- MODIFICATION END --- */}
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
            )}
            {activeTab === 'Security' && (
                 <form onSubmit={handleSubmitPassword(onSubmitPasswordChange)}>
                    <SectionCard title="Change Password" icon={FiLock} footer={<LocalButton type="submit" isLoading={submittingSection === 'password'} icon={FiSave}>Update Password</LocalButton>}>
                       <div className="space-y-4">
                            <PasswordInputField label="Current Password" name="currentPassword" register={{...registerPassword('currentPassword', { required: 'Current password is required' })}} error={errorsPassword.currentPassword} />
                            <PasswordInputField label="New Password" name="newPassword" register={{...registerPassword('newPassword', { required: 'New password is required', minLength: { value: 8, message: 'Must be at least 8 characters' } })}} error={errorsPassword.newPassword} />
                            <PasswordInputField label="Confirm New Password" name="confirmPassword" register={{...registerPassword('confirmPassword', { required: 'Please confirm password', validate: value => value === newPassword || 'Passwords do not match' })}} error={errorsPassword.confirmPassword} />
                        </div>
                    </SectionCard>
                </form>
            )}
        </div>
        <ExperienceModal isOpen={isExperienceModalOpen} onClose={() => setIsExperienceModalOpen(false)} onSave={onSaveExperience} experience={editingExperience} isLoading={submittingSection === 'experience'} />
        <SkillModal isOpen={isSkillModalOpen} onClose={() => setIsSkillModalOpen(false)} onSave={onSaveSkill} skill={editingSkill} isLoading={submittingSection === 'skill'} />
        <ConfirmDeleteModal isOpen={deleteModalState.isOpen} onClose={() => setDeleteModalState({ isOpen: false, item: null, type: '' })} onConfirm={handleConfirmDelete} itemType={deleteModalState.type} isLoading={submittingSection === 'delete'} />
    </div>
  );
};

export default Profile;
