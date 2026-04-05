// src/components/ui/Modal.tsx

import type { FC, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* ✅ Backdrop - Full screen, high z-index */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
        onClick={onClose}
      />
      
      {/* ✅ Centered Modal - Fixed position, flex center */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
          
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
          
          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Modal;