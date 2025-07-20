import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft } from 'react-icons/fi';
import { useAlert } from '@/hooks/useAlert';
import { bulkUpdateMainSheetEntries, getInterviewers, getMainSheetEntry } from '@/api/admin.api';
import { MAIN_SHEET_TECH_STACKS, MAIN_SHEET_INTERVIEW_STATUSES } from '@/utils/constants';

// --- SELF-CONTAINED UI COMPONENTS ---
const LocalButton = ({ children, onClick, type = 'button', isLoading = false, variant = 'primary', icon: Icon, className = '' }) => {
    const baseClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm";
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    };
    return (
        <button type={type} onClick={onClick} disabled={isLoading} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
            {isLoading ? <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : (Icon && <Icon className="mr-2 h-4 w-4" />)}
            {children}
        </button>
    );
};

const LocalInput = React.forwardRef(({ className, ...props }, ref) => (
    <input ref={ref} {...props} className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm disabled:bg-gray-100 ${className}`} />
));

const LocalSelect = React.forwardRef(({ options, placeholder, className, ...props }, ref) => (
    <select ref={ref} {...props} className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm ${className}`}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
));

const LocalTextarea = React.forwardRef(({ className, ...props }, ref) => (
    <textarea ref={ref} {...props} className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm ${className}`} />
));

const LocalLoader = ({ text }) => (
     <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
             <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
             </svg>
            <p className="mt-2 text-gray-500">{text}</p>
        </div>
    </div>
);

// --- MAIN FORM COMPONENT ---
const MainSheetForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const { showSuccess, showError } = useAlert();
    const [loading, setLoading] = useState(isEditMode);
    const [interviewerOptions, setInterviewerOptions] = useState([]);

    const defaultEntry = { hiringName: '', techStack: '', interviewId: '', uid: '', candidateName: '', mobileNumber: '', mailId: '', candidateResume: '', meetingLink: '', interviewDate: '', interviewTime: '', interviewDuration: '', interviewStatus: '', remarks: '', interviewer: null, };

    const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: { entries: [defaultEntry] } });
    const { fields, append, remove } = useFieldArray({ control, name: 'entries' });

    useEffect(() => {
        getInterviewers({ status: 'Active,On Probation', limit: 500 })
            .then(res => {
                const options = (res.data.data.interviewers || []).map(i => ({ value: i._id, label: `${i.user.firstName} ${i.user.lastName}`}));
                setInterviewerOptions(options);
            })
            .catch(() => showError("Failed to load interviewers list."));
    }, [showError]);

    useEffect(() => {
        if (isEditMode) {
            getMainSheetEntry(id).then(res => {
                const entry = res.data.data;
                if (entry.interviewDate) entry.interviewDate = new Date(entry.interviewDate).toISOString().split('T')[0];
                reset({ entries: [entry] });
                setLoading(false);
            }).catch(() => { showError('Failed to load entry data.'); navigate('/admin/main-sheet'); });
        }
    }, [id, isEditMode, reset, navigate, showError]);
    
    const onSubmit = async (data) => {
        try {
            await bulkUpdateMainSheetEntries(data.entries);
            showSuccess(`Successfully ${isEditMode ? 'updated' : 'created'} entries!`);
            navigate('/admin/main-sheet');
        } catch (error) { showError(error.response?.data?.message || 'Failed to save entries.'); }
    };
    
    if (loading) return <LocalLoader text="Loading Entry Data..."/>

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="h-full w-full flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                <div>
                    <Link to="/admin/main-sheet" className="text-m text-gray-600 hover:text-gray-900 flex items-center mb-1"><FiArrowLeft className="mr-2"/> Back to Main Sheet</Link>
                    <h2 className="text-xl font-bold text-gray-800">{isEditMode ? `` : ""}</h2>
                </div>
                 <LocalButton type="submit" variant="primary" icon={FiSave} isLoading={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Entries'}</LocalButton>
            </div>

            <div className="flex-grow overflow-auto p-4">
                <table className="min-w-full text-sm border-collapse border border-gray-300">
                    <thead className="bg-gray-100 text-left sticky top-0 z-10">
                        <tr>
                            {[ '#', 'Hiring Name', 'Tech Stack', 'Interview ID', 'UID', 'Candidate Name', 'Mobile Number', 'Mail ID', 'Resume', 'Meeting Link', 'Date', 'Time', 'Duration', 'Status', 'Remarks', 'Interviewer', '' ].map(h => (
                                <th key={h} className="p-2 border border-gray-300 whitespace-nowrap font-semibold">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map((field, index) => (
                            <tr key={field.id} className="even:bg-gray-50 align-top">
                                <td className="p-1 border border-gray-300 text-center">{index + 1}</td>
                                <td className="p-1 border border-gray-300"><LocalInput {...register(`entries.${index}.hiringName`)} style={{minWidth: '150px'}}/></td>
                                <td className="p-1 border border-gray-300"><LocalSelect {...register(`entries.${index}.techStack`)} options={MAIN_SHEET_TECH_STACKS} placeholder="Select Stack..." style={{minWidth: '200px'}}/></td>
                                <td className="p-1 border border-gray-300"><LocalInput {...register(`entries.${index}.interviewId`)} style={{minWidth: '180px'}}/></td>
                                <td className="p-1 border border-gray-300"><LocalInput {...register(`entries.${index}.uid`)} style={{minWidth: '120px'}}/></td>
                                <td className="p-1 border border-gray-300"><LocalInput {...register(`entries.${index}.candidateName`, { required: true })} style={{minWidth: '200px'}}/></td>
                                <td className="p-1 border border-gray-300"><LocalInput {...register(`entries.${index}.mobileNumber`)} style={{minWidth: '150px'}}/></td>
                                <td className="p-1 border border-gray-300"><LocalInput type="email" {...register(`entries.${index}.mailId`, { required: true })} style={{minWidth: '220px'}}/></td>
                                <td className="p-1 border border-gray-300"><LocalInput {...register(`entries.${index}.candidateResume`)} style={{minWidth: '220px'}}/></td>
                                <td className="p-1 border border-gray-300"><LocalInput {...register(`entries.${index}.meetingLink`)} style={{minWidth: '220px'}}/></td>
                                <td className="p-1 border border-gray-300"><LocalInput type="date" {...register(`entries.${index}.interviewDate`)} style={{minWidth: '150px'}}/></td>
                                <td className="p-1 border border-gray-300"><LocalInput type="time" {...register(`entries.${index}.interviewTime`)} style={{minWidth: '120px'}}/></td>
                                <td className="p-1 border border-gray-300"><LocalInput {...register(`entries.${index}.interviewDuration`)} style={{minWidth: '120px'}}/></td>
                                <td className="p-1 border border-gray-300"><LocalSelect {...register(`entries.${index}.interviewStatus`)} options={MAIN_SHEET_INTERVIEW_STATUSES} placeholder="Select Status..." style={{minWidth: '150px'}}/></td>
                                <td className="p-1 border border-gray-300"><LocalTextarea {...register(`entries.${index}.remarks`)} rows={1} style={{minWidth: '250px'}} /></td>
                                <td className="p-1 border border-gray-300"><Controller name={`entries.${index}.interviewer`} control={control} render={({ field }) => (<LocalSelect {...field} options={interviewerOptions} placeholder="Select Interviewer..." style={{minWidth: '200px'}}/>)}/></td>
                                <td className="p-1 border border-gray-300 text-center">
                                   {!isEditMode && <LocalButton variant="danger" className="!p-2" onClick={() => remove(index)}><FiTrash2 size={16}/></LocalButton>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {!isEditMode && (
                    <LocalButton variant="outline" icon={FiPlus} className="mt-4" onClick={() => append(defaultEntry)}>Add Row</LocalButton>
                )}
            </div>
        </form>
    );
};

export default MainSheetForm;
