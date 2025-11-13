'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { toPersianNumber, toPersianCurrency } from '@/utils/numberUtils';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { orderApi, OrderDto } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToastHelpers } from '@/hooks/useToastHelpers';

const OrdersPage: React.FC = () => {
  const router = useRouter();
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize] = useState(5);
  const { user } = useAuth();
  const toast = useToastHelpers();

  const { data: ordersResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      const response = await orderApi.getMyOrders();
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
  });

  const orders: OrderDto[] = ordersResponse?.data || [];

  const getTotalPages = (totalItems: number, pageSize: number) => {
    return Math.ceil(totalItems / pageSize);
  };

  const orderColumns: Column<OrderDto>[] = [
    {
      key: 'orderNumber',
      title: 'شماره سفارش',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="font-medium text-primary">{value}</span>
      )
    },
    {
      key: 'orderDate',
      title: 'تاریخ سفارش',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleDateString('fa-IR')}
        </span>
      )
    },
    {
      key: 'status',
      title: 'وضعیت',
      sortable: true,
      filterable: true,
      render: (value) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
          'Pending': { label: 'در انتظار', className: 'bg-gray-100 text-gray-800' },
          'Paid': { label: 'پرداخت شده', className: 'bg-blue-100 text-blue-800' },
          'Processing': { label: 'در حال پردازش', className: 'bg-yellow-100 text-yellow-800' },
          'Shipped': { label: 'ارسال شده', className: 'bg-purple-100 text-purple-800' },
          'Delivered': { label: 'تحویل داده شده', className: 'bg-green-100 text-green-800' },
          'Cancelled': { label: 'لغو شده', className: 'bg-red-100 text-red-800' },
          'Refunded': { label: 'بازگشت وجه', className: 'bg-orange-100 text-orange-800' }
        };
        
        const config = statusConfig[value as string] || { label: value as string, className: 'bg-gray-100 text-gray-800' };
        
        return (
          <Badge className={config.className}>
            {config.label}
          </Badge>
        );
      }
    },
    {
      key: 'totalAmount',
      title: 'مبلغ کل',
      sortable: true,
      render: (value) => (
        <span className="font-medium">
          {toPersianCurrency(value)}
        </span>
      )
    },
    {
      key: 'orderItems',
      title: 'تعداد آیتم‌ها',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {toPersianNumber((value as any[])?.length || 0)} آیتم
        </span>
      )
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => {
            router.push(`/profile/orders/detail?id=${record.id}`);
          }}>
            <Eye className="h-4 w-4 mr-1" />
            مشاهده
          </Button>
        </div>
      )
    }
  ];

  const totalPages = getTotalPages(orders.length, ordersPageSize);
  const startIndex = (ordersPage - 1) * ordersPageSize;
  const endIndex = startIndex + ordersPageSize;
  const currentOrders = orders.slice(startIndex, endIndex);

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
        <p className="text-red-500">خطا در بارگذاری سفارشات</p>
        <Button onClick={() => refetch()} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-1" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Professional Orders Header */}
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-orange-600 via-red-600 via-pink-600 to-rose-600 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 lg:space-x-4 mb-3 lg:mb-4 rtl:space-x-reverse">
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/80 rounded-full animate-bounce animation-delay-200"></div>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/60 rounded-full animate-bounce animation-delay-400"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">سفارشات من</h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">🛒 مدیریت و پیگیری سفارشات خریداری شده 📦</p>
          </div>
        </div>
        
        <div className="space-y-6 lg:space-y-8">
          {/* Orders Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{toPersianNumber(orders.length)}</div>
              <div className="text-sm text-blue-600/80 font-medium">کل سفارشات</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-600">{toPersianNumber(orders.filter(o => o.status === 'Delivered').length)}</div>
              <div className="text-sm text-green-600/80 font-medium">تحویل داده شده</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{toPersianNumber(orders.filter(o => o.status === 'Processing' || o.status === 'Paid').length)}</div>
              <div className="text-sm text-yellow-600/80 font-medium">در حال پردازش</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{toPersianCurrency(orders.reduce((sum, order) => sum + order.totalAmount, 0))}</div>
              <div className="text-sm text-purple-600/80 font-medium">کل مبلغ</div>
            </div>
          </div>

          {/* Orders Table */}
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">شما هنوز سفارشی ثبت نکرده‌اید</p>
              <p className="text-sm text-gray-400 mt-2">پس از خرید محصولات، سفارشات شما در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <DataTable
                data={currentOrders}
                columns={orderColumns}
                searchable={true}
                sortable={true}
                filterable={true}
              />
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={ordersPage}
                totalPages={totalPages}
                onPageChange={setOrdersPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;

