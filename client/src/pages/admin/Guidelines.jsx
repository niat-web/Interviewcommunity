// client/src/pages/admin/Guidelines.jsx
import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiSearch, FiRefreshCw, FiCheck, FiX, FiCheckCircle, FiXCircle, FiMoreVertical } from 'react-icons/fi';
import Card from '../../components/common/Card';
import { Menu, Transition } from '@headlessui/react';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import SearchInput from '../../components/common/SearchInput';
import FilterDropdown from '../../components/common/FilterDropdown';
import Badge from '../../components/common/Badge';
import { getGuidelinesSubmissions, reviewGuidelinesSubmission } from '../../api/admin.api';
import { formatDate } from '../../utils/formatters';
import { DOMAINS, APPLICATION_STATUS } from '../../utils/constants';
import { debounce } from '../../utils/helpers';
import { useAlert } from '../../hooks/useAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal'; // Import the Modal component

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

const Guidelines = () => {
    const [loading, setLoading] = useState(true);
    const [guidelinesData, setGuidelinesData] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // 'passed' or 'failed'
    const [domainFilter, setDomainFilter] = useState('');
    const { showSuccess, showError } = useAlert();
    const [confirmState, setConfirmState] = useState({ isOpen: false, id: null, action: null });
    const [processingIds, setProcessingIds] = useState(new Set());
    const [detailsModal, setDetailsModal] = useState({ isOpen: false, data: null }); // State for the details modal


    const statusOptions = useMemo(() => [
        { value: '', label: 'All Test Results' },
        { value: 'passed', label: 'Passed' },
        { value: 'failed', label: 'Failed' },
    ], []);

    const domainOptions = useMemo(() => [
        { value: '', label: 'All Domains' },
        ...DOMAINS.map(d => ({ value: d.value, label: d.label })),
    ], []);

    const fetchGuidelines = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await getGuidelinesSubmissions({
                page, limit: 10, search: searchTerm, status: statusFilter,
                domain: domainFilter, sortBy: 'createdAt', sortOrder: 'desc',
            });
            const { guidelines, ...paginationData } = response.data.data;
            setGuidelinesData(guidelines || []);
            setPagination(paginationData);
        } catch (error) {
            showError('Failed to load guidelines submissions.');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter, domainFilter, showError]);

    useEffect(() => {
        const handler = debounce(() => fetchGuidelines(1), 300);
        handler();
        return () => handler.cancel();
    }, [fetchGuidelines]);

    const handlePageChange = (page) => { fetchGuidelines(page); };

    const handleReviewDecision = async () => {
        if (!confirmState.id || !confirmState.action) return;

        setProcessingIds(prev => new Set(prev).add(confirmState.id));
        setConfirmState({ isOpen: false, id: null, action: null });

        try {
            await reviewGuidelinesSubmission(confirmState.id, { decision: confirmState.action });
            showSuccess(`Submission successfully ${confirmState.action === 'approve' ? 'approved and applicant onboarded' : 'rejected'}.`);
            fetchGuidelines(pagination.currentPage);
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to process decision.');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(confirmState.id);
                return newSet;
            });
        }
    };
    
    const openConfirmation = (id, action) => {
        setConfirmState({ isOpen: true, id, action });
    };

    const openDetailsModal = (guideline) => {
        setDetailsModal({ isOpen: true, data: guideline });
    };

    const columns = useMemo(() => [
        { key: 'applicant', title: 'Applicant', render: (row) => (
            <button onClick={() => openDetailsModal(row)} className="font-medium text-primary-600 hover:underline">
                {row.applicant.fullName}
            </button>
        )},
        { 
            key: 'domains', 
            title: 'Domain(s)', 
            render: (row) => (
                <div className="flex flex-wrap gap-1">
                    {(row.domains && row.domains.length > 0) ? (
                        row.domains.map((domain, index) => (
                            <Badge key={index} variant="primary" size="sm">{domain}</Badge>
                        ))
                    ) : (
                        <span className="text-gray-500">N/A</span>
                    )}
                </div>
            )
        },
        { key: 'score', title: 'Score', render: (row) => `${row.score}%` },
        { key: 'status', title: 'Test Result', render: (row) => (
            <Badge variant={row.passed ? 'success' : 'danger'}>
                {row.passed ? 'Passed' : 'Failed'}
            </Badge>
        )},
        { key: 'applicantStatus', title: 'Applicant Status', render: (row) => (
            <Badge variant={row.applicantStatus === APPLICATION_STATUS.GUIDELINES_REVIEWED ? 'warning' : 'info'}>
                {row.applicantStatus === APPLICATION_STATUS.GUIDELINES_REVIEWED ? 'Pending Decision' : row.applicantStatus}
            </Badge>
        )},
        { key: 'submittedAt', title: 'Submitted On', render: (row) => formatDate(row.createdAt)},
        {
            key: 'actions', title: 'Actions', render: (row) => {
                const isProcessing = processingIds.has(row._id);
                const isActionable = row.applicantStatus === APPLICATION_STATUS.GUIDELINES_REVIEWED;

                return (
                    <Menu as="div" className="relative inline-block text-left">
                        <div>
                            <Menu.Button className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-transparent text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                <span className="sr-only">Open options</span>
                                <FiMoreVertical className="h-5 w-5" aria-hidden="true" />
                            </Menu.Button>
                        </div>
                        <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                    <Menu.Item>
                                        {({ active }) => (<button onClick={() => openDetailsModal(row)} className={classNames(active ? 'bg-gray-100' : '', 'group flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left')}><FiEye className="mr-3 h-5 w-5 text-gray-400" />Scores</button>)}
                                    </Menu.Item>
                                    {isActionable && (
                                        <>
                                            <Menu.Item disabled={isProcessing}>
                                                {({ active, disabled }) => (<button onClick={() => openConfirmation(row._id, 'approve')} disabled={disabled} className={classNames(active ? 'bg-gray-100' : '', disabled ? 'opacity-50' : '', 'group flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left')}><FiCheckCircle className="mr-3 h-5 w-5 text-green-400" />Approve & Onboard</button>)}
                                            </Menu.Item>
                                            <Menu.Item disabled={isProcessing}>
                                                {({ active, disabled }) => (<button onClick={() => openConfirmation(row._id, 'reject')} disabled={disabled} className={classNames(active ? 'bg-red-50' : '', disabled ? 'opacity-50' : '', 'group flex items-center px-4 py-2 text-sm text-red-700 w-full text-left')}><FiXCircle className="mr-3 h-5 w-5 text-red-400" />Reject</button>)}
                                            </Menu.Item>
                                        </>
                                    )}
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                );
            },
        },
    ], [processingIds, openConfirmation, openDetailsModal]);

    return (
        <div className="space-y-6">
            <Card>
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 min-h-[60px]">
        <div className="w-full md:w-1/3 flex items-center">
            <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
                placeholder="Search by applicant name..."
                className="w-full"
            />
        </div>
        <div className="flex flex-wrap gap-4 items-center">
            <FilterDropdown 
                label="Test Result" 
                options={statusOptions} 
                selectedValue={statusFilter} 
                onChange={setStatusFilter} 
            />
            <FilterDropdown 
                label="Domain" 
                options={domainOptions} 
                selectedValue={domainFilter} 
                onChange={setDomainFilter} 
            />
        </div>
    </div>
    <Table
        columns={columns}
        data={guidelinesData}
        isLoading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        emptyMessage="No guidelines submissions found."
    />
</Card>

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState({ isOpen: false, id: null, action: null })}
                onConfirm={handleReviewDecision}
                title={`Confirm ${confirmState.action}`}
                message={`Are you sure you want to ${confirmState.action} this submission? This action cannot be undone.`}
                confirmText={confirmState.action === 'approve' ? 'Approve & Onboard' : 'Confirm Rejection'}
                confirmVariant={confirmState.action === 'approve' ? 'primary' : 'danger'}
                icon={confirmState.action === 'approve' ? <FiCheck className="h-6 w-6 text-green-600"/> : <FiX className="h-6 w-6 text-red-600"/>}
                isLoading={processingIds.has(confirmState.id)}
            />

            {/* Details Modal */}
            {detailsModal.isOpen && (
              <Modal
                isOpen={detailsModal.isOpen}
                onClose={() => setDetailsModal({ isOpen: false, data: null })}
                title="Guidelines Submission Details"
                size="2xl"
              >
                {detailsModal.data && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-xl font-semibold text-gray-900">{detailsModal.data.applicant.fullName}</h3>
                      <p className="text-sm text-gray-500">{detailsModal.data.applicant.email}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center p-4 bg-gray-50 rounded-lg border">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Score</p>
                        <p className="text-2xl font-bold text-gray-800">{detailsModal.data.score}%</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Result</p>
                        <Badge variant={detailsModal.data.passed ? 'success' : 'danger'} size="lg">
                          {detailsModal.data.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Time</p>
                        <p className="text-2xl font-bold text-gray-800">{detailsModal.data.completionTime}s</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Answers:</h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Selected Option</th>
                              <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Correct?</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {detailsModal.data.answers.map((answer) => (
                              <tr key={answer.questionNumber}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{answer.questionNumber}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{answer.selectedOption}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <div className="flex justify-center">
                                    {answer.isCorrect ? 
                                        <FiCheckCircle className="h-5 w-5 text-green-500" /> : 
                                        <FiXCircle className="h-5 w-5 text-red-500" />}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </Modal>
            )}
        </div>
    );
};

export default Guidelines;
