'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Package, Truck, CheckCircle, Clock, AlertCircle, MapPin, CreditCard, Calendar, Download, Printer, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { orderApi, OrderDto } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { TvtoBookSpinner } from '@/components/ui/spinner';
import UserLayout from '@/components/UserLayout';
import { toPersianNumber, toPersianCurrency } from '@/utils/numberUtils';

function OrderDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id') as string;
  const { user } = useAuth();

  const { data: orderResponse, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await orderApi.getById(orderId);
      return response.data;
    },
    enabled: !!orderId && typeof window !== 'undefined',
  });

  const order: OrderDto | undefined = orderResponse?.data;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      'Pending': { label: 'در انتظار', className: 'bg-amber-100 text-amber-800', icon: Clock },
      'Paid': { label: 'پرداخت شده', className: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      'Processing': { label: 'در حال پردازش', className: 'bg-yellow-100 text-yellow-800', icon: Package },
      'Shipped': { label: 'ارسال شده', className: 'bg-purple-100 text-purple-800', icon: Truck },
      'Delivered': { label: 'تحویل داده شده', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Cancelled': { label: 'لغو شده', className: 'bg-red-100 text-red-800', icon: AlertCircle },
      'Refunded': { label: 'بازگشت وجه', className: 'bg-orange-100 text-orange-800', icon: AlertCircle },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: Package };
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 ml-1" />
        {config.label}
      </Badge>
    );
  };

  const userStats = {
    totalOrders: 0,
    totalSpent: 0,
    memberSince: user?.dateJoined || new Date().toISOString()
  };

  const handleTabSwitch = (tabId: string) => {
    if (tabId === 'orders') {
      router.push('/profile/orders');
    } else {
      router.push(`/profile?tab=${tabId}`);
    }
  };

  if (isLoading) {
    return (
      <UserLayout
        activeTab="orders"
        onTabChange={handleTabSwitch}
        user={user}
        isOwnProfile={true}
        userStats={userStats}
      >
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </UserLayout>
    );
  }

  if (!order) {
    return (
      <UserLayout
        activeTab="orders"
        onTabChange={handleTabSwitch}
        user={user}
        isOwnProfile={true}
        userStats={userStats}
      >
        <div className="container mx-auto p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">سفارش یافت نشد</p>
              <Button onClick={() => {
                window.location.href = '/profile?tab=orders';
              }} className="mt-4">
                بازگشت به لیست سفارشات
              </Button>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout
      activeTab="orders"
      onTabChange={handleTabSwitch}
      user={user}
      isOwnProfile={true}
      userStats={userStats}
    >
      <div>
        {/* Professional Order Detail Header */}
        <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
          <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-orange-600 via-red-600 via-pink-600 to-rose-600 shadow-2xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">
                    سفارش #{order.orderNumber}
                  </h1>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-blue-100 text-sm sm:text-base lg:text-lg font-medium text-right">
                    تاریخ سفارش: {new Date(order.orderDate).toLocaleDateString('fa-IR')} • مبلغ کل: {toPersianCurrency(order.totalAmount)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = '/profile?tab=orders';
                  }}
                  className="bg-white text-orange-600 hover:bg-orange-50"
                >
                  <ArrowRight className="h-4 w-4 ml-1" />
                  بازگشت
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-6 lg:space-y-8">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>خلاصه سفارش</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">شماره سفارش</p>
                    <p className="font-semibold">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">تاریخ سفارش</p>
                    <p className="font-semibold">{new Date(order.orderDate).toLocaleDateString('fa-IR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">وضعیت</p>
                    {getStatusBadge(order.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">روش پرداخت</p>
                    <p className="font-semibold">{order.paymentMethod}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">زیرمجموعه</span>
                    <span className="font-medium">{toPersianCurrency(order.subtotal)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">تخفیف</span>
                      <span className="font-medium">-{toPersianCurrency(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">مالیات</span>
                    <span className="font-medium">{toPersianCurrency(order.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">حمل و نقل</span>
                    <span className="font-medium">
                      {order.shippingCost === 0 ? 'رایگان' : toPersianCurrency(order.shippingCost)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>کل</span>
                    <span className="text-primary">{toPersianCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>اقلام سفارش</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.orderItems && order.orderItems.length > 0 ? (
                  order.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.productTitle}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          نوع: {item.formatType} {item.isDigital ? '(دیجیتال)' : '(فیزیکی)'}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {item.formatType}
                          </Badge>
                          {item.isDigital && (
                            <Badge variant="secondary" className="text-xs">
                              دیجیتال
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-gray-600">قیمت واحد</p>
                        <p className="font-medium">{toPersianCurrency(item.unitPrice)}</p>
                        {item.discountPrice > 0 && (
                          <>
                            <p className="text-xs text-gray-500 line-through mt-1">
                              {toPersianCurrency(item.unitPrice)}
                            </p>
                            <p className="font-medium text-green-600">
                              {toPersianCurrency(item.discountPrice)}
                            </p>
                          </>
                        )}
                        <p className="text-sm text-gray-600 mt-2">تعداد: {toPersianNumber(item.quantity)}</p>
                        <p className="text-sm font-medium text-primary mt-1">
                          کل: {toPersianCurrency(item.totalPrice)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">هیچ آیتمی یافت نشد</p>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  آدرس ارسال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">
                  {order.shippingFirstName} {order.shippingLastName}
                </p>
                <p>{order.shippingAddress}</p>
                <p>
                  {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
                </p>
                <p>{order.shippingCountry}</p>
                {order.shippingPhoneNumber && (
                  <p className="text-sm text-gray-600">
                    📞 {order.shippingPhoneNumber}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tracking Information */}
            {order.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    اطلاعات پیگیری
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">شماره پیگیری</p>
                    <p className="font-semibold font-mono">{order.trackingNumber}</p>
                  </div>
                  {order.shippedDate && (
                    <div>
                      <p className="text-sm text-gray-600">تاریخ ارسال</p>
                      <p className="font-semibold">
                        {new Date(order.shippedDate).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  )}
                  {order.deliveredDate && (
                    <div>
                      <p className="text-sm text-gray-600">تاریخ تحویل</p>
                      <p className="font-semibold">
                        {new Date(order.deliveredDate).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>اقدامات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-5 w-5" />
                    <span className="text-sm">چاپ</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `سفارش ${order.orderNumber}`,
                          text: `جزئیات سفارش ${order.orderNumber}`
                        });
                      }
                    }}
                  >
                    <Share2 className="h-5 w-5" />
                    <span className="text-sm">اشتراک‌گذاری</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <TvtoBookSpinner />
      </div>
    }>
      <OrderDetailContent />
    </Suspense>
  );
}

