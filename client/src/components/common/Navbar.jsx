import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiMenu, FiX, FiUser, FiArrowRight } from 'react-icons/fi';
import nxtWaveLogo from '/logo.svg';

const Navbar = () => {
  const { currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getProfileLink = () => {
    if (!currentUser) return '/login';
    return currentUser.role === 'admin' ? '/admin/dashboard' : '/interviewer/dashboard';
  };

  const navClass = isScrolled 
    ? "bg-[#0A091A]/80 backdrop-blur-lg border-b border-white/10" 
    : "bg-transparent";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${navClass}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <img className="h-9 sm:h-10 w-auto" src={nxtWaveLogo} alt="NxtWave Hire" />
          </Link>
          
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <Link 
                to={getProfileLink()} 
                className="flex items-center space-x-2 text-gray-200 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                  <span className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <FiUser className="w-3.5 h-3.5 text-white" />
                  </span>
                  <span>Dashboard</span>
                  <FiArrowRight className="w-4 h-4"/>
              </Link>
            ) : (
              <Link 
                to="/#apply"
                onClick={(e) => {
                    e.preventDefault();
                    navigate('/#apply');
                    // This logic is now handled in Home.jsx, but we still navigate
                }}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full py-2.5 px-6 text-sm font-semibold text-white shadow-lg transition-all duration-300 ease-out hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:scale-105"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300"></span>
                <span className="relative">Apply Now</span>
              </Link>
            )}
          </div>
          
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg text-gray-300 hover:text-white transition-colors">
              <span className="sr-only">Open menu</span>
              {isMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden bg-[#0A091A] border-t border-white/10">
          <div className="px-4 pt-4 pb-5 space-y-4">
            {currentUser ? (
              <Link 
                to={getProfileLink()} 
                onClick={() => setIsMenuOpen(false)} 
                className="block text-center py-3 rounded-lg text-base font-medium text-gray-200 bg-white/10 hover:bg-white/20 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link 
                to="/#apply" 
                onClick={() => setIsMenuOpen(false)} 
                className="block w-full text-center py-3 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              >
                Apply Now
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
