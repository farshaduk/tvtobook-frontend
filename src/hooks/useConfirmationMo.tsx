'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';
import ConfirmationModal, { ModalType } from '../components/ui/confirmation-modal';

interface ConfirmationState {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ModalType;
  showCancel?: boolean;
  icon?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ConfirmationContextType {
  showConfirmation: (config: Omit<ConfirmationState, 'isOpen'>) => Promise<boolean>;
  showWarning: (message: string, title?: string) => Promise<boolean>;
  showError: (message: string, title?: string) => Promise<boolean>;
  showSuccess: (message: string, title?: string) => Promise<boolean>;
  showInfo: (message: string, title?: string) => Promise<boolean>;
  closeConfirmation: () => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

interface ConfirmationProviderProps {
  children: ReactNode;
  isRtl?: boolean;
}

export const ConfirmationProvider: React.FC<ConfirmationProviderProps> = ({ 
  children, 
  isRtl = true 
}) => {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    message: '',
  });

  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const showConfirmation = (config: Omit<ConfirmationState, 'isOpen'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
      setConfirmationState({
        ...config,
        isOpen: true,
      });
    });
  };

  const showWarning = (message: string, title?: string): Promise<boolean> => {
    return showConfirmation({
      message,
      title: title || 'هشدار',
      type: 'warning',
      confirmText: 'تأیید',
      cancelText: 'لغو',
    });
  };

  const showError = (message: string, title?: string): Promise<boolean> => {
    return showConfirmation({
      message,
      title: title || 'خطا',
      type: 'error',
      confirmText: 'تأیید',
      cancelText: 'لغو',
    });
  };

  const showSuccess = (message: string, title?: string): Promise<boolean> => {
    return showConfirmation({
      message,
      title: title || 'موفقیت',
      type: 'success',
      confirmText: 'تأیید',
      showCancel: false,
    });
  };

  const showInfo = (message: string, title?: string): Promise<boolean> => {
    return showConfirmation({
      message,
      title: title || 'اطلاعات',
      type: 'info',
      confirmText: 'تأیید',
      showCancel: false,
    });
  };

  const closeConfirmation = () => {
    setConfirmationState(prev => ({ ...prev, isOpen: false }));
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  };

  const handleConfirm = () => {
    if (confirmationState.onConfirm) {
      confirmationState.onConfirm();
    }
    setConfirmationState(prev => ({ ...prev, isOpen: false }));
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
  };

  const handleCancel = () => {
    if (confirmationState.onCancel) {
      confirmationState.onCancel();
    }
    closeConfirmation();
  };

  const contextValue: ConfirmationContextType = {
    showConfirmation,
    showWarning,
    showError,
    showSuccess,
    showInfo,
    closeConfirmation,
  };

  return (
    <ConfirmationContext.Provider value={contextValue}>
      {children}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={closeConfirmation}
        onConfirm={handleConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        type={confirmationState.type}
        showCancel={confirmationState.showCancel}
        isRtl={isRtl}
        icon={confirmationState.icon}
      />
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = (): ConfirmationContextType => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};
