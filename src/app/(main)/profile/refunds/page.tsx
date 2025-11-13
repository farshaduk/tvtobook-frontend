'use client';

import React, { useState } from 'react';
import { RefreshCw, Loader2, Plus, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundApi, RefundDto, CreateRefundRequest, orderApi, OrderDto, RefundListDto } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { Pagination } from '@/components/ui/pagination';
import { toPersianNumber, toPersianCurrency } from '@/utils/numberUtils';

const RefundsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [refundsPage, setRefundsPage] = useState(1);
  const [refundsPageSize, setRefundsPageSize] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundDto | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const { user } = useAuth();
  const toast = useToastHelpers();
  const queryClient = useQueryClient();

  const { data: refundsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['my-refunds', user?.id, statusFilter, refundsPage, refundsPageSize],
    queryFn: async () => {
      const response = await refundApi.getMyRefunds(refundsPage, refundsPageSize);
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
  });

  const { data: ordersResponse } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      const response = await orderApi.getMyOrders();
      return response.data;
    },
    enabled: !!user?.id && showCreateModal && typeof window !== 'undefined',
  });

  const refundsData: RefundListDto | undefined = refundsResponse?.data;
  const refunds: RefundDto[] = refundsData?.items || [];
  const totalCount = refundsData?.totalCount || 0;
  const totalPages = refundsData?.totalPages || 0;
  const orders: OrderDto[] = ordersResponse?.data || [];

  const createRefundMutation = useMutation({
    mutationFn: (data: CreateRefundRequest) => refundApi.request(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-refunds'] });
      setShowCreateModal(false);
      setSelectedOrderId('');
      setRefundsPage(1);
      toast.successPersian('درخواست بازگشت وجه با موفقیت ثبت شد');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در ثبت درخواست بازگشت وجه');
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      'Pending': { label: 'در انتظار', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Approved': { label: 'تأیید شده', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Rejected': { label: 'رد شده', className: 'bg-red-100 text-red-800', icon: XCircle },
      'Processing': { label: 'در حال پردازش', className: 'bg-blue-100 text-blue-800', icon: Clock },
      'Completed': { label: 'تکمیل شده', className: 'bg-green-100 text-green-800', icon: CheckCircle },
    };
    
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleCreateRefund = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const orderItemIdValue = formData.get('orderItemId') as string;
    const data: CreateRefundRequest = {
      orderId: formData.get('orderId') as string,
      orderItemId: orderItemIdValue && orderItemIdValue !== '' ? orderItemIdValue : undefined,
      reason: formData.get('reason') as string,
    };
    createRefundMutation.mutate(data);
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

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
        <p className="text-red-500">خطا در بارگذاری درخواست‌های بازگشت وجه</p>
        <Button onClick={() => refetch()} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-1" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Professional Refunds Header */}
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-red-600 via-orange-600 via-amber-600 to-yellow-600 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">بازگشت وجه</h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">💰 مدیریت و پیگیری درخواست‌های بازگشت وجه 💵</p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-red-600 hover:bg-red-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                درخواست جدید
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 lg:space-y-8">
          {/* Filter */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === '' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('');
                setRefundsPage(1);
              }}
              size="sm"
            >
              همه
            </Button>
            <Button
              variant={statusFilter === 'Pending' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('Pending');
                setRefundsPage(1);
              }}
              size="sm"
            >
              در انتظار
            </Button>
            <Button
              variant={statusFilter === 'Approved' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('Approved');
                setRefundsPage(1);
              }}
              size="sm"
            >
              تأیید شده
            </Button>
            <Button
              variant={statusFilter === 'Rejected' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('Rejected');
                setRefundsPage(1);
              }}
              size="sm"
            >
              رد شده
            </Button>
            <Button
              variant={statusFilter === 'Completed' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('Completed');
                setRefundsPage(1);
              }}
              size="sm"
            >
              تکمیل شده
            </Button>
          </div>

          {/* Refunds List */}
          {totalCount === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">شما هنوز درخواست بازگشت وجهی ثبت نکرده‌اید</p>
              <p className="text-sm text-gray-400 mt-2">برای ایجاد درخواست جدید، روی دکمه "درخواست جدید" کلیک کنید</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {refunds
                  .filter(refund => !statusFilter || refund.status === statusFilter)
                  .map((refund) => (
                <Card key={refund.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">شماره درخواست: {refund.refundNumber}</CardTitle>
                          {getStatusBadge(refund.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600">مبلغ بازگشت</p>
                            <p className="text-lg font-semibold text-green-600">{toPersianCurrency(refund.refundAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">تاریخ درخواست</p>
                            <p className="text-sm">{new Date(refund.requestedAt).toLocaleDateString('fa-IR')}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">دلیل:</p>
                          <p className="text-sm">{refund.reason}</p>
                        </div>
                        {refund.adminNotes && (
                          <div className="mt-2 p-2 bg-blue-50 rounded">
                            <p className="text-sm text-gray-600">یادداشت مدیر:</p>
                            <p className="text-sm">{refund.adminNotes}</p>
                          </div>
                        )}
                        {refund.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-50 rounded">
                            <p className="text-sm text-red-600">دلیل رد:</p>
                            <p className="text-sm">{refund.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRefund(refund)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        مشاهده
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-6">
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
            </>
          )}
        </div>
      </div>

      {/* Create Refund Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              setShowCreateModal(false);
              setSelectedOrderId('');
            }
          }}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              setShowCreateModal(false);
              setSelectedOrderId('');
            }
          }}
          style={{ 
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          aria-label="بستن مودال بازگشت وجه"
        >
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>ایجاد درخواست بازگشت وجه</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRefund} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">سفارش</label>
                  <select 
                    name="orderId" 
                    required 
                    className="w-full px-3 py-2 border rounded-lg"
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                  >
                    <option value="">انتخاب سفارش</option>
                    {orders
                      .filter(order => order.status === 'Delivered')
                      .map((order) => (
                        <option key={order.id} value={order.id}>
                          {order.orderNumber} - {toPersianCurrency(order.totalAmount)} - {new Date(order.orderDate).toLocaleDateString('fa-IR')}
                        </option>
                      ))}
                  </select>
                </div>
                {selectedOrder && selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">آیتم سفارش (اختیاری - برای بازگشت جزئی)</label>
                    <select name="orderItemId" className="w-full px-3 py-2 border rounded-lg">
                      <option value="">همه آیتم‌ها (بازگشت کامل)</option>
                      {selectedOrder.orderItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.productTitle} - {item.formatType} - {toPersianCurrency(item.totalPrice)} ({toPersianNumber(item.quantity)} عدد)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">دلیل بازگشت وجه</label>
                  <textarea
                    name="reason"
                    required
                    rows={5}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="دلیل درخواست بازگشت وجه را وارد کنید"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCreateModal(false);
                      setSelectedOrderId('');
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCreateModal(false);
                      setSelectedOrderId('');
                    }}
                    className="touch-manipulation active:scale-95"
                    style={{ 
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    انصراف
                  </Button>
                  <Button type="submit" disabled={createRefundMutation.isPending}>
                    {createRefundMutation.isPending ? 'در حال ثبت...' : 'ثبت درخواست'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Refund Details Modal */}
      {selectedRefund && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              setSelectedRefund(null);
            }
          }}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              setSelectedRefund(null);
            }
          }}
          style={{ 
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          aria-label="بستن جزئیات بازگشت وجه"
        >
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>جزئیات بازگشت وجه</CardTitle>
                  <div className="mt-2">{getStatusBadge(selectedRefund.status)}</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedRefund(null);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedRefund(null);
                  }}
                  className="touch-manipulation active:scale-95"
                  style={{ 
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  بستن
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">شماره درخواست</p>
                  <p className="font-semibold">{selectedRefund.refundNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">مبلغ</p>
                  <p className="font-semibold text-green-600">{toPersianCurrency(selectedRefund.refundAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">نوع بازگشت</p>
                  <p className="font-semibold">{selectedRefund.refundType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">تاریخ درخواست</p>
                  <p className="font-semibold">{new Date(selectedRefund.requestedAt).toLocaleDateString('fa-IR')}</p>
                </div>
                {selectedRefund.processedAt && (
                  <div>
                    <p className="text-sm text-gray-600">تاریخ پردازش</p>
                    <p className="font-semibold">{new Date(selectedRefund.processedAt).toLocaleDateString('fa-IR')}</p>
                  </div>
                )}
                {selectedRefund.completedAt && (
                  <div>
                    <p className="text-sm text-gray-600">تاریخ تکمیل</p>
                    <p className="font-semibold">{new Date(selectedRefund.completedAt).toLocaleDateString('fa-IR')}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">دلیل</p>
                <p className="p-3 bg-gray-50 rounded">{selectedRefund.reason}</p>
              </div>
              {selectedRefund.adminNotes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">یادداشت مدیر</p>
                  <p className="p-3 bg-blue-50 rounded">{selectedRefund.adminNotes}</p>
                </div>
              )}
              {selectedRefund.rejectionReason && (
                <div>
                  <p className="text-sm text-red-600 mb-1">دلیل رد</p>
                  <p className="p-3 bg-red-50 rounded">{selectedRefund.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RefundsPage;

