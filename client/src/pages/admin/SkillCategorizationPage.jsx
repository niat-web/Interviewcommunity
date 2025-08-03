// client/src/pages/admin/SkillCategorizationPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FiBriefcase, FiCheckCircle, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiUser, FiClock, FiStar, FiMail, FiPhone, FiLinkedin, FiSend } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { getSkillAssessments, processSkillCategorization } from '../../api/admin.api';
import { useAlert } from '../../hooks/useAlert';
import EmptyState from '../../components/common/EmptyState';
import { debounce } from '../../utils/helpers';
import SearchInput from '../../components/common/SearchInput';
import { formatDate } from '../../utils/formatters';
import Select from 'react-select';
import { DOMAINS } from '../../utils/constants';

// --- Reusable UI Components for this page ---

const LocalButton = ({ children, variant = 'primary', icon: Icon, ...props }) => {
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
        outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    };
    return (
        <button {...props} className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 ${variants[variant]}`}>
            {Icon && <Icon className="h-4 w-4" />}
            {children}
        </button>
    );
};

const LocalTextarea = (props) => (
    <textarea {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
);

const LocalBadge = ({ children, className }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>
);


// --- Page Content Components ---

const ApplicantHeader = ({ applicant, skillAssessment }) => (
    <div className="mb-8">
        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{applicant.fullName}</h1>
                <div className="mt-3 flex items-center flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2 hover:text-indigo-600"><FiMail className="text-gray-400"/> {applicant.email}</div>
                    <div className="flex items-center gap-2 hover:text-indigo-600"><FiPhone className="text-gray-400"/> {applicant.phoneNumber}</div>
                    <a href={applicant.linkedinProfileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 hover:underline">
                        <FiLinkedin className="text-gray-400"/> View LinkedIn Profile
                    </a>
                </div>
            </div>
            <LocalBadge className="bg-blue-100 text-blue-800">Assessment Done</LocalBadge>
        </div>
    </div>
);

const KeyMetrics = ({ skillAssessment }) => (
    <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600"><FiUser size={20}/></div>
            <div>
                <p className="text-sm font-medium text-gray-500">Current Role</p>
                <p className="text-base font-semibold text-gray-900">{skillAssessment.jobTitle} at {skillAssessment.currentEmployer}</p>
            </div>
        </div>
        <div className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600"><FiClock size={20}/></div>
            <div>
                <p className="text-sm font-medium text-gray-500">Total Experience</p>
                <p className="text-base font-semibold text-gray-900">{skillAssessment.yearsOfExperience} years</p>
            </div>
        </div>
        <div className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600"><FiStar size={20}/></div>
            <div>
                <p className="text-sm font-medium text-gray-500">Auto-Suggested Domain</p>
                <p className="text-base font-semibold text-indigo-700">{skillAssessment.autoCategorizedDomain || 'N/A'}</p>
            </div>
        </div>
    </div>
);

const TechnicalSkills = ({ skillAssessment }) => (
    <div className="mb-10">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Technical Skills</h3>
        {skillAssessment.technicalSkills && skillAssessment.technicalSkills.length > 0 ? (
          <div className="space-y-6">
            {skillAssessment.technicalSkills.map((skill, index) => (
              <div key={index} className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">{skill.technology}</h4>
                  <LocalBadge className="bg-gray-100 text-gray-700">{skill.subSkills.length} skills</LocalBadge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skill.subSkills.map((subSkill, subIndex) => (
                    <LocalBadge key={subIndex} className="bg-gray-100 text-gray-700">{subSkill}</LocalBadge>
                  ))}
                </div>
              </div>
            ))}
            {skillAssessment.otherSkills && (
              <div className="mt-6 p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-base font-semibold text-gray-600 mb-2">Other Skills Mentioned</h4>
                <p className="text-gray-700 text-sm whitespace-pre-line">{skillAssessment.otherSkills}</p>
              </div>
            )}
          </div>
        ) : <p className="text-sm text-gray-500 italic">No specific skills were listed by the applicant.</p>}
    </div>
);

const AdminActionForm = ({ applicant, skillAssessment, onCategorizeComplete }) => {
    const { showSuccess, showError } = useAlert();
    const [selectedDomains, setSelectedDomains] = useState([]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    useEffect(() => {
      const initialDomains = (skillAssessment?.domains && skillAssessment.domains.length > 0) ? skillAssessment.domains : (skillAssessment?.autoCategorizedDomain ? [skillAssessment.autoCategorizedDomain] : []);
      setSelectedDomains(DOMAINS.filter(d => initialDomains.includes(d.value)));
      setNotes(skillAssessment?.additionalNotes || '');
    }, [skillAssessment]);
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDomains || selectedDomains.length === 0) {
            return showError('Please select at least one domain.');
        }
        setIsSubmitting(true);
        try {
            const domainValues = selectedDomains.map(d => d.value);
            await processSkillCategorization(skillAssessment._id, { domains: domainValues, notes });
            showSuccess('Assessment categorized successfully!');
            onCategorizeComplete?.();
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to categorize assessment.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl border-2 border-indigo-200 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-full text-indigo-600"><FiCheckCircle size={22} /></div>
                <h3 className="text-xl font-bold text-gray-800">Admin Review & Action</h3>
            </div>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Final Domain(s) *</label>
                    <Select isMulti name="domains" options={DOMAINS} className="basic-multi-select" classNamePrefix="select" value={selectedDomains} onChange={setSelectedDomains} placeholder="Select one or more domains..." aria-label="Assign Final Domains" styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), menu: base => ({...base, fontSize: '0.875rem'}) }} menuPosition="fixed" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Internal Review Notes (Optional)</label>
                    <LocalTextarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add internal notes about this decision..." rows={4}/>
                </div>
            </div>
            <div className="mt-8 flex justify-end">
                <LocalButton type="submit" isLoading={isSubmitting} icon={FiSend} disabled={isSubmitting || selectedDomains.length === 0}>
                    {isSubmitting ? 'Processing...' : 'Confirm & Send Guidelines'}
                </LocalButton>
            </div>
        </form>
    );
};


// --- MAIN PAGE COMPONENT ---
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
        if (!shouldPreserveSelection) setSelectedAssessment(null);
        try {
            const response = await getSkillAssessments({ page, limit: 15, status: statusFilter, search: searchTerm, sortBy: 'createdAt', sortOrder: 'asc' });
            const data = response.data.data;
            setAssessments(data.assessments || []);
            setPagination({ currentPage: data.page, totalPages: data.totalPages, totalItems: data.totalDocs });
            if (!shouldPreserveSelection && (data.assessments || []).length > 0) setSelectedAssessment(data.assessments[0]);
        } catch (error) { showError('Failed to fetch assessments for review.'); }
        finally { setLoading(false); }
    }, [showError, statusFilter, searchTerm]);

    useEffect(() => { const handler = debounce(() => fetchAssessments(1), 300); handler(); return () => handler.cancel(); }, [fetchAssessments]);

    const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= pagination.totalPages) fetchAssessments(newPage); };
    const handleSelectAssessment = (assessment) => { setSelectedAssessment(assessment); if (window.innerWidth < 1024) setSidebarCollapsed(true); };
    const handleCategorizeComplete = () => {
        const currentIndex = assessments.findIndex(a => a._id === selectedAssessment._id);
        const remaining = assessments.filter(a => a._id !== selectedAssessment._id);
        setAssessments(remaining);
        if (remaining.length > 0) { setSelectedAssessment(remaining[Math.min(currentIndex, remaining.length - 1)]); }
        else {
            if (pagination.currentPage < pagination.totalPages) fetchAssessments(pagination.currentPage);
            else if (pagination.currentPage > 1) fetchAssessments(pagination.currentPage - 1);
            else setSelectedAssessment(null);
        }
    };
    const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

    return (
        <div className="flex h-full bg-slate-50">
            <aside className={`transition-all duration-300 ease-in-out flex flex-col bg-white border-r border-gray-200 ${sidebarCollapsed ? 'w-0 opacity-0 -translate-x-full' : 'w-full lg:w-[380px] opacity-100 translate-x-0'}`}>
                <div className="p-4 border-b border-gray-200 space-y-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800">Review Queue</h2>
                        <span className="text-sm font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">{pagination.totalItems} Pending</span>
                    </div>
                    <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} placeholder="Search applicant..." />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading && assessments.length === 0 && <div className="p-6 flex justify-center"><Loader text="Loading queue..." /></div>}
                    {!loading && assessments.length === 0 && ( <div className="p-10 text-center"><FiCheckCircle className="mx-auto h-12 w-12 text-green-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">All Clear!</h3><p className="mt-1 text-sm text-gray-500">The review queue is empty.</p></div>)}
                    {!loading && assessments.map((assessment) => (
                        <button key={assessment._id} onClick={() => handleSelectAssessment(assessment)} className={`w-full text-left p-4 border-b border-gray-100 hover:bg-indigo-50/50 focus:outline-none transition-colors duration-200 relative ${selectedAssessment?._id === assessment._id ? 'bg-indigo-50' : ''}`}>
                            {selectedAssessment?._id === assessment._id && <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500 rounded-r-full"></div>}
                            <div className="flex justify-between items-start"><p className="font-semibold truncate text-gray-800 text-base">{assessment.applicant.fullName}</p><span className="text-xs text-gray-400 font-medium flex-shrink-0 ml-2">{formatDate(assessment.createdAt)}</span></div>
                            <div className="flex justify-between items-center text-sm text-gray-500 mt-2"><LocalBadge className="bg-indigo-100 text-indigo-700">{assessment.autoCategorizedDomain || 'N/A'}</LocalBadge><span>Exp: {assessment.yearsOfExperience} yrs</span></div>
                        </button>
                    ))}
                </div>
                
                {pagination.totalPages > 1 && (
                    <div className="p-2 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
                        <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"><FiChevronLeft className="h-5 w-5 text-gray-600"/></button>
                        <p className="text-xs text-gray-600 font-medium">Page {pagination.currentPage} of {pagination.totalPages}</p>
                        <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"><FiChevronRight className="h-5 w-5 text-gray-600"/></button>
                    </div>
                )}
            </aside>

            <div className="flex-1 relative bg-slate-50/70">
                <button onClick={toggleSidebar} className="absolute top-4 left-0 -translate-x-1/2 z-10 bg-white shadow-md rounded-full p-2 border border-gray-200 hover:bg-gray-100 transition-all" aria-label={sidebarCollapsed ? "Show queue" : "Hide queue"}>
                    {sidebarCollapsed ? <FiChevronsRight className="h-5 w-5 text-gray-700" /> : <FiChevronsLeft className="h-5 w-5 text-gray-700" />}
                </button>
                <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
                    {loading && !selectedAssessment && <div className="flex items-center justify-center h-full"><Loader text="Loading Assessment..."/></div>}
                    {!loading && selectedAssessment ? (
                        <div key={selectedAssessment._id} className="animate-fade-in">
                            <ApplicantHeader applicant={selectedAssessment.applicant} skillAssessment={selectedAssessment} />
                            <KeyMetrics skillAssessment={selectedAssessment} />
                            <TechnicalSkills skillAssessment={selectedAssessment} />
                            <AdminActionForm applicant={selectedAssessment.applicant} skillAssessment={selectedAssessment} onCategorizeComplete={handleCategorizeComplete} />
                        </div>
                    ) : (!loading && assessments.length > 0 && <div className="flex items-center justify-center h-full"><EmptyState icon={<FiBriefcase className="h-16 w-16" />} title="Select an Assessment" description="Click on an applicant from the list to review their skills." /></div>)}
                </div>
            </div>
        </div>
    );
};

export default SkillCategorizationPage;
