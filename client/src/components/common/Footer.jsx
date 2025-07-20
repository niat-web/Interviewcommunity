// client/src/components/common/Footer.jsx
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import logoSrc from '/logo.svg';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="mb-4 inline-block">
              <img 
                src={logoSrc} 
                alt="NxtWave Logo" 
                className="h-12 w-auto" />
            </Link>
            <p className="text-gray-400 mb-4 max-w-md">
              Connecting skilled professionals with opportunities to conduct interviews and earn competitive compensation while helping shape the next generation of tech talent.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center text-gray-400">
                <FiMail className="w-4 h-4 mr-2" />
                <span className="text-sm">support@nxtwave.com</span>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/#apply" 
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Apply Now
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/faq" 
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/privacy" 
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;
