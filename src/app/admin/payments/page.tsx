'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminPaymentApi, AdminPaymentDto, AdminPaymentListDto } from '@/services/adminApi';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CreditCardIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { toPersianCurrency, toPersianNumber } from '@/utils/numberUtils';

const AdminPaymentsPage: React.FC = () => {
  const { errorPersian } = useToastHelpers();
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentDto | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const { data: paymentsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-payments', currentPage, searchTerm, statusFilter],
    queryFn: async () => {
      const response = await adminPaymentApi.getAll({ 
        pageNumber: currentPage, 
        pageSize: 20, 
        searchTerm: searchTerm || undefined,
        status: statusFilter || undefined
      });
      return response.data;
    },
    retry: 2,
  });

  const payments = paymentsResponse?.data?.payments || [];
  const pagination = paymentsResponse?.data;

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; icon: any; label: string } } = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'در انتظار' },
      'Completed': { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'تکمیل شده' },
      'Failed': { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'ناموفق' },
      'Refunded': { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon, label: 'بازگشت وجه' },
      'PartiallyRefunded': { color: 'bg-orange-100 text-orange-800', icon: XCircleIcon, label: 'بازگشت جزئی' }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    errorPersian('خطا در بارگذاری پرداخت‌ها');
    return null;
  }

  const totalPayments = pagination?.totalCount ?? 0;
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const completedPayments = payments.filter(p => p.status === 'Completed').length;
  const pendingPayments = payments.filter(p => p.status === 'Pending').length;

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">مدیریت پرداخت‌ها</h1>
            <p className="text-gray-600 mt-2">مشاهده و مدیریت تمام پرداخت‌های سیستم</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">کل پرداخت‌ها</p>
                  <p className="text-4xl font-bold">{toPersianNumber(totalPayments)}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <CreditCardIcon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">پرداخت‌های موفق</p>
                  <p className="text-4xl font-bold">{toPersianNumber(completedPayments)}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <CheckCircleIcon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">در انتظار</p>
                  <p className="text-4xl font-bold">{toPersianNumber(pendingPayments)}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <ClockIcon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">مجموع مبلغ (این صفحه)</p>
                  <p className="text-2xl font-bold">{toPersianCurrency(totalAmount)}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <CurrencyDollarIcon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو بر اساس شماره پرداخت، شناسه تراکنش یا توضیحات..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                dir="rtl"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                dir="rtl"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="Pending">در انتظار</option>
                <option value="Completed">تکمیل شده</option>
                <option value="Failed">ناموفق</option>
                <option value="Refunded">بازگشت وجه</option>
                <option value="PartiallyRefunded">بازگشت جزئی</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  شماره پرداخت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  مبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  روش پرداخت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  درگاه
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وضعیت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاریخ پرداخت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length > 0 ? (
                payments.map((payment: AdminPaymentDto) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.paymentNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {toPersianCurrency(payment.amount)} {payment.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.gatewayName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.paymentDate).toLocaleDateString('fa-IR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowPaymentModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                        title="مشاهده جزئیات"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || statusFilter ? 'نتیجه‌ای برای فیلترهای اعمال شده یافت نشد.' : 'هیچ پرداختی یافت نشد.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 rounded-b-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                قبلی
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                بعدی
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  نمایش <span className="font-medium">{((currentPage - 1) * (pagination.pageSize || 20)) + 1}</span> تا{' '}
                  <span className="font-medium">{Math.min(currentPage * (pagination.pageSize || 20), pagination.totalCount || 0)}</span> از{' '}
                  <span className="font-medium">{pagination.totalCount || 0}</span> پرداخت
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">قبلی</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {toPersianNumber(pageNum)}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">بعدی</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">جزئیات پرداخت</h2>
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayment(null);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">شماره پرداخت</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedPayment.paymentNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">مبلغ</p>
                  <p className="text-lg font-semibold text-gray-900">{toPersianCurrency(selectedPayment.amount)} {selectedPayment.currency}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">روش پرداخت</p>
                  <p className="text-lg text-gray-900">{selectedPayment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">درگاه پرداخت</p>
                  <p className="text-lg text-gray-900">{selectedPayment.gatewayName || 'نامشخص'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">وضعیت</p>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">تاریخ پرداخت</p>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedPayment.paymentDate).toLocaleDateString('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {selectedPayment.gatewayTransactionId && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">شناسه تراکنش</p>
                    <p className="text-lg text-gray-900 font-mono">{selectedPayment.gatewayTransactionId}</p>
                  </div>
                )}
                {selectedPayment.completedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">تاریخ تکمیل</p>
                    <p className="text-lg text-gray-900">
                      {new Date(selectedPayment.completedAt).toLocaleDateString('fa-IR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                {selectedPayment.isRefunded && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">مبلغ بازگشت شده</p>
                      <p className="text-lg text-gray-900">{toPersianCurrency(selectedPayment.refundedAmount)} {selectedPayment.currency}</p>
                    </div>
                    {selectedPayment.refundedAt && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">تاریخ بازگشت</p>
                        <p className="text-lg text-gray-900">
                          {new Date(selectedPayment.refundedAt).toLocaleDateString('fa-IR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                    {selectedPayment.refundReason && (
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-500">دلیل بازگشت</p>
                        <p className="text-lg text-gray-900">{selectedPayment.refundReason}</p>
                      </div>
                    )}
                  </>
                )}
                {selectedPayment.failureReason && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">دلیل ناموفق</p>
                    <p className="text-lg text-red-600">{selectedPayment.failureReason}</p>
                  </div>
                )}
                {selectedPayment.description && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">توضیحات</p>
                    <p className="text-lg text-gray-900">{selectedPayment.description}</p>
                  </div>
                )}
                {selectedPayment.receiptUrl && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">لینک رسید</p>
                    <a href={selectedPayment.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                      مشاهده رسید
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayment(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
