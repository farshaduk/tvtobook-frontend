'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { 
  UsersIcon, DocumentTextIcon, CurrencyDollarIcon, 
  EyeIcon, ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  CalendarIcon, MapPinIcon, TagIcon, UserGroupIcon
} from '@heroicons/react/24/outline'
import { analyticsApi, type DashboardAnalyticsDto } from '@/services/analyticsApi'
import { toPersianCurrency, toPersianNumber } from '@/utils/numberUtils'

const AdminAnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  })

  const { data: analyticsResponse, isLoading, error } = useQuery({
    queryKey: ['admin-analytics', dateRange.fromDate, dateRange.toDate],
    queryFn: () => analyticsApi.getOverview(dateRange.fromDate, dateRange.toDate),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })

  const analytics = analyticsResponse?.data?.data;

  // Format numbers
  const formatNumber = (num: number) => {
    return toPersianNumber(num)
  }

  const formatCurrency = (amount: number) => {
    return toPersianCurrency(amount)
  }

  const formatPercent = (value: number) => {
    if (value === 0) return '0%';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${toPersianNumber(value.toFixed(1))}%`;
  }

  // Stats card component
  const StatsCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    color = 'blue' 
  }: {
    title: string
    value: string | number
    icon: React.ElementType
    trend?: 'up' | 'down'
    trendValue?: number
    color?: string
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-red-600">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trendValue !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              <span>{formatPercent(trendValue)} نسبت به ماه قبل</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-8 w-8 text-${color}-600`} />
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">خطا در بارگذاری داده‌های آماری</p>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="ltr">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">داشبورد آمار و گزارشات</h1>
        <p className="text-gray-600">آمار جامع عملکرد کسب‌وکار و پلتفرم</p>
        
        {/* Date Range Selector */}
        <div className="mt-4 flex items-center gap-4">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={dateRange.fromDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.toDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="کل کاربران"
          value={formatNumber(analytics?.users?.totalUsers || 0)}
          icon={UsersIcon}
          color="blue"
          trend={analytics?.users?.userGrowthRate >= 0 ? 'up' : 'down'}
          trendValue={analytics?.users?.userGrowthRate || 0}
        />
        <StatsCard
          title="کل محصولات"
          value={formatNumber(analytics?.products?.totalProducts || 0)}
          icon={DocumentTextIcon}
          color="green"
          trend={analytics?.products?.productGrowthRate >= 0 ? 'up' : 'down'}
          trendValue={analytics?.products?.productGrowthRate || 0}
        />
        <StatsCard
          title="کل سفارشات"
          value={formatNumber(analytics?.orders?.totalOrders || 0)}
          icon={EyeIcon}
          color="yellow"
        />
        <StatsCard
          title="کل درآمد"
          value={formatCurrency(analytics?.revenue?.totalRevenue || 0)}
          icon={CurrencyDollarIcon}
          color="red"
          trend={analytics?.revenue?.revenueGrowthRate >= 0 ? 'up' : 'down'}
          trendValue={analytics?.revenue?.revenueGrowthRate || 0}
        />
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">آمار امروز</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">کاربران جدید:</span>
              <span className="font-semibold">{formatNumber(analytics?.users?.newUsersToday || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">محصولات جدید:</span>
              <span className="font-semibold">{formatNumber(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">درآمد امروز:</span>
              <span className="font-semibold">{formatCurrency(analytics?.revenue?.revenueToday || 0)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">آمار این ماه</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">کاربران جدید:</span>
              <span className="font-semibold">{formatNumber(analytics?.users?.newUsersThisMonth || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">سفارشات:</span>
              <span className="font-semibold">{formatNumber(analytics?.orders?.ordersThisMonth || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">درآمد این ماه:</span>
              <span className="font-semibold">{formatCurrency(analytics?.revenue?.revenueThisMonth || 0)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">آمار کلی</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">کل پرداخت‌ها:</span>
              <span className="font-semibold">{formatNumber(analytics?.orders?.totalOrders || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Registration Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UsersIcon className="h-5 w-5 mr-2" />
            روند ثبت‌نام کاربران
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics?.monthlyUserTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                interval={Math.floor(((analytics?.monthlyUserTrends?.length || 0) - 1) / 6)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(label) => `ماه: ${label}`}
                formatter={(value: number) => [formatNumber(value), 'کاربران جدید']}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke={'#3b82f6'} 
                fill={'#3b82f6'}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Ad Posting Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            روند سفارشات
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics?.monthlyOrderTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                interval={Math.floor(((analytics?.monthlyOrderTrends?.length || 0) - 1) / 6)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(label) => `ماه: ${label}`}
                formatter={(value: number) => [formatNumber(value), 'سفارشات']}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke={'#10b981'} 
                fill={'#10b981'}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CurrencyDollarIcon className="h-5 w-5 mr-2" />
          روند درآمد
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={analytics?.monthlyRevenueTrends || []}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              interval={Math.floor(((analytics?.monthlyRevenueTrends?.length || 0) - 1) / 8)}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => formatCurrency(value)}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip 
              labelFormatter={(label) => `ماه: ${label}`}
              formatter={(value: number) => [formatCurrency(value), 'درآمد']}
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="url(#lineGradient)"
              strokeWidth={3}
              dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#F59E0B', strokeWidth: 2, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TagIcon className="h-5 w-5 mr-2" />
            آمار دسته‌بندی‌ها
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.categoryStatistics || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="categoryName" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  const label = name === 'productCount' ? 'تعداد محصولات' : 
                               name === 'orderCount' ? 'تعداد سفارشات' : name
                  return [formatNumber(value), label]
                }}
              />
              <Bar dataKey="productCount" fill={'#3b82f6'} name="productCount" />
              <Bar dataKey="orderCount" fill={'#10b981'} name="orderCount" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2" />
            توزیع جغرافیایی کاربران
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.geographicStatistics || []}>
              <defs>
                <linearGradient id="geoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="location" 
                tick={{ fontSize: 10, fill: '#64748b' }}
                angle={-45}
                textAnchor="end"
                height={80}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), 'تعداد کاربران']}
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="userCount" 
                fill="url(#geoGradient)"
                radius={[6, 6, 0, 0]}
                stroke="#fff"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Categories Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            توزیع محصولات بر اساس دسته‌بندی
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.categoryStatistics || []}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DC2626" />
                  <stop offset="100%" stopColor="#B91C1C" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="categoryName" 
                tick={{ fontSize: 10, fill: '#64748b' }}
                angle={-45}
                textAnchor="end"
                height={80}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), 'تعداد محصولات']}
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="productCount" 
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
                stroke="#fff"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2" />
            توزیع جغرافیایی (استان‌ها)
          </h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {analytics?.geographicStatistics?.slice(0, 10).map((geo, index) => (
              <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span className="font-medium">{geo.location}</span>
                <div className="text-sm text-gray-600">
                  <span className="mr-4">{formatNumber(geo.userCount)} کاربر</span>
                  <span className="mr-4">{formatNumber(geo.orderCount)} سفارش</span>
                </div>
              </div>
            )) || <p className="text-gray-500 text-center py-4">داده‌ای یافت نشد</p>}
          </div>
        </div>
      </div>

      {/* Price Analysis Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">آمار درآمد بر اساس دسته‌بندی</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={analytics?.categoryStatistics || []}>
            <defs>
              <linearGradient id="columnGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#059669" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="categoryName" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              angle={-45}
              textAnchor="end"
              height={80}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => formatCurrency(value)}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'درآمد']}
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar 
              dataKey="revenue" 
              fill="url(#columnGradient)"
              radius={[8, 8, 0, 0]}
              stroke="#fff"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default AdminAnalyticsDashboard

