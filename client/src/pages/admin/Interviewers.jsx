// client/src/pages/admin/Interviewers.jsx
import React, { useEffect, useState, useMemo, useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiFilter, FiSearch, FiRefreshCw, FiEdit, FiTrash2, FiPlus, FiDownload, FiMoreVertical } from 'react-icons/fi';
import Card from '../../components/common/Card';
import { Menu, Transition } from '@headlessui/react';
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

const Interviewers = () => {
    const { showSuccess, showError } = useAlert();
    const [loading, setLoading] = useState(true);
    const [interviewers, setInterviewers] = useState([]);
    function classNames(...classes) {
        return classes.filter(Boolean).join(' ');
    }

    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
    const [sortConfig, setSortConfig] = useState({ key: 'onboardingDate', direction: 'desc' });
    const [filters, setFilters] = useState({ search: '', status: '', domain: '', paymentTier: '' });
    
    // State for editable amount cells and status dropdowns
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
    }, [filters, sortConfig, showError]);
    
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

        // Only save if the value has actually changed.
        if (originalInterviewer && (originalInterviewer.paymentAmount || '') !== newValue) {
            setUpdatingId(interviewerId);
            try {
                await updateInterviewer(interviewerId, { paymentAmount: newValue });
                showSuccess('Amount updated successfully!');
                
                // Optimistically update the main interviewers state to reflect the change immediately
                setInterviewers(prev => prev.map(i => 
                    i._id === interviewerId ? { ...i, paymentAmount: newValue } : i
                ));

            } catch (err) {
                showError('Failed to update amount.');
                // On error, revert the input to its original value
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
            // Optimistically update the UI without a full refetch
            setInterviewers(prev => 
                prev.map(i => i._id === interviewerId ? { ...i, status: newStatus } : i)
            );
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
        { key: 'user.firstName', title: 'Name', sortable: true, render: (row) => `${row.user.firstName || ''} ${row.user.lastName || ''}` },
        { key: 'user.email', title: 'Email', sortable: true, render: (row) => row.user.email || '' },
        { key: 'primaryDomain', title: 'Domain', sortable: true, render: (row) => <Badge variant="primary">{row.primaryDomain}</Badge> },
        { 
            key: 'status', title: 'Status', sortable: true, 
            render: (row) => (
                <select
                    value={row.status}
                    onChange={(e) => handleStatusChange(row._id, e.target.value)}
                    disabled={updatingId === row._id}
                    className={`w-36 text-xs font-semibold px-2 py-1.5 border rounded-md shadow-sm focus:outline-none focus:ring-1 transition-colors cursor-pointer ${
                        row.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' :
                        row.status === 'On Probation' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200' :
                        row.status === 'Inactive' ? 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200' :
                        'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                    } focus:ring-primary-500 focus:border-primary-500`}
                    onClick={(e) => e.stopPropagation()} // Prevents other row click events from firing
                >
                    {Object.values(INTERVIEWER_STATUS).map(statusValue => (
                        <option key={statusValue} value={statusValue}>
                            {statusValue}
                        </option>
                    ))}
                </select>
            ) 
        },
        { 
            key: 'paymentAmount', title: 'Amount', sortable: false, 
            render: (row) => (
                <div className="mb-0 max-w-xs">
                    <input
                        className="py-1 px-2 text-sm w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={amountValues[row._id] ?? ''}
                        onChange={(e) => handleAmountChange(row._id, e.target.value)}
                        onBlur={() => handleAmountSave(row._id)}
                        disabled={updatingId === row._id}
                        placeholder="e.g. Tier 1 (₹500)"
                    />
                </div>
            )
        },
        { key: 'metrics.interviewsCompleted', title: 'Interviews', sortable: true, render: (row) => row.metrics?.interviewsCompleted || 0 },
        { key: 'onboardingDate', title: 'Onboarded', sortable: true, render: (row) => formatDate(row.onboardingDate) },
        {
            key: 'actions', title: 'Actions',
            render: (row) => (
                <Menu as="div" className="relative inline-block text-left">
                    <div>
                        <Menu.Button className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-transparent text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            <span className="sr-only">Open options</span>
                            <FiMoreVertical className="h-5 w-5" aria-hidden="true" />
                        </Menu.Button>
                    </div>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                                <Menu.Item>
                                    {({ active }) => (<Link to={`/admin/interviewers/${row._id}`} className={classNames(active ? 'bg-gray-100' : '', 'group flex items-center px-4 py-2 text-sm text-gray-700')}><FiUser className="mr-3 h-5 w-5 text-gray-400" />View Details</Link>)}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (<button onClick={() => setModalState({ type: 'edit', data: row })} className={classNames(active ? 'bg-gray-100' : '', 'group flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left')}><FiEdit className="mr-3 h-5 w-5 text-gray-400" />Edit Interviewer</button>)}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (<button onClick={() => setDeleteDialog({ isOpen: true, id: row._id })} className={classNames(active ? 'bg-red-50' : '', 'group flex items-center px-4 py-2 text-sm text-red-700 w-full text-left')}><FiTrash2 className="mr-3 h-5 w-5 text-red-400" />Delete Interviewer</button>)}
                                </Menu.Item>
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
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

                <Table columns={columns} data={interviewers} isLoading={loading} pagination={pagination} onPageChange={handlePageChange} sortConfig={sortConfig} onSort={handleSort} emptyMessage="No interviewers found." />
            </Card>

            {modalState.type && <InterviewerFormModal isOpen={!!modalState.type} onClose={() => setModalState({ type: null, data: null })} onSuccess={handleModalSuccess} interviewerData={modalState.data} />}
            
            <ConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({ isOpen: false, id: null })} onConfirm={handleDelete} title="Delete Interviewer" message="Are you sure you want to delete this interviewer? This will also deactivate their user account." />
        </div>
    );
};

export default Interviewers;
