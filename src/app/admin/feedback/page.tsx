'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminContactFeedbackApi, AdminContactFeedbackDto, AdminContactFeedbackListDto } from '@/services/adminApi';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { Pagination } from '@/components/ui/pagination';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { toPersianNumber } from '@/utils/numberUtils';

const AdminFeedbackPage: React.FC = () => {
  const [selectedFeedback, setSelectedFeedback] = useState<AdminContactFeedbackDto | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [feedbacksPage, setFeedbacksPage] = useState(1);
  const [feedbacksPageSize, setFeedbacksPageSize] = useState(10);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const toast = useToastHelpers();
  const queryClient = useQueryClient();

  const { data: feedbacksResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-feedbacks', statusFilter, categoryFilter, feedbacksPage, feedbacksPageSize],
    queryFn: async () => {
      const response = await adminContactFeedbackApi.getAllFeedbacks({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        pageNumber: feedbacksPage,
        pageSize: feedbacksPageSize
      });
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; adminNotes?: string; response?: string } }) => 
      adminContactFeedbackApi.updateStatus(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] });
      setShowFeedbackModal(false);
      setFeedbacksPage(1);
      toast.successPersian(response.data.message || 'وضعیت بازخورد با موفقیت به‌روزرسانی شد');
      setActionLoading(null);
      setUpdateStatus('');
      setAdminNotes('');
      setResponse('');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در به‌روزرسانی وضعیت بازخورد');
      setActionLoading(null);
    },
  });

  const feedbacksData: AdminContactFeedbackListDto | undefined = feedbacksResponse?.data;
  const feedbacks: AdminContactFeedbackDto[] = feedbacksData?.feedbacks || [];
  const totalCount = feedbacksData?.totalCount || 0;
  const totalPages = feedbacksData?.totalPages || 0;

  const handleUpdateStatus = (feedbackId: string) => {
    if (!updateStatus) {
      toast.errorPersian('لطفاً وضعیت را انتخاب کنید');
      return;
    }
    setActionLoading(feedbackId);
    updateStatusMutation.mutate({
      id: feedbackId,
      data: {
        status: updateStatus,
        adminNotes: adminNotes || undefined,
        response: response || undefined
      }
    });
  };

  const handleViewFeedback = async (feedbackId: string) => {
    try {
      const response = await adminContactFeedbackApi.getFeedback(feedbackId);
      if (response.data.isSucceeded && response.data.data) {
        setSelectedFeedback(response.data.data);
        setUpdateStatus(response.data.data.status);
        setAdminNotes(response.data.data.adminNotes || '');
        setResponse(response.data.data.response || '');
        setShowFeedbackModal(true);
      }
    } catch (error: any) {
      toast.errorPersian(error.response?.data?.message || 'خطا در دریافت جزئیات بازخورد');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      'New': { label: 'جدید', color: 'bg-blue-100 text-blue-800' },
      'Read': { label: 'خوانده شده', color: 'bg-gray-100 text-gray-800' },
      'InProgress': { label: 'در حال بررسی', color: 'bg-yellow-100 text-yellow-800' },
      'Resolved': { label: 'حل شده', color: 'bg-green-100 text-green-800' },
      'Closed': { label: 'بسته شده', color: 'bg-gray-100 text-gray-800' }
    };
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'general': 'عمومی',
      'technical': 'مشکل فنی',
      'billing': 'صورت حساب',
      'suggestion': 'پیشنهاد',
      'complaint': 'شکایت'
    };
    return labels[category] || category;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">خطا در بارگذاری بازخوردها</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">مدیریت بازخوردها</h1>
            <p className="text-sm text-gray-500 mt-1">مدیریت و بررسی بازخوردهای کاربران</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">فیلتر وضعیت</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setFeedbacksPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">همه</option>
              <option value="New">جدید</option>
              <option value="Read">خوانده شده</option>
              <option value="InProgress">در حال بررسی</option>
              <option value="Resolved">حل شده</option>
              <option value="Closed">بسته شده</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">فیلتر دسته‌بندی</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setFeedbacksPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">همه</option>
              <option value="general">عمومی</option>
              <option value="technical">مشکل فنی</option>
              <option value="billing">صورت حساب</option>
              <option value="suggestion">پیشنهاد</option>
              <option value="complaint">شکایت</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تعداد در صفحه</label>
            <select
              value={feedbacksPageSize}
              onChange={(e) => {
                setFeedbacksPageSize(Number(e.target.value));
                setFeedbacksPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ایمیل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">موضوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">دسته‌بندی</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    بازخوردی یافت نشد
                  </td>
                </tr>
              ) : (
                feedbacks.map((feedback) => (
                  <tr key={feedback.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{feedback.name}</div>
                      {feedback.userName && (
                        <div className="text-xs text-gray-500">کاربر: {feedback.userName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{feedback.email}</div>
                      {feedback.phoneNumber && (
                        <div className="text-xs text-gray-500">{feedback.phoneNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{feedback.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{getCategoryLabel(feedback.category)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(feedback.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(feedback.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewFeedback(feedback.id)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={feedbacksPage}
              totalPages={totalPages}
              onPageChange={setFeedbacksPage}
            />
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {showFeedbackModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">جزئیات بازخورد</h2>
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedFeedback(null);
                    setUpdateStatus('');
                    setAdminNotes('');
                    setResponse('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
                    <p className="text-sm text-gray-900">{selectedFeedback.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
                    <p className="text-sm text-gray-900">{selectedFeedback.email}</p>
                  </div>
                  {selectedFeedback.phoneNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">شماره تماس</label>
                      <p className="text-sm text-gray-900">{selectedFeedback.phoneNumber}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
                    <p className="text-sm text-gray-900">{getCategoryLabel(selectedFeedback.category)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">موضوع</label>
                  <p className="text-sm text-gray-900">{selectedFeedback.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">پیام</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>

                {selectedFeedback.response && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">پاسخ ادمین</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedFeedback.response}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت *</label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="New">جدید</option>
                    <option value="Read">خوانده شده</option>
                    <option value="InProgress">در حال بررسی</option>
                    <option value="Resolved">حل شده</option>
                    <option value="Closed">بسته شده</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">یادداشت ادمین</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="یادداشت داخلی..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">پاسخ به کاربر</label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="پاسخ خود را وارد کنید..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedFeedback.id)}
                    disabled={actionLoading === selectedFeedback.id}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === selectedFeedback.id ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                  </button>
                  <button
                    onClick={() => {
                      setShowFeedbackModal(false);
                      setSelectedFeedback(null);
                      setUpdateStatus('');
                      setAdminNotes('');
                      setResponse('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    بستن
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackPage;



