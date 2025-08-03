import { Fragment } from 'react';
import { Dialog, Transition, DialogPanel, DialogTitle } from '@headlessui/react';
import { FiX } from 'react-icons/fi';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  theme = 'light' // New prop: 'light' or 'dark'
}) => {
  const sizeClasses = {
    sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl', '4xl': 'max-w-4xl', '5xl': 'max-w-5xl', full: 'max-w-full'
  };

  // Dynamic theme classes
  const themeStyles = {
    light: {
      panel: 'bg-white shadow-xl',
      header: 'border-gray-200',
      title: 'text-gray-900',
      closeButton: 'text-gray-400 hover:text-gray-500',
      footer: 'border-gray-200 bg-gray-50',
    },
    dark: {
      panel: 'bg-[#14162B]/80 backdrop-blur-lg border border-white/10 shadow-2xl shadow-black/30',
      header: 'border-white/10',
      title: 'text-gray-100',
      closeButton: 'text-gray-400 hover:text-white',
      footer: 'border-white/10 bg-black/20',
    }
  };

  const currentTheme = themeStyles[theme];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeOnOverlayClick ? onClose : () => {}}>
        <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className={`relative w-full ${sizeClasses[size]} my-8 flex flex-col rounded-2xl max-h-[90vh] ${currentTheme.panel}`}>
              {title && (
                <div className={`flex-shrink-0 px-6 py-4 border-b flex justify-between items-center ${currentTheme.header}`}>
                  <DialogTitle as="h3" className={`text-lg font-medium leading-6 ${currentTheme.title}`}>
                    {title}
                  </DialogTitle>
                  {showCloseButton && (
                    <button type="button" className={`p-1 rounded-full focus:outline-none ${currentTheme.closeButton}`} onClick={onClose}>
                      <span className="sr-only">Close</span>
                      <FiX className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
              
              <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
                {children}
              </div>
              
              {footer && (
                <div className={`flex-shrink-0 px-6 py-4 border-t flex justify-end space-x-3 ${currentTheme.footer}`}>
                  {footer}
                </div>
              )}
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
