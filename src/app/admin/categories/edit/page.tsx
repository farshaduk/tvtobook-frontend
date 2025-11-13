'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useToastHelpers } from '../../../../hooks/useToastHelpers';
import { useLoading } from '../../../../providers/LoadingProvider';
import { 
  ChevronDownIcon,
  TagIcon,
  BuildingStorefrontIcon,
  HomeIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  HeartIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  CameraIcon,
  SparklesIcon,
  GiftIcon,
  BeakerIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  MapIcon,
  StarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import adminApi, { AdminCategoryDto } from '../../../../services/adminApi';
import { SearchableSelect } from '../../../../components/ui/searchable-select';

// Category Icons for selection
const CATEGORY_ICONS = [
  { name: 'کتاب‌های عمومی', icon: BookOpenIcon, value: 'general-books' },
  { name: 'رمان و داستان', icon: SparklesIcon, value: 'novels' },
  { name: 'کتاب‌های علمی', icon: BeakerIcon, value: 'science-books' },
  { name: 'تاریخ و جغرافیا', icon: MapIcon, value: 'history-geography' },
  { name: 'ادبیات فارسی', icon: AcademicCapIcon, value: 'persian-literature' },
  { name: 'ادبیات جهان', icon: StarIcon, value: 'world-literature' },
  { name: 'کودک و نوجوان', icon: HeartIcon, value: 'children-books' },
  { name: 'آموزش و کمک‌درسی', icon: AcademicCapIcon, value: 'educational' },
  { name: 'دین و مذهب', icon: BuildingStorefrontIcon, value: 'religion' },
  { name: 'فلسفه و روانشناسی', icon: BeakerIcon, value: 'philosophy-psychology' },
  { name: 'هنر و طراحی', icon: CameraIcon, value: 'art-design' },
  { name: 'ورزش و سلامتی', icon: StarIcon, value: 'sports-health' },
  { name: 'کامپیوتر و فناوری', icon: ComputerDesktopIcon, value: 'computer-tech' },
  { name: 'زبان‌های خارجی', icon: TagIcon, value: 'foreign-languages' },
  { name: 'مجلات و نشریات', icon: BookOpenIcon, value: 'magazines' },
  { name: 'کتاب‌های صوتی', icon: MusicalNoteIcon, value: 'audio-books' },
  { name: 'کتاب‌های الکترونیکی', icon: DevicePhoneMobileIcon, value: 'e-books' },
  { name: 'نقشه و اطلس', icon: MapIcon, value: 'maps-atlas' },
  { name: 'کتاب‌های نفیس', icon: GiftIcon, value: 'premium-books' },
  { name: 'عمومی', icon: TagIcon, value: 'general' }
];

// Helper to flatten categories with indentation
const flattenCategories = (categories: AdminCategoryDto[], parentId: string = '', level: number = 0): (AdminCategoryDto & {level: number})[] => {
  let result: (AdminCategoryDto & {level: number})[] = [];
  categories.filter((cat: AdminCategoryDto) => (cat.parentId || '') === parentId).forEach((cat: AdminCategoryDto) => {
    result.push({ ...cat, level });
    result = result.concat(flattenCategories(categories, cat.id, level + 1));
  });
  return result;
};

const EditCategoryPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToastHelpers();
  const { startLoading, stopLoading } = useLoading();
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryId = searchParams.get('id') as string;

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [categoryForm, setCategoryForm] = useState({
    title: '',
    slug: '',
    description: '',
    iconValue: 'general',
    sortOrder: 0,
    isActive: true,
    parentId: ''
  });

  // Fetch all categories for parent selection
  const { data: allCategories } = useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: async () => {
      const response = await adminApi.getCategories();
      return response.data;
    }
  });

  // Fetch current category details
  const { data: category, isLoading } = useQuery({
    queryKey: ['admin-category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const response = await adminApi.getCategory(categoryId);
      return response.data;
    },
    enabled: !!categoryId && typeof window !== 'undefined'
  });

  // Populate form when category data is loaded
  useEffect(() => {
    if (category) {
      setCategoryForm({
        title: category.title || '',
        slug: category.slug || '',
        description: category.description || '',
        iconValue: category.iconUrl || 'general',
        sortOrder: category.sort || 0,
        isActive: category.isActive ?? true,
        parentId: category.parentId || ''
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryId) {
      toast.errorPersian('شناسه دسته‌بندی یافت نشد');
      return;
    }

    setIsSubmitting(true);
    startLoading('در حال ویرایش دسته‌بندی...', true);

    try {
      const updateData = {
        Id: categoryId,
        Title: categoryForm.title,
        Slug: categoryForm.slug,
        Description: categoryForm.description || undefined,
        IconUrl: categoryForm.iconValue || undefined,
        Sort: categoryForm.sortOrder,
        IsActive: categoryForm.isActive,
        IsFilterable: true,
        ParentId: categoryForm.parentId || undefined
      };

      await adminApi.updateCategory(categoryId, updateData);
      
      toast.successPersian('دسته‌بندی با موفقیت ویرایش شد');
      
      // Redirect back to categories list
      router.push('/admin/categories');
    } catch (error: any) {
      console.error('Error updating category:', error);
      const errorMessage = error.response?.data?.message || 'خطا در ویرایش دسته‌بندی';
      toast.errorPersian(errorMessage);
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };

  const handleCancel = () => {
    router.push('/admin/categories');
  };

  const handleInputChange = (field: string, value: any) => {
    setCategoryForm(prev => ({ ...prev, [field]: value }));
  };

  // Auto-generate slug from title (Persian-aware)
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0600-\u06FFa-z0-9\-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleTitleChange = (title: string) => {
    handleInputChange('title', title);
    if (!categoryForm.slug || categoryForm.slug === generateSlug(categoryForm.title)) {
      handleInputChange('slug', generateSlug(title));
    }
  };

  if (!isMounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">دسته‌بندی یافت نشد</p>
          <button 
            onClick={handleCancel}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  // Filter out current category and its descendants from parent selection
  const availableParentCategories = allCategories?.filter((cat: AdminCategoryDto) => {
    if (cat.id === categoryId) return false;
    // Check if cat is a descendant of current category
    let parent = allCategories.find((p: AdminCategoryDto) => p.id === cat.parentId);
    while (parent) {
      if (parent.id === categoryId) return false;
      parent = allCategories.find((p: AdminCategoryDto) => p.id === parent!.parentId);
    }
    return true;
  }) || [];

  const flattenedCategories = flattenCategories(availableParentCategories);
  const selectedIcon = CATEGORY_ICONS.find(icon => icon.value === categoryForm.iconValue) || CATEGORY_ICONS[0];
  const SelectedIconComponent = selectedIcon.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-6 rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600 rtl:rotate-180" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ویرایش دسته‌بندی</h1>
              <p className="text-gray-600 mt-1">ویرایش اطلاعات دسته‌بندی</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام دسته‌بندی <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={categoryForm.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="مثال: کتاب‌های علمی"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نامک (Slug) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={categoryForm.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="science-books"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                URL دسته‌بندی: /category/{categoryForm.slug || 'slug'}
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                توضیحات
              </label>
              <textarea
                value={categoryForm.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={4}
                placeholder="توضیحات دسته‌بندی..."
              />
            </div>

            {/* Parent Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                دسته‌بندی والد
              </label>
              <SearchableSelect
                options={[
                  { value: '', label: 'بدون والد (دسته اصلی)' },
                  ...flattenedCategories.map((cat) => ({
                    value: cat.id,
                    label: `${'—'.repeat(cat.level)} ${cat.title}`
                  }))
                ]}
                value={categoryForm.parentId}
                onChange={(value) => handleInputChange('parentId', value)}
                placeholder="انتخاب دسته‌بندی والد"
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                آیکون
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <SelectedIconComponent className="h-6 w-6 text-primary" />
                    <span>{selectedIcon.name}</span>
                  </div>
                  <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${showIconPicker ? 'rotate-180' : ''}`} />
                </button>

                {showIconPicker && (
                  <div className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto">
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {CATEGORY_ICONS.map((icon) => {
                        const IconComponent = icon.icon;
                        return (
                          <button
                            key={icon.value}
                            type="button"
                            onClick={() => {
                              handleInputChange('iconValue', icon.value);
                              setShowIconPicker(false);
                            }}
                            className={`flex items-center space-x-2 space-x-reverse p-2 rounded-lg hover:bg-gray-100 ${
                              categoryForm.iconValue === icon.value ? 'bg-primary/10 border-2 border-primary' : 'border border-transparent'
                            }`}
                          >
                            <IconComponent className="h-5 w-5 text-primary" />
                            <span className="text-sm">{icon.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ترتیب نمایش
              </label>
              <input
                type="number"
                value={categoryForm.sortOrder}
                onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center space-x-3 space-x-reverse">
              <input
                type="checkbox"
                id="isActive"
                checked={categoryForm.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                فعال
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 space-x-reverse pt-4 border-t">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 space-x-reverse"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>در حال ذخیره...</span>
                  </>
                ) : (
                  <span>ذخیره تغییرات</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EditCategoryPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <EditCategoryPageContent />
    </Suspense>
  );
};

export default EditCategoryPage;

