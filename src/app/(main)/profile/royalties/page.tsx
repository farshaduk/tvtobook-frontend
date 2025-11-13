'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { royaltyPaymentApi, RoyaltyPaymentDto, RoyaltyPaymentListDto } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { authorApi } from '@/services/api';
import { 
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { toPersianCurrency, toPersianNumber } from '@/utils/numberUtils';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/pagination';

const RoyaltiesPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToastHelpers();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetch author profile to get authorId
  const { data: authorProfileResponse } = useQuery({
    queryKey: ['author-profile-for-royalties', user?.id],
    queryFn: async () => {
      try {
        const response = await authorApi.getMyAuthorProfile();
        return response.data.data;
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 400) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!user?.id && typeof window !== 'undefined',
  });

  const authorId = authorProfileResponse?.id;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Fetch royalties
  const { data: royaltiesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['author-royalties', authorId, statusFilter, currentPage, pageSize],
    queryFn: async () => {
      if (!authorId) return { data: { royalties: [], totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 0, hasPreviousPage: false, hasNextPage: false } };
      const response = await royaltyPaymentApi.getAuthorRoyalties(authorId, {
        pageNumber: currentPage,
        pageSize: pageSize,
        status: statusFilter || undefined
      });
      return response.data;
    },
    enabled: !!authorId && typeof window !== 'undefined',
    retry: 1,
  });

  const royaltiesData: RoyaltyPaymentListDto | undefined = royaltiesResponse?.data;
  const royalties: RoyaltyPaymentDto[] = royaltiesData?.royalties || [];
  const pagination = royaltiesData;

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; icon: any; label: string } } = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'در انتظار' },
      'Approved': { color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, label: 'تایید شده' },
      'Paid': { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'پرداخت شده' },
      'Cancelled': { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'لغو شده' },
      'Failed': { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'ناموفق' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: ClockIcon, label: status };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  if (!authorId) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
          <DocumentTextIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">پروفایل نویسنده یافت نشد</h3>
        <p className="text-gray-600">برای مشاهده سهم‌های نویسندگی، ابتدا باید درخواست نویسندگی خود را ثبت کنید.</p>
      </div>
    );
  }

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
        <p className="text-red-500 mb-4">خطا در بارگذاری سهم‌های نویسندگی</p>
        <p className="text-sm text-gray-500 mb-4">
          {(error as any)?.response?.data?.message || (error as any)?.message || 'خطای نامشخص'}
        </p>
      </div>
    );
  }

  const totalRoyalties = pagination?.totalCount ?? 0;
  const pendingRoyalties = royalties.filter(r => r.status === 'Pending').length;
  const paidRoyalties = royalties.filter(r => r.status === 'Paid').length;
  const totalPendingAmount = royalties.filter(r => r.status === 'Pending').reduce((sum, r) => sum + r.royaltyAmount, 0);
  const totalPaidAmount = royalties.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.royaltyAmount, 0);

  return (
    <div>
      {/* Professional Royalties Header */}
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-green-600 via-emerald-600 via-teal-600 to-cyan-600 shadow-2xl">
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
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-green-100 bg-clip-text text-right">سهم‌های نویسندگی</h1>
                <p className="text-green-100 text-sm sm:text-base lg:text-xl font-medium text-right">💰 مدیریت و مشاهده سهم‌های نویسندگی شما از فروش محصولات 💵</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 lg:space-y-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 lg:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium opacity-90 mb-1">کل سهم‌ها</p>
                    <p className="text-2xl lg:text-4xl font-bold">{toPersianNumber(totalRoyalties)}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-2 lg:p-3">
                    <DocumentTextIcon className="h-6 w-6 lg:h-10 lg:w-10 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 lg:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium opacity-90 mb-1">در انتظار پرداخت</p>
                    <p className="text-xl lg:text-2xl font-bold">{toPersianCurrency(totalPendingAmount)}</p>
                    <p className="text-xs opacity-90 mt-1">{toPersianNumber(pendingRoyalties)} مورد</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-2 lg:p-3">
                    <ClockIcon className="h-6 w-6 lg:h-10 lg:w-10 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 lg:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium opacity-90 mb-1">پرداخت شده</p>
                    <p className="text-xl lg:text-2xl font-bold">{toPersianCurrency(totalPaidAmount)}</p>
                    <p className="text-xs opacity-90 mt-1">{toPersianNumber(paidRoyalties)} مورد</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-2 lg:p-3">
                    <CheckCircleIcon className="h-6 w-6 lg:h-10 lg:w-10 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 lg:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium opacity-90 mb-1">مجموع سهم</p>
                    <p className="text-xl lg:text-2xl font-bold">
                      {toPersianCurrency(royalties.reduce((sum, r) => sum + r.royaltyAmount, 0))}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-2 lg:p-3">
                    <CurrencyDollarIcon className="h-6 w-6 lg:h-10 lg:w-10 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-4">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  dir="rtl"
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="Pending">در انتظار</option>
                  <option value="Approved">تایید شده</option>
                  <option value="Paid">پرداخت شده</option>
                  <option value="Cancelled">لغو شده</option>
                </select>
              </div>
            </div>
          </div>

          {/* Royalties List */}
          <div className="space-y-4">
            {royalties.length > 0 ? (
              royalties.map((royalty) => (
                <div
                  key={royalty.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {royalty.productTitle || 'محصول نامشخص'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            شماره سفارش: {royalty.orderNumber || '-'}
                          </p>
                        </div>
                        <div className="text-left lg:text-right">
                          {getStatusBadge(royalty.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">مبلغ فروش</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {toPersianCurrency(royalty.saleAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">درصد سهم</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {toPersianNumber(royalty.royaltyPercentage)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">مبلغ سهم</p>
                          <p className="text-sm font-semibold text-green-600">
                            {toPersianCurrency(royalty.royaltyAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">تاریخ ایجاد</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(royalty.createdAt).toLocaleDateString('fa-IR', { dateStyle: 'short' })}
                          </p>
                        </div>
                      </div>

                      {royalty.paidAt && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              تاریخ پرداخت: <span className="font-semibold text-gray-900">{new Date(royalty.paidAt).toLocaleDateString('fa-IR', { dateStyle: 'medium' })} {new Date(royalty.paidAt).toLocaleTimeString('fa-IR', { timeStyle: 'short' })}</span>
                            </span>
                            {royalty.paymentMethod && (
                              <span className="text-gray-600">
                                روش پرداخت: <span className="font-semibold text-gray-900">
                                  {royalty.paymentMethod === 'Manual' ? 'دستی' : 'درگاه پرداخت'}
                                </span>
                              </span>
                            )}
                          </div>
                          {royalty.receiptUrl && (
                            <div className="mt-2">
                              <a
                                href={royalty.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <DocumentTextIcon className="h-4 w-4" />
                                مشاهده رسید
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {royalty.notes && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">یادداشت</p>
                          <p className="text-sm text-gray-700">{royalty.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                      <button
                        onClick={() => router.push(`/product?id=${royalty.productId}`)}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        <EyeIcon className="h-4 w-4" />
                        مشاهده محصول
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">هیچ سهمی یافت نشد</h3>
                <p className="text-gray-600">
                  {statusFilter ? 'نتیجه‌ای برای فیلتر اعمال شده یافت نشد.' : 'هنوز سهم نویسندگی برای شما ثبت نشده است.'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoyaltiesPage;

