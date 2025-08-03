// client/src/pages/admin/Dashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCheckSquare, FiUserCheck, FiDollarSign, FiChevronRight } from 'react-icons/fi';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Loader from '../../components/common/Loader';
import StatusBadge from '../../components/common/StatusBadge';
import { getApplicants, getDashboardStats } from '../../api/admin.api';
import { formatDate, formatCurrency } from '../../utils/formatters';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';


// *** FIX: A more compact Stat Card component for a user-friendly, reduced-height appearance ***
const StatCard = ({ title, value, icon, linkTo, color = 'text-primary-600' }) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full flex flex-col">
        {/* Header section with title and icon */}
        <div className={`p-2 border-b border-gray-200 flex justify-between items-center bg-gray-50/50`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${color}`}>{title}</h3>
            <div className={`${color}`}>
                {React.cloneElement(icon, { size: 16 })}
            </div>
        </div>
        
        {/* Body section with stat value and link */}
        <div className="p-3 flex-grow flex flex-row items-end justify-between">
            <p className="text-3xl font-bold text-gray-800 leading-none">{value}</p>
            <Link to={linkTo} className="text-xs font-medium text-gray-400 hover:text-primary-600 flex items-center group">
                Details
                <FiChevronRight className="ml-0.5 h-3 w-3" />
            </Link>
        </div>
    </div>
);


const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [recentApplicants, setRecentApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const [statsRes, applicantsRes] = await Promise.all([
          getDashboardStats(),
          getApplicants({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
        ]);
        
        setStats(statsRes.data.data);
        setRecentApplicants(applicantsRes.data.data.applicants || []);

      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
        setRecentApplicants([]);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);
  
  const applicantColumns = useMemo(() => [
    { 
        key: 'name', title: 'Applicant Name', 
        render: (row) => (
            <Link to={`/admin/applicants/${row._id}`} className="font-medium text-gray-800 hover:text-primary-600 hover:underline">
                {row.fullName}
            </Link>
        )
    },
    { 
        key: 'email', title: 'Email', 
        render: (row) => <div className="text-gray-500">{row.email}</div> 
    },
    { 
        key: 'status', title: 'Status', 
        render: (row) => <StatusBadge status={row.status} /> 
    },
    { 
        key: 'applied', title: 'Applied On', 
        render: (row) => <div className="text-gray-500">{formatDate(row.createdAt)}</div> 
    }
  ], []);

  if (loading) return <div className="flex w-full h-full items-center justify-center py-20"><Loader text="Loading Dashboard..." /></div>;

  return (
    <div className="space-y-8">

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
      
      {/* Redesigned Stats Grid using the new, more compact StatCard component */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Applicants" value={stats.totalApplicants || 0} icon={<FiUsers />} linkTo="/admin/applicants" color="text-blue-600" />
        <StatCard title="Pending Reviews" value={stats.pendingReviews || 0} icon={<FiCheckSquare />} linkTo="/admin/linkedin-review" color="text-orange-600" />
        <StatCard title="Active Interviewers" value={stats.activeInterviewers || 0} icon={<FiUserCheck />} linkTo="/admin/interviewers" color="text-green-600" />
        <StatCard title="Total Earnings" value={formatCurrency(stats.totalPlatformEarnings || 0)} icon={<FiDollarSign />} linkTo="/admin/earnings-report" color="text-slate-600" />
      </div>

      {/* Recent Applicants Table */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <div className="p-4 bg-gray-50/75 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Recent Applicants</h2>
              <Button variant="outline" to="/admin/applicants" className="!text-sm">
                  View All Applicants
              </Button>
          </div>
          <div className="overflow-x-auto">
            <Table 
                columns={applicantColumns} 
                data={recentApplicants} 
                isLoading={loading} 
                emptyMessage="No recent applicants."
            />
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
