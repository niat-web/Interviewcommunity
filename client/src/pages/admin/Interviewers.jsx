// client/src/pages/admin/Interviewers.jsx
import React, { useEffect, useState, useMemo, useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiFilter, FiSearch, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import SearchInput from '../../components/common/SearchInput';
import FilterDropdown from '../../components/common/FilterDropdown';
import Badge from '../../components/common/Badge';
import { getInterviewers, deleteInterviewer, updateInterviewer } from '../../api/admin.api';
import { formatDate } from '../../utils/formatters';
import { INTERVIEWER_STATUS, DOMAINS, PAYMENT_TIERS } from '../../utils/constants';
import { debounce } from '../../utils/helpers';
import { useAlert } from '../../hooks/useAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import InterviewerFormModal from './InterviewerFormModal';
// *** FIX: Import the shared DropdownMenu component ***
import DropdownMenu from '../../components/common/DropdownMenu';


const Interviewers = () => {
    const { showSuccess, showError } = useAlert();
    const [loading, setLoading] = useState(true);
    const [interviewers, setInterviewers] = useState([]);
    
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
    const [sortConfig, setSortConfig] = useState({ key: 'onboardingDate', direction: 'desc' });
    const [filters, setFilters] = useState({ search: '', status: '', domain: '', paymentTier: '' });
    
    const [amountValues, setAmountValues] = useState({});
    const [updatingId, setUpdatingId] = useState(null);

    const [modalState, setModalState] = useState({ type: null, data: null });
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });

    const fetchInterviewers = useCallback(async (pageToFetch = pagination.currentPage, preserveAmounts = false) => {
        setLoading(true);
        try {
            const params = {
                page: pageToFetch, limit: 10,
                search: filters.search, status: filters.status, domain: filters.domain, paymentTier: filters.paymentTier,
                sortBy: sortConfig.key, sortOrder: sortConfig.direction,
            };
            const response = await getInterviewers(params);
            const resData = response.data.data;
            setInterviewers(resData.interviewers || []);
            setPagination({
                currentPage: resData.page,
                totalPages: resData.totalPages,
                totalItems: resData.totalDocs,
            });
            if (!preserveAmounts) {
                const initialAmounts = (resData.interviewers || []).reduce((acc, curr) => {
                    acc[curr._id] = curr.paymentAmount || '';
                    return acc;
                }, {});
                setAmountValues(initialAmounts);
            }
        } catch (error) {
            showError('Error fetching interviewers:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, sortConfig, showError, pagination.currentPage]);
    
    const debouncedFetch = useMemo(() => debounce((page) => fetchInterviewers(page), 300), [fetchInterviewers]);

    useEffect(() => {
        debouncedFetch(1);
        setPagination(p => ({ ...p, currentPage: 1 }));
        return () => debouncedFetch.cancel();
    }, [filters, sortConfig, debouncedFetch]);

    const handleAmountChange = (interviewerId, value) => {
        setAmountValues(prev => ({ ...prev, [interviewerId]: value }));
    };

    const handleAmountSave = async (interviewerId) => {
        const originalInterviewer = interviewers.find(i => i._id === interviewerId);
        const newValue = amountValues[interviewerId];

        if (originalInterviewer && (originalInterviewer.paymentAmount || '') !== newValue) {
            setUpdatingId(interviewerId);
            try {
                await updateInterviewer(interviewerId, { paymentAmount: newValue });
                showSuccess('Amount updated successfully!');
                setInterviewers(prev => prev.map(i => i._id === interviewerId ? { ...i, paymentAmount: newValue } : i));
            } catch (err) {
                showError('Failed to update amount.');
                setAmountValues(prev => ({...prev, [interviewerId]: originalInterviewer.paymentAmount || ''}));
            } finally {
                setUpdatingId(null);
            }
        }
    };
    
    const handleStatusChange = useCallback(async (interviewerId, newStatus) => {
        setUpdatingId(interviewerId);
        try {
            await updateInterviewer(interviewerId, { status: newStatus });
            showSuccess('Status updated successfully!');
            setInterviewers(prev => prev.map(i => i._id === interviewerId ? { ...i, status: newStatus } : i));
        } catch(err) {
            showError('Failed to update status.');
        } finally {
            setUpdatingId(null);
        }
    }, [showError, showSuccess]);


    const handleFilterChange = (key, value) => {
        setPagination(p => ({ ...p, currentPage: 1 }));
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSort = (key) => {
        setPagination(p => ({ ...p, currentPage: 1 }));
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
        fetchInterviewers(page, true);
    };
    
    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        try {
            await deleteInterviewer(deleteDialog.id);
            showSuccess('Interviewer deleted successfully');
            setDeleteDialog({ isOpen: false, id: null });
            fetchInterviewers(pagination.currentPage);
        } catch(err) {
            showError("Failed to delete interviewer.");
        }
    };
    
    const handleModalSuccess = () => {
        setModalState({ type: null, data: null });
        fetchInterviewers(pagination.currentPage);
    };

    const columns = useMemo(() => [
        { key: 'interviewerId', title: 'Interviewer ID', sortable: true, minWidth: '280px', render: (row) => (<div className="font-mono text-xs text-gray-500" title={row.interviewerId}>{row.interviewerId}</div>)},
        { key: 'user.firstName', title: 'Name', sortable: true, minWidth: '180px', render: (row) => `${row.user.firstName || ''} ${row.user.lastName || ''}` },
        { key: 'user.email', title: 'Email', sortable: true, minWidth: '220px', render: (row) => row.user.email || '' },
        { 
            key: 'domains', 
            title: 'Domain(s)', 
            minWidth: '200px',
            render: (row) => (
                <div className="flex flex-wrap gap-1">
                    {(row.domains && row.domains.length > 0) ? (
                        row.domains.map((domain, index) => (
                            <Badge key={index} variant="primary" size="sm">{domain}</Badge>
                        ))
                    ) : (<Badge variant="gray" size="sm"></Badge>)}
                </div>
            ) 
        },
        { 
            key: 'status', title: 'Status', sortable: true, minWidth: '150px', 
            render: (row) => (
                <select value={row.status} onChange={(e) => handleStatusChange(row._id, e.target.value)} disabled={updatingId === row._id}
                    className={`w-full text-xs font-semibold px-2 py-1.5 border rounded-md shadow-sm focus:outline-none focus:ring-1 transition-colors cursor-pointer ${
                        row.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' : row.status === 'On Probation' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200' : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {Object.values(INTERVIEWER_STATUS).map(statusValue => (<option key={statusValue} value={statusValue}>{statusValue}</option>))}
                </select>
            ) 
        },
        // --- MODIFICATION START ---
        { key: 'paymentAmount', title: 'Amount', minWidth: '120px', render: (row) => (<input className="py-1 px-2 text-sm w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={amountValues[row._id] ?? ''} onChange={(e) => handleAmountChange(row._id, e.target.value)} onBlur={() => handleAmountSave(row._id)} disabled={updatingId === row._id} />)},
        { key: 'metrics.interviewsCompleted', title: 'Interviews', sortable: true, minWidth: '110px', render: (row) => row.metrics?.interviewsCompleted || 0 },
        { key: 'onboardingDate', title: 'Onboarded', sortable: true, minWidth: '120px', render: (row) => formatDate(row.onboardingDate) },
        { key: 'user.phoneNumber', title: 'Phone', minWidth: '150px', render: (row) => row.user.phoneNumber || '' },
        { key: 'user.whatsappNumber', title: 'WhatsApp', minWidth: '150px', render: (row) => row.user.whatsappNumber || '' },
        { key: 'currentEmployer', title: 'Employer', minWidth: '180px', render: (row) => row.currentEmployer || '' },
        { key: 'jobTitle', title: 'Job Title', minWidth: '180px', render: (row) => row.jobTitle || '' },
        { key: 'yearsOfExperience', title: 'Experience', minWidth: '120px', render: (row) => `${row.yearsOfExperience || 0} yrs`, sortable: true },
        { key: 'companyType', title: 'Company Type', minWidth: '150px', render: (row) => row.companyType || '', sortable: true },
        { key: 'bankDetails.accountName', title: 'Account Name', minWidth: '180px', render: (row) => row.bankDetails?.accountName || '' },
        // --- MODIFICATION END ---
        { key: 'bankDetails.bankName', title: 'Bank Name', minWidth: '180px', render: (row) => row.bankDetails?.bankName || '' },
        { key: 'bankDetails.accountNumber', title: 'Account Number', minWidth: '160px', render: (row) => row.bankDetails?.accountNumber || '' },
        { key: 'bankDetails.ifscCode', title: 'IFSC Code', minWidth: '120px', render: (row) => row.bankDetails?.ifscCode || '' },
        {
            key: 'actions', title: 'Actions', minWidth: '100px',
            render: (row) => (
                <DropdownMenu options={[
                    { label: 'Edit', icon: FiEdit, onClick: () => setModalState({ type: 'edit', data: row }) },
                    { label: 'Delete', icon: FiTrash2, isDestructive: true, onClick: () => setDeleteDialog({ isOpen: true, id: row._id }) }
                ]} />
            )
        }
    ], [setModalState, setDeleteDialog, amountValues, updatingId, handleStatusChange]);
  
    return (
        <div className="space-y-6">
            <Card>
                <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <SearchInput value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} onClear={() => handleFilterChange('search', '')} placeholder="Search interviewers..." className="w-full md:w-72" />
                    <div className="flex items-center gap-4 flex-wrap">
                        <FilterDropdown label="Status" options={[{ value: '', label: 'All Statuses' }, ...Object.values(INTERVIEWER_STATUS).map(s => ({ value: s, label: s }))]} selectedValue={filters.status} onChange={(val) => handleFilterChange('status', val)} />
                        <FilterDropdown label="Domain" options={[{ value: '', label: 'All Domains' }, ...DOMAINS.map(d => ({ value: d.value, label: d.label }))]} selectedValue={filters.domain} onChange={(val) => handleFilterChange('domain', val)} />
                        <Button variant="primary" icon={<FiPlus size={20} />} onClick={() => setModalState({ type: 'add', data: null })}>Add</Button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <Table columns={columns} data={interviewers} isLoading={loading} pagination={pagination} onPageChange={handlePageChange} sortConfig={sortConfig} onSort={handleSort} emptyMessage="No interviewers found." />
                </div>
            </Card>

            {modalState.type && <InterviewerFormModal isOpen={!!modalState.type} onClose={() => setModalState({ type: null, data: null })} onSuccess={handleModalSuccess} interviewerData={modalState.data} />}
            
            <ConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({ isOpen: false, id: null })} onConfirm={handleDelete} title="Delete Interviewer" message="Are you sure you want to delete this interviewer? This will also deactivate their user account." />
        </div>
    );
};

export default Interviewers;
