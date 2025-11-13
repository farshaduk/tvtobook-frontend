/**
 * Utility functions for number formatting across the application
 */

/**
 * Converts a number to Persian digits using fa-IR locale
 * @param value - The number to convert
 * @param options - Optional formatting options
 * @returns Formatted Persian number string
 */
export const toPersianNumber = (value: number | string, options?: Intl.NumberFormatOptions): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return value.toString();
  
  return num.toLocaleString('fa-IR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  });
};

/**
 * Formats currency in Persian with تومان
 * @param value - The amount to format
 * @param options - Optional formatting options
 * @returns Formatted Persian currency string
 */
export const toPersianCurrency = (value: number, options?: Intl.NumberFormatOptions): string => {
  return `${toPersianNumber(value, options)} تومان`;
};

/**
 * Formats percentage in Persian
 * @param value - The percentage value (0-100)
 * @param options - Optional formatting options
 * @returns Formatted Persian percentage string
 */
export const toPersianPercentage = (value: number, options?: Intl.NumberFormatOptions): string => {
  return `${toPersianNumber(value, options)}%`;
};

/**
 * Formats large numbers with appropriate suffixes (هزار، میلیون، میلیارد)
 * @param value - The number to format
 * @returns Formatted Persian number with suffix
 */
export const toPersianNumberWithSuffix = (value: number): string => {
  if (value >= 1000000000) {
    return `${toPersianNumber(value / 1000000000, { maximumFractionDigits: 1 })} میلیارد`;
  } else if (value >= 1000000) {
    return `${toPersianNumber(value / 1000000, { maximumFractionDigits: 1 })} میلیون`;
  } else if (value >= 1000) {
    return `${toPersianNumber(value / 1000, { maximumFractionDigits: 1 })} هزار`;
  }
  return toPersianNumber(value);
};

