// client/src/components/forms/SkillAssessmentForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiChevronRight, FiChevronLeft, FiSend, FiCheck } from 'react-icons/fi';
import Input from '../common/Input';
import Button from '../common/Button';
import Textarea from '../common/Textarea';
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
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300 ease-in-out hover:shadow-md hover:border-blue-200 bg-white">
            <input type="hidden" {...register(`technicalSkills.${tech.id}.technology`, { value: tech.name })} />
            <button
                type="button"
                onClick={onToggle}
                className="flex justify-between items-center w-full p-4 text-left"
            >
                <div className="flex items-center gap-3">
                    <h4 className="text-base font-semibold text-gray-800">{tech.name}</h4>
                    {selectedCount > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{selectedCount} selected</span>
                    )}
                </div>
                <span className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}>▼</span>
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
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
        { id: 1, name: 'Personal Info', description: '' },
        { id: 2, name: 'Technical Skills', description: '' }
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
        if (step === 1) fieldsToValidate = ['currentEmployer', 'jobTitle', 'yearsOfExperience'];

        const isValid = await trigger(fieldsToValidate);
        if (isValid) setStep(step + 1);
    };

    const handlePrev = () => setStep(step - 1);

    const onSubmit = async (data) => {
        if (step !== 2) return;

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
        <div className="w-full max-w-7xl bg-white  shadow-xl flex min-h-[700px]">
        {/* Left Side: Stepper */}
        <div className="w-0.4/3 p-8 border-r border-gray-100 hidden md:block">
            <h2 className="text-xl font-bold text-gray-800 mb-8">Assessment Steps</h2>
            <ul className="space-y-8">
            {wizardSteps.map((wizardStep, index) => {
                const isCompleted = step > wizardStep.id;
                const isCurrent = step === wizardStep.id;

                return (
                <li key={index} className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300
                        ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : ''}
                        ${!isCurrent ? 'bg-gray-200 text-gray-500' : ''}
                    `}>
                        {isCompleted ? <FiCheck size={20} /> : wizardStep.id}
                    </div>
                    {index < wizardSteps.length - 1 && (
                        <div className={`w-0.5 h-16 mt-2 transition-all duration-300 bg-gray-200`}></div>
                    )}
                    </div>
                    <div>
                    <h3 className={`font-bold text-lg transition-colors duration-300 ${isCurrent ? 'text-blue-600' : 'text-gray-800'}`}>{wizardStep.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {wizardStep.description}
                    </p>
                    </div>
                </li>
                );
            })}
            </ul>
        </div>
        
        {/* Right Side: Form Content */}
        <div className="w-full md:w-2.6/3 p-7 flex flex-col">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-grow">
            {/* Main content area */}
            <div className="flex-grow">
                {step === 1 && (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mb-6">
                            <Input label="Full Name" {...register('fullName')} disabled className="mb-0"/>
                            <Input label="Email" {...register('email')} disabled className="mb-0" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                            <Input label="Current Company / Employer" {...register('currentEmployer', { required: "Current employer is required" })} placeholder="e.g., NxtWave" error={errors.currentEmployer?.message} required className="mb-0"/>
                            <Input label="Your Job Title / Role" {...register('jobTitle', { required: 'Job title is required' })} placeholder="e.g., Senior Developer" error={errors.jobTitle?.message} required className="mb-0"/>
                        </div>
                        <Input label="Total Years of Experience" type="number" {...register('yearsOfExperience', { required: 'Years of experience is required', min: { value: 0, message: 'Experience cannot be negative' } })} placeholder="e.g., 7" error={errors.yearsOfExperience?.message} required className="mt-6" />
                    </div>
                )}
                
                {step === 2 && (
                    <div className="animate-fade-in">
                        <div className="space-y-3 max-h-[540px] overflow-y-auto pr-2 custom-scrollbar">
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
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Other Skills or Technologies
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-20"
                                {...register('otherSkills')}
                                placeholder="Mention any skills not listed above (e.g., DevOps tools, cloud platforms, other languages)."
                            />
                        </div>
                    </div>
                )}
            </div>
            
            {/* Footer with buttons */}
            <div className=" border-t border-gray-100 flex justify-between items-center">
                <div>
                {step > 1 && (
                    <Button type="button" variant="outline" onClick={handlePrev}>
                    <FiChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                    </Button>
                )}
                </div>
                <div>
                {step < wizardSteps.length ? (
                    <Button type="button" variant="primary" onClick={handleNext}>
                        Next
                        <FiChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button type="submit" variant="primary" disabled={isSubmitting} icon={<FiSend />} iconPosition="left" isLoading={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                    </Button>
                )}
                </div>
            </div>
            </form>
        </div>
        </div>
    );
};

export default SkillAssessmentForm;
