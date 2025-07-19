// client/src/components/forms/SkillAssessmentForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { FiChevronRight, FiChevronLeft, FiSend, FiUser, FiBriefcase, FiCode, FiChevronDown } from 'react-icons/fi';
import Input from '../common/Input';
import Button from '../common/Button';
import Textarea from '../common/Textarea';
import Stepper from '../common/Stepper';
import { submitSkillAssessment, checkApplicationStatus } from '../../api/applicant.api';
import { useAlert } from '../../hooks/useAlert';
import { techStacks } from './techStackData';
import Loader from '../common/Loader';

const AccordionItem = ({ tech, control, register, setValue, watch, isOpen, onToggle }) => {
    const allSubSkills = tech.subSkills.map(s => s.value);
    const watchedSubSkills = watch(`technicalSkills.${tech.id}.subSkills`) || [];
    const selectedCount = watchedSubSkills.length;
  
    const handleSelectAll = (e) => {
        setValue(`technicalSkills.${tech.id}.subSkills`, e.target.checked ? allSubSkills : []);
    };
  
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300 ease-in-out hover:shadow-md hover:border-indigo-200 bg-white">
            <input type="hidden" {...register(`technicalSkills.${tech.id}.technology`, { value: tech.name })} />
            <button
                type="button"
                onClick={onToggle}
                className="flex justify-between items-center w-full p-4 text-left"
            >
                <div className="flex items-center">
                    <h4 className="text-lg font-semibold text-gray-800">{tech.name}</h4>
                    {selectedCount > 0 && (
                        <span className="ml-3 bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">{selectedCount} selected</span>
                    )}
                </div>
                <FiChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                        <div className="flex items-center col-span-full border-b pb-3 mb-1">
                            <input
                                type="checkbox"
                                id={`select-all-${tech.id}`}
                                onChange={handleSelectAll}
                                checked={watchedSubSkills.length === allSubSkills.length && allSubSkills.length > 0}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`select-all-${tech.id}`} className="ml-3 block text-sm font-bold text-gray-900">
                                Select All {tech.name} Skills
                            </label>
                        </div>
                        {tech.subSkills.map((subSkill) => (
                            <div key={subSkill.value} className="flex items-center">
                                <input
                                    {...register(`technicalSkills.${tech.id}.subSkills`)}
                                    type="checkbox"
                                    value={subSkill.value}
                                    id={`${tech.id}-${subSkill.value}`}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`${tech.id}-${subSkill.value}`} className="ml-3 block text-sm text-gray-700">
                                    {subSkill.label}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const SkillAssessmentForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showSuccess, showError } = useAlert();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [openAccordion, setOpenAccordion] = useState(null);

    const { 
        register, control, handleSubmit, formState: { errors, isSubmitting },
        trigger, reset, setValue, watch
    } = useForm({
        defaultValues: {
            currentEmployer: '', jobTitle: '', yearsOfExperience: '',
            technicalSkills: techStacks.map(t => ({ technology: t.name, subSkills: [] })),
            otherSkills: ''
        }
    });

    const wizardSteps = [
        { id: 1, name: 'Personal Info' },
        { id: 2, name: 'Professional Experience' },
        { id: 3, name: 'Technical Skills' }
    ];

    useEffect(() => {
        const fetchApplicantDetails = async () => {
            setLoading(true);
            try {
                const response = await checkApplicationStatus(id); 
                const applicant = response.data.data;
                reset({ ...watch(), ...applicant });
            } catch (error) {
                showError("Failed to load applicant data. Please check the link or contact support.");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchApplicantDetails();
    }, [id, reset, navigate, showError, watch]);

    const handleNext = async () => {
        let fieldsToValidate = [];
        if (step === 1) fieldsToValidate = ['currentEmployer'];
        if (step === 2) fieldsToValidate = ['jobTitle', 'yearsOfExperience'];

        const isValid = await trigger(fieldsToValidate);
        if (isValid) setStep(step + 1);
    };

    const handlePrev = () => setStep(step - 1);

    const onSubmit = async (data) => {
        if (step !== 3) return;

        try {
            const selectedTechnicalSkills = data.technicalSkills
              .map(skill => ({
                  ...skill,
                  subSkills: Array.isArray(skill.subSkills) ? skill.subSkills : []
              }))
              .filter(skill => skill.subSkills.length > 0);

            const submissionData = {
              currentEmployer: data.currentEmployer,
              jobTitle: data.jobTitle,
              yearsOfExperience: Number(data.yearsOfExperience),
              technicalSkills: selectedTechnicalSkills,
              otherSkills: data.otherSkills,
            };
            
            if (submissionData.technicalSkills.length === 0 && !submissionData.otherSkills) {
                return;
            }

            await submitSkillAssessment(id, submissionData);
            navigate(`/skill-assessment-success/${id}`);
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to submit skill assessment.');
        }
    };
    
    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader text="Loading your information..." size="lg" />
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-12">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-16">
                    <Stepper steps={wizardSteps} currentStep={step} />
                </div>
                
                <div className="min-h-[250px]">
                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Step 1: Current Employment</h2>
                            <p className="text-gray-500 mb-6 mt-1">Let's start with your current professional status.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <Input label="Full Name" {...register('fullName')} disabled className="mb-0" />
                                <Input label="Email" {...register('email')} disabled className="mb-0" />
                            </div>
                            <Input 
                                label="Current Company / Employer"
                                className="mt-6 mb-0"
                                {...register('currentEmployer', { required: "Current employer is required" })}
                                placeholder="e.g., Google, Freelancer, etc."
                                error={errors.currentEmployer?.message}
                                required
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Step 2: Professional Experience</h2>
                            <p className="text-gray-500 mb-6 mt-1">Please provide details about your role and experience level.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <Input
                              label="Your Job Title / Role"
                              {...register('jobTitle', { required: 'Job title is required' })}
                              placeholder="e.g., Senior Software Engineer"
                              error={errors.jobTitle?.message}
                              required
                              className="mb-0"
                            />
                            <Input
                              label="Total Years of Experience"
                              type="number"
                              {...register('yearsOfExperience', { 
                                  required: 'Years of experience is required',
                                  min: { value: 0, message: 'Experience cannot be negative' }
                              })}
                              placeholder="e.g., 5"
                              error={errors.yearsOfExperience?.message}
                              required
                              className="mb-0"
                            />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                             <h2 className="text-xl font-bold text-gray-800">Step 3: Technical Specialization</h2>
                             <p className="text-gray-500 mb-6 mt-1">
                                Select all the sub-topics you are proficient in for each technology. This will help us find the best interviews for you.
                            </p>
                            <div className="space-y-3">
                                {techStacks.map((tech, index) => (
                                   <AccordionItem 
                                        key={tech.id} 
                                        tech={tech} 
                                        control={control}
                                        register={register}
                                        setValue={setValue}
                                        watch={watch}
                                        isOpen={openAccordion === index}
                                        onToggle={() => setOpenAccordion(openAccordion === index ? null : index)}
                                   />
                                ))}
                            </div>
                            <Textarea
                                label="Other Skills or Technologies"
                                className="mt-6 mb-0"
                                {...register('otherSkills')}
                                placeholder="Mention any skills not listed above (e.g., DevOps tools, cloud platforms, other languages)."
                            />
                        </div>
                    )}
                </div>

                <div className="mt-10 pt-8 border-t border-gray-200 flex justify-between items-center">
                    <div>
                    {step > 1 && (
                        <Button type="button" variant="outline" onClick={handlePrev} icon={<FiChevronLeft />} iconPosition="left">
                            Previous
                        </Button>
                    )}
                    </div>
                    <div>
                    {step < 3 ? (
                        <Button type="button" variant="primary" onClick={handleNext} icon={<FiChevronRight />} iconPosition="right">
                            Next
                        </Button>
                    ) : (
                        <Button type="submit" variant="primary" disabled={isSubmitting} icon={<FiSend />} iconPosition="right">
                            {isSubmitting ? 'Submitting...' : 'Submit & Complete'}
                        </Button>
                    )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SkillAssessmentForm;
