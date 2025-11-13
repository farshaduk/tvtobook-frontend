import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Media/Image URL helper
export const getMediaUrl = (mediaUrl?: string, fileName?: string): string => {
  if (!mediaUrl) return '/placeholder-book.jpg';
  
  // If mediaUrl already starts with http/https, return as is
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return fileName ? `${mediaUrl}/${fileName}` : mediaUrl;
  }
  
  // Otherwise, prepend the backend base URL
  const BACKEND_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:7262'
    : 'http://dev.tvtobook.com';
  
  const fullUrl = fileName ? `${BACKEND_BASE}${mediaUrl}/${fileName}` : `${BACKEND_BASE}${mediaUrl}`;
  return fullUrl;
};

