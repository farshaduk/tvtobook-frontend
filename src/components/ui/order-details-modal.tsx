'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  CreditCard,
  Calendar,
  User,
  Phone,
  Mail,
  ArrowRight,
  RefreshCw,
  RotateCcw,
  FileText,
  Printer,
  Share2,
  Star,
  MessageCircle,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface OrderItem {
  id: string;
  title: string;
  author: string;
  price: number;
  quantity: number;
  image: string;
  format?: string;
  category: 'book' | 'ebook' | 'audiobook';
  isbn?: string;
}

export interface OrderDetails {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  totalAmount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  billingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: {
    type: 'credit_card' | 'paypal' | 'bank_transfer';
    last4?: string;
    brand?: string;
  };
  tracking?: {
    carrier: string;
    trackingNumber: string;
    estimatedDelivery: string;
    status: string;
  };
  timeline: Array<{
    date: string;
    status: string;
    description: string;
    location?: string;
  }>;
}

interface OrderDetailsModalProps {
  order: OrderDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onReorder?: (order: OrderDetails) => void;
  onCancel?: (order: OrderDetails) => void;
  onReturn?: (order: OrderDetails) => void;
  onTrack?: (order: OrderDetails) => void;
}

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock, label: 'در انتظار' },
  processing: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Package, label: 'در حال پردازش' },
  shipped: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Truck, label: 'ارسال شده' },
  delivered: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle, label: 'تحویل شده' },
  cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, label: 'لغو شده' },
  returned: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: RotateCcw, label: 'بازگردانده شده' },
};

export function OrderDetailsModal({
  order,
  isOpen,
  onClose,
  onReorder,
  onCancel,
  onReturn,
  onTrack
}: OrderDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!order) return null;

  const StatusIcon = statusConfig[order.status].icon;
  const statusColor = statusConfig[order.status].color;

  const handleAction = (action: string) => {
    switch (action) {
      case 'reorder':
        onReorder?.(order);
        break;
      case 'cancel':
        onCancel?.(order);
        break;
      case 'return':
        onReturn?.(order);
        break;
      case 'track':
        onTrack?.(order);
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/20 w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4 rtl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 rtl:flex-row-reverse">
              <div className="text-right">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  سفارش #{order.orderNumber}
                </h2>
                <p className="text-sm text-muted-foreground">
                  ثبت شده در {new Date(order.orderDate).toLocaleDateString('fa-IR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div className="flex items-center gap-3 rtl:flex-row-reverse">
                <Badge className={`${statusColor} border rtl:flex-row-reverse`}>
                  <StatusIcon className="h-4 w-4 rtl:ml-1 rtl:mr-0" />
                  <span className="capitalize font-medium">{statusConfig[order.status].label}</span>
                </Badge>
                
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="overview" className="rtl:flex-row-reverse">بررسی اجمالی</TabsTrigger>
                  <TabsTrigger value="items" className="rtl:flex-row-reverse">اقلام</TabsTrigger>
                  <TabsTrigger value="shipping" className="rtl:flex-row-reverse">ارسال</TabsTrigger>
                  <TabsTrigger value="timeline" className="rtl:flex-row-reverse">زمان‌بندی</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 text-right">
                  {/* Order Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-right">خلاصه سفارش</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-right">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">شماره سفارش</p>
                          <p className="font-semibold">{order.orderNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">تاریخ سفارش</p>
                          <p className="font-semibold">
                            {new Date(order.orderDate).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">وضعیت</p>
                          <Badge className={`${statusColor} border rtl:flex-row-reverse`}>
                            <StatusIcon className="h-3 w-3 rtl:ml-1 rtl:mr-0" />
                            <span className="capitalize">{statusConfig[order.status].label}</span>
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">مبلغ کل</p>
                          <p className="text-xl font-bold text-primary">{order.totalAmount.toFixed(2)}$</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between rtl:flex-row-reverse">
                          <span className="text-sm text-muted-foreground">زیرمجموعه</span>
                          <span className="font-medium">{order.subtotal.toFixed(2)}$</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-green-600 rtl:flex-row-reverse">
                            <span className="text-sm">تخفیف</span>
                            <span className="font-medium">-{order.discount.toFixed(2)}$</span>
                          </div>
                        )}
                        <div className="flex justify-between rtl:flex-row-reverse">
                          <span className="text-sm text-muted-foreground">مالیات</span>
                          <span className="font-medium">{order.tax.toFixed(2)}$</span>
                        </div>
                        <div className="flex justify-between rtl:flex-row-reverse">
                          <span className="text-sm text-muted-foreground">حمل و نقل</span>
                          <span className="font-medium">
                            {order.shipping === 0 ? 'رایگان' : `${order.shipping.toFixed(2)}$`}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold rtl:flex-row-reverse">
                          <span>کل</span>
                          <span className="text-primary">{order.totalAmount.toFixed(2)}$</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-right">اقدامات سریع</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-center gap-2"
                          onClick={() => handleAction('track')}
                        >
                          <Truck className="h-5 w-5" />
                          <span className="text-sm">پیگیری سفارش</span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-center gap-2"
                          onClick={() => handleAction('reorder')}
                        >
                          <RefreshCw className="h-5 w-5" />
                          <span className="text-sm">سفارش مجدد</span>
                        </Button>
                        
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
                          onClick={() => navigator.share?.({ title: `Order ${order.orderNumber}`, text: `Check out my order details` })}
                        >
                          <Share2 className="h-5 w-5" />
                          <span className="text-sm">اشتراک‌گذاری</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Items Tab */}
                <TabsContent value="items" className="space-y-4 text-right">
                  {order.items.map((item, index) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4 rtl:flex-row-reverse">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-16 h-20 object-cover rounded-lg shadow-sm"
                          />
                          
                          <div className="flex-1 text-right">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">توسط {item.author}</p>
                            
                            <div className="flex items-center gap-4 mt-2 rtl:flex-row-reverse">
                              <Badge variant="outline" className="text-xs">
                                {item.category === 'book' ? '📖 کتاب' : 
                                 item.category === 'ebook' ? '📱 کتاب الکترونیکی' : '🎧 کتاب صوتی'}
                              </Badge>
                              {item.format && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.format}
                                </Badge>
                              )}
                              {item.isbn && (
                                <span className="text-xs text-muted-foreground">
                                  شابک: {item.isbn}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {item.price.toFixed(2)}$
                            </div>
                            <div className="text-sm text-muted-foreground">
                              تعداد: {item.quantity}
                            </div>
                            <div className="text-sm font-medium text-primary">
                              کل: {(item.price * item.quantity).toFixed(2)}$
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* Shipping Tab */}
                <TabsContent value="shipping" className="space-y-6 text-right">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shipping Address */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 rtl:flex-row-reverse">
                          <MapPin className="h-5 w-5 rtl:ml-2 rtl:mr-0" />
                          آدرس ارسال
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-right">
                        <p className="font-semibold">{order.shippingAddress.name}</p>
                        <p>{order.shippingAddress.address}</p>
                        <p>
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                        </p>
                        <p>{order.shippingAddress.country}</p>
                        <p className="text-sm text-muted-foreground">
                          📞 {order.shippingAddress.phone}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Billing Address */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 rtl:flex-row-reverse">
                          <CreditCard className="h-5 w-5 rtl:ml-2 rtl:mr-0" />
                          آدرس صورتحساب
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-right">
                        <p className="font-semibold">{order.billingAddress.name}</p>
                        <p>{order.billingAddress.address}</p>
                        <p>
                          {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}
                        </p>
                        <p>{order.billingAddress.country}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Payment Method */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 rtl:flex-row-reverse">
                        <CreditCard className="h-5 w-5 rtl:ml-2 rtl:mr-0" />
                        روش پرداخت
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 rtl:flex-row-reverse">
                        <div className="w-12 h-8 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                          💳
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {order.paymentMethod.brand?.toUpperCase()} •••• {order.paymentMethod.last4}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.paymentMethod.type.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tracking Information */}
                  {order.tracking && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 rtl:flex-row-reverse">
                          <Truck className="h-5 w-5 rtl:ml-2 rtl:mr-0" />
                          اطلاعات پیگیری
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-right">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">شرکت حمل</p>
                            <p className="font-semibold">{order.tracking.carrier}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">شماره پیگیری</p>
                            <p className="font-semibold font-mono">{order.tracking.trackingNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">وضعیت</p>
                            <Badge variant="outline">{order.tracking.status}</Badge>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">تاریخ تحویل پیش‌بینی شده</p>
                            <p className="font-semibold">
                              {new Date(order.tracking.estimatedDelivery).toLocaleDateString('fa-IR')}
                            </p>
                          </div>
                        </div>
                        
                        <Button className="w-full rtl:flex-row-reverse" onClick={() => handleAction('track')}>
                          <Truck className="h-4 w-4 rtl:ml-2 rtl:mr-0" />
                          پیگیری بسته
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="space-y-4 text-right">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-right">زمان‌بندی سفارش</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {order.timeline.map((event, index) => (
                          <div key={index} className="flex items-start gap-4 rtl:flex-row-reverse">
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                index === 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                              )}>
                                {index === 0 ? <CheckCircle className="h-4 w-4" /> : 
                                 index === order.timeline.length - 1 ? <Clock className="h-4 w-4" /> :
                                 <div className="w-2 h-2 bg-current rounded-full" />}
                              </div>
                              {index < order.timeline.length - 1 && (
                                <div className="w-px h-8 bg-border mt-2" />
                              )}
                            </div>
                            
                            <div className="flex-1 pb-4 text-right">
                              <div className="flex items-center justify-between rtl:flex-row-reverse">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                  {event.status}
                                </h4>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(event.date).toLocaleDateString('fa-IR')}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </p>
                              {event.location && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  📍 {event.location}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

