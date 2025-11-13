'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, OrderDto } from '@/services/api';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toPersianCurrency, toPersianNumber } from '@/utils/numberUtils';

const AdminOrdersPage: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [updateData, setUpdateData] = useState({ status: '', trackingNumber: '', notes: '' });
  const toast = useToastHelpers();
  const queryClient = useQueryClient();

  const { data: ordersResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      const response = await orderApi.getAll(statusFilter || undefined);
      return response.data;
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: (data: { orderId: string; status: string; trackingNumber?: string; notes?: string }) => 
      orderApi.updateStatus(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setShowOrderModal(false);
      setUpdateData({ status: '', trackingNumber: '', notes: '' });
      toast.successPersian(response.data.message || 'وضعیت سفارش با موفقیت بروزرسانی شد');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در بروزرسانی وضعیت سفارش');
      setActionLoading(null);
    },
  });

  const orders: OrderDto[] = ordersResponse?.data || [];

  const handleUpdateOrderStatus = (orderId: string) => {
    if (!updateData.status) {
      toast.errorPersian('لطفاً وضعیت جدید را انتخاب کنید');
      return;
    }

    setActionLoading(orderId);
    const data: { orderId: string; status: string; trackingNumber?: string; notes?: string } = {
      orderId,
      status: updateData.status,
    };

    if (updateData.trackingNumber && updateData.trackingNumber.trim() !== '') {
      data.trackingNumber = updateData.trackingNumber.trim();
    }

    if (updateData.notes && updateData.notes.trim() !== '') {
      data.notes = updateData.notes.trim();
    }

    updateOrderStatusMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const config: { [key: string]: { color: string; icon: any; label: string } } = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'در انتظار' },
      'Paid': { color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, label: 'پرداخت شده' },
      'Processing': { color: 'bg-purple-100 text-purple-800', icon: ClockIcon, label: 'در حال پردازش' },
      'Shipped': { color: 'bg-indigo-100 text-indigo-800', icon: TruckIcon, label: 'ارسال شده' },
      'Delivered': { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'تحویل داده شده' },
      'Cancelled': { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'لغو شده' },
      'Refunded': { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon, label: 'بازگشت وجه' }
    };
    const { color, icon: Icon, label } = config[status] || { color: 'bg-gray-100 text-gray-800', icon: ClockIcon, label: status };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  const getNextStatusOptions = (currentStatus: string): string[] => {
    const statusFlow: { [key: string]: string[] } = {
      'Pending': ['Paid', 'Cancelled'],
      'Paid': ['Processing', 'Cancelled'],
      'Processing': ['Shipped', 'Delivered', 'Cancelled'],
      'Shipped': ['Delivered'],
      'Delivered': [],
      'Cancelled': [],
      'Refunded': []
    };
    return statusFlow[currentStatus] || [];
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingLastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.shippingPhoneNumber && order.shippingPhoneNumber.includes(searchTerm));
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
        <p className="text-red-500">خطا در بارگذاری سفارشات</p>
        <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">مدیریت سفارشات</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در شماره سفارش، نام مشتری، تلفن..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="Pending">در انتظار</option>
              <option value="Paid">پرداخت شده</option>
              <option value="Processing">در حال پردازش</option>
              <option value="Shipped">ارسال شده</option>
              <option value="Delivered">تحویل داده شده</option>
              <option value="Cancelled">لغو شده</option>
              <option value="Refunded">بازگشت وجه</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شماره سفارش</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مشتری</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ کل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ سفارش</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    سفارشی یافت نشد
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.shippingFirstName} {order.shippingLastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{toPersianCurrency(order.totalAmount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                          setUpdateData({ status: '', trackingNumber: '', notes: '' });
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
      </div>

      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">جزئیات سفارش {selectedOrder.orderNumber}</h2>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                    setUpdateData({ status: '', trackingNumber: '', notes: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">وضعیت فعلی</p>
                    <div>{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">مبلغ کل</p>
                    <p className="text-lg font-semibold text-gray-900">{toPersianCurrency(selectedOrder.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">تاریخ سفارش</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedOrder.orderDate).toLocaleDateString('fa-IR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">روش پرداخت</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.paymentMethod}</p>
                  </div>
                  {selectedOrder.trackingNumber && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">شماره پیگیری</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.trackingNumber}</p>
                    </div>
                  )}
                  {selectedOrder.shippedDate && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">تاریخ ارسال</p>
                      <p className="font-semibold text-gray-900">{new Date(selectedOrder.shippedDate).toLocaleDateString('fa-IR')}</p>
                    </div>
                  )}
                  {selectedOrder.deliveredDate && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">تاریخ تحویل</p>
                      <p className="font-semibold text-gray-900">{new Date(selectedOrder.deliveredDate).toLocaleDateString('fa-IR')}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">اطلاعات مشتری</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">نام و نام خانوادگی</p>
                        <p className="text-sm font-medium text-gray-900">{selectedOrder.shippingFirstName} {selectedOrder.shippingLastName}</p>
                      </div>
                      {selectedOrder.shippingPhoneNumber && (
                        <div>
                          <p className="text-xs text-gray-500">تلفن</p>
                          <p className="text-sm font-medium text-gray-900">{selectedOrder.shippingPhoneNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">آدرس ارسال</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900">
                      {selectedOrder.shippingAddress}، {selectedOrder.shippingCity}، {selectedOrder.shippingState}، {selectedOrder.shippingPostalCode}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{selectedOrder.shippingCountry}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">آیتم‌های سفارش</p>
                  <div className="space-y-2">
                    {selectedOrder.orderItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.productTitle}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.formatType} {item.fileType && `(${item.fileType})`}
                            </p>
                          </div>
                          <div className="text-left ml-4">
                            <p className="text-sm font-semibold text-gray-900">{toPersianCurrency(item.totalPrice)}</p>
                            <p className="text-xs text-gray-500">تعداد: {toPersianNumber(item.quantity)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>قیمت واحد: {toPersianCurrency(item.unitPrice)}</span>
                          {item.discountPrice > 0 && (
                            <span>تخفیف: {toPersianCurrency(item.discountPrice)}</span>
                          )}
                          {item.isDigital && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">دیجیتال</span>
                          )}
                          {item.isDelivered && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">تحویل داده شده</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">یادداشت سفارش</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {getNextStatusOptions(selectedOrder.status).length > 0 && (
                  <div className="pt-4 border-t space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">تغییر وضعیت</label>
                      <select
                        value={updateData.status}
                        onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">انتخاب وضعیت جدید</option>
                        {getNextStatusOptions(selectedOrder.status).map((status) => {
                          const statusLabels: { [key: string]: string } = {
                            'Paid': 'پرداخت شده',
                            'Processing': 'در حال پردازش',
                            'Shipped': 'ارسال شده',
                            'Delivered': 'تحویل داده شده',
                            'Cancelled': 'لغو شده'
                          };
                          return (
                            <option key={status} value={status}>
                              {statusLabels[status] || status}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {updateData.status === 'Shipped' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">شماره پیگیری (اختیاری)</label>
                        <input
                          type="text"
                          placeholder="شماره پیگیری پستی را وارد کنید..."
                          value={updateData.trackingNumber}
                          onChange={(e) => setUpdateData({ ...updateData, trackingNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">یادداشت (اختیاری)</label>
                      <textarea
                        placeholder="یادداشت خود را وارد کنید..."
                        value={updateData.notes}
                        onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>

                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id)}
                      disabled={actionLoading === selectedOrder.id || updateOrderStatusMutation.isPending || !updateData.status}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading === selectedOrder.id || updateOrderStatusMutation.isPending ? 'در حال بروزرسانی...' : 'بروزرسانی وضعیت'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
