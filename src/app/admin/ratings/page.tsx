'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminRatingApi, AdminRatingStatisticsDto } from '@/services/adminApi';
import { 
  StarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { Star } from 'lucide-react';
import { toPersianNumber } from '@/utils/numberUtils';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AdminRatingsPage: React.FC = () => {
  const { data: statisticsResponse, isLoading, error } = useQuery({
    queryKey: ['admin-rating-statistics'],
    queryFn: async () => {
      const response = await adminRatingApi.getStatistics();
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const statistics: AdminRatingStatisticsDto | undefined = statisticsResponse?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">خطا در بارگذاری آمار امتیازات</p>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">داده‌ای یافت نشد</p>
      </div>
    );
  }

  const distributionData = [
    { name: '۵ ستاره', value: statistics.distribution.fiveStar, color: '#10b981' },
    { name: '۴ ستاره', value: statistics.distribution.fourStar, color: '#3b82f6' },
    { name: '۳ ستاره', value: statistics.distribution.threeStar, color: '#f59e0b' },
    { name: '۲ ستاره', value: statistics.distribution.twoStar, color: '#ef4444' },
    { name: '۱ ستاره', value: statistics.distribution.oneStar, color: '#dc2626' }
  ].filter(item => item.value > 0);

  const monthlyData = statistics.monthlyTrends.map(trend => ({
    month: trend.month,
    count: trend.count,
    average: parseFloat(trend.averageRating.toFixed(2))
  }));

  const distributionBarData = [
    { rating: '۵ ستاره', count: statistics.distribution.fiveStar },
    { rating: '۴ ستاره', count: statistics.distribution.fourStar },
    { rating: '۳ ستاره', count: statistics.distribution.threeStar },
    { rating: '۲ ستاره', count: statistics.distribution.twoStar },
    { rating: '۱ ستاره', count: statistics.distribution.oneStar }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">آمار امتیازات</h1>
            <p className="text-sm text-gray-500 mt-1">بررسی و تحلیل امتیازات محصولات</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium mb-1">کل نظرات</p>
                <p className="text-2xl font-bold text-blue-900">{toPersianNumber(statistics.totalReviews)}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium mb-1">نظرات تأیید شده</p>
                <p className="text-2xl font-bold text-green-900">{toPersianNumber(statistics.approvedReviews)}</p>
              </div>
              <StarIcon className="h-8 w-8 text-green-600 fill-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium mb-1">در انتظار تأیید</p>
                <p className="text-2xl font-bold text-yellow-900">{toPersianNumber(statistics.pendingReviews)}</p>
              </div>
              <StarIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium mb-1">میانگین امتیاز</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-purple-900">{parseFloat(statistics.averageRating.toFixed(2))}</p>
                  <Star className="h-5 w-5 text-purple-600 fill-purple-600" />
                </div>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Rating Distribution Bar Chart */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">توزیع امتیازات</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rating Distribution Pie Chart */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">نسبت امتیازات</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent as number * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white p-4 rounded-lg border mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">روند ماهانه امتیازات</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" name="تعداد نظرات" />
              <Line yAxisId="right" type="monotone" dataKey="average" stroke="#10b981" name="میانگین امتیاز" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top and Low Rated Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Rated Products */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">محصولات با بالاترین امتیاز</h3>
            <div className="space-y-3">
              {statistics.topRatedProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">محصولی یافت نشد</p>
              ) : (
                statistics.topRatedProducts.map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.productTitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.round(product.averageRating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">{parseFloat(product.averageRating.toFixed(2))}</span>
                          <span className="text-xs text-gray-500">({toPersianNumber(product.totalReviews)} نظر)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Rated Products */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">محصولات با پایین‌ترین امتیاز</h3>
            <div className="space-y-3">
              {statistics.lowRatedProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">محصولی یافت نشد</p>
              ) : (
                statistics.lowRatedProducts.map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.productTitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.round(product.averageRating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">{parseFloat(product.averageRating.toFixed(2))}</span>
                          <span className="text-xs text-gray-500">({toPersianNumber(product.totalReviews)} نظر)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRatingsPage;



