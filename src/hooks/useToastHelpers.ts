'use client';

import { useToast } from '../components/ui/toast';

export const useToastHelpers = () => {
  const { showToast } = useToast();

  return {
    success: (title: string, message?: string) => {
      showToast({
        type: 'success',
        title,
        message,
        duration: 4000
      });
    },
    
    error: (title: string, message?: string) => {
      showToast({
        type: 'error',
        title,
        message,
        duration: 6000
      });
    },
    
    warning: (title: string, message?: string) => {
      showToast({
        type: 'warning',
        title,
        message,
        duration: 5000
      });
    },
    
    info: (title: string, message?: string) => {
      showToast({
        type: 'info',
        title,
        message,
        duration: 4000
      });
    },
    
    // Persian-specific helpers
    successPersian: (message: string) => {
      showToast({
        type: 'success',
        title: 'موفقیت',
        message,
        duration: 4000
      });
    },
    
    errorPersian: (message: string) => {
      showToast({
        type: 'error',
        title: 'خطا',
        message,
        duration: 6000
      });
    },
    
    warningPersian: (message: string) => {
      showToast({
        type: 'warning',
        title: 'هشدار',
        message,
        duration: 5000
      });
    },
    
    infoPersian: (message: string) => {
      showToast({
        type: 'info',
        title: 'اطلاعات',
        message,
        duration: 4000
      });
    }
  };
};

export default useToastHelpers;
