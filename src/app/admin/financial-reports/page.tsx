'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  CurrencyDollarIcon, 
  CreditCardIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { adminFinancialReportsApi } from '@/services/adminApi';
import { toPersianCurrency, toPersianNumber } from '@/utils/numberUtils';
import { useToastHelpers } from '@/hooks/useToastHelpers';

const AdminFinancialReportsPage: React.FC = () => {
  const toast = useToastHelpers();
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');

  const { data: statisticsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-financial-reports', dateRange.fromDate, dateRange.toDate, paymentMethodFilter, paymentStatusFilter],
    queryFn: async () => {
      const response = await adminFinancialReportsApi.getStatistics({
        fromDate: dateRange.fromDate || undefined,
        toDate: dateRange.toDate || undefined,
        paymentMethod: paymentMethodFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined
      });
      return response.data;
    },
    retry: 2,
  });

  const statistics = statisticsResponse?.data;

  const formatCurrency = (amount: number) => {
    return toPersianCurrency(amount);
  };

  const formatPercent = (value: number) => {
    if (value === 0) return '0%';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${toPersianNumber(value.toFixed(1))}%`;
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    toast.errorPersian('خطا در بارگذاری گزارشات مالی');
    return null;
  }

  if (!statistics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">داده‌ای یافت نشد</p>
      </div>
    );
  }

  const thisMonthChange = calculateChange(statistics.thisMonth.revenue, statistics.lastMonth.revenue);
  const thisYearChange = calculateChange(statistics.thisYear.revenue, statistics.lastYear.revenue);

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">گزارشات مالی</h1>
            <p className="text-gray-600 mt-2">مشاهده و تحلیل گزارشات مالی سیستم</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">از تاریخ</label>
              <input
                type="date"
                value={dateRange.fromDate}
                onChange={(e) => setDateRange({ ...dateRange, fromDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تا تاریخ</label>
              <input
                type="date"
                value={dateRange.toDate}
                onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">روش پرداخت</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">همه</option>
                <option value="CreditCard">کارت اعتباری</option>
                <option value="BankTransfer">انتقال بانکی</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت پرداخت</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">همه</option>
                <option value="Completed">تکمیل شده</option>
                <option value="Pending">در انتظار</option>
                <option value="Failed">ناموفق</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">درآمد کل</p>
                  <p className="text-3xl font-bold">{formatCurrency(statistics.totalRevenue)}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <CurrencyDollarIcon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">درآمد خالص</p>
                  <p className="text-3xl font-bold">{formatCurrency(statistics.netRevenue)}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <ChartBarIcon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">کل بازگشت‌ها</p>
                  <p className="text-3xl font-bold">{formatCurrency(statistics.totalRefunds)}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <ArrowTrendingDownIcon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">کل سهم نویسندگان</p>
                  <p className="text-3xl font-bold">{formatCurrency(statistics.totalRoyaltiesPaid)}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <CreditCardIcon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Period Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">مقایسه ماهانه</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">این ماه</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(statistics.thisMonth.revenue)}</p>
                  <p className="text-sm text-gray-500">{toPersianNumber(statistics.thisMonth.paymentCount)} پرداخت</p>
                </div>
                <div className={`flex items-center gap-2 ${thisMonthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {thisMonthChange >= 0 ? (
                    <ArrowTrendingUpIcon className="h-5 w-5" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-5 w-5" />
                  )}
                  <span className="font-semibold">{formatPercent(thisMonthChange)}</span>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">ماه گذشته</p>
                <p className="text-xl font-semibold text-gray-700">{formatCurrency(statistics.lastMonth.revenue)}</p>
                <p className="text-sm text-gray-500">{toPersianNumber(statistics.lastMonth.paymentCount)} پرداخت</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">مقایسه سالانه</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">امسال</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(statistics.thisYear.revenue)}</p>
                  <p className="text-sm text-gray-500">{toPersianNumber(statistics.thisYear.paymentCount)} پرداخت</p>
                </div>
                <div className={`flex items-center gap-2 ${thisYearChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {thisYearChange >= 0 ? (
                    <ArrowTrendingUpIcon className="h-5 w-5" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-5 w-5" />
                  )}
                  <span className="font-semibold">{formatPercent(thisYearChange)}</span>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">سال گذشته</p>
                <p className="text-xl font-semibold text-gray-700">{formatCurrency(statistics.lastYear.revenue)}</p>
                <p className="text-sm text-gray-500">{toPersianNumber(statistics.lastYear.paymentCount)} پرداخت</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">آمار پرداخت‌ها</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">کل پرداخت‌ها</span>
                <span className="font-semibold">{toPersianNumber(statistics.totalPayments)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">تکمیل شده</span>
                <span className="font-semibold text-green-600">{toPersianNumber(statistics.completedPayments)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">در انتظار</span>
                <span className="font-semibold text-yellow-600">{toPersianNumber(statistics.pendingPayments)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ناموفق</span>
                <span className="font-semibold text-red-600">{toPersianNumber(statistics.failedPayments)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">آمار بازگشت‌ها</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">کل بازگشت‌ها</span>
                <span className="font-semibold">{toPersianNumber(statistics.totalRefundsCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">تأیید شده</span>
                <span className="font-semibold text-green-600">{toPersianNumber(statistics.approvedRefundsCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">در انتظار</span>
                <span className="font-semibold text-yellow-600">{toPersianNumber(statistics.pendingRefundsCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">رد شده</span>
                <span className="font-semibold text-red-600">{toPersianNumber(statistics.rejectedRefundsCount)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">آمار سهم نویسندگان</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">کل سهم‌ها</span>
                <span className="font-semibold">{toPersianNumber(statistics.totalRoyaltiesCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">پرداخت شده</span>
                <span className="font-semibold text-green-600">{toPersianNumber(statistics.paidRoyaltiesCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">در انتظار</span>
                <span className="font-semibold text-yellow-600">{toPersianNumber(statistics.pendingRoyaltiesCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">مبلغ پرداخت شده</span>
                <span className="font-semibold">{formatCurrency(statistics.paidRoyaltiesAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">روند درآمد ماهانه</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={statistics.monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">روند درآمد روزانه (۳۰ روز گذشته)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statistics.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => {
                  try {
                    const date = typeof value === 'string' ? new Date(value) : value;
                    return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
                  } catch {
                    return value;
                  }
                }} />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Distribution */}
        {statistics.paymentMethodStats && Object.keys(statistics.paymentMethodStats).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">توزیع روش‌های پرداخت</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.values(statistics.paymentMethodStats).map(p => ({
                    name: p.method === "CreditCard" ? "کارت اعتباری" : p.method === "BankTransfer" ? "انتقال بانکی" : p.method,
                    value: p.totalAmount
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent as number * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.values(statistics.paymentMethodStats).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Breakdown Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">جزئیات ماهانه</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={statistics.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="درآمد" />
              <Bar dataKey="refunds" fill="#ef4444" name="بازگشت‌ها" />
              <Bar dataKey="royalties" fill="#8b5cf6" name="سهم نویسندگان" />
              <Bar dataKey="discounts" fill="#f59e0b" name="تخفیفات" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminFinancialReportsPage;

