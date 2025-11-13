'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GlobalLoader } from '@/components/ui/spinner';

interface LoadingContextType {
  isLoading: boolean;
  loadingText: string;
  showBrand: boolean;
  overlayIntensity: 'low' | 'medium' | 'high' | 'maximum';
  setLoading: (loading: boolean, text?: string, showBrand?: boolean, overlayIntensity?: 'low' | 'medium' | 'high' | 'maximum') => void;
  startLoading: (text?: string, showBrand?: boolean, overlayIntensity?: 'low' | 'medium' | 'high' | 'maximum') => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [showBrand, setShowBrand] = useState(true);
  const [overlayIntensity, setOverlayIntensity] = useState<'low' | 'medium' | 'high' | 'maximum'>('high');

  // Manage body scroll when overlay is active
  useEffect(() => {
    if (isLoading) {
      document.body.classList.add('overlay-active');
    } else {
      document.body.classList.remove('overlay-active');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('overlay-active');
    };
  }, [isLoading]);

  const setLoading = (loading: boolean, text?: string, showBrand?: boolean, overlayIntensity?: 'low' | 'medium' | 'high' | 'maximum') => {
    setIsLoading(loading);
    if (text) setLoadingText(text);
    if (showBrand !== undefined) setShowBrand(showBrand);
    if (overlayIntensity !== undefined) setOverlayIntensity(overlayIntensity);
  };

  const startLoading = (text?: string, showBrand?: boolean, overlayIntensity?: 'low' | 'medium' | 'high' | 'maximum') => {
    setIsLoading(true);
    if (text) setLoadingText(text);
    if (showBrand !== undefined) setShowBrand(showBrand);
    if (overlayIntensity !== undefined) setOverlayIntensity(overlayIntensity);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingText,
        showBrand,
        overlayIntensity,
        setLoading,
        startLoading,
        stopLoading,
      }}
    >
      {children}
      <GlobalLoader 
        isLoading={isLoading} 
        text={loadingText} 
        showBrand={showBrand}
        overlayIntensity={overlayIntensity}
      />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// Hook for API calls with automatic loading
export function useLoadingApi() {
  const { startLoading, stopLoading } = useLoading();

  const executeWithLoading = async <T,>(
    apiCall: () => Promise<T>,
    loadingText?: string,
    showBrand?: boolean
  ): Promise<T> => {
    try {
      startLoading(loadingText, showBrand);
      const result = await apiCall();
      return result;
    } finally {
      stopLoading();
    }
  };

  return { executeWithLoading };
}
