'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  const iconClass = "h-6 w-6";
  
  switch (type) {
    case 'success':
      return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
    case 'error':
      return <XCircleIcon className={`${iconClass} text-red-500`} />;
    case 'warning':
      return <ExclamationTriangleIcon className={`${iconClass} text-yellow-500`} />;
    case 'info':
      return <InformationCircleIcon className={`${iconClass} text-blue-500`} />;
    default:
      return <InformationCircleIcon className={`${iconClass} text-gray-500`} />;
  }
};

const ToastComponent = ({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast.persistent && toast.duration !== 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.persistent]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  const getToastStyles = () => {
    const baseStyles = "relative flex items-start p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out";
    const visibilityStyles = isVisible && !isLeaving 
      ? "translate-x-0 opacity-100 scale-100" 
      : "translate-x-full opacity-0 scale-95";
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-400 ${visibilityStyles}`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-400 ${visibilityStyles}`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-400 ${visibilityStyles}`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-400 ${visibilityStyles}`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-400 ${visibilityStyles}`;
    }
  };

  const getTextStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex-shrink-0 ml-3">
        <ToastIcon type={toast.type} />
      </div>
      <div className="flex-1 mr-3">
        <h3 className={`text-sm font-medium ${getTextStyles()}`}>
          {toast.title}
        </h3>
        {toast.message && (
          <p className={`mt-1 text-sm ${getTextStyles()} opacity-90`}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black hover:bg-opacity-10 transition-colors duration-200"
      >
        <XMarkIcon className="h-4 w-4 text-gray-500 hover:text-gray-700" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, clearAllToasts }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onClose={hideToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Convenience functions for common toast types
export const createToastHelpers = () => {
  const { showToast } = useToast();
  
  return {
    success: (title: string, message?: string, options?: Partial<Toast>) => {
      showToast({ type: 'success', title, message, ...options });
    },
    
    error: (title: string, message?: string, options?: Partial<Toast>) => {
      showToast({ type: 'error', title, message, ...options });
    },
    
    warning: (title: string, message?: string, options?: Partial<Toast>) => {
      showToast({ type: 'warning', title, message, ...options });
    },
    
    info: (title: string, message?: string, options?: Partial<Toast>) => {
      showToast({ type: 'info', title, message, ...options });
    },
  };
};

export default ToastProvider;

