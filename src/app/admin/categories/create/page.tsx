'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useToastHelpers } from '../../../../hooks/useToastHelpers';
import { useLoading } from '../../../../providers/LoadingProvider';
import { 
  ChevronDownIcon,
  ChevronRightIcon,
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

const CreateCategoryPage: React.FC = () => {
  const router = useRouter();
  const toast = useToastHelpers();
  const { startLoading, stopLoading } = useLoading();
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [categoryForm, setCategoryForm] = useState({
    title: '',
    description: '',
    slug: '',
    iconUrl: 'general',
    parentId: '',
    sort: 1,
    isActive: true,
    isFilterable: false
  });

  const [formErrors, setFormErrors] = useState({
    title: '',
    slug: ''
  });

  // Fetch categories for parent selection
  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories()
  });

  // Get icon component by value
  const getIconComponent = (iconValue: string) => {
    const iconData = CATEGORY_ICONS.find(icon => icon.value === iconValue);
    return iconData ? iconData.icon : TagIcon;
  };

  // Get next suggested sort order
  const getNextSortOrder = () => {
    if (!categories?.data?.length) return 1;
    const maxOrder = Math.max(...categories.data.map(cat => cat.sort));
    return maxOrder + 1;
  };

  const handleSaveCategory = async () => {
    console.log('Form submitted:', categoryForm);
    console.log('Title value:', categoryForm.title);
    console.log('Slug value:', categoryForm.slug);
    
    startLoading('در حال ایجاد دسته‌بندی...', true, 'high');
    
    // Clear previous errors
    setFormErrors({ title: '', slug: '' });
    
    let hasErrors = false;
    
    if (!categoryForm.title.trim()) {
      console.log('Title validation failed - empty title');
      setFormErrors(prev => ({ ...prev, title: 'نام دسته‌بندی الزامی است' }));
      hasErrors = true;
    }

    if (!categoryForm.slug.trim()) {
      console.log('Slug validation failed - empty slug');
      setFormErrors(prev => ({ ...prev, slug: 'اسلاگ دسته‌بندی الزامی است' }));
      hasErrors = true;
    }

    if (hasErrors) {
      toast.errorPersian('لطفاً فیلدهای الزامی را پر کنید');
      return;
    }

    console.log('Validation passed, proceeding to API call');

    try {
      console.log('Sending data to API:', {
        Title: categoryForm.title,
        Description: categoryForm.description,
        Slug: categoryForm.slug,
        IconUrl: categoryForm.iconUrl,
        ParentId: categoryForm.parentId || undefined,
        Sort: categoryForm.sort,
        IsActive: categoryForm.isActive,
        IsFilterable: categoryForm.isFilterable
      });
      
      const response = await adminApi.createCategory({
        Title: categoryForm.title,
        Description: categoryForm.description,
        Slug: categoryForm.slug,
        IconUrl: categoryForm.iconUrl,
        ParentId: categoryForm.parentId || undefined,
        Sort: categoryForm.sort,
        IsActive: categoryForm.isActive,
        IsFilterable: categoryForm.isFilterable
      });
      
      console.log('API Response:', response);
      toast.successPersian('دسته‌بندی با موفقیت ایجاد شد');
      router.push('/admin/categories');
    } catch (error: any) {
      console.error('Error creating category:', error);
      
      // Show user-friendly error messages only
      // Check if data is a string (error message directly)
      if (error?.response?.data && typeof error.response.data === 'string') {
        toast.errorPersian(error.response.data);
      } else if (error?.response?.data?.Message) {
        toast.errorPersian(error.response.data.Message);
      } else if (error?.response?.data?.message) {
        toast.errorPersian(error.response.data.message);
      } else if (error?.response?.data?.errors) {
        // Handle validation errors from API
        const errors = error.response.data.errors;
        if (Array.isArray(errors)) {
          errors.forEach((err: any) => {
            toast.errorPersian(err.message || String(err));
          });
        } else {
          toast.errorPersian(String(errors));
        }
      } else {
        // Generic user-friendly error message for any technical errors
        toast.errorPersian('خطا در ایجاد دسته‌بندی. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      stopLoading();
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-reverse space-x-4">
              <button
                onClick={() => router.push('/admin/categories')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="بازگشت"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h3 className="text-lg font-medium text-gray-900">افزودن دسته‌بندی جدید</h3>
                <p className="mt-1 text-sm text-gray-500">
                  دسته‌بندی جدید را ایجاد کنید
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام دسته‌بندی *
              </label>
              <input
                type="text"
                value={categoryForm.title}
                onChange={(e) => {
                  console.log('Title input changed:', e.target.value);
                  setCategoryForm({ ...categoryForm, title: e.target.value });
                  // Clear error when user starts typing
                  if (formErrors.title) {
                    setFormErrors(prev => ({ ...prev, title: '' }));
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: الکترونیک، خودرو، خانه و باغ"
                maxLength={200}
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
              )}
            </div>

            {/* Category Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسلاگ دسته‌بندی *
              </label>
              <input
                type="text"
                value={categoryForm.slug}
                onChange={(e) => {
                  console.log('Slug input changed:', e.target.value);
                  setCategoryForm({ ...categoryForm, slug: e.target.value });
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: electronics، car، home-garden"
                maxLength={1000}
              />
              {formErrors.slug && (
                <p className="mt-1 text-sm text-red-600">{formErrors.slug}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                اسلاگ باید به انگلیسی و بدون فاصله باشد
              </p>
            </div>

            {/* Category Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                توضیحات
              </label>
              <textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="توضیح مختصری درباره این دسته‌بندی"
                maxLength={1000}
              />
            </div>

            {/* Parent Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                دسته‌بندی والد
              </label>
              <SearchableSelect
                options={[
                  { value: '', label: 'دسته‌بندی اصلی (بدون والد)' },
                  ...(categories?.data
                    ? flattenCategories(categories.data).map((cat) => ({
                        value: cat.id,
                        label: `${'— '.repeat(cat.level)}${cat.title}`
                      }))
                    : [])
                ]}
                value={categoryForm.parentId}
                onChange={(value) => setCategoryForm({ ...categoryForm, parentId: value })}
                placeholder="انتخاب دسته‌بندی والد"
              />
              <p className="mt-1 text-xs text-gray-500">
                برای ایجاد زیر دسته‌بندی، دسته‌بندی والد را انتخاب کنید
              </p>
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                آیکون دسته‌بندی
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-right flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center space-x-reverse space-x-2">
                    {React.createElement(getIconComponent(categoryForm.iconUrl), { className: "h-5 w-5" })}
                    <span>
                      {CATEGORY_ICONS.find(icon => icon.value === categoryForm.iconUrl)?.name || 'انتخاب آیکون'}
                    </span>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </button>
                
                {showIconPicker && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2 p-3">
                      {CATEGORY_ICONS.map((iconOption) => {
                        const IconComponent = iconOption.icon;
                        return (
                          <button
                            key={iconOption.value}
                            type="button"
                            onClick={() => {
                              setCategoryForm({ ...categoryForm, iconUrl: iconOption.value });
                              setShowIconPicker(false);
                            }}
                            className={`p-3 rounded-lg border-2 hover:bg-gray-50 flex flex-col items-center space-y-1 ${
                              categoryForm.iconUrl === iconOption.value 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200'
                            }`}
                          >
                            <IconComponent className="h-6 w-6 text-gray-600" />
                            <span className="text-xs text-gray-600 text-center">{iconOption.name}</span>
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
                value={categoryForm.sort}
                onChange={(e) => setCategoryForm({ ...categoryForm, sort: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="9999"
              />
              <p className="mt-1 text-xs text-gray-500">
                پیشنهاد: {getNextSortOrder()} (عدد کمتر = نمایش زودتر)
              </p>
            </div>

            {/* Category Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">تنظیمات دسته‌بندی</h4>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={categoryForm.isActive}
                    onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="mr-2 text-sm text-gray-700">دسته‌بندی فعال</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={categoryForm.isFilterable}
                    onChange={(e) => setCategoryForm({ ...categoryForm, isFilterable: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="mr-2 text-sm text-gray-700">قابل فیلتر</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-reverse space-x-3 pt-4 border-t">
              <button
                onClick={() => router.push('/admin/categories')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                لغو
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Button clicked');
                  handleSaveCategory();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                type="button"
              >
                ایجاد دسته‌بندی
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCategoryPage;
