import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import { FiHome, FiUsers, FiLinkedin, FiBriefcase, FiFileText, FiUserCheck, FiMenu, FiShield, FiCalendar, FiClock, FiGrid, FiBookOpen } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const location = useLocation();
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <FiHome className="w-5 h-5" /> },
    { label: 'Applicants', path: '/admin/applicants', icon: <FiUsers className="w-5 h-5" /> },
    { label: 'Main Sheet', path: '/admin/main-sheet', icon: <FiGrid className="w-5 h-5" /> }, 
    { label: 'LinkedIn Review', path: '/admin/linkedin-review', icon: <FiLinkedin className="w-5 h-5" /> },
    { label: 'Skills Review', path: '/admin/skill-categorization', icon: <FiBriefcase className="w-5 h-5" /> },
    { label: 'Guidelines Review', path: '/admin/guidelines', icon: <FiFileText className="w-5 h-5" /> },
    { label: 'Interviewers', path: '/admin/interviewers', icon: <FiUserCheck className="w-5 h-5" /> },
    { label: 'User Management', path: '/admin/user-management', icon: <FiShield className="w-5 h-5" /> },
    { label: 'Interviewer Bookings', path: '/admin/interview-bookings', icon: <FiCalendar className="w-5 h-5" /> },
    { label: 'Booking Slots', path: '/admin/booking-slots', icon: <FiClock className="w-5 h-5" /> },
    { label: 'Student Bookings', path: '/admin/student-bookings', icon: <FiBookOpen className="w-5 h-5" /> },
  ];

  const getPageTitle = () => {
    const currentNav = adminNavItems.find(item => 
      location.pathname === item.path || 
      (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path))
    );
    return currentNav?.label || 'Admin Panel';
  };

  // --- MODIFICATION ---
  // Added '/admin/interviewers' to this list. Now, this page will also have the full-page layout without a top bar.
  const fullPageLayoutPaths = [
      '/admin/main-sheet',
      '/admin/user-management',
      '/admin/interview-bookings',
      '/admin/booking-slots',
      '/admin/student-bookings',
      '/admin/skill-categorization',
      '/admin/interviewers' // ADD THIS LINE
  ];
  
  const useFullPageLayout = fullPageLayoutPaths.some(path => location.pathname.startsWith(path));

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        navItems={adminNavItems} 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        role="admin"
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        { !useFullPageLayout && (
          <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                  <FiMenu className="h-6 w-6" />
                </button>
                
                <div className="ml-4 lg:ml-0">
                  <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="font-semibold text-blue-600 text-sm">
                      {currentUser?.firstName?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className="text-sm font-medium text-gray-700">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* --- MODIFICATION --- 
            Now when on '/admin/interviewers', the layout will apply padding directly to the main container
            instead of a nested div, which is better for a full-page component.
        */}
        <main className={`flex-1 overflow-y-auto bg-gray-50 ${useFullPageLayout ? 'p-4 sm:p-6' : ''}`}>
            {useFullPageLayout ? (
                <Outlet />
            ) : (
                <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8">
                    <Outlet />
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
