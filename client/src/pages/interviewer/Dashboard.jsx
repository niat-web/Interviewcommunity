import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMetrics } from '../../api/interviewer.api';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FiCheckCircle, FiDollarSign, FiCalendar, FiArrowRight, FiInbox, FiXCircle } from 'react-icons/fi';

// --- SELF-CONTAINED UI COMPONENTS (DEFINED LOCALLY) ---

const LocalStatCard = ({ title, value, icon, link, isLoading, footerText }) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-600">{title}</p>
                <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                  {icon}
                </div>
            </div>
            {isLoading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            )}
        </div>
        {link && (
            <Link to={link} className="text-xs font-medium text-blue-600 hover:underline mt-3 flex items-center">
                {footerText}
                <FiArrowRight className="ml-1 h-3 w-3" />
            </Link>
        )}
    </div>
);

const LocalLoader = ({ text }) => (
    <div className="flex justify-center items-center py-20 text-center text-gray-500">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="ml-4">{text}</span>
    </div>
);

const LocalEmptyState = ({ message, icon: Icon }) => (
    <div className="text-center py-16 text-gray-500">
        <Icon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
        <h3 className="font-semibold text-gray-700">No Data Available</h3>
        <p className="text-sm">{message}</p>
    </div>
);

// --- MODIFICATION START: New component to display status without depending on common/StatusBadge ---
const LocalStatusBadge = ({ status }) => {
    const statusStyles = {
        'Scheduled': 'bg-yellow-100 text-yellow-800',
        'InProgress': 'bg-blue-100 text-blue-800',
        'Completed': 'bg-green-100 text-green-800',
        'Cancelled': 'bg-red-100 text-red-800'
    };
    const style = statusStyles[status] || 'bg-gray-100 text-gray-800';
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}>
            {status || 'Unknown'}
        </span>
    );
};
// --- MODIFICATION END ---

const LocalTable = ({ columns, data, isLoading, emptyMessage, emptyIcon }) => (
    <div className="w-full overflow-x-auto">
        <table className="min-w-full bg-white divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    {columns.map(col => (
                        <th key={col.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {col.title}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                    <tr><td colSpan={columns.length}><LocalLoader text="Loading data..." /></td></tr>
                ) : data.length === 0 ? (
                    <tr><td colSpan={columns.length}><LocalEmptyState message={emptyMessage} icon={emptyIcon} /></td></tr>
                ) : (
                    data.map((row, rowIndex) => (
                        <tr key={row._id || rowIndex} className="hover:bg-gray-50">
                            {columns.map(col => (
                                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

const LocalCard = ({ title, children, bodyClassName = '' }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <div className={bodyClassName}>
            {children}
        </div>
    </div>
);


// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const res = await getMetrics();
        const data = res.data.data;
        setStats({
            scheduledCount: data.scheduledCount,
            completedCount: data.completedCount,
            cancelledCount: data.cancelledCount,
            totalEarnings: data.totalEarnings,
        });
        setUpcomingInterviews(data.upcomingInterviews || []);
      } catch (error) {
        console.error("Failed to load interviewer dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const upcomingInterviewsColumns = useMemo(() => [
    { key: 'techStack', title: 'Domain Name' },
    { key: 'candidateName', title: 'Candidate Name' },
    { key: 'interviewDate', title: 'Date', render: (row) => formatDate(row.interviewDate) },
    { key: 'interviewTime', title: 'Time' },
    // --- MODIFICATION: Use the new local status component ---
    { key: 'status', title: 'Status', render: (row) => <LocalStatusBadge status={row.interviewStatus} /> },
  ], []);
  

  if (loading && !stats.scheduledCount) {
    return <LocalLoader text="Loading Dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <LocalStatCard 
            title="Interviews Scheduled" 
            value={stats.scheduledCount ?? 0}
            icon={<FiCalendar size={18} />} 
            link="/interviewer/interview-evaluation"
            footerText="View All"
            isLoading={loading} 
        />
        <LocalStatCard 
            title="Interviews Completed" 
            value={stats.completedCount ?? 0}
            icon={<FiCheckCircle size={18} />} 
            isLoading={loading} 
        />
        <LocalStatCard 
            title="Interviews Cancelled" 
            value={stats.cancelledCount ?? 0}
            icon={<FiXCircle size={18} />} 
            isLoading={loading} 
        />
        <LocalStatCard 
            title="Total Earnings" 
            value={formatCurrency(stats.totalEarnings ?? 0)} 
            icon={<FiDollarSign size={18} />} 
            link="/interviewer/payment-details"
            footerText="View payment details" 
            isLoading={loading} 
        />
      </div>

      <LocalCard title="Upcoming Interviews" bodyClassName="p-0">
          <LocalTable 
              columns={upcomingInterviewsColumns}
              data={upcomingInterviews}
              isLoading={loading}
              emptyMessage="You have no upcoming interviews scheduled."
              emptyIcon={FiInbox}
          />
      </LocalCard>
    </div>
  );
};

export default Dashboard;
