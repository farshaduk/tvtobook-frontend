'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

export function SessionWarning() {
  const { sessionWarning, dismissSessionWarning, refreshAuth } = useAuth();

  if (!sessionWarning) return null;

  const handleContinue = async () => {
    await refreshAuth();
    dismissSessionWarning();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={dismissSessionWarning}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <ClockIcon className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">هشدار جلسه</h3>
            <p className="text-sm text-gray-500">جلسه شما در حال انقضا است</p>
          </div>
        </div>

        <p className="text-gray-700 mb-6 text-right">
          به دلیل عدم فعالیت، جلسه شما در <span className="font-bold text-orange-600">5 دقیقه</span> آینده منقضی خواهد شد. 
          برای ادامه کار، لطفاً بر روی دکمه زیر کلیک کنید.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleContinue}
            className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-6 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            ادامه جلسه
          </button>
          <button
            onClick={dismissSessionWarning}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
          >
            بستن
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          با انجام هر فعالیتی در صفحه، جلسه شما به طور خودکار تمدید می‌شود.
        </p>
      </div>
    </div>
  );
}
