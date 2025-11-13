'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminContentApi, AdminContentStatisticsDto } from '@/services/adminApi';
import { useRouter } from 'next/navigation';
import { 
  BookOpenIcon,
  FolderIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { toPersianNumber } from '@/utils/numberUtils';
import {
  BarChart,
  Bar,
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

const AdminDashboardPage: React.FC = () => {
  const router = useRouter();
  const { data: statisticsResponse, isLoading, error } = useQuery({
    queryKey: ['admin-content-statistics'],
    queryFn: async () => {
      const response = await adminContentApi.getStatistics();
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const statistics: AdminContentStatisticsDto | undefined = statisticsResponse?.data;

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
        <p className="text-red-800">خطا در بارگذاری آمار محتوا</p>
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

  const productGrowth = statistics.products.lastMonth > 0
    ? ((statistics.products.thisMonth - statistics.products.lastMonth) / statistics.products.lastMonth * 100).toFixed(1)
    : '0';

  const productData = [
    { name: 'فعال', value: statistics.products.active, color: '#10b981' },
    { name: 'غیرفعال', value: statistics.products.inactive, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const categoryData = [
    { name: 'فعال', value: statistics.categories.active, color: '#3b82f6' },
    { name: 'غیرفعال', value: statistics.categories.inactive, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const categoryTypeData = [
    { name: 'دسته اصلی', value: statistics.categories.rootCategories, color: '#8b5cf6' },
    { name: 'زیردسته', value: statistics.categories.subCategories, color: '#06b6d4' }
  ].filter(item => item.value > 0);

  const authorData = [
    { name: 'فعال', value: statistics.authors.active, color: '#10b981' },
    { name: 'غیرفعال', value: statistics.authors.inactive, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const reviewData = [
    { name: 'تأیید شده', value: statistics.reviews.approved, color: '#10b981' },
    { name: 'در انتظار', value: statistics.reviews.pending, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  const tagData = [
    { name: 'فعال', value: statistics.tags.active, color: '#3b82f6' },
    { name: 'غیرفعال', value: statistics.tags.inactive, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const contentOverviewData = [
    { name: 'محصولات', value: statistics.products.total },
    { name: 'دسته‌بندی‌ها', value: statistics.categories.total },
    { name: 'نویسندگان', value: statistics.authors.total },
    { name: 'نظرات', value: statistics.reviews.total },
    { name: 'برچسب‌ها', value: statistics.tags.total }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">داشبورد مدیریت محتوا</h1>
            <p className="text-sm text-gray-500 mt-1">بررسی و مدیریت محتوای سایت</p>
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => router.push('/admin/products')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-all text-right"
          >
            <BookOpenIcon className="h-8 w-8 text-blue-600 mb-2" />
            <p className="text-sm font-medium text-blue-600 mb-1">محصولات</p>
            <p className="text-2xl font-bold text-blue-900">{toPersianNumber(statistics.products.total)}</p>
          </button>

          <button
            onClick={() => router.push('/admin/categories')}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-all text-right"
          >
            <FolderIcon className="h-8 w-8 text-purple-600 mb-2" />
            <p className="text-sm font-medium text-purple-600 mb-1">دسته‌بندی‌ها</p>
            <p className="text-2xl font-bold text-purple-900">{toPersianNumber(statistics.categories.total)}</p>
          </button>

          <button
            onClick={() => router.push('/admin/authors')}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 hover:shadow-md transition-all text-right"
          >
            <UserGroupIcon className="h-8 w-8 text-green-600 mb-2" />
            <p className="text-sm font-medium text-green-600 mb-1">نویسندگان</p>
            <p className="text-2xl font-bold text-green-900">{toPersianNumber(statistics.authors.total)}</p>
          </button>

          <button
            onClick={() => router.push('/admin/reviews')}
            className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200 hover:shadow-md transition-all text-right"
          >
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-yellow-600 mb-2" />
            <p className="text-sm font-medium text-yellow-600 mb-1">نظرات</p>
            <p className="text-2xl font-bold text-yellow-900">{toPersianNumber(statistics.reviews.total)}</p>
          </button>

          <button
            onClick={() => router.push('/admin/products')}
            className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200 hover:shadow-md transition-all text-right"
          >
            <TagIcon className="h-8 w-8 text-indigo-600 mb-2" />
            <p className="text-sm font-medium text-indigo-600 mb-1">برچسب‌ها</p>
            <p className="text-2xl font-bold text-indigo-900">{toPersianNumber(statistics.tags.total)}</p>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Products Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <BookOpenIcon className="h-6 w-6 text-blue-600" />
              <div className={`flex items-center text-xs ${parseFloat(productGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(productGrowth) >= 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                )}
                <span>{productGrowth}%</span>
              </div>
            </div>
            <p className="text-sm text-blue-600 font-medium mb-1">محصولات</p>
            <p className="text-2xl font-bold text-blue-900">{toPersianNumber(statistics.products.total)}</p>
            <div className="mt-2 text-xs text-blue-700">
              <span>فعال: {toPersianNumber(statistics.products.active)}</span>
              <span className="mr-2"> | </span>
              <span>غیرفعال: {toPersianNumber(statistics.products.inactive)}</span>
            </div>
            <div className="mt-1 text-xs text-blue-600">
              این ماه: {toPersianNumber(statistics.products.thisMonth)}
            </div>
          </div>

          {/* Categories Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <FolderIcon className="h-6 w-6 text-purple-600 mb-2" />
            <p className="text-sm text-purple-600 font-medium mb-1">دسته‌بندی‌ها</p>
            <p className="text-2xl font-bold text-purple-900">{toPersianNumber(statistics.categories.total)}</p>
            <div className="mt-2 text-xs text-purple-700">
              <span>فعال: {toPersianNumber(statistics.categories.active)}</span>
              <span className="mr-2"> | </span>
              <span>غیرفعال: {toPersianNumber(statistics.categories.inactive)}</span>
            </div>
            <div className="mt-1 text-xs text-purple-600">
              اصلی: {toPersianNumber(statistics.categories.rootCategories)} | زیردسته: {toPersianNumber(statistics.categories.subCategories)}
            </div>
          </div>

          {/* Authors Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <UserGroupIcon className="h-6 w-6 text-green-600 mb-2" />
            <p className="text-sm text-green-600 font-medium mb-1">نویسندگان</p>
            <p className="text-2xl font-bold text-green-900">{toPersianNumber(statistics.authors.total)}</p>
            <div className="mt-2 text-xs text-green-700">
              <span>فعال: {toPersianNumber(statistics.authors.active)}</span>
              <span className="mr-2"> | </span>
              <span>تأیید شده: {toPersianNumber(statistics.authors.verified)}</span>
            </div>
          </div>

          {/* Reviews Card */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-yellow-600 mb-2" />
            <p className="text-sm text-yellow-600 font-medium mb-1">نظرات</p>
            <p className="text-2xl font-bold text-yellow-900">{toPersianNumber(statistics.reviews.total)}</p>
            <div className="mt-2 text-xs text-yellow-700">
              <span>تأیید شده: {toPersianNumber(statistics.reviews.approved)}</span>
              <span className="mr-2"> | </span>
              <span>در انتظار: {toPersianNumber(statistics.reviews.pending)}</span>
            </div>
            <div className="mt-1 text-xs text-yellow-600">
              میانگین امتیاز: {parseFloat(statistics.reviews.averageRating.toFixed(2))}
            </div>
          </div>

          {/* Tags Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
            <TagIcon className="h-6 w-6 text-indigo-600 mb-2" />
            <p className="text-sm text-indigo-600 font-medium mb-1">برچسب‌ها</p>
            <p className="text-2xl font-bold text-indigo-900">{toPersianNumber(statistics.tags.total)}</p>
            <div className="mt-2 text-xs text-indigo-700">
              <span>فعال: {toPersianNumber(statistics.tags.active)}</span>
              <span className="mr-2"> | </span>
              <span>غیرفعال: {toPersianNumber(statistics.tags.inactive)}</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Content Overview Bar Chart */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">نمای کلی محتوا</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contentOverviewData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Products Status Pie Chart */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">وضعیت محصولات</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent as number * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories Status */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">وضعیت دسته‌بندی‌ها</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent as number * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Types */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">نوع دسته‌بندی‌ها</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent as number * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Reviews Status */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">وضعیت نظرات</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={reviewData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent as number * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
