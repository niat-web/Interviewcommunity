import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import { useAlert } from '../../hooks/useAlert';
import { createInterviewer, updateInterviewer } from '../../api/admin.api';
import { DOMAINS, INTERVIEWER_STATUS, PAYMENT_TIERS } from '../../utils/constants';

const InterviewerFormModal = ({ isOpen, onClose, onSuccess, interviewerData }) => {
    const isEditMode = !!interviewerData;
    const { showSuccess, showError } = useAlert();
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting }
    } = useForm();

    const [statusOptions] = useState(Object.values(INTERVIEWER_STATUS).map(s => ({ value: s, label: s })));
    const [domainOptions] = useState(DOMAINS.map(d => ({ value: d.value, label: d.label })));
    const [tierOptions] = useState(PAYMENT_TIERS.map(t => ({ value: t.value, label: t.label })));
    // --- MODIFICATION START ---
    const [companyTypeOptions] = useState([
        {value: 'Other', label: 'Other'},
        {value: 'Product-based', label: 'Product-based'},
        {value: 'Service-based', label: 'Service-based'},
        {value: 'Startup', label: 'Startup'}
    ]);
    // --- MODIFICATION END ---


    useEffect(() => {
        if (isEditMode && interviewerData) {
            reset({
                ...interviewerData.user, // User fields
                ...interviewerData // Interviewer fields
            });
        } else {
            reset({ status: INTERVIEWER_STATUS.PROBATION, paymentTier: 'Tier 1', companyType: 'Other' });
        }
    }, [interviewerData, isEditMode, reset]);

    const onSubmit = async (data) => {
        try {
            if (isEditMode) {
                await updateInterviewer(interviewerData._id, data);
                showSuccess('Interviewer updated successfully!');
            } else {
                await createInterviewer(data);
                showSuccess('Interviewer created successfully!');
            }
            onSuccess();
        } catch (error) {
            showError(error.response?.data?.message || 'Operation failed.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Interviewer' : 'Add New Interviewer'} size="2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="First Name" {...register('firstName', { required: true })} error={errors.firstName && 'First name is required'} />
                    <Input label="Last Name" {...register('lastName', { required: true })} error={errors.lastName && 'Last name is required'} />
                    <Input label="Email" type="email" {...register('email', { required: true })} error={errors.email && 'Email is required'} />
                    <Input label="Phone Number" {...register('phoneNumber', { required: true })} error={errors.phoneNumber && 'Phone number is required'} />
                    <Input label="WhatsApp Number" {...register('whatsappNumber')} helpText="Optional, for sending WhatsApp alerts." />
                </div>
                 {!isEditMode && (
                    <Input label="Temporary Password" type="password" {...register('password', { required: 'Password is required' })} error={errors.password?.message} />
                )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Current Employer" {...register('currentEmployer', { required: true })} error={errors.currentEmployer && 'Employer is required'} />
                    <Input label="Job Title" {...register('jobTitle', { required: true })} error={errors.jobTitle && 'Job title is required'} />
                    {/* --- MODIFICATION START --- */}
                    <Input label="Years of Experience" type="number" {...register('yearsOfExperience', { required: 'Experience is required', valueAsNumber: true })} error={errors.yearsOfExperience?.message} />
                    <Select label="Company Type" {...register('companyType')} options={companyTypeOptions} />
                    {/* --- MODIFICATION END --- */}
                    <Select label="Primary Domain" {...register('primaryDomain', { required: true })} options={domainOptions} error={errors.primaryDomain && 'Domain is required'} />
                     <Select label="Status" {...register('status', { required: true })} options={statusOptions} error={errors.status && 'Status is required'} />
                     <Select label="Payment Tier" {...register('paymentTier', { required: true })} options={tierOptions} error={errors.paymentTier && 'Tier is required'} />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default InterviewerFormModal;
