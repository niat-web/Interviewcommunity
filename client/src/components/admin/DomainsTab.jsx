// client/src/components/admin/DomainsTab.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { createDomain, updateDomain, deleteDomain } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';

// --- SELF-CONTAINED UI COMPONENTS USING TAILWIND CSS ---

const LocalButton = ({ children, onClick, variant = 'primary', icon: Icon, disabled = false, isLoading = false, type = 'button', className = '' }) => {
    const baseClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantClasses = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500',
        ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-indigo-500 shadow-none !p-2',
    };
    
    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;
    
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={combinedClasses}
        >
            {isLoading ? (
                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            ) : (Icon && <Icon className="mr-2 h-4 w-4" />)}
            {children}
        </button>
    );
};

const LocalModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const LocalInput = React.forwardRef(({ label, name, error, ...props }, ref) => (
    <div className="w-full">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            id={name}
            name={name}
            ref={ref}
            {...props}
            className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
));
LocalInput.displayName = 'LocalInput';


const LocalConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => (
     <LocalModal isOpen={isOpen} onClose={onClose} title={title}>
         <div className="flex items-start">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <FiAlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="ml-4">
                <p className="text-sm text-gray-500">{message}</p>
            </div>
         </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <LocalButton variant="danger" onClick={onConfirm}>Confirm</LocalButton>
            <LocalButton variant="outline" onClick={onClose}>Cancel</LocalButton>
        </div>
     </LocalModal>
);

// --- MAIN DOMAINS TAB COMPONENT ---
const DomainsTab = ({ domains, onUpdate }) => {
    const { showSuccess, showError } = useAlert();
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

    const [modalState, setModalState] = useState({ isOpen: false, data: null });
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });

    const openModal = (data = null) => {
        reset(data ? { name: data.name, eventTitle: data.eventTitle } : { name: '', eventTitle: '' });
        setModalState({ isOpen: true, data });
    };

    const closeModal = () => setModalState({ isOpen: false, data: null });

    const onSubmit = async (data) => {
        try {
            if (modalState.data) {
                await updateDomain(modalState.data._id, data);
                showSuccess('Domain updated successfully.');
            } else {
                await createDomain(data);
                showSuccess('Domain created successfully.');
            }
            onUpdate();
            closeModal();
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to save domain.');
        }
    };
    
    const handleDelete = async () => {
        try {
            await deleteDomain(deleteDialog.id);
            showSuccess('Domain deleted successfully.');
            onUpdate();
            setDeleteDialog({ isOpen: false, id: null });
        } catch (error) {
            showError('Failed to delete domain.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">Manage the technical domains used across the platform.</p>
                <LocalButton icon={FiPlus} onClick={() => openModal()}>Add Domain</LocalButton>
            </div>
            
            <div className="bg-white border rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {domains.map((domain) => (
                        <li key={domain._id} className="p-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-800">{domain.name}</span>
                                {domain.eventTitle && (
                                    <span className="text-sm text-gray-500">{domain.eventTitle}</span>
                                )}
                            </div>
                            <div className="flex items-center space-x-1">
                                <LocalButton variant="ghost" onClick={() => openModal(domain)}><FiEdit/></LocalButton>
                                <LocalButton variant="ghost" onClick={() => setDeleteDialog({ isOpen: true, id: domain._id })}><FiTrash2 className="text-red-500"/></LocalButton>
                            </div>
                        </li>
                    ))}
                    {domains.length === 0 && (
                        <li className="p-8 text-center text-gray-500">
                            No domains have been added yet.
                        </li>
                    )}
                </ul>
            </div>
            
            <LocalModal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.data ? 'Edit Domain' : 'Add New Domain'}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <LocalInput
                            label="Domain Name"
                            name="name"
                            {...register('name', { required: 'Domain name is required.' })}
                            error={errors.name?.message}
                        />
                        <LocalInput
                            label="Domain Event Title"
                            name="eventTitle"
                            {...register('eventTitle')}
                            error={errors.eventTitle?.message}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <LocalButton variant="outline" type="button" onClick={closeModal}>Cancel</LocalButton>
                        <LocalButton type="submit" isLoading={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</LocalButton>
                    </div>
                </form>
            </LocalModal>
            
            <LocalConfirmDialog 
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="Delete Domain"
                message="Are you sure? This will also delete any evaluation sheet associated with this domain. This action cannot be undone."
            />
        </div>
    );
};

export default DomainsTab;
