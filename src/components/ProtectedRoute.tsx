'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin as checkIsAdmin } from '@/utils/roleUtils';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireAuth = true,
  redirectTo 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const hasRedirectedRef = useRef(false);
  const hasCheckedAuthRef = useRef(false);

  useEffect(() => {
    const validateAccess = async () => {
      if (isLoading) {
        setIsAuthorized(false);
        return;
      }
      
      // If authenticated but user data is not yet loaded, refresh auth state
      if (isAuthenticated && !user && !hasCheckedAuthRef.current) {
        hasCheckedAuthRef.current = true;
        try {
          await checkAuth();
        } catch (error) {
          console.warn('[ProtectedRoute] Failed to refresh auth:', error);
        }
        return;
      }
      
      if (requireAuth && !isAuthenticated) {
        if (!hasRedirectedRef.current) {
          console.warn('[ProtectedRoute] User not authenticated, redirecting to login');
          hasRedirectedRef.current = true;
          const redirect = redirectTo || '/login';
          router.push(redirect);
        }
        setIsAuthorized(false);
        return;
      }
      
      if (requireAdmin && isAuthenticated && !user) {
        // Wait for user data to load
        return;
      }
      
      if (requireAdmin && !checkIsAdmin(user)) {
        if (!hasRedirectedRef.current) {
          console.warn('[ProtectedRoute] User lacks admin privileges, redirecting to home');
          hasRedirectedRef.current = true;
          router.push('/');
        }
        setIsAuthorized(false);
        return;
      }
      
      if (requireAuth && isAuthenticated && (!requireAdmin || checkIsAdmin(user))) {
        setIsAuthorized(true);
        hasRedirectedRef.current = false;
      }
    };

    validateAccess();
  }, [isLoading, isAuthenticated, user, requireAdmin, requireAuth, redirectTo, router, checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <Spinner size="xl" text="در حال بررسی دسترسی..." />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

// Specific HOC for admin routes
export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={true} requireAuth={true}>
      {children}
    </ProtectedRoute>
  );
}

// Specific HOC for user routes
export function ProtectedUserRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true} requireAdmin={false} redirectTo="/login?redirect=/profile">
      {children}
    </ProtectedRoute>
  );
}
