'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { couponApi, CouponDto } from '@/services/api';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { 
  TicketIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { toPersianNumber, toPersianCurrency } from '@/utils/numberUtils';
import { useRouter } from 'next/navigation';

export default function CouponsPage() {
  const toast = useToastHelpers();
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: couponsResponse, isLoading, error } = useQuery({
    queryKey: ['public-coupons'],
    queryFn: async () => {
      const response = await couponApi.getPublicCoupons();
      return response.data;
    },
    retry: 2,
  });

  const coupons: CouponDto[] = couponsResponse?.data || [];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.successPersian('کد کوپن کپی شد');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDiscountDisplay = (coupon: CouponDto) => {
    if (coupon.discountType === 'Percentage') {
      return `${toPersianNumber(coupon.discountValue)}%`;
    }
    return toPersianCurrency(coupon.discountValue);
  };

  const getStatusBadge = (coupon: CouponDto) => {
    const now = new Date();
    const validTo = new Date(coupon.validTo);
    const daysLeft = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <ClockIcon className="h-3 w-3" />
          {daysLeft > 0 ? `${toPersianNumber(daysLeft)} روز باقی مانده` : 'منقضی شده'}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="h-3 w-3" />
        فعال
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">خطا در بارگذاری کوپن‌ها</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50" dir="rtl">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Professional Header */}
        <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl mb-8 lg:mb-12">
          <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-purple-600 via-pink-600 via-rose-600 to-orange-600 shadow-2xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 lg:space-x-4 mb-3 lg:mb-4 rtl:space-x-reverse">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/80 rounded-full animate-bounce animation-delay-200"></div>
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/60 rounded-full animate-bounce animation-delay-400"></div>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-purple-100 bg-clip-text text-right">کوپن‌های تخفیف</h1>
                  <p className="text-purple-100 text-sm sm:text-base lg:text-xl font-medium text-right">🎫 کوپن‌های فعال و قابل استفاده برای خرید شما 🎁</p>
                </div>
                <div className="hidden lg:block ml-8">
                  <div className="bg-white/20 backdrop-blur-md rounded-full p-4 lg:p-6">
                    <TicketIcon className="h-12 w-12 lg:h-16 lg:w-16 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {coupons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {coupons.map((coupon, index) => (
              <div
                key={coupon.id}
                className="group relative bg-white rounded-2xl shadow-xl border-2 border-purple-100 hover:border-purple-400 transition-all duration-300 overflow-hidden transform hover:-translate-y-2 hover:shadow-2xl"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/30 to-purple-200/30 rounded-full blur-2xl -ml-12 -mb-12"></div>

                {/* Coupon Header */}
                <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-5 lg:p-6 text-white overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                          <CurrencyDollarIcon className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                        </div>
                        <span className="text-3xl lg:text-4xl font-extrabold drop-shadow-lg">{getDiscountDisplay(coupon)}</span>
                      </div>
                      {getStatusBadge(coupon)}
                    </div>
                    <h3 className="text-lg lg:text-xl font-bold drop-shadow-md">{coupon.name}</h3>
                  </div>
                </div>

                {/* Coupon Body */}
                <div className="relative p-5 lg:p-6 space-y-4 bg-white">
                  <p className="text-sm lg:text-base text-gray-700 leading-relaxed min-h-[3rem]">{coupon.description}</p>

                  {/* Coupon Code - Enhanced Design */}
                  <div className="relative bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl p-4 border-2 border-dashed border-purple-300 hover:border-purple-400 transition-colors group/code">
                    <div className="flex items-center justify-between">
                      <code className="text-xl lg:text-2xl font-mono font-extrabold text-gray-900 tracking-wider select-all">
                        {coupon.code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(coupon.code)}
                        className="p-2.5 bg-white hover:bg-purple-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110"
                        title="کپی کد"
                      >
                        <ClipboardDocumentIcon className={`h-5 w-5 lg:h-6 lg:w-6 transition-colors ${copiedCode === coupon.code ? 'text-green-600' : 'text-purple-600'}`} />
                      </button>
                    </div>
                    {copiedCode === coupon.code && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                        کپی شد!
                      </div>
                    )}
                  </div>

                  {/* Coupon Details - Enhanced */}
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    {coupon.minimumPurchaseAmount && (
                      <div className="flex items-center justify-between text-sm lg:text-base">
                        <span className="text-gray-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                          حداقل خرید:
                        </span>
                        <span className="font-bold text-gray-900">{toPersianCurrency(coupon.minimumPurchaseAmount)}</span>
                      </div>
                    )}
                    {coupon.maximumDiscountAmount && coupon.discountType === 'Percentage' && (
                      <div className="flex items-center justify-between text-sm lg:text-base">
                        <span className="text-gray-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                          حداکثر تخفیف:
                        </span>
                        <span className="font-bold text-gray-900">{toPersianCurrency(coupon.maximumDiscountAmount)}</span>
                      </div>
                    )}
                    {coupon.maxUsagePerUser && (
                      <div className="flex items-center justify-between text-sm lg:text-base">
                        <span className="text-gray-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                          استفاده برای هر کاربر:
                        </span>
                        <span className="font-bold text-gray-900">{toPersianNumber(coupon.maxUsagePerUser)} بار</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm lg:text-base">
                      <span className="text-gray-600 flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-orange-500" />
                        اعتبار تا:
                      </span>
                      <span className="font-bold text-gray-900">{new Date(coupon.validTo).toLocaleDateString('fa-IR', { dateStyle: 'medium' })}</span>
                    </div>
                  </div>

                  {/* Action Button - Enhanced */}
                  <button
                    onClick={() => router.push('/checkout')}
                    className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white py-3 lg:py-3.5 rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 transition-all duration-300 font-bold text-base lg:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    <TicketIcon className="h-5 w-5" />
                    استفاده از کوپن
                  </button>
                </div>

                {/* Shine Effect on Hover */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-8 lg:p-12 shadow-2xl">
            <div className="text-center py-12 lg:py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mb-6 lg:mb-8">
                <TicketIcon className="h-12 w-12 lg:h-16 lg:w-16 text-purple-600" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 lg:mb-4">هیچ کوپن فعالی وجود ندارد</h3>
              <p className="text-gray-600 text-base lg:text-lg max-w-md mx-auto">
                در حال حاضر کوپن تخفیف فعالی برای نمایش وجود ندارد. لطفاً بعداً دوباره بررسی کنید.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

