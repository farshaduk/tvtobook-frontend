'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUserReportApi, AdminUserReportDto, AdminUserReportListDto } from '@/services/adminApi';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { Pagination } from '@/components/ui/pagination';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toPersianNumber } from '@/utils/numberUtils';

const AdminUserReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<AdminUserReportDto | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [reasonFilter, setReasonFilter] = useState<string>('');
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPageSize, setReportsPageSize] = useState(10);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [resolutionAction, setResolutionAction] = useState<string>('');
  const toast = useToastHelpers();
  const queryClient = useQueryClient();

  const { data: reportsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-user-reports', statusFilter, typeFilter, reasonFilter, reportsPage, reportsPageSize],
    queryFn: async () => {
      const response = await adminUserReportApi.getAllReports({
        status: statusFilter || undefined,
        reportType: typeFilter || undefined,
        reportReason: reasonFilter || undefined,
        pageNumber: reportsPage,
        pageSize: reportsPageSize
      });
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; adminNotes?: string; resolutionAction?: string } }) => 
      adminUserReportApi.updateStatus(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-reports'] });
      setShowReportModal(false);
      setReportsPage(1);
      toast.successPersian(response.data.message || 'وضعیت گزارش با موفقیت به‌روزرسانی شد');
      setActionLoading(null);
      setUpdateStatus('');
      setAdminNotes('');
      setResolutionAction('');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در به‌روزرسانی وضعیت گزارش');
      setActionLoading(null);
    },
  });

  const reportsData: AdminUserReportListDto | undefined = reportsResponse?.data;
  const reports: AdminUserReportDto[] = reportsData?.reports || [];
  const totalCount = reportsData?.totalCount || 0;
  const totalPages = reportsData?.totalPages || 0;

  const handleUpdateStatus = (reportId: string) => {
    if (!updateStatus) {
      toast.errorPersian('لطفاً وضعیت را انتخاب کنید');
      return;
    }
    setActionLoading(reportId);
    updateStatusMutation.mutate({
      id: reportId,
      data: {
        status: updateStatus,
        adminNotes: adminNotes || undefined,
        resolutionAction: resolutionAction || undefined
      }
    });
  };

  const handleViewReport = async (reportId: string) => {
    try {
      const response = await adminUserReportApi.getReport(reportId);
      if (response.data.isSucceeded && response.data.data) {
        setSelectedReport(response.data.data);
        setUpdateStatus(response.data.data.status);
        setAdminNotes(response.data.data.adminNotes || '');
        setResolutionAction(response.data.data.resolutionAction || '');
        setShowReportModal(true);
      }
    } catch (error: any) {
      toast.errorPersian(error.response?.data?.message || 'خطا در دریافت جزئیات گزارش');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3 w-3" />
            در انتظار بررسی
          </span>
        );
      case 'UnderReview':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <EyeIcon className="h-3 w-3" />
            در حال بررسی
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3" />
            حل شده
          </span>
        );
      case 'Dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircleIcon className="h-3 w-3" />
            رد شده
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: { [key: string]: string } = {
      'User': 'bg-purple-100 text-purple-800',
      'Product': 'bg-blue-100 text-blue-800',
      'Review': 'bg-orange-100 text-orange-800'
    };
    const labels: { [key: string]: string } = {
      'User': 'کاربر',
      'Product': 'محصول',
      'Review': 'نظر'
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type] || type}
      </span>
    );
  };

  const getReasonLabel = (reason: string) => {
    const labels: { [key: string]: string } = {
      'InappropriateContent': 'محتوای نامناسب',
      'Copyright': 'نقض حق تکثیر',
      'Other': 'سایر'
    };
    return labels[reason] || reason;
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
        <p className="text-red-800">خطا در بارگذاری گزارشات</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">گزارشات کاربران</h1>
            <p className="text-sm text-gray-500 mt-1">مدیریت و بررسی گزارشات ارسالی توسط کاربران</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setReportsPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">همه</option>
              <option value="Pending">در انتظار بررسی</option>
              <option value="UnderReview">در حال بررسی</option>
              <option value="Resolved">حل شده</option>
              <option value="Dismissed">رد شده</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع گزارش</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setReportsPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">همه</option>
              <option value="User">کاربر</option>
              <option value="Product">محصول</option>
              <option value="Review">نظر</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">دلیل گزارش</label>
              <select
                value={reasonFilter}
                onChange={(e) => {
                  setReasonFilter(e.target.value);
                  setReportsPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">همه</option>
                <option value="InappropriateContent">محتوای نامناسب</option>
                <option value="Copyright">نقض حق تکثیر</option>
                <option value="Other">سایر</option>
              </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
                setReasonFilter('');
                setReportsPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              پاک کردن فیلترها
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">گزارش‌دهنده</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">دلیل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    هیچ گزارشی یافت نشد
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.reporterName}</div>
                      <div className="text-sm text-gray-500">{report.reporterEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(report.reportType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getReasonLabel(report.reportReason)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewReport(report.id)}
                        className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                      >
                        <EyeIcon className="h-4 w-4" />
                        مشاهده
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={reportsPage}
              totalPages={totalPages}
              onPageChange={setReportsPage}
            />
          </div>
        )}

        {/* Report Details Modal */}
        {showReportModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">جزئیات گزارش</h2>
                  <button
                    onClick={() => {
                      setShowReportModal(false);
                      setSelectedReport(null);
                      setUpdateStatus('');
                      setAdminNotes('');
                      setResolutionAction('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">گزارش‌دهنده</label>
                      <p className="text-sm text-gray-900">{selectedReport.reporterName}</p>
                      <p className="text-xs text-gray-500">{selectedReport.reporterEmail}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">نوع گزارش</label>
                      {getTypeBadge(selectedReport.reportType)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">دلیل</label>
                      <p className="text-sm text-gray-900">{getReasonLabel(selectedReport.reportReason)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت</label>
                      {getStatusBadge(selectedReport.status)}
                    </div>
                    {selectedReport.reportedUserName && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">کاربر گزارش شده</label>
                        <p className="text-sm text-gray-900">{selectedReport.reportedUserName}</p>
                      </div>
                    )}
                    {selectedReport.reportedProductTitle && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">محصول گزارش شده</label>
                        <p className="text-sm text-gray-900">{selectedReport.reportedProductTitle}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReport.description}</p>
                  </div>

                  {selectedReport.adminNotes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">یادداشت ادمین</label>
                      <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg">{selectedReport.adminNotes}</p>
                    </div>
                  )}

                  {selectedReport.resolutionAction && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">اقدام انجام شده</label>
                      <p className="text-sm text-gray-900 bg-green-50 p-3 rounded-lg">{selectedReport.resolutionAction}</p>
                    </div>
                  )}

                  {selectedReport.reviewedByName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">بررسی شده توسط</label>
                      <p className="text-sm text-gray-900">{selectedReport.reviewedByName}</p>
                      {selectedReport.reviewedAt && (
                        <p className="text-xs text-gray-500">{new Date(selectedReport.reviewedAt).toLocaleDateString('fa-IR')}</p>
                      )}
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">به‌روزرسانی وضعیت</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت جدید</label>
                        <select
                          value={updateStatus}
                          onChange={(e) => setUpdateStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="Pending">در انتظار بررسی</option>
                          <option value="UnderReview">در حال بررسی</option>
                          <option value="Resolved">حل شده</option>
                          <option value="Dismissed">رد شده</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">یادداشت ادمین</label>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="یادداشت خود را وارد کنید..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">اقدام انجام شده</label>
                        <input
                          type="text"
                          value={resolutionAction}
                          onChange={(e) => setResolutionAction(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="مثلاً: اخطار، تعلیق حساب، حذف محتوا"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(selectedReport.id)}
                          disabled={actionLoading === selectedReport.id}
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === selectedReport.id ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                        </button>
                        <button
                          onClick={() => {
                            setShowReportModal(false);
                            setSelectedReport(null);
                            setUpdateStatus('');
                            setAdminNotes('');
                            setResolutionAction('');
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserReportsPage;

