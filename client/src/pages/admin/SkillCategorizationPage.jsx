// client/src/pages/admin/SkillCategorizationPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FiBriefcase, FiFilter, FiCheckCircle, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import SkillCategorization from '../../components/admin/SkillCategorization';
import { getSkillAssessments } from '../../api/admin.api';
import { useAlert } from '../../hooks/useAlert';
import EmptyState from '../../components/common/EmptyState';
import { debounce } from '../../utils/helpers';
import SearchInput from '../../components/common/SearchInput';
import { formatDate } from '../../utils/formatters';
import Badge from '../../components/common/Badge';

const SkillCategorizationPage = () => {
    const [loading, setLoading] = useState(true);
    const [assessments, setAssessments] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
    const { showError } = useAlert();
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter] = useState('Pending'); 
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const fetchAssessments = useCallback(async (page = 1, shouldPreserveSelection = false) => {
        setLoading(true);
        if (!shouldPreserveSelection) {
            setSelectedAssessment(null);
        }
        try {
            const response = await getSkillAssessments({
                page,
                limit: 15,
                status: statusFilter,
                search: searchTerm,
                sortBy: 'createdAt',
                sortOrder: 'asc'
            });
            const data = response.data.data;
            setAssessments(data.assessments || []);
            setPagination({
                currentPage: data.page,
                totalPages: data.totalPages,
                totalItems: data.totalDocs,
            });
            if (!shouldPreserveSelection && (data.assessments || []).length > 0) {
                setSelectedAssessment(data.assessments[0]);
            }
        } catch (error) {
            showError('Failed to fetch assessments for review.');
            console.error('Error fetching assessments:', error);
        } finally {
            setLoading(false);
        }
    }, [showError, statusFilter, searchTerm]);

    useEffect(() => {
        const handler = debounce(() => fetchAssessments(1), 300);
        handler();
        return () => handler.cancel();
    }, [fetchAssessments]);

    const handlePageChange = (newPage) => {
        if(newPage >= 1 && newPage <= pagination.totalPages){
            fetchAssessments(newPage);
        }
    };

    const handleSelectAssessment = (assessment) => {
        setSelectedAssessment(assessment);
        if (window.innerWidth < 1024) {
            setSidebarCollapsed(true);
        }
    };

    const handleCategorizeComplete = () => {
        const currentIndex = assessments.findIndex(a => a._id === selectedAssessment._id);
        const remainingAssessments = assessments.filter(a => a._id !== selectedAssessment._id);
        setAssessments(remainingAssessments);
        if (remainingAssessments.length > 0) {
            const nextIndex = Math.min(currentIndex, remainingAssessments.length - 1);
            setSelectedAssessment(remainingAssessments[nextIndex]);
        } else {
            if(pagination.currentPage < pagination.totalPages) {
                fetchAssessments(pagination.currentPage);
            } else if (pagination.currentPage > 1) {
                 fetchAssessments(pagination.currentPage - 1);
            } else {
                 setSelectedAssessment(null);
            }
        }
    };
    
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="flex h-full bg-slate-50">
            {/* Left Sidebar: Review Queue */}
            <aside className={`transition-all duration-300 ease-in-out flex flex-col bg-white border-r border-gray-200 ${
                sidebarCollapsed ? 'w-0 opacity-0 -translate-x-full' : 'w-full lg:w-[380px] opacity-100 translate-x-0'
            }`}>
                {/* Header of the sidebar with padding and borders */}
                <div className="p-4 border-b border-gray-200 space-y-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800">Review Queue</h2>
                        <span className="text-sm font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">{pagination.totalItems} Pending</span>
                    </div>
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClear={() => setSearchTerm('')}
                        placeholder="Search applicant..."
                    />
                </div>

                {/* List container with custom scrollbar for aesthetics */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading && assessments.length === 0 && <div className="p-6 flex justify-center"><Loader text="Loading queue..." /></div>}
                    {!loading && assessments.length === 0 && (
                        <div className="p-10 text-center">
                            <FiCheckCircle className="mx-auto h-12 w-12 text-green-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">All Clear!</h3>
                            <p className="mt-1 text-sm text-gray-500">The review queue is empty.</p>
                        </div>
                    )}
                    {!loading && assessments.map((assessment) => (
                        <button
                            key={assessment._id}
                            onClick={() => handleSelectAssessment(assessment)}
                            className={`w-full text-left p-4 border-b border-gray-100 hover:bg-indigo-50/50 focus:outline-none focus:bg-indigo-50/80 transition-colors duration-200 relative ${
                                selectedAssessment?._id === assessment._id ? 'bg-indigo-50' : ''
                            }`}
                        >
                            {/* Blue indicator for the selected item */}
                            {selectedAssessment?._id === assessment._id && <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500 rounded-r-full"></div>}
                            <div className="flex justify-between items-start">
                                <p className="font-semibold truncate text-gray-800 text-base">{assessment.applicant.fullName}</p>
                                <span className="text-xs text-gray-400 font-medium flex-shrink-0 ml-2">{formatDate(assessment.createdAt)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                                <Badge variant="primary" size="sm">{assessment.autoCategorizedDomain || 'N/A'}</Badge>
                                <span>Exp: {assessment.yearsOfExperience} yrs</span>
                            </div>
                        </button>
                    ))}
                </div>
                
                {/* Improved pagination footer for a cleaner look */}
                {pagination.totalPages > 1 && (
                    <div className="p-2 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
                        <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <FiChevronLeft className="h-5 w-5 text-gray-600"/>
                        </button>
                        <p className="text-xs text-gray-600 font-medium">Page {pagination.currentPage} of {pagination.totalPages}</p>
                        <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <FiChevronRight className="h-5 w-5 text-gray-600"/>
                        </button>
                    </div>
                )}
            </aside>

            {/* Right Panel: Details View */}
            <div className="flex-1 relative bg-slate-50/70">
                {/* Toggle button with better positioning and intuitive icons */}
                <button 
                    onClick={toggleSidebar}
                    className="absolute top-4 left-0 -translate-x-1/2 z-10 bg-white shadow-md rounded-full p-2 border border-gray-200 hover:bg-gray-100 transition-all"
                    aria-label={sidebarCollapsed ? "Show queue" : "Hide queue"}
                >
                    {sidebarCollapsed ? <FiChevronsRight className="h-5 w-5 text-gray-700" /> : <FiChevronsLeft className="h-5 w-5 text-gray-700" />}
                </button>
                <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
                    {loading && !selectedAssessment && <div className="flex items-center justify-center h-full"><Loader text="Loading Assessment..."/></div>}
                    {!loading && selectedAssessment ? (
                        <SkillCategorization
                            key={selectedAssessment._id}
                            applicant={selectedAssessment.applicant}
                            skillAssessment={selectedAssessment}
                            onCategorizeComplete={handleCategorizeComplete}
                        />
                    ) : (
                         !loading && assessments.length > 0 &&
                        <div className="flex items-center justify-center h-full">
                             <EmptyState
                                icon={<FiBriefcase className="h-16 w-16" />}
                                title="Select an Assessment"
                                description="Click on an applicant from the list to review their skills and assign a domain."
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SkillCategorizationPage;
