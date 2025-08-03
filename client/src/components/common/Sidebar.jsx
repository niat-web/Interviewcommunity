// client/src/components/common/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiLogOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useState } from 'react';
import logoSrc from '/logo.svg'; 

const Sidebar = ({ navItems, isOpen, toggleSidebar, role }) => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 ${collapsed ? 'w-20' : 'w-64'} bg-slate-900 shadow-xl transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-6'} h-16 border-b border-slate-800`}>
            {!collapsed && (<img src={logoSrc} alt="NxtWave Logo" className="h-10 w-auto" />)}
            
            {collapsed && (
              <img src={logoSrc} alt="NxtWave Logo" className="w-9 h-9" />
            )}

            {/* Collapse toggle - hidden on mobile */}
            <button 
              onClick={toggleCollapse}
              className="hidden lg:flex items-center justify-center w-6 h-6 text-slate-400 hover:text-white transition-colors"
            >
              {collapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`relative flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  location.pathname === item.path || (item.path !== `/${role}/dashboard` && location.pathname.startsWith(item.path))
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                {!collapsed && (
                  <span className="ml-3 truncate flex-1">{item.label}</span>
                )}
                
                {/* --- START: Blinking Count Display Logic --- */}
                {item.displayCount && !collapsed && (
                  <span className="ml-auto inline-block py-0.5 px-2 text-xs font-bold rounded-full bg-red-500 text-white blinking-count">
                    {item.displayCount}
                  </span>
                )}
                {item.displayCount && collapsed && (
                  <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold blinking-count ring-2 ring-slate-900">
                    {item.displayCount > 9 ? '9+' : item.displayCount}
                  </span>
                )}
                {/* --- END: Blinking Count Display Logic --- */}

              </Link>
            ))}
          </nav>

          {/* User Profile Footer */}
          <div className={`p-4 border-t border-slate-800 ${collapsed ? 'px-2' : ''}`}>
            {!collapsed ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-semibold text-blue-600 text-sm">
                      {currentUser?.firstName?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="ml-3 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </p>
                    <p className="text-xs text-slate-400 capitalize">{currentUser?.role}</p>
                  </div>
                </div>
                <button 
                  onClick={logout} 
                  className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0 ml-2" 
                  title="Logout"
                >
                  <FiLogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="font-semibold text-blue-600 text-xs">
                    {currentUser?.firstName?.charAt(0) || 'A'}
                  </span>
                </div>
                <button 
                  onClick={logout} 
                  className="text-slate-400 hover:text-red-400 transition-colors" 
                  title="Logout"
                >
                  <FiLogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
