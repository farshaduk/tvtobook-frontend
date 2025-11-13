'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminRoyaltyPaymentApi, AdminRoyaltyPaymentDto, AdminRoyaltyPaymentListDto, AdminProcessRoyaltyPaymentDto } from '@/services/adminApi';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { toPersianCurrency, toPersianNumber } from '@/utils/numberUtils';
import { authorApi } from '@/services/api';

const AdminRoyaltiesPage: React.FC = () => {
  const { successPersian, errorPersian } = useToastHelpers();
  const queryClient = useQueryClient();
  const { isOpen, modalConfig, showModal, confirm, cancel } = useConfirmationModal();

  const [selectedRoyalty, setSelectedRoyalty] = useState<AdminRoyaltyPaymentDto | null>(null);
  const [showRoyaltyModal, setShowRoyaltyModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Manual' | 'Gateway'>('Manual');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [authorFilter, setAuthorFilter] = useState<string>('');

  // Fetch authors for filter dropdown
  const { data: authorsResponse } = useQuery({
    queryKey: ['admin-authors-simple'],
    queryFn: async () => {
      try {
        const response = await authorApi.getAll({ pageNumber: 1, pageSize: 1000 });
        const responseData = response?.data?.data as any;
        return responseData || { authors: [] };
      } catch (error) {
        return { authors: [] };
      }
    }
  });

  const authors = authorsResponse?.authors || [];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, authorFilter]);

  const { data: royaltiesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-royalties', currentPage, searchTerm, statusFilter, authorFilter],
    queryFn: async () => {
      const response = await adminRoyaltyPaymentApi.getAll({ 
        pageNumber: currentPage, 
        pageSize: 20, 
        searchTerm: searchTerm || undefined,
        status: statusFilter || undefined,
        authorId: authorFilter || undefined
      });
      return response.data;
    },
    retry: 2,
  });

  const royalties = royaltiesResponse?.data?.royalties || [];
  const pagination = royaltiesResponse?.data;

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: ({ data, file }: { data: AdminProcessRoyaltyPaymentDto; file?: File }) => 
      adminRoyaltyPaymentApi.processPayment(data, file),
    onSuccess: (response) => {
      successPersian(response.data.message || 'پرداخت با موفقیت انجام شد');
      setShowPaymentModal(false);
      setShowRoyaltyModal(false);
      setSelectedRoyalty(null);
      setReceiptFile(null);
      setReceiptUrl('');
      setPaymentNotes('');
      setPaymentMethod('Manual');
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در پردازش پرداخت');
    },
  });

  // Initiate gateway payment mutation
  const initiateGatewayMutation = useMutation({
    mutationFn: (data: { royaltyPaymentId: string; callbackUrl: string }) => 
      adminRoyaltyPaymentApi.initiateGatewayPayment(data),
    onSuccess: (response) => {
      if (response.data?.data?.paymentUrl) {
        // Redirect to gateway payment URL
        window.open(response.data.data.paymentUrl, '_blank');
        successPersian('در حال انتقال به درگاه پرداخت...');
      } else {
        successPersian(response.data.message || 'درگاه پرداخت با موفقیت ایجاد شد');
      }
      setShowPaymentModal(false);
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در ایجاد درگاه پرداخت');
    },
  });

  const handleProcessPayment = (royalty: AdminRoyaltyPaymentDto) => {
    setSelectedRoyalty(royalty);
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = () => {
    if (!selectedRoyalty) return;

    if (paymentMethod === 'Manual') {
      if (!receiptFile && !receiptUrl.trim()) {
        errorPersian('لطفاً فایل رسید را آپلود کنید یا لینک رسید را وارد کنید');
        return;
      }

      processPaymentMutation.mutate({
        data: {
          royaltyPaymentId: selectedRoyalty.id,
          paymentMethod: 'Manual',
          receiptUrl: receiptUrl.trim() || undefined,
          notes: paymentNotes.trim() || undefined,
        },
        file: receiptFile || undefined,
      });
    } else if (paymentMethod === 'Gateway') {
      const callbackUrl = `${window.location.origin}/admin/royalties?royaltyId=${selectedRoyalty.id}`;
      initiateGatewayMutation.mutate({
        royaltyPaymentId: selectedRoyalty.id,
        callbackUrl: callbackUrl,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; icon: any; label: string } } = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'در انتظار' },
      'Approved': { color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, label: 'تایید شده' },
      'Paid': { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'پرداخت شده' },
      'Cancelled': { color: 'bg-red-100 text-red-800', icon: ClockIcon, label: 'لغو شده' }
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
    errorPersian('خطا در بارگذاری سهم‌های نویسندگان');
    return null;
  }

  const totalRoyalties = pagination?.totalCount ?? 0;
  const pendingRoyalties = royalties.filter(r => r.status === 'Pending').length;
  const paidRoyalties = royalties.filter(r => r.status === 'Paid').length;
  const totalPendingAmount = royalties.filter(r => r.status === 'Pending').reduce((sum, r) => sum + r.royaltyAmount, 0);
  const totalPaidAmount = royalties.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.royaltyAmount, 0);

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">مدیریت سهم نویسندگان</h1>
            <p className="text-gray-600 mt-2">مشاهده و مدیریت سهم‌های نویسندگان از فروش محصولات</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">کل سهم‌ها</p>
                  <p className="text-4xl font-bold">{toPersianNumber(totalRoyalties)}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <BookOpenIcon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">در انتظار پرداخت</p>
                  <p className="text-2xl font-bold">{toPersianCurrency(totalPendingAmount)}</p>
                  <p className="text-sm opacity-90 mt-1">{toPersianNumber(pendingRoyalties)} مورد</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <ClockIcon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">پرداخت شده</p>
                  <p className="text-2xl font-bold">{toPersianCurrency(totalPaidAmount)}</p>
                  <p className="text-sm opacity-90 mt-1">{toPersianNumber(paidRoyalties)} مورد</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <CheckCircleIcon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">مجموع سهم (این صفحه)</p>
                  <p className="text-2xl font-bold">
                    {toPersianCurrency(royalties.reduce((sum, r) => sum + r.royaltyAmount, 0))}
                  </p>
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
                placeholder="جستجو بر اساس نام نویسنده، عنوان محصول، شماره سفارش یا یادداشت..."
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
                <option value="Approved">تایید شده</option>
                <option value="Paid">پرداخت شده</option>
                <option value="Cancelled">لغو شده</option>
              </select>
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[200px]"
                dir="rtl"
              >
                <option value="">همه نویسندگان</option>
                {authors.map((author: any) => (
                  <option key={author.id} value={author.id}>
                    {author.penName || 'نامشخص'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Royalties Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نویسنده
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  محصول
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  شماره سفارش
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  مبلغ فروش
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  درصد سهم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  مبلغ سهم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وضعیت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاریخ ایجاد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {royalties.length > 0 ? (
                royalties.map((royalty: AdminRoyaltyPaymentDto) => (
                  <tr key={royalty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {royalty.authorName || 'نامشخص'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {royalty.productTitle || 'نامشخص'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {royalty.orderNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {toPersianCurrency(royalty.saleAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {toPersianNumber(royalty.royaltyPercentage)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {toPersianCurrency(royalty.royaltyAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(royalty.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(royalty.createdAt).toLocaleDateString('fa-IR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRoyalty(royalty);
                            setShowRoyaltyModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="مشاهده جزئیات"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {royalty.status === 'Pending' && (
                          <button
                            onClick={() => handleProcessPayment(royalty)}
                            disabled={processPaymentMutation.isPending}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="پرداخت سهم"
                          >
                            پرداخت
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || statusFilter || authorFilter ? 'نتیجه‌ای برای فیلترهای اعمال شده یافت نشد.' : 'هیچ سهمی یافت نشد.'}
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
                  <span className="font-medium">{pagination.totalCount || 0}</span> سهم
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

      {/* Royalty Details Modal */}
      {showRoyaltyModal && selectedRoyalty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">جزئیات سهم نویسنده</h2>
              <button 
                onClick={() => {
                  setShowRoyaltyModal(false);
                  setSelectedRoyalty(null);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">نویسنده</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedRoyalty.authorName || 'نامشخص'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">محصول</p>
                  <p className="text-lg text-gray-900">{selectedRoyalty.productTitle || 'نامشخص'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">شماره سفارش</p>
                  <p className="text-lg text-gray-900">{selectedRoyalty.orderNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">مبلغ فروش</p>
                  <p className="text-lg font-semibold text-gray-900">{toPersianCurrency(selectedRoyalty.saleAmount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">درصد سهم</p>
                  <p className="text-lg text-gray-900">{toPersianNumber(selectedRoyalty.royaltyPercentage)}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">مبلغ سهم</p>
                  <p className="text-lg font-semibold text-green-600">{toPersianCurrency(selectedRoyalty.royaltyAmount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">وضعیت</p>
                  <div className="mt-1">{getStatusBadge(selectedRoyalty.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">تاریخ ایجاد</p>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedRoyalty.createdAt).toLocaleDateString('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {selectedRoyalty.paidAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">تاریخ پرداخت</p>
                    <p className="text-lg text-gray-900">
                      {new Date(selectedRoyalty.paidAt).toLocaleDateString('fa-IR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                {selectedRoyalty.settlementDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">تاریخ تسویه</p>
                    <p className="text-lg text-gray-900">
                      {new Date(selectedRoyalty.settlementDate).toLocaleDateString('fa-IR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {selectedRoyalty.notes && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">یادداشت</p>
                    <p className="text-lg text-gray-900">{selectedRoyalty.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t flex justify-end gap-3">
              {selectedRoyalty.status === 'Pending' && (
                <button
                  onClick={() => {
                    setShowRoyaltyModal(false);
                    handleProcessPayment(selectedRoyalty);
                  }}
                  disabled={processPaymentMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {processPaymentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      در حال پردازش...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      پرداخت سهم
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setShowRoyaltyModal(false);
                  setSelectedRoyalty(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Selection Modal */}
      {showPaymentModal && selectedRoyalty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">پرداخت سهم نویسنده</h2>
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setReceiptFile(null);
                  setReceiptUrl('');
                  setPaymentNotes('');
                  setPaymentMethod('Manual');
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">نویسنده:</p>
                <p className="font-semibold text-gray-900">{selectedRoyalty.authorName || 'نامشخص'}</p>
                <p className="text-sm text-gray-600 mt-2 mb-1">مبلغ سهم:</p>
                <p className="font-bold text-green-600 text-lg">{toPersianCurrency(selectedRoyalty.royaltyAmount)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">روش پرداخت *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Manual')}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      paymentMethod === 'Manual'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold">پرداخت دستی</div>
                    <div className="text-xs mt-1">آپلود رسید یا لینک رسید</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Gateway')}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      paymentMethod === 'Gateway'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold">پرداخت خودکار</div>
                    <div className="text-xs mt-1">از طریق درگاه پرداخت</div>
                  </button>
                </div>
              </div>

              {paymentMethod === 'Manual' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">آپلود فایل رسید</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setReceiptFile(file);
                          setReceiptUrl(''); // Clear URL when file is selected
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {receiptFile && (
                      <p className="mt-1 text-sm text-gray-600">فایل انتخاب شده: {receiptFile.name}</p>
                    )}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">یا</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">لینک رسید</label>
                    <input
                      type="text"
                      value={receiptUrl}
                      onChange={(e) => {
                        setReceiptUrl(e.target.value);
                        setReceiptFile(null); // Clear file when URL is entered
                      }}
                      placeholder="https://example.com/receipt.pdf"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {paymentMethod === 'Gateway' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    با انتخاب پرداخت خودکار، درگاه پرداخت شپا باز می‌شود و پس از پرداخت موفق، سهم نویسنده به صورت خودکار پرداخت می‌شود.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">یادداشت (اختیاری)</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  placeholder="یادداشت یا توضیحات..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setReceiptFile(null);
                  setReceiptUrl('');
                  setPaymentNotes('');
                  setPaymentMethod('Manual');
                }}
                disabled={processPaymentMutation.isPending || initiateGatewayMutation.isPending}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={processPaymentMutation.isPending || initiateGatewayMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {(processPaymentMutation.isPending || initiateGatewayMutation.isPending) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    {paymentMethod === 'Manual' ? 'پرداخت دستی' : 'شروع پرداخت خودکار'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isOpen}
        onClose={cancel}
        onConfirm={confirm}
        title={modalConfig?.title}
        message={modalConfig?.message || ''}
        confirmText={modalConfig?.confirmText}
        cancelText={modalConfig?.cancelText}
        type={modalConfig?.type}
        showCancel={modalConfig?.showCancel}
        isRtl={modalConfig?.isRtl}
      />
    </div>
  );
};

export default AdminRoyaltiesPage;
