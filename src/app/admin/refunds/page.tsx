'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundApi, RefundDto, ProcessRefundRequest, RefundListDto } from '@/services/api';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { Pagination } from '@/components/ui/pagination';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toPersianCurrency } from '@/utils/numberUtils';

const AdminRefundsPage: React.FC = () => {
  const [selectedRefund, setSelectedRefund] = useState<RefundDto | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [refundsPage, setRefundsPage] = useState(1);
  const [refundsPageSize, setRefundsPageSize] = useState(10);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [processData, setProcessData] = useState({ approve: true, adminNotes: '', rejectionReason: '', gatewayRefundId: '', gatewayResponse: '' });
  const toast = useToastHelpers();
  const queryClient = useQueryClient();

  const { data: refundsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-refunds', statusFilter, refundsPage, refundsPageSize],
    queryFn: async () => {
      const response = await refundApi.getAll(statusFilter || undefined, refundsPage, refundsPageSize);
      return response.data;
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: (data: ProcessRefundRequest) => refundApi.process(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      setShowRefundModal(false);
      setProcessData({ approve: true, adminNotes: '', rejectionReason: '', gatewayRefundId: '', gatewayResponse: '' });
      setRefundsPage(1);
      toast.successPersian(response.data.message || 'بازگشت وجه با موفقیت پردازش شد');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در پردازش بازگشت وجه');
      setActionLoading(null);
    },
  });

  const refundsData: RefundListDto | undefined = refundsResponse?.data;
  const refunds: RefundDto[] = refundsData?.items || [];
  const totalCount = refundsData?.totalCount || 0;
  const totalPages = refundsData?.totalPages || 0;

  const handleProcessRefund = (refundId: string, approve: boolean) => {
    setActionLoading(refundId);
    const data: ProcessRefundRequest = {
      refundId,
      approve,
      adminNotes: processData.adminNotes || undefined,
      rejectionReason: approve ? undefined : processData.rejectionReason || undefined,
      gatewayRefundId: approve ? (processData.gatewayRefundId || undefined) : undefined,
      gatewayResponse: approve ? (processData.gatewayResponse || undefined) : undefined,
    };
    processRefundMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const config: { [key: string]: { color: string; icon: any; label: string } } = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'در انتظار' },
      'Approved': { color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, label: 'تایید شده' },
      'Completed': { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'تکمیل شده' },
      'Rejected': { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'رد شده' },
      'Processing': { color: 'bg-purple-100 text-purple-800', icon: ClockIcon, label: 'در حال پردازش' }
    };
    const { color, icon: Icon, label } = config[status] || { color: 'bg-gray-100 text-gray-800', icon: ClockIcon, label: status };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">خطا در بارگذاری بازگشت‌های وجه</p>
        <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت بازگشت‌های وجه</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium">فیلتر وضعیت:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setRefundsPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="Pending">در انتظار</option>
            <option value="Approved">تایید شده</option>
            <option value="Processing">در حال پردازش</option>
            <option value="Completed">تکمیل شده</option>
            <option value="Rejected">رد شده</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شماره بازگشت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ درخواست</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {totalCount === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    هیچ درخواست بازگشت وجهی یافت نشد
                  </td>
                </tr>
              ) : (
                refunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{refund.refundNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{toPersianCurrency(refund.refundAmount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {refund.refundType === 'Full' ? 'کامل' : 'جزئی'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(refund.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(refund.requestedAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                      setSelectedRefund(refund);
                      setShowRefundModal(true);
                      setProcessData({ approve: true, adminNotes: '', rejectionReason: '', gatewayRefundId: '', gatewayResponse: '' });
                        }}
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
          <div className="mt-6 px-6 pb-4">
            <Pagination
              currentPage={refundsPage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={refundsPageSize}
              onPageChange={(page) => setRefundsPage(page)}
              onPageSizeChange={(size) => {
                setRefundsPageSize(size);
                setRefundsPage(1);
              }}
              showPageSize={true}
              showInfo={true}
            />
          </div>
        )}
      </div>

      {showRefundModal && selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">جزئیات بازگشت وجه</h2>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedRefund(null);
                  setProcessData({ approve: true, adminNotes: '', rejectionReason: '', gatewayRefundId: '', gatewayResponse: '' });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">شماره درخواست</p>
                  <p className="font-semibold text-gray-900">{selectedRefund.refundNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">مبلغ</p>
                  <p className="font-semibold text-green-600">{toPersianCurrency(selectedRefund.refundAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">نوع بازگشت</p>
                  <p className="font-semibold text-gray-900">{selectedRefund.refundType === 'Full' ? 'کامل' : 'جزئی'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">وضعیت</p>
                  <div>{getStatusBadge(selectedRefund.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">تاریخ درخواست</p>
                  <p className="font-semibold text-gray-900">{new Date(selectedRefund.requestedAt).toLocaleDateString('fa-IR')}</p>
                </div>
                {selectedRefund.processedAt && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">تاریخ پردازش</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedRefund.processedAt).toLocaleDateString('fa-IR')}</p>
                  </div>
                )}
                {selectedRefund.completedAt && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">تاریخ تکمیل</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedRefund.completedAt).toLocaleDateString('fa-IR')}</p>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">دلیل درخواست</p>
                <p className="p-3 bg-gray-50 rounded-lg text-gray-900">{selectedRefund.reason}</p>
              </div>
              
              {selectedRefund.adminNotes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">یادداشت مدیر</p>
                  <p className="p-3 bg-blue-50 rounded-lg text-gray-900">{selectedRefund.adminNotes}</p>
                </div>
              )}
              
              {selectedRefund.rejectionReason && (
                <div>
                  <p className="text-sm text-red-600 mb-1">دلیل رد</p>
                  <p className="p-3 bg-red-50 rounded-lg text-gray-900">{selectedRefund.rejectionReason}</p>
                </div>
              )}

              {selectedRefund.gatewayRefundId && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">شناسه بازگشت درگاه</p>
                  <p className="font-semibold text-gray-900">{selectedRefund.gatewayRefundId}</p>
                </div>
              )}

              {(selectedRefund.userFirstName || selectedRefund.userLastName || selectedRefund.userEmail || selectedRefund.userPhoneNumber) && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">اطلاعات کاربر</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      {(selectedRefund.userFirstName || selectedRefund.userLastName) && (
                        <div>
                          <p className="text-xs text-gray-500">نام و نام خانوادگی</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedRefund.userFirstName || ''} {selectedRefund.userLastName || ''}
                          </p>
                        </div>
                      )}
                      {selectedRefund.userEmail && (
                        <div>
                          <p className="text-xs text-gray-500">ایمیل</p>
                          <p className="text-sm font-medium text-gray-900">{selectedRefund.userEmail}</p>
                        </div>
                      )}
                      {selectedRefund.userPhoneNumber && (
                        <div>
                          <p className="text-xs text-gray-500">تلفن</p>
                          <p className="text-sm font-medium text-gray-900">{selectedRefund.userPhoneNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedRefund.status === 'Pending' && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">یادداشت مدیر</label>
                  <textarea
                    placeholder="یادداشت خود را وارد کنید..."
                    value={processData.adminNotes}
                    onChange={(e) => setProcessData({ ...processData, adminNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">شناسه بازگشت وجه درگاه (برای پردازش دستی - اختیاری)</label>
                  <input
                    type="text"
                    placeholder="در صورت پردازش دستی، شناسه بازگشت وجه درگاه را وارد کنید..."
                    value={processData.gatewayRefundId}
                    onChange={(e) => setProcessData({ ...processData, gatewayRefundId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">اگر پرداخت از طریق Shepa انجام شده باشد، به صورت خودکار پردازش می‌شود. در غیر این صورت، این فیلد را پر کنید.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">پاسخ درگاه (برای پردازش دستی - اختیاری)</label>
                  <textarea
                    placeholder="در صورت پردازش دستی، پاسخ درگاه را وارد کنید..."
                    value={processData.gatewayResponse}
                    onChange={(e) => setProcessData({ ...processData, gatewayResponse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">دلیل رد (در صورت رد درخواست)</label>
                  <textarea
                    placeholder="دلیل رد درخواست را وارد کنید..."
                    value={processData.rejectionReason}
                    onChange={(e) => setProcessData({ ...processData, rejectionReason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleProcessRefund(selectedRefund.id, true)}
                    disabled={actionLoading === selectedRefund.id || processRefundMutation.isPending}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === selectedRefund.id || processRefundMutation.isPending ? 'در حال پردازش...' : 'تایید و پردازش'}
                  </button>
                  <button
                    onClick={() => {
                      if (!processData.rejectionReason || processData.rejectionReason.trim() === '') {
                        toast.errorPersian('لطفاً دلیل رد را وارد کنید');
                        return;
                      }
                      handleProcessRefund(selectedRefund.id, false);
                    }}
                    disabled={actionLoading === selectedRefund.id || processRefundMutation.isPending}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === selectedRefund.id || processRefundMutation.isPending ? 'در حال پردازش...' : 'رد درخواست'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRefundsPage;
