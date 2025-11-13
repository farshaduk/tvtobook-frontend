'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminLogApi, AdminLogDto, AdminLogStatisticsDto } from '@/services/adminApi';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toPersianNumber } from '@/utils/numberUtils';

const LOG_LEVELS = [
  { value: '', label: 'همه سطوح' },
  { value: 'Error', label: 'خطا' },
  { value: 'Warning', label: 'هشدار' },
  { value: 'Information', label: 'اطلاعات' },
  { value: 'Fatal', label: 'مهلک' },
  { value: 'Debug', label: 'دیباگ' }
];

export default function AdminLogsPage() {
  const { successPersian, errorPersian } = useToastHelpers();
  const queryClient = useQueryClient();
  const { isOpen, modalConfig, showModal, confirm, cancel } = useConfirmationModal();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AdminLogDto | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

  // Fetch logs
  const { data: logsResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-logs', currentPage, pageSize, searchTerm, levelFilter, fromDate, toDate],
    queryFn: async () => {
      const response = await adminLogApi.getAll({
        page: currentPage,
        pageSize: pageSize,
        searchTerm: searchTerm || undefined,
        level: levelFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      });
      return response.data;
    },
    retry: 2,
  });

  const logs = Array.isArray(logsResponse?.data) ? logsResponse.data : [];

  // Fetch statistics
  const { data: statisticsResponse } = useQuery({
    queryKey: ['admin-logs-statistics', fromDate, toDate],
    queryFn: async () => {
      const response = await adminLogApi.getStatistics({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      });
      return response.data;
    },
    enabled: showStatistics && typeof window !== 'undefined',
  });

  const statistics = statisticsResponse?.data;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, levelFilter, fromDate, toDate]);

  // Delete log mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminLogApi.delete(id),
    onSuccess: (response) => {
      successPersian(response.data.message || 'لاگ با موفقیت حذف شد');
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در حذف لاگ');
    },
  });

  // Delete all logs mutation
  const deleteAllMutation = useMutation({
    mutationFn: (beforeDate?: string) => adminLogApi.deleteAll({ beforeDate }),
    onSuccess: (response) => {
      successPersian(response.data.message || 'لاگ‌ها با موفقیت حذف شدند');
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در حذف لاگ‌ها');
    },
  });

  const handleDeleteLog = (log: AdminLogDto) => {
    showModal({
      title: 'حذف لاگ',
      message: `آیا مطمئن هستید که می‌خواهید این لاگ را حذف کنید؟`,
      confirmText: 'حذف',
      cancelText: 'انصراف',
      onConfirm: () => {
        deleteMutation.mutate(log.id);
        cancel();
      },
      onCancel: cancel
    });
  };

  const handleDeleteAllLogs = () => {
    showModal({
      title: 'حذف همه لاگ‌ها',
      message: 'آیا مطمئن هستید که می‌خواهید همه لاگ‌ها را حذف کنید؟ این عمل قابل بازگشت نیست.',
      confirmText: 'حذف همه',
      cancelText: 'انصراف',
      onConfirm: () => {
        deleteAllMutation.mutate(undefined as any);
        cancel();
      },
      onCancel: cancel
    });
  };

  const handleViewLog = (log: AdminLogDto) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Error':
      case 'Fatal':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'Warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'Information':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'Debug':
        return <CheckCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const levelMap: { [key: string]: { label: string; color: string } } = {
      'Error': { label: 'خطا', color: 'bg-red-100 text-red-800' },
      'Warning': { label: 'هشدار', color: 'bg-yellow-100 text-yellow-800' },
      'Information': { label: 'اطلاعات', color: 'bg-blue-100 text-blue-800' },
      'Fatal': { label: 'مهلک', color: 'bg-red-200 text-red-900' },
      'Debug': { label: 'دیباگ', color: 'bg-gray-100 text-gray-800' }
    };
    const levelInfo = levelMap[level] || { label: level, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelInfo.color}`}>
        {levelInfo.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">مدیریت لاگ‌ها</h1>
        <p className="text-gray-600">مشاهده و مدیریت لاگ‌های سیستم</p>
      </div>

      {/* Statistics Toggle */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <button
          onClick={() => setShowStatistics(!showStatistics)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {showStatistics ? 'پنهان کردن آمار' : 'نمایش آمار'}
        </button>
      </div>

      {/* Statistics Panel */}
      {showStatistics && statistics && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">آمار لاگ‌ها</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">کل لاگ‌ها</div>
              <div className="text-2xl font-bold text-gray-900">{toPersianNumber(statistics.totalLogs)}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-sm text-red-600 mb-1">خطا</div>
              <div className="text-2xl font-bold text-red-900">{toPersianNumber(statistics.errorCount)}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-yellow-600 mb-1">هشدار</div>
              <div className="text-2xl font-bold text-yellow-900">{toPersianNumber(statistics.warningCount)}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-1">اطلاعات</div>
              <div className="text-2xl font-bold text-blue-900">{toPersianNumber(statistics.informationCount)}</div>
            </div>
            <div className="bg-red-100 rounded-lg p-4">
              <div className="text-sm text-red-700 mb-1">مهلک</div>
              <div className="text-2xl font-bold text-red-900">{toPersianNumber(statistics.fatalCount)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">دیباگ</div>
              <div className="text-2xl font-bold text-gray-900">{toPersianNumber(statistics.debugCount)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در پیام‌ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="relative">
            <FunnelIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 appearance-none bg-white"
            >
              {LOG_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="از تاریخ"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="تا تاریخ"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">تعداد در صفحه:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded-lg"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>
          <button
            onClick={handleDeleteAllLogs}
            disabled={deleteAllMutation.isPending}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <TrashIcon className="h-5 w-5" />
            <span>حذف همه لاگ‌ها</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">زمان</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">سطح</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">پیام</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    لاگی یافت نشد
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatDate(log.timeStamp)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getLevelIcon(log.level)}
                        {getLevelBadge(log.level)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2 max-w-2xl">
                        {log.message}
                      </div>
                      {log.exception && (
                        <div className="text-xs text-red-600 mt-1 line-clamp-1">
                          {log.exception.substring(0, 100)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewLog(log)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {logs.length > 0 && (
        <div className="mt-4 flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              قبلی
            </button>
            <span className="px-4 py-2 text-gray-700">
              صفحه {toPersianNumber(currentPage)}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={logs.length < pageSize}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              بعدی
            </button>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {showLogModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">جزئیات لاگ</h2>
                <button
                  onClick={() => {
                    setShowLogModal(false);
                    setSelectedLog(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">شناسه</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg">{selectedLog.id}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">زمان</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg">{formatDate(selectedLog.timeStamp)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سطح</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg">
                    {getLevelBadge(selectedLog.level)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">پیام</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg whitespace-pre-wrap font-mono text-sm">
                    {selectedLog.message}
                  </div>
                </div>
                {selectedLog.exception && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">استثنا</label>
                    <div className="px-3 py-2 bg-red-50 rounded-lg whitespace-pre-wrap font-mono text-sm text-red-800 max-h-64 overflow-y-auto">
                      {selectedLog.exception}
                    </div>
                  </div>
                )}
                {selectedLog.properties && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ویژگی‌ها</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg whitespace-pre-wrap font-mono text-sm max-h-64 overflow-y-auto">
                      {selectedLog.properties}
                    </div>
                  </div>
                )}
                {selectedLog.logEvent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رویداد</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg whitespace-pre-wrap font-mono text-sm max-h-64 overflow-y-auto">
                      {selectedLog.logEvent}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowLogModal(false);
                    setSelectedLog(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isOpen}
        title={modalConfig?.title}
        message={modalConfig?.message || ''}
        confirmText={modalConfig?.confirmText}
        cancelText={modalConfig?.cancelText}
        onConfirm={confirm}
        onClose={cancel}
      />
    </div>
  );
}



