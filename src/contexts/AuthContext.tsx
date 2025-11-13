'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  error: string | null;
  lastActivity: number;
  sessionWarning: boolean;
  dismissSessionWarning: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout constants
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_WARNING_TIME = 10 * 60 * 1000; // Warn 10 minutes before timeout
const AUTH_REFRESH_INTERVAL = 10 * 60 * 1000; // Refresh auth every 10 minutes

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [sessionWarning, setSessionWarning] = useState(false);
  
  const activityTimeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  const isAuthenticated = !!user;


  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authApi.logout();
    } catch (error: any) {
    } finally {
      setUser(null);
      setLastActivity(0);
      setSessionWarning(false);
      
      // Clear all timeouts
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      
      // Clear user-specific data from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart-storage');
        // Note: theme-storage is intentionally kept as it's a browser preference, not user-specific
      }
      
      setIsLoading(false);
    }
  }, []);

  // Update last activity time
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setSessionWarning(false);
    
    // Clear existing timeouts
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    if (isAuthenticated) {
      // Set warning timeout
      warningTimeoutRef.current = setTimeout(() => {
        setSessionWarning(true);
      }, SESSION_TIMEOUT - SESSION_WARNING_TIME);
      
      // Set auto-logout timeout
      activityTimeoutRef.current = setTimeout(() => {
        logout();
      }, SESSION_TIMEOUT);
    }
  }, [isAuthenticated, logout]);

  const dismissSessionWarning = useCallback(() => {
    setSessionWarning(false);
    updateActivity();
  }, [updateActivity]);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authApi.getCurrentUser();
      
      if (response.data) {
        setUser(response.data);
        setLastActivity(Date.now());
      } else {
        setUser(null);
      }
    } catch (error: any) {
      setUser(null);
      
      // Don't set error for 401/403 as these are expected when not logged in
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        setError('Failed to check authentication status');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await authApi.getCurrentUser();
      
      if (response.data) {
        setUser(response.data);
        setLastActivity(Date.now());
        updateActivity();
      } else {
        await logout();
      }
    } catch (error: any) {
      // Only logout if we haven't had recent activity (within last 5 minutes)
      const timeSinceLastActivity = Date.now() - lastActivity;
      const recentActivityThreshold = 5 * 60 * 1000; // 5 minutes
      
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        if (timeSinceLastActivity > recentActivityThreshold) {
          await logout();
        }
      }
    }
  }, [isAuthenticated, logout, lastActivity, updateActivity]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      return { ...currentUser, ...userData };
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authApi.login({
        Email: email,
        Password: password
      });
      
      if (response.data.user) {
        setUser(response.data.user);
        setLastActivity(Date.now());
        
        // Refresh auth state in background to ensure all user data (including roles) is up to date
        checkAuth().catch((refreshError) => {
          // If refresh fails, continue with the user from login response
          console.warn('Failed to refresh auth after login:', refreshError);
        });
      } else {
        throw new Error('Login failed: No user data received');
      }
    } catch (error: any) {
      setUser(null);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [checkAuth]);

  // Initialize activity timeouts when user becomes authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Trigger updateActivity to set up timeouts
    updateActivity();
  }, [isAuthenticated, updateActivity]);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      updateActivity();
    };

    // Listen for user activity
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [isAuthenticated, updateActivity]);

  // Periodic auth refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    refreshIntervalRef.current = setInterval(() => {
      refreshAuth();
    }, AUTH_REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isAuthenticated, refreshAuth]);

  // Check authentication status on mount ONLY ONCE
  useEffect(() => {
    // Only check auth in browser, not during static export build
    if (typeof window === 'undefined') return;
    
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    refreshAuth,
    updateUser,
    error,
    lastActivity,
    sessionWarning,
    dismissSessionWarning
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    fallback?: React.ComponentType;
  }
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const { redirectTo = '/login', fallback: Fallback } = options || {};

    if (isLoading) {
      return Fallback ? <Fallback /> : <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      // Redirect to login page using Next.js router
      router.push(redirectTo);
      return null;
    }

    return <Component {...props} />;
  };
}

// Hook for protecting pages
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isAuthenticated, isLoading };
}
