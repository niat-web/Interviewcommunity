// client/src/components/admin/CreateEmailTemplate.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { createCustomEmailTemplate, updateCustomEmailTemplate, getCustomEmailTemplates, deleteCustomEmailTemplate } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';
import { FiEdit, FiTrash2, FiPlus, FiSave, FiEye, FiClipboard, FiInbox, FiCode } from 'react-icons/fi';
import DOMPurify from 'dompurify';
import ConfirmDialog from '../common/ConfirmDialog';


const CreateEmailTemplate = ({ refreshTemplates }) => {
    const { showSuccess, showError, showInfo } = useAlert();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);
    const [viewMode, setViewMode] = useState('editor');
    const [isSaving, setIsSaving] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
    const [isCreating, setIsCreating] = useState(false);
    const quillRef = useRef(null);
    
    const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
        defaultValues: { name: '', subject: '', body: '' }
    });

    useEffect(() => {
        getCustomEmailTemplates().then(res => setTemplates(res.data.data)).catch(() => showError('Could not load templates.'));
    }, [showError]);
    
    useEffect(() => {
        const template = templates.find(t => t._id === selectedTemplateId);
        if (template) {
            reset({ name: template.name, subject: template.subject, body: template.body });
        } else {
            reset({ name: '', subject: '', body: '' });
        }
    }, [selectedTemplateId, templates, reset]);

    const handleCreateNew = () => {
        setSelectedTemplateId(null);
        reset({ name: '', subject: '', body: '' });
        setIsCreating(true);
    };
    
    const handleTemplateSelectChange = (e) => {
        const newId = e.target.value;
        setSelectedTemplateId(newId);
        setIsCreating(false); 
        if (!newId) {
            handleCreateNew();
            setIsCreating(false);
        }
    };
    
    const onSubmit = async (data) => {
        setIsSaving(true);
        try {
            if (selectedTemplateId) {
                await updateCustomEmailTemplate(selectedTemplateId, data);
                showSuccess('Template updated successfully!');
            } else {
                await createCustomEmailTemplate(data);
                showSuccess('Template created successfully!');
                handleCreateNew();
            }
            refreshTemplates(); 
            getCustomEmailTemplates().then(res => setTemplates(res.data.data)); 
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to save template.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        try {
            await deleteCustomEmailTemplate(deleteDialog.id);
            showSuccess("Template deleted.");
            handleCreateNew();
            refreshTemplates();
            getCustomEmailTemplates().then(res => setTemplates(res.data.data));
        } catch (error) {
            showError("Failed to delete template.");
        } finally {
            setDeleteDialog({isOpen: false, id: null});
        }
    };
    
    const bodyContent = watch('body');

    const commonPlaceholders = ['Fullname', 'Email', 'Report Link'];
    const handlePlaceholderClick = (placeholder) => {
        const text = `{{${placeholder}}}`;
        navigator.clipboard.writeText(text);
        showInfo(`"${text}" copied to clipboard!`);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <style>
            {`
                /* Style the new button to have a code icon */
                .ql-toolbar .ql-formats button.ql-code-block svg {
                    width: 24px !important; height: 24px !important;
                    content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>');
                }
                /* Style the editor when in source mode */
                .ql-editor[data-view="source"] {
                    font-family: monospace;
                    white-space: pre-wrap;
                    background-color: #f3f4f6;
                    color: #1f2937;
                }
            `}
            </style>
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                 <div className="flex items-center gap-4">
                    <select
                        value={selectedTemplateId || ''}
                        onChange={handleTemplateSelectChange}
                        className="w-full sm:w-64 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">Select a Template to Edit</option>
                        {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                     {selectedTemplateId && (
                        <button onClick={() => setDeleteDialog({isOpen: true, id: selectedTemplateId})} className="p-2 text-red-500 hover:bg-red-50 rounded-md"><FiTrash2 size={18} /></button>
                     )}
                 </div>
                <button onClick={handleCreateNew} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm"><FiPlus/>Create New</button>
            </div>

            { !isCreating && !selectedTemplateId && templates.length === 0 ? (
                <div className="text-center py-16 text-gray-500"><FiInbox className="mx-auto h-12 w-12 text-gray-300 mb-4" /><h3 className="font-semibold text-lg text-gray-700">No Templates Found</h3><p>Click "Create New" to build your first email template.</p></div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                        <input {...register('name', { required: "Template name is required" })} placeholder="e.g., Interview Shortlisted - July 2025" className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-400' : 'border-gray-300'}`} />
                        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                        <input {...register('subject', { required: "Subject is required" })} placeholder="e.g., Congratulations On Being Selected" className={`w-full p-2 border rounded-md ${errors.subject ? 'border-red-400' : 'border-gray-300'}`}/>
                         {errors.subject && <p className="text-xs text-red-600 mt-1">{errors.subject.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Available Placeholders</label>
                        <div className="flex flex-wrap gap-2">
                            {commonPlaceholders.map(p => (
                                <button key={p} type="button" onClick={() => handlePlaceholderClick(p)} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-mono px-2 py-1 rounded hover:bg-gray-200"><FiClipboard size={12}/>{`{{${p}}}`}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                         <div className="flex justify-between items-center mb-2">
                             <label className="block text-sm font-medium text-gray-700">Email Body</label>
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md">
                                <button type="button" onClick={() => setViewMode('editor')} className={`px-2 py-1 text-xs rounded ${viewMode === 'editor' ? 'bg-white shadow-sm' : ''}`}><FiEdit className="inline mr-1" />Editor</button>
                                <button type="button" onClick={() => setViewMode('preview')} className={`px-2 py-1 text-xs rounded ${viewMode === 'preview' ? 'bg-white shadow-sm' : ''}`}><FiEye className="inline mr-1" />Preview</button>
                            </div>
                         </div>
                        {viewMode === 'editor' ? (
                             <Controller 
                                name="body" 
                                control={control} 
                                rules={{ required: "Email body cannot be empty" }} 
                                render={({ field }) => {
                                    const quillModules = useMemo(() => {
                                        const handleHtmlToggle = () => {
                                            const quill = quillRef.current?.getEditor();
                                            if (!quill) return;
                            
                                            const isHtmlView = quill.root.dataset.view === 'source';
                            
                                            if (isHtmlView) {
                                                // Switching FROM Source View TO Rich Text
                                                const htmlSource = quill.root.textContent;
                                                // Update react-hook-form's state with raw HTML
                                                field.onChange(htmlSource);
                                                // Manually set innerHTML for immediate visual feedback
                                                quill.root.innerHTML = htmlSource;
                                                delete quill.root.dataset.view;
                                            } else {
                                                // Switching FROM Rich Text TO Source View
                                                const htmlContent = quill.root.innerHTML;
                                                // Set as plain text to show the source code
                                                quill.root.textContent = htmlContent;
                                                quill.root.dataset.view = 'source';
                                            }
                                        };
                            
                                        return {
                                            toolbar: {
                                                container: [
                                                    [{ 'header': [1, 2, false] }],
                                                    ['bold', 'italic', 'underline'],
                                                    [{'list': 'ordered'}, {'list': 'bullet'}],
                                                    ['link'],
                                                    ['clean'],
                                                    ['code-block'] 
                                                ],
                                                handlers: {
                                                    'code-block': handleHtmlToggle
                                                }
                                            }
                                        };
                                    }, [field.onChange]);

                                    return (
                                        <ReactQuill 
                                            ref={quillRef} 
                                            theme="snow" 
                                            modules={quillModules} 
                                            value={field.value} 
                                            onChange={field.onChange} 
                                        /> 
                                    );
                                }}
                            />
                        ) : (
                            <div className="prose min-w-full min-h-[200px] border border-gray-300 rounded p-4 bg-gray-50" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyContent) }}></div>
                        )}
                        {errors.body && <p className="text-xs text-red-600 mt-1">{errors.body.message}</p>}
                    </div>
                    <div className="flex justify-end pt-4"><LocalButton type="submit" icon={FiSave} isLoading={isSaving}>{isSaving ? 'Saving...' : 'Save Template'}</LocalButton></div>
                </form>
            )}
            <ConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({isOpen: false, id: null})} onConfirm={handleDelete} title="Delete Template" message="Are you sure? This action cannot be undone." />
        </div>
    );
};
const LocalButton = ({ children, onClick, type = 'button', isLoading = false, icon: Icon }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-60 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
    >
      {isLoading ? <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : (Icon && <Icon className="mr-2 h-4 w-4" />)}
      {children}
    </button>
  );

export default CreateEmailTemplate;
