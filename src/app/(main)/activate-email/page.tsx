'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/services/api';
import { useToast } from '@/components/ui/toast';

const EmailActivationContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activationStatus, setActivationStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const token = searchParams.get('token');
  const { showToast } = useToast();

  const activationMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await authApi.activateEmail({ token });
      return response.data;
    },
    onSuccess: () => {
      setActivationStatus('success');
      showToast({
        type: 'success',
        title: 'ایمیل فعال شد',
        message: 'ایمیل شما با موفقیت فعال شد. اکنون می‌توانید وارد حساب کاربری خود شوید.'
      });
      setTimeout(() => router.push('/login'), 3000);
    },
    onError: () => {
      setActivationStatus('error');
      showToast({
        type: 'error',
        title: 'فعال‌سازی ناموفق',
        message: 'توکن فعال‌سازی نامعتبر یا منقضی شده است. لطفاً دوباره ثبت‌نام کنید.'
      });
    }
  });

  useEffect(() => {
    if (!token) {
      setActivationStatus('invalid');
      return;
    }

    activationMutation.mutate(token);
  }, [token]);

  const renderContent = () => {
    switch (activationStatus) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">در حال فعال‌سازی حساب شما</h2>
            <p className="text-gray-600">لطفاً صبر کنید تا حساب شما فعال شود...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">ایمیل با موفقیت فعال شد!</h2>
            <p className="text-gray-600 mb-4">حساب شما فعال شده است. به زودی به صفحه ورود هدایت خواهید شد.</p>
            <Link 
              href="/login" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              رفتن به ورود
            </Link>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">فعال‌سازی ناموفق</h2>
            <p className="text-gray-600 mb-4">لینک فعال‌سازی نامعتبر یا منقضی شده است. لطفاً دوباره ثبت‌نام کنید یا با پشتیبانی تماس بگیرید.</p>
            <div className="space-x-4">
              <Link 
                href="/register" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                ثبت‌نام مجدد
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                رفتن به ورود
              </Link>
            </div>
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-yellow-900 mb-2">لینک فعال‌سازی نامعتبر</h2>
            <p className="text-gray-600 mb-4">لینک فعال‌سازی موجود نیست یا نامعتبر است. لطفاً ایمیل خود را برای لینک صحیح بررسی کنید.</p>
            <Link 
              href="/login" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              رفتن به ورود
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white shadow rounded-lg p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const EmailActivationPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">در حال بارگذاری</h2>
              <p className="text-gray-600">لطفاً صبر کنید...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <EmailActivationContent />
    </Suspense>
  );
};

export default EmailActivationPage;


