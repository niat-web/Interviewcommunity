// client/src/pages/public/SkillAssessment.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode, FiCheck, FiArrowRight, FiArrowLeft, FiChevronDown, FiBriefcase, FiAward } from 'react-icons/fi';

import { useAuth } from '../../hooks/useAuth';
import { checkApplicationStatus, submitSkillAssessment } from '../../api/applicant.api';
import { APPLICATION_STATUS } from '../../utils/constants';
import { techStacks } from '../../components/forms/techStackData';
import { useAlert } from '../../hooks/useAlert';

// Self-contained loader to avoid import issues
const LocalLoader = ({ text }) => (
    <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-400"></div>
        {text && <p className="mt-4 text-lg text-slate-300">{text}</p>}
    </div>
);

// Self-contained error display
const ErrorDisplay = ({ error, navigate }) => (
    <div className="w-full max-w-lg bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 sm:p-10 border border-slate-700">
        <div className="text-center">
            <h2 className="text-xl font-bold text-red-500 mb-2">Access Denied</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
                Return to Homepage
            </button>
        </div>
    </div>
);

const VerticalStepper = ({ steps, currentStep }) => (
    <div className="p-8 md:p-10">
        <p className="text-slate-400 mb-10">Complete your profile to proceed.</p>
        <ol className="relative border-l border-slate-700">
            {steps.map((step) => (
                <li key={step.id} className="mb-10 ml-6">
                    <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-8 ring-slate-900 transition-all duration-300 ${
                        currentStep > step.id ? 'bg-green-500 text-white' : 
                        currentStep === step.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                        {currentStep > step.id ? <FiCheck /> : <step.icon className="w-4 h-4" />}
                    </span>
                    <h3 className={`text-lg font-bold leading-tight ${currentStep >= step.id ? 'text-white' : 'text-slate-500'}`}>{step.name}</h3>
                    <p className={`text-sm ${currentStep >= step.id ? 'text-slate-400' : 'text-slate-600'}`}>{step.description}</p>
                </li>
            ))}
        </ol>
    </div>
);

const InputField = ({ label, name, error, register, ...props }) => ( 
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
        <input id={name} {...register} {...props} className={`w-full p-3 bg-slate-800 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors duration-300 text-slate-200 ${error ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500' : 'border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'}`} />
        {error && <p className="mt-1.5 text-xs text-red-400">{error.message}</p>}
    </div>
);

const AccordionItem = ({ tech, register, setValue, watch, isOpen, onToggle }) => {
    const allSubSkills = tech.subSkills.map(s => s.value);
    const watchedSubSkills = watch(`technicalSkills.${tech.id}.subSkills`) || [];
    const selectedCount = watchedSubSkills.length;
  
    const handleSelectAll = (e) => {
        setValue(`technicalSkills.${tech.id}.subSkills`, e.target.checked ? allSubSkills : []);
    };
  
    return (
        <div className="border border-slate-700 rounded-xl bg-slate-800/50 transition-all duration-300 ease-in-out hover:border-indigo-500/50">
            <input type="hidden" {...register(`technicalSkills.${tech.id}.technology`, { value: tech.name })} />
            <button
                type="button"
                onClick={onToggle}
                className="flex justify-between items-center w-full p-5 text-left"
            >
                <div className="flex items-center gap-4">
                    <h4 className="text-base font-semibold text-slate-100">{tech.name}</h4>
                    {selectedCount > 0 && (
                        <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full">{selectedCount} selected</span>
                    )}
                </div>
                <FiChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
            </button>
            <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                >
                    <div className="p-5 border-t border-slate-700 bg-slate-900/40">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                            <div className="flex items-center col-span-full border-b border-slate-700 pb-3 mb-2">
                                <input type="checkbox" id={`select-all-${tech.id}`} onChange={handleSelectAll} checked={watchedSubSkills.length === allSubSkills.length && allSubSkills.length > 0} className="h-4 w-4 accent-indigo-500 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500 cursor-pointer"/>
                                <label htmlFor={`select-all-${tech.id}`} className="ml-3 block text-sm font-bold text-slate-100 cursor-pointer">Select All</label>
                            </div>
                            {tech.subSkills.map((subSkill) => (
                                <div key={subSkill.value} className="flex items-center">
                                    <input {...register(`technicalSkills.${tech.id}.subSkills`)} type="checkbox" value={subSkill.value} id={`${tech.id}-${subSkill.value}`} className="h-4 w-4 accent-indigo-500 bg-slate-700 border-slate-600 rounded cursor-pointer"/>
                                    <label htmlFor={`${tech.id}-${subSkill.value}`} className="ml-3 block text-sm text-slate-300 cursor-pointer">{subSkill.label}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

const LocalButton = ({ children, onClick, type = 'button', isLoading = false, icon: Icon, variant = 'primary', ...props }) => {
    const baseClasses = "inline-flex items-center justify-center px-7 py-3 text-sm font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none";
    const variantClasses = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-500 ring-2 ring-transparent hover:ring-indigo-400/50',
        outline: 'bg-transparent text-slate-300 border border-slate-600 hover:bg-slate-700/50 hover:text-white'
    };
    return (<button type={type} onClick={onClick} disabled={isLoading} className={`${baseClasses} ${variantClasses[variant]}`} {...props}>{isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/50 border-t-white"></div> : (<>{Icon && <Icon className="mr-2 h-5 w-5"/>}{children}</>)}</button>);
};

const SkillAssessment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, loading: authLoading } = useAuth();
    const { showSuccess, showError } = useAlert();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(1);
    const [openAccordion, setOpenAccordion] = useState(0); 

    const { register, handleSubmit, formState: { errors, isSubmitting }, trigger, reset, setValue, watch } = useForm({
        defaultValues: { technicalSkills: techStacks.map(t => ({ technology: t.name, subSkills: [] })) }
    });
    
    const steps = [
        { id: 1, name: 'Professional Details', description: 'Your current role and experience.', icon: FiBriefcase },
        { id: 2, name: 'Technical Skills', description: 'Select your areas of expertise.', icon: FiCode }
    ];

    useEffect(() => {
        if (currentUser) {
            navigate(currentUser.role === 'admin' ? '/admin/dashboard' : '/interviewer/dashboard', { replace: true });
            return;
        }
        const verifyApplicantStatus = async () => {
            try {
                const response = await checkApplicationStatus(id);
                const data = response.data.data;
                reset(currentValues => ({
                  ...currentValues, // Keep all existing form values
                  fullName: data.fullName, // Overwrite only the full name
                  email: data.email        // Overwrite only the email
              })); 

                const completedStages = [APPLICATION_STATUS.SKILLS_ASSESSMENT_COMPLETED, APPLICATION_STATUS.GUIDELINES_SENT, APPLICATION_STATUS.GUIDELINES_REVIEWED, APPLICATION_STATUS.GUIDELINES_FAILED, APPLICATION_STATUS.ONBOARDED, APPLICATION_STATUS.ACTIVE_INTERVIEWER];
                if (completedStages.includes(data.status)) {
                    navigate(`/skill-assessment-success/${id}`, { replace: true });
                } else if (data.status !== APPLICATION_STATUS.SKILLS_ASSESSMENT_SENT && data.status !== APPLICATION_STATUS.PROFILE_APPROVED) {
                    setError('This link is not valid for your current application status.');
                }
            } catch (err) {
                setError('Failed to verify your application. The link may be invalid or expired.');
            } finally {
                setLoading(false);
            }
        };
        if (!authLoading) verifyApplicantStatus();
    }, [id, currentUser, authLoading, navigate, reset]);

    const handleNext = async () => {
        const isValid = await trigger(['currentEmployer', 'jobTitle', 'yearsOfExperience']);
        if (isValid) setStep(2);
    };
    const handlePrev = () => setStep(1);

    const onSubmit = async (data) => {
        const selectedSkills = data.technicalSkills.map(s => ({...s, subSkills: Array.isArray(s.subSkills) ? s.subSkills : []})).filter(s => s.subSkills.length > 0);
        if (selectedSkills.length === 0 && !data.otherSkills) {
            showError("Please select at least one skill or mention other skills.");
            return;
        }
        try {
            const submissionData = { currentEmployer: data.currentEmployer, jobTitle: data.jobTitle, yearsOfExperience: Number(data.yearsOfExperience), technicalSkills: selectedSkills, otherSkills: data.otherSkills };
            await submitSkillAssessment(id, submissionData);
            showSuccess("Assessment submitted successfully!");
            navigate(`/skill-assessment-success/${id}`);
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to submit skill assessment.');
        }
    };

    if (loading || authLoading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LocalLoader text="Verifying your status..." /></div>;
    }

    return (
        <div className="min-h-screen w-full bg-slate-900 text-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
            {error ? (
                <div className="flex items-center justify-center min-h-screen"><ErrorDisplay error={error} navigate={navigate} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-screen">
                    <div className="hidden md:block md:col-span-5 lg:col-span-4 xl:col-span-3 bg-black/20 border-r border-slate-800">
                        <VerticalStepper steps={steps} currentStep={step} />
                    </div>

                    <main className="md:col-span-7 lg:col-span-8 xl:col-span-9 flex flex-col justify-center p-6 sm:p-12">
                        <div className={`w-full ${step === 1 ? 'max-w-2xl' : 'max-w-4xl'} mx-auto transition-all duration-500 ease-in-out`}>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div key="step1" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                                             <h3 className="text-xl font-bold text-white mb-8">Let's start with your professional background</h3>
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div><label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label><input {...register('fullName')} disabled className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg text-slate-500 cursor-not-allowed" /></div>
                                                    <div><label className="block text-sm font-medium text-slate-400 mb-2">Email</label><input {...register('email')} disabled className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg text-slate-500 cursor-not-allowed" /></div>
                                                </div>
                                                <InputField label="Current Company / Employer *" name="currentEmployer" register={{...register('currentEmployer', { required: "This field is required" })}} error={errors.currentEmployer} placeholder="e.g., Google" />
                                                <InputField label="Your Job Title / Role *" name="jobTitle" register={{...register('jobTitle', { required: "This field is required" })}} error={errors.jobTitle} placeholder="e.g., Senior Software Engineer"/>
                                                <InputField label="Total Years of Professional Experience *" name="yearsOfExperience" type="number" register={{...register('yearsOfExperience', { required: "This field is required", min: {value: 0, message: 'Experience cannot be negative'} })}} error={errors.yearsOfExperience} placeholder="e.g., 5" />
                                            </div>
                                        </motion.div>
                                    )}
                                    {step === 2 && (
                                        <motion.div key="step2" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                                            <h3 className="text-xl font-bold text-white mb-8">Showcase Your Technical Expertise</h3>
                                            <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-3 custom-scrollbar">
                                                {techStacks.map((tech, index) => <AccordionItem key={tech.id} tech={tech} register={register} setValue={setValue} watch={watch} isOpen={openAccordion === index} onToggle={() => setOpenAccordion(openAccordion === index ? null : index)} />)}
                                            </div>
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Other Skills or Technologies</label>
                                                <textarea {...register('otherSkills')} placeholder="Mention any other relevant skills not listed, e.g., Docker, Kubernetes, AWS..." className="w-full h-20 p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-200 transition-colors" />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="mt-10 border-t border-slate-800 flex justify-between items-center">
                                    {step > 1 ? (<LocalButton type="button" variant="outline" onClick={handlePrev} icon={FiArrowLeft}>Previous</LocalButton>) : (<div></div>)}
                                    {step < 2 ? (<LocalButton type="button" onClick={handleNext}>Next<FiArrowRight className="ml-2"/></LocalButton>) : (<LocalButton type="submit" isLoading={isSubmitting} icon={FiAward}>Submit Assessment</LocalButton>)}
                                </div>
                            </form>
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
};

export default SkillAssessment;
