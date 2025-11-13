'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCouponApi, AdminCouponDto, AdminCouponListDto, AdminCreateCouponDto, AdminUpdateCouponDto } from '@/services/adminApi';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { 
  PencilIcon, 
  TrashIcon,
  PlusIcon,
  TicketIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toPersianNumber, toPersianCurrency } from '@/utils/numberUtils';

export default function AdminCouponsPage() {
  const { successPersian, errorPersian } = useToastHelpers();
  const queryClient = useQueryClient();
  const { isOpen, modalConfig, showModal, confirm, cancel } = useConfirmationModal();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCouponDto | null>(null);
  const [newCoupon, setNewCoupon] = useState<AdminCreateCouponDto>({
    code: '',
    name: '',
    description: '',
    discountType: 'Percentage',
    discountValue: 0,
    maxUsageCount: undefined,
    maxUsagePerUser: undefined,
    validFrom: '',
    validTo: '',
    minimumPurchaseAmount: undefined,
    maximumDiscountAmount: undefined,
    isApplicableToAllProducts: true,
    applicableProductIds: undefined,
    applicableCategoryIds: undefined,
    isApplicableToAllUsers: true
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterActive]);

  // Fetch coupons with pagination
  const { data: couponsResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-coupons', currentPage, searchTerm, filterActive],
    queryFn: async () => {
      const response = await adminCouponApi.getAll({
        pageNumber: currentPage,
        pageSize: 20,
        searchTerm: searchTerm || undefined,
        isActive: filterActive !== null ? filterActive : undefined
      });
      return response.data;
    },
    retry: 2,
  });

  const coupons = couponsResponse?.data?.coupons || [];
  const pagination = couponsResponse?.data;

  // Create coupon mutation
  const createMutation = useMutation({
    mutationFn: (data: AdminCreateCouponDto) => adminCouponApi.create(data),
    onSuccess: (response) => {
      successPersian(response.data.message || 'کوپن با موفقیت ایجاد شد');
      setIsCreateModalOpen(false);
      setNewCoupon({
        code: '',
        name: '',
        description: '',
        discountType: 'Percentage',
        discountValue: 0,
        maxUsageCount: undefined,
        maxUsagePerUser: undefined,
        validFrom: '',
        validTo: '',
        minimumPurchaseAmount: undefined,
        maximumDiscountAmount: undefined,
        isApplicableToAllProducts: true,
        applicableProductIds: undefined,
        applicableCategoryIds: undefined,
        isApplicableToAllUsers: true
      });
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در ایجاد کوپن');
    },
  });

  // Update coupon mutation
  const updateMutation = useMutation({
    mutationFn: (data: AdminUpdateCouponDto) => adminCouponApi.update(data),
    onSuccess: (response) => {
      successPersian(response.data.message || 'کوپن با موفقیت بروزرسانی شد');
      setIsEditModalOpen(false);
      setEditingCoupon(null);
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در بروزرسانی کوپن');
    },
  });

  // Delete coupon mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCouponApi.delete(id),
    onSuccess: (response) => {
      successPersian(response.data.message || 'کوپن با موفقیت حذف شد');
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در حذف کوپن');
    },
  });

  const handleCreateCoupon = () => {
    if (!newCoupon.code.trim() || !newCoupon.name.trim()) {
      errorPersian('لطفاً کد و نام کوپن را وارد کنید');
      return;
    }
    if (!newCoupon.validFrom || !newCoupon.validTo) {
      errorPersian('لطفاً تاریخ شروع و پایان را وارد کنید');
      return;
    }
    if (new Date(newCoupon.validFrom) >= new Date(newCoupon.validTo)) {
      errorPersian('تاریخ پایان باید بعد از تاریخ شروع باشد');
      return;
    }
    createMutation.mutate(newCoupon);
  };

  const handleUpdateCoupon = () => {
    if (!editingCoupon) return;
    if (editingCoupon.name && !editingCoupon.name.trim()) {
      errorPersian('لطفاً نام کوپن را وارد کنید');
      return;
    }
    updateMutation.mutate({
      id: editingCoupon.id,
      name: editingCoupon.name,
      description: editingCoupon.description,
      maxUsageCount: editingCoupon.maxUsageCount,
      validFrom: editingCoupon.validFrom,
      validTo: editingCoupon.validTo,
      isActive: editingCoupon.isActive
    });
  };

  const handleDeleteCoupon = (coupon: AdminCouponDto) => {
    showModal({
      title: 'حذف کوپن',
      message: `آیا مطمئن هستید که می‌خواهید کوپن "${coupon.name}" (${coupon.code}) را حذف کنید؟`,
      confirmText: 'حذف',
      cancelText: 'انصراف',
      type: 'warning',
      isRtl: true,
      onConfirm: () => {
        deleteMutation.mutate(coupon.id);
      }
    });
  };

  const handleEditCoupon = (coupon: AdminCouponDto) => {
    setEditingCoupon({
      ...coupon,
      name: coupon.name || '',
      description: coupon.description || ''
    });
    setIsEditModalOpen(true);
  };

  const getStatusBadge = (coupon: AdminCouponDto) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validTo = new Date(coupon.validTo);

    if (!coupon.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="h-3 w-3" />
          غیرفعال
        </span>
      );
    }

    if (now < validFrom) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <ClockIcon className="h-3 w-3" />
          در انتظار
        </span>
      );
    }

    if (now > validTo) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircleIcon className="h-3 w-3" />
          منقضی شده
        </span>
      );
    }

    if (coupon.maxUsageCount && coupon.currentUsageCount >= coupon.maxUsageCount) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <XCircleIcon className="h-3 w-3" />
          تمام شده
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

  const totalCoupons = pagination?.totalCount ?? 0;
  const activeCoupons = coupons.filter(c => c.isActive).length;
  const expiredCoupons = coupons.filter(c => new Date(c.validTo) < new Date()).length;

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">مدیریت کوپن‌ها</h1>
            <p className="text-gray-600 mt-2">مشاهده و مدیریت کوپن‌های تخفیف</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            ایجاد کوپن جدید
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">کل کوپن‌ها</p>
                  <p className="text-4xl font-bold">{toPersianNumber(totalCoupons)}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <TicketIcon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">کوپن‌های فعال</p>
                  <p className="text-4xl font-bold">{toPersianNumber(activeCoupons)}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <CheckCircleIcon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">منقضی شده</p>
                  <p className="text-4xl font-bold">{toPersianNumber(expiredCoupons)}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <ClockIcon className="h-10 w-10 text-white" />
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
                placeholder="جستجو بر اساس کد، نام یا توضیحات..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                dir="rtl"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterActive === null ? '' : filterActive.toString()}
                onChange={(e) => setFilterActive(e.target.value === '' ? null : e.target.value === 'true')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                dir="rtl"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="true">فعال</option>
                <option value="false">غیرفعال</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  کد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نام
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نوع تخفیف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  مقدار
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  استفاده
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اعتبار
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وضعیت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.length > 0 ? (
                coupons.map((coupon: AdminCouponDto) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {coupon.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {coupon.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {coupon.discountType === 'Percentage' ? 'درصدی' : 'مبلغ ثابت'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {coupon.discountType === 'Percentage' 
                        ? `${toPersianNumber(coupon.discountValue)}%`
                        : toPersianCurrency(coupon.discountValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {toPersianNumber(coupon.currentUsageCount)} / {coupon.maxUsageCount ? toPersianNumber(coupon.maxUsageCount) : '∞'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(coupon.validFrom).toLocaleDateString('fa-IR')} - {new Date(coupon.validTo).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(coupon)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditCoupon(coupon)}
                          className="text-purple-600 hover:text-purple-900"
                          title="ویرایش"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon)}
                          className="text-red-600 hover:text-red-900"
                          title="حذف"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || filterActive !== null ? 'نتیجه‌ای برای فیلترهای اعمال شده یافت نشد.' : 'هیچ کوپنی یافت نشد.'}
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
                  <span className="font-medium">{pagination.totalCount || 0}</span> کوپن
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

      {/* Create Coupon Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">ایجاد کوپن جدید</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">کد کوپن *</label>
                  <input
                    type="text"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="مثلاً: SUMMER2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نام *</label>
                  <input
                    type="text"
                    value={newCoupon.name}
                    onChange={(e) => setNewCoupon({ ...newCoupon, name: e.target.value })}
                    placeholder="نام کوپن"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات *</label>
                <textarea
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  rows={3}
                  placeholder="توضیحات کوپن"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع تخفیف *</label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Percentage">درصدی</option>
                    <option value="FixedAmount">مبلغ ثابت</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">مقدار تخفیف *</label>
                  <input
                    type="number"
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: parseFloat(e.target.value) || 0 })}
                    placeholder={newCoupon.discountType === 'Percentage' ? 'مثلاً: 20' : 'مثلاً: 50000'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ شروع *</label>
                  <input
                    type="datetime-local"
                    value={newCoupon.validFrom}
                    onChange={(e) => setNewCoupon({ ...newCoupon, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ پایان *</label>
                  <input
                    type="datetime-local"
                    value={newCoupon.validTo}
                    onChange={(e) => setNewCoupon({ ...newCoupon, validTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">حداکثر تعداد استفاده</label>
                  <input
                    type="number"
                    value={newCoupon.maxUsageCount || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxUsageCount: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="خالی = نامحدود"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">حداکثر استفاده برای هر کاربر</label>
                  <input
                    type="number"
                    value={newCoupon.maxUsagePerUser || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxUsagePerUser: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="خالی = نامحدود"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">حداقل مبلغ خرید</label>
                  <input
                    type="number"
                    value={newCoupon.minimumPurchaseAmount || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minimumPurchaseAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="خالی = بدون محدودیت"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">حداکثر مبلغ تخفیف (برای درصدی)</label>
                  <input
                    type="number"
                    value={newCoupon.maximumDiscountAmount || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maximumDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="خالی = بدون محدودیت"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newCoupon.isApplicableToAllProducts}
                    onChange={(e) => setNewCoupon({ ...newCoupon, isApplicableToAllProducts: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">قابل استفاده برای همه محصولات</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newCoupon.isApplicableToAllUsers}
                    onChange={(e) => setNewCoupon({ ...newCoupon, isApplicableToAllUsers: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">قابل استفاده برای همه کاربران</span>
                </label>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleCreateCoupon}
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    در حال ایجاد...
                  </>
                ) : (
                  'ایجاد کوپن'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Coupon Modal */}
      {isEditModalOpen && editingCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">ویرایش کوپن</h2>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCoupon(null);
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
                <p className="text-sm text-gray-600 mb-1">کد کوپن:</p>
                <p className="font-semibold text-gray-900">{editingCoupon.code}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام</label>
                <input
                  type="text"
                  value={editingCoupon.name}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات</label>
                <textarea
                  value={editingCoupon.description || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">حداکثر تعداد استفاده</label>
                  <input
                    type="number"
                    value={editingCoupon.maxUsageCount || ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, maxUsageCount: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
                  <select
                    value={editingCoupon.isActive.toString()}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="true">فعال</option>
                    <option value="false">غیرفعال</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ شروع</label>
                  <input
                    type="datetime-local"
                    value={editingCoupon.validFrom ? new Date(editingCoupon.validFrom).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ پایان</label>
                  <input
                    type="datetime-local"
                    value={editingCoupon.validTo ? new Date(editingCoupon.validTo).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, validTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCoupon(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleUpdateCoupon}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    در حال بروزرسانی...
                  </>
                ) : (
                  'ذخیره تغییرات'
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
}
