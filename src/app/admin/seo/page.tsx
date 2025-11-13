'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminSeoApi, AdminSeoSettingDto, AdminCreateSeoSettingDto, AdminUpdateSeoSettingDto } from '@/services/adminApi';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { 
  PencilIcon, 
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  GlobeAltIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { toPersianNumber } from '@/utils/numberUtils';

const PAGE_TYPES = [
  { value: 'Home', label: 'صفحه اصلی' },
  { value: 'Category', label: 'دسته‌بندی' },
  { value: 'Product', label: 'محصول' },
  { value: 'Author', label: 'نویسنده' },
  { value: 'Search', label: 'جستجو' },
  { value: 'Custom', label: 'سفارشی' }
];

const OG_TYPES = [
  { value: 'website', label: 'وب‌سایت' },
  { value: 'article', label: 'مقاله' },
  { value: 'product', label: 'محصول' },
  { value: 'book', label: 'کتاب' },
  { value: 'profile', label: 'پروفایل' }
];

const TWITTER_CARDS = [
  { value: 'summary', label: 'خلاصه' },
  { value: 'summary_large_image', label: 'خلاصه با تصویر بزرگ' },
  { value: 'app', label: 'اپلیکیشن' },
  { value: 'player', label: 'پلیر' }
];

const ROBOTS_OPTIONS = [
  { value: 'index, follow', label: 'ایندکس و فالو' },
  { value: 'noindex, follow', label: 'بدون ایندکس، فالو' },
  { value: 'index, nofollow', label: 'ایندکس، بدون فالو' },
  { value: 'noindex, nofollow', label: 'بدون ایندکس و فالو' }
];

export default function AdminSeoPage() {
  const { successPersian, errorPersian } = useToastHelpers();
  const queryClient = useQueryClient();
  const { isOpen, modalConfig, showModal, confirm, cancel } = useConfirmationModal();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPageType, setFilterPageType] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSeo, setEditingSeo] = useState<AdminSeoSettingDto | null>(null);
  const [newSeo, setNewSeo] = useState<AdminCreateSeoSettingDto>({
    pageType: 'Home',
    pagePath: '',
    entityId: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogType: 'website',
    ogUrl: '',
    twitterCard: 'summary',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    structuredData: '',
    robotsMeta: 'index, follow',
    additionalMetaTags: '',
    isActive: true,
    priority: 0
  });

  // Fetch SEO settings with pagination
  const { data: seoResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-seo', currentPage, searchTerm, filterPageType],
    queryFn: async () => {
      const response = await adminSeoApi.getAll({
        page: currentPage,
        pageSize: 20,
        searchTerm: searchTerm || undefined,
        pageType: filterPageType || undefined
      });
      return response.data;
    },
    retry: 2,
  });

  const seoSettings = Array.isArray(seoResponse?.data) ? seoResponse.data : [];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPageType]);

  // Create SEO mutation
  const createMutation = useMutation({
    mutationFn: (data: AdminCreateSeoSettingDto) => adminSeoApi.create(data),
    onSuccess: (response) => {
      successPersian(response.data.message || 'تنظیمات SEO با موفقیت ایجاد شد');
      setIsCreateModalOpen(false);
      setNewSeo({
        pageType: 'Home',
        pagePath: '',
        entityId: '',
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        canonicalUrl: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        ogType: 'website',
        ogUrl: '',
        twitterCard: 'summary',
        twitterTitle: '',
        twitterDescription: '',
        twitterImage: '',
        structuredData: '',
        robotsMeta: 'index, follow',
        additionalMetaTags: '',
        isActive: true,
        priority: 0
      });
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در ایجاد تنظیمات SEO');
    },
  });

  // Update SEO mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUpdateSeoSettingDto }) => adminSeoApi.update(id, data),
    onSuccess: (response) => {
      successPersian(response.data.message || 'تنظیمات SEO با موفقیت به‌روزرسانی شد');
      setIsEditModalOpen(false);
      setEditingSeo(null);
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در به‌روزرسانی تنظیمات SEO');
    },
  });

  // Delete SEO mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminSeoApi.delete(id),
    onSuccess: (response) => {
      successPersian(response.data.message || 'تنظیمات SEO با موفقیت حذف شد');
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در حذف تنظیمات SEO');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => adminSeoApi.toggleStatus(id),
    onSuccess: (response) => {
      successPersian(response.data.message || 'وضعیت تنظیمات SEO با موفقیت تغییر کرد');
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در تغییر وضعیت تنظیمات SEO');
    },
  });

  const handleCreateSeo = () => {
    if (!newSeo.pageType.trim()) {
      errorPersian('لطفاً نوع صفحه را انتخاب کنید');
      return;
    }
    createMutation.mutate(newSeo);
  };

  const handleUpdateSeo = () => {
    if (!editingSeo) return;
    updateMutation.mutate({
      id: editingSeo.id,
      data: {
        metaTitle: editingSeo.metaTitle,
        metaDescription: editingSeo.metaDescription,
        metaKeywords: editingSeo.metaKeywords,
        canonicalUrl: editingSeo.canonicalUrl,
        ogTitle: editingSeo.ogTitle,
        ogDescription: editingSeo.ogDescription,
        ogImage: editingSeo.ogImage,
        ogType: editingSeo.ogType,
        ogUrl: editingSeo.ogUrl,
        twitterCard: editingSeo.twitterCard,
        twitterTitle: editingSeo.twitterTitle,
        twitterDescription: editingSeo.twitterDescription,
        twitterImage: editingSeo.twitterImage,
        structuredData: editingSeo.structuredData,
        robotsMeta: editingSeo.robotsMeta,
        additionalMetaTags: editingSeo.additionalMetaTags,
        isActive: editingSeo.isActive,
        priority: editingSeo.priority
      }
    });
  };

  const handleDeleteSeo = (seo: AdminSeoSettingDto) => {
    showModal({
      title: 'حذف تنظیمات SEO',
      message: `آیا مطمئن هستید که می‌خواهید تنظیمات SEO برای "${seo.pageType}" را حذف کنید؟`,
      confirmText: 'حذف',
      cancelText: 'انصراف',
      onConfirm: () => {
        deleteMutation.mutate(seo.id);
        cancel();
      },
      onCancel: cancel
    });
  };

  const handleEditClick = (seo: AdminSeoSettingDto) => {
    setEditingSeo({ ...seo });
    setIsEditModalOpen(true);
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">مدیریت SEO</h1>
        <p className="text-gray-600">مدیریت تنظیمات SEO برای صفحات مختلف</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="جستجو..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <FunnelIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <select
                value={filterPageType}
                onChange={(e) => setFilterPageType(e.target.value)}
                className="pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">همه انواع صفحات</option>
                {PAGE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>ایجاد تنظیمات SEO جدید</span>
          </button>
        </div>
      </div>

      {/* SEO Settings Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع صفحه</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مسیر</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عنوان متا</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اولویت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {seoSettings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    تنظیمات SEO یافت نشد
                  </td>
                </tr>
              ) : (
                seoSettings.map((seo) => (
                  <tr key={seo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {PAGE_TYPES.find(t => t.value === seo.pageType)?.label || seo.pageType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{seo.pagePath || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 line-clamp-1">{seo.metaTitle || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{toPersianNumber(seo.priority)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(seo.id)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          seo.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {seo.isActive ? 'فعال' : 'غیرفعال'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(seo)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSeo(seo)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {seoSettings.length > 0 && (
        <div className="mt-4 flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              قبلی
            </button>
            <span className="px-4 py-2 text-gray-700">
              صفحه {toPersianNumber(currentPage)}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={seoSettings.length < 20}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              بعدی
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">ایجاد تنظیمات SEO جدید</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع صفحه *</label>
                    <select
                      value={newSeo.pageType}
                      onChange={(e) => setNewSeo({ ...newSeo, pageType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      {PAGE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">مسیر صفحه</label>
                    <input
                      type="text"
                      value={newSeo.pagePath}
                      onChange={(e) => setNewSeo({ ...newSeo, pagePath: e.target.value })}
                      placeholder="/about"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">شناسه موجودیت</label>
                    <input
                      type="text"
                      value={newSeo.entityId}
                      onChange={(e) => setNewSeo({ ...newSeo, entityId: e.target.value })}
                      placeholder="برای صفحات خاص (ProductId, CategoryId, etc.)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اولویت</label>
                    <input
                      type="number"
                      value={newSeo.priority}
                      onChange={(e) => setNewSeo({ ...newSeo, priority: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">اطلاعات متا پایه</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">عنوان متا</label>
                      <input
                        type="text"
                        value={newSeo.metaTitle}
                        onChange={(e) => setNewSeo({ ...newSeo, metaTitle: e.target.value })}
                        placeholder="عنوان صفحه برای موتورهای جستجو"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات متا</label>
                      <textarea
                        value={newSeo.metaDescription}
                        onChange={(e) => setNewSeo({ ...newSeo, metaDescription: e.target.value })}
                        placeholder="توضیحات صفحه برای موتورهای جستجو"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">کلمات کلیدی</label>
                      <input
                        type="text"
                        value={newSeo.metaKeywords}
                        onChange={(e) => setNewSeo({ ...newSeo, metaKeywords: e.target.value })}
                        placeholder="کلمات کلیدی با کاما جدا شده"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL کانونیکال</label>
                      <input
                        type="text"
                        value={newSeo.canonicalUrl}
                        onChange={(e) => setNewSeo({ ...newSeo, canonicalUrl: e.target.value })}
                        placeholder="https://example.com/page"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Robots Meta</label>
                      <SearchableSelect
                        options={ROBOTS_OPTIONS}
                        value={newSeo.robotsMeta || 'index, follow'}
                        onChange={(value) => setNewSeo({ ...newSeo, robotsMeta: value })}
                        placeholder="انتخاب Robots Meta"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Open Graph</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">عنوان OG</label>
                      <input
                        type="text"
                        value={newSeo.ogTitle}
                        onChange={(e) => setNewSeo({ ...newSeo, ogTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">نوع OG</label>
                      <select
                        value={newSeo.ogType}
                        onChange={(e) => setNewSeo({ ...newSeo, ogType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      >
                        {OG_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات OG</label>
                      <textarea
                        value={newSeo.ogDescription}
                        onChange={(e) => setNewSeo({ ...newSeo, ogDescription: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تصویر OG</label>
                      <input
                        type="text"
                        value={newSeo.ogImage}
                        onChange={(e) => setNewSeo({ ...newSeo, ogImage: e.target.value })}
                        placeholder="URL تصویر"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL OG</label>
                      <input
                        type="text"
                        value={newSeo.ogUrl}
                        onChange={(e) => setNewSeo({ ...newSeo, ogUrl: e.target.value })}
                        placeholder="URL صفحه"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Twitter Card</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">نوع کارت</label>
                      <select
                        value={newSeo.twitterCard}
                        onChange={(e) => setNewSeo({ ...newSeo, twitterCard: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      >
                        {TWITTER_CARDS.map(card => (
                          <option key={card.value} value={card.value}>{card.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">عنوان توییتر</label>
                      <input
                        type="text"
                        value={newSeo.twitterTitle}
                        onChange={(e) => setNewSeo({ ...newSeo, twitterTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات توییتر</label>
                      <textarea
                        value={newSeo.twitterDescription}
                        onChange={(e) => setNewSeo({ ...newSeo, twitterDescription: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تصویر توییتر</label>
                      <input
                        type="text"
                        value={newSeo.twitterImage}
                        onChange={(e) => setNewSeo({ ...newSeo, twitterImage: e.target.value })}
                        placeholder="URL تصویر"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">ساختار داده (JSON-LD)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">JSON-LD Schema</label>
                    <textarea
                      value={newSeo.structuredData}
                      onChange={(e) => setNewSeo({ ...newSeo, structuredData: e.target.value })}
                      placeholder='{"@context": "https://schema.org", "@type": "Book", ...}'
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newSeo.isActive}
                      onChange={(e) => setNewSeo({ ...newSeo, isActive: e.target.checked })}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <label className="text-sm font-medium text-gray-700">فعال</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCreateSeo}
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'در حال ایجاد...' : 'ایجاد'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingSeo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">ویرایش تنظیمات SEO</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع صفحه</label>
                    <input
                      type="text"
                      value={PAGE_TYPES.find(t => t.value === editingSeo.pageType)?.label || editingSeo.pageType}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اولویت</label>
                    <input
                      type="number"
                      value={editingSeo.priority}
                      onChange={(e) => setEditingSeo({ ...editingSeo, priority: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">اطلاعات متا پایه</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">عنوان متا</label>
                      <input
                        type="text"
                        value={editingSeo.metaTitle || ''}
                        onChange={(e) => setEditingSeo({ ...editingSeo, metaTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات متا</label>
                      <textarea
                        value={editingSeo.metaDescription || ''}
                        onChange={(e) => setEditingSeo({ ...editingSeo, metaDescription: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">کلمات کلیدی</label>
                      <input
                        type="text"
                        value={editingSeo.metaKeywords || ''}
                        onChange={(e) => setEditingSeo({ ...editingSeo, metaKeywords: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL کانونیکال</label>
                      <input
                        type="text"
                        value={editingSeo.canonicalUrl || ''}
                        onChange={(e) => setEditingSeo({ ...editingSeo, canonicalUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Robots Meta</label>
                      <SearchableSelect
                        options={ROBOTS_OPTIONS}
                        value={editingSeo.robotsMeta || 'index, follow'}
                        onChange={(value) => setEditingSeo({ ...editingSeo, robotsMeta: value })}
                        placeholder="انتخاب Robots Meta"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Open Graph</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">عنوان OG</label>
                      <input
                        type="text"
                        value={editingSeo.ogTitle || ''}
                        onChange={(e) => setEditingSeo({ ...editingSeo, ogTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">نوع OG</label>
                      <select
                        value={editingSeo.ogType || 'website'}
                        onChange={(e) => setEditingSeo({ ...editingSeo, ogType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      >
                        {OG_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات OG</label>
                      <textarea
                        value={editingSeo.ogDescription || ''}
                        onChange={(e) => setEditingSeo({ ...editingSeo, ogDescription: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تصویر OG</label>
                      <input
                        type="text"
                        value={editingSeo.ogImage || ''}
                        onChange={(e) => setEditingSeo({ ...editingSeo, ogImage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL OG</label>
                      <input
                        type="text"
                        value={editingSeo.ogUrl || ''}
                        onChange={(e) => setEditingSeo({ ...editingSeo, ogUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Twitter Card</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">نوع کارت</label>
                      <select
                        value={editingSeo.twitterCard || 'summary'}
                        onChange={(e) => setEditingSeo({ ...editingSeo, twitterCard: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      >
                        {TWITTER_CARDS.map(card => (
                          <option key={card.value} value={card.value}>{card.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">عنوان توییتر</label>
                      <input
                        type="text"
                        value={editingSeo.twitterTitle || ''}
                        onChange={(e) => setEditingSeo({ ...editingSeo, twitterTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات توییتر</label>
                      <textarea
                        value={editingSeo.twitterDescription || ''}
                        onChange={(e) => setEditingSeo({ ...editingSeo, twitterDescription: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تصویر توییتر</label>
                      <input
                        type="text"
                        value={editingSeo.twitterImage || ''}
                        onChange={(e) => setEditingSeo({ ...editingSeo, twitterImage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">ساختار داده (JSON-LD)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">JSON-LD Schema</label>
                    <textarea
                      value={editingSeo.structuredData || ''}
                      onChange={(e) => setEditingSeo({ ...editingSeo, structuredData: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingSeo.isActive}
                      onChange={(e) => setEditingSeo({ ...editingSeo, isActive: e.target.checked })}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <label className="text-sm font-medium text-gray-700">فعال</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingSeo(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  انصراف
                </button>
                <button
                  onClick={handleUpdateSeo}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isOpen}
        title={modalConfig?.title}
        message={modalConfig?.message || ''}
        confirmText={modalConfig?.confirmText}
        cancelText={modalConfig?.cancelText}
        onConfirm={confirm}
        onClose={cancel}
      />
    </div>
  );
}

