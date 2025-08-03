// client/src/layouts/InterviewerLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header'; // Imported to conditionally render
import { FiHome, FiUser, FiCalendar, FiMenu, FiClipboard, FiGrid, FiDollarSign } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications'; // NEW
import { useAlert } from '../hooks/useAlert'; // NEW

const InterviewerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const location = useLocation();
  const { showInfo } = useAlert(); // NEW: For in-app toasts
  const { askPermissionAndSubscribe } = usePushNotifications(); // NEW
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // --- NEW: Handle Push Notifications ---
  useEffect(() => {
    // Wait for a few seconds before asking for permission to not overwhelm the user
    const timer = setTimeout(() => {
        // *** FIX START ***
        // Only ask for permission if the user has not already granted or denied it.
        // The 'default' state means no choice has been made.
        if (
          currentUser?.role === 'interviewer' && 
          'Notification' in window && 
          Notification.permission === 'default'
        ) {
            askPermissionAndSubscribe();
        }
        // *** FIX END ***
    }, 5000); // 5-second delay

    // Listen for in-app notifications from the service worker
    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'IN_APP_NOTIFICATION') {
        const payload = event.data.payload;
        showInfo(`${payload.title}: ${payload.body}`);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }
    
    return () => {
        clearTimeout(timer);
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.removeEventListener('message', handleSWMessage);
        }
    };
  }, [askPermissionAndSubscribe, showInfo, currentUser]);
  
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://wati-integration-prod-service.clare.ai/v2/watiWidget.js?62685';
    const options = {
        "enabled":true,
        "chatButtonSetting":{"backgroundColor":"#00e785","ctaText":"Chat with us","borderRadius":"25","marginLeft":"0","marginRight":"20","marginBottom":"20","ctaIconWATI":false,"position":"right"},
        "brandSetting":{"brandName":"Wati","brandSubTitle":"undefined","brandImg":"https://www.wati.io/wp-content/uploads/2023/4/Wati-logo.svg","welcomeText":"Hi there!\nHow can I help you?","backgroundColor":"#00e785","ctaText":"Chat with us","borderRadius":"25","autoShow":false,"phoneNumber":"916303639014"}
    };
    script.onload = () => { if (typeof window.CreateWhatsappChatWidget === 'function') { window.CreateWhatsappChatWidget(options); }};
    document.body.appendChild(script);
    return () => {
      if(document.body.contains(script)){ document.body.removeChild(script); }
      const widgetDiv = document.querySelector('.wa-chat-widget-container');
      if (widgetDiv && widgetDiv.parentNode) { widgetDiv.parentNode.removeChild(widgetDiv); }
    };
  }, []);

  const interviewerNavItems = [
    { label: 'Dashboard', path: '/interviewer/dashboard', icon: <FiHome className="w-5 h-5" /> },
    { label: 'Availability', path: '/interviewer/availability', icon: <FiCalendar className="w-5 h-5" /> },
    { label: 'Assigned Interviews', path: '/interviewer/interview-evaluation', icon: <FiClipboard className="w-5 h-5" /> },
    { label: 'Domain Evaluation', path: '/interviewer/domain-evaluation', icon: <FiGrid className="w-5 h-5" /> },
    { label: 'Profile', path: '/interviewer/profile', icon: <FiUser className="w-5 h-5" /> },
  ];
  
  const fullPageLayoutPaths = [
    '/interviewer/domain-evaluation',
    '/interviewer/interview-evaluation',
    '/interviewer/profile'
  ];
  
  const useFullPageLayout = fullPageLayoutPaths.some(path => location.pathname.startsWith(path));

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        navItems={interviewerNavItems} 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        role="interviewer"
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {!useFullPageLayout && (
          <Header toggleSidebar={toggleSidebar} />
        )}
        
        <main className="flex-1 overflow-y-auto">
          {useFullPageLayout ? (
             <div className="h-full">
                <Outlet />
             </div>
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

export default InterviewerLayout;
