'use client'

import { useMemo } from 'react';
import { toPersianNumber, toPersianCurrency, toPersianPercentage, toPersianNumberWithSuffix } from '../utils/numberUtils';

/**
 * Custom hook for Persian number formatting
 * Provides memoized formatting functions for better performance
 */
export const usePersianNumbers = () => {
  return useMemo(() => ({
    /**
     * Format number to Persian digits
     */
    formatNumber: (value: number | string, options?: Intl.NumberFormatOptions) => 
      toPersianNumber(value, options),
    
    /**
     * Format currency to Persian with تومان
     */
    formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => 
      toPersianCurrency(value, options),
    
    /**
     * Format percentage to Persian
     */
    formatPercentage: (value: number, options?: Intl.NumberFormatOptions) => 
      toPersianPercentage(value, options),
    
    /**
     * Format large numbers with suffixes
     */
    formatWithSuffix: (value: number) => 
      toPersianNumberWithSuffix(value),
    
    /**
     * Format count with "مورد" suffix
     */
    formatCount: (value: number) => 
      `${toPersianNumber(value)} مورد`,
    
    /**
     * Format price with currency
     */
    formatPrice: (value: number) => 
      `${toPersianNumber(value)} تومان`,
  }), []);
};

