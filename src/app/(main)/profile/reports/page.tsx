'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userReportApi, UserReportDto, UserReportListDto } from '@/services/api';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { toPersianNumber } from '@/utils/numberUtils';
import { useConfirmation } from '@/hooks/useConfirmationMo';

const UserReportsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPageSize, setReportsPageSize] = useState(12);
  const toast = useToastHelpers();
  const queryClient = useQueryClient();
  const { showConfirmation } = useConfirmation();

  const { data: reportsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['user-reports', statusFilter, reportsPage, reportsPageSize],
    queryFn: async () => {
      const response = await userReportApi.getMyReports({
        status: statusFilter || undefined,
        pageNumber: reportsPage,
        pageSize: reportsPageSize
      });
      return response.data;
    },
  });


  const reportsData: UserReportListDto | undefined = reportsResponse?.data;
  const reports: UserReportDto[] = reportsData?.reports || [];
  const totalCount = reportsData?.totalCount || 0;
  const totalPages = reportsData?.totalPages || 0;

  // Get all reports for counts (without pagination)
  const { data: allReportsResponse } = useQuery({
    queryKey: ['user-reports-all'],
    queryFn: async () => {
      const response = await userReportApi.getMyReports({
        pageNumber: 1,
        pageSize: 1000
      });
      return response.data;
    },
  });

  const allReports: UserReportDto[] = allReportsResponse?.data?.reports || [];
  const pendingCount = allReports.filter(r => r.status === 'Pending').length;
  const underReviewCount = allReports.filter(r => r.status === 'UnderReview').length;
  const resolvedCount = allReports.filter(r => r.status === 'Resolved').length;
  const dismissedCount = allReports.filter(r => r.status === 'Dismissed').length;


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            در انتظار بررسی
          </span>
        );
      case 'UnderReview':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Eye className="h-3 w-3" />
            در حال بررسی
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            حل شده
          </span>
        );
      case 'Dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3" />
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

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'User': 'کاربر',
      'Product': 'محصول',
      'Review': 'نظر'
    };
    return labels[type] || type;
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">خطا در بارگذاری گزارشات</p>
        <p className="text-sm text-gray-500 mb-4">
          {(error as any)?.response?.data?.message || (error as any)?.message || 'خطای نامشخص'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Professional Reports Header */}
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-blue-600 via-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
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
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">گزارشات من</h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">📋 مدیریت و مشاهده گزارشات ثبت شده شما 📝</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 lg:space-y-8">
          {/* Status Filter Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            <button
              onClick={() => {
                setStatusFilter('');
                setReportsPage(1);
              }}
              className={`text-center p-4 rounded-xl border-2 transition-all ${
                statusFilter === ''
                  ? 'bg-blue-100 border-blue-300 shadow-md'
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <div className="text-2xl font-bold text-blue-600 mb-1">{toPersianNumber(allReports.length)}</div>
              <div className="flex items-center justify-center gap-1 text-sm text-blue-600/80 font-medium">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                كل گزارشات
              </div>
            </button>
            <button
              onClick={() => {
                setStatusFilter('Pending');
                setReportsPage(1);
              }}
              className={`text-center p-4 rounded-xl border-2 transition-all ${
                statusFilter === 'Pending'
                  ? 'bg-yellow-100 border-yellow-300 shadow-md'
                  : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
              }`}
            >
              <div className="text-2xl font-bold text-yellow-600 mb-1">{toPersianNumber(pendingCount)}</div>
              <div className="flex items-center justify-center gap-1 text-sm text-yellow-600/80 font-medium">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                در انتظار تأیید
              </div>
            </button>
            <button
              onClick={() => {
                setStatusFilter('UnderReview');
                setReportsPage(1);
              }}
              className={`text-center p-4 rounded-xl border-2 transition-all ${
                statusFilter === 'UnderReview'
                  ? 'bg-blue-100 border-blue-300 shadow-md'
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <div className="text-2xl font-bold text-blue-600 mb-1">{toPersianNumber(underReviewCount)}</div>
              <div className="flex items-center justify-center gap-1 text-sm text-blue-600/80 font-medium">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                در حال بررسی
              </div>
            </button>
            <button
              onClick={() => {
                setStatusFilter('Resolved');
                setReportsPage(1);
              }}
              className={`text-center p-4 rounded-xl border-2 transition-all ${
                statusFilter === 'Resolved'
                  ? 'bg-green-100 border-green-300 shadow-md'
                  : 'bg-green-50 border-green-200 hover:bg-green-100'
              }`}
            >
              <div className="text-2xl font-bold text-green-600 mb-1">{toPersianNumber(resolvedCount)}</div>
              <div className="flex items-center justify-center gap-1 text-sm text-green-600/80 font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                حل شده
              </div>
            </button>
            <button
              onClick={() => {
                setStatusFilter('Dismissed');
                setReportsPage(1);
              }}
              className={`text-center p-4 rounded-xl border-2 transition-all ${
                statusFilter === 'Dismissed'
                  ? 'bg-gray-100 border-gray-300 shadow-md'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="text-2xl font-bold text-gray-600 mb-1">{toPersianNumber(dismissedCount)}</div>
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600/80 font-medium">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                رد شده
              </div>
            </button>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">هنوز گزارشی ثبت نکرده‌اید</h3>
                <p className="text-gray-600 mb-4">گزارشات خود را در مورد محصولات ثبت کنید.</p>
                <p className="text-sm text-gray-500">برای ثبت گزارش، به صفحه محصول مورد نظر مراجعه کنید و از دکمه گزارش استفاده کنید.</p>
              </div>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {getTypeLabel(report.reportType)}
                            </span>
                            <span className="text-sm text-gray-500">-</span>
                            <span className="text-sm text-gray-700">{getReasonLabel(report.reportReason)}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-500">
                              {new Date(report.createdAt).toLocaleDateString('fa-IR')}
                            </span>
                            {getStatusBadge(report.status)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {report.reportedUserName && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">کاربر گزارش شده: </span>
                            <span className="text-gray-900">{report.reportedUserName}</span>
                          </div>
                        )}
                        {report.reportedProductTitle && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">محصول گزارش شده: </span>
                            <span className="text-gray-900">{report.reportedProductTitle}</span>
                          </div>
                        )}
                        {report.reportedReviewText && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">نظر گزارش شده: </span>
                            <span className="text-gray-900 line-clamp-2">{report.reportedReviewText}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">{report.description}</p>
                      
                      {report.adminNotes && (
                        <div className="p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                          <strong className="text-blue-700">یادداشت ادمین:</strong> {report.adminNotes}
                        </div>
                      )}
                      
                      {report.resolutionAction && (
                        <div className="p-3 bg-green-50 rounded-lg text-sm text-gray-700">
                          <strong className="text-green-700">اقدام انجام شده:</strong> {report.resolutionAction}
                        </div>
                      )}
                      
                      {report.reviewedByName && (
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>بررسی شده توسط: {report.reviewedByName}</span>
                          {report.reviewedAt && (
                            <span>در تاریخ: {new Date(report.reviewedAt).toLocaleDateString('fa-IR')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={reportsPage}
                totalPages={totalPages}
                onPageChange={setReportsPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserReportsPage;

