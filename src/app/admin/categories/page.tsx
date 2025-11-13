'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useToast } from '@/components/ui/toast';
import { useLoading } from '@/providers/LoadingProvider';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin as checkIsAdmin } from '@/utils/roleUtils';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  Bars3Icon,
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
  StarIcon
} from '@heroicons/react/24/outline';
import adminApi, { AdminCategoryDto, CategoryAttributeDto, CategoryAttributeValueDto, CreateCategoryAttributeDto, UpdateCategoryAttributeDto, UpdateCategoryAttributeValueDto, CreateCategoryAttributeValueDto } from '@/services/adminApi';

// Category Icons for selection
const CATEGORY_ICONS = [
  { name: 'خانه و باغ', icon: HomeIcon, value: 'home' },
  { name: 'خودرو', icon: TruckIcon, value: 'car' },
  { name: 'الکترونیک', icon: ComputerDesktopIcon, value: 'electronics' },
  { name: 'موبایل', icon: DevicePhoneMobileIcon, value: 'mobile' },
  { name: 'فروشگاه', icon: BuildingStorefrontIcon, value: 'shop' },
  { name: 'ابزار', icon: WrenchScrewdriverIcon, value: 'tools' },
  { name: 'زیبایی', icon: HeartIcon, value: 'beauty' },
  { name: 'کتاب', icon: BookOpenIcon, value: 'book' },
  { name: 'موسیقی', icon: MusicalNoteIcon, value: 'music' },
  { name: 'عکاسی', icon: CameraIcon, value: 'camera' },
  { name: 'پوشاک', icon: SparklesIcon, value: 'clothing' },
  { name: 'هدیه', icon: GiftIcon, value: 'gift' },
  { name: 'علمی', icon: BeakerIcon, value: 'science' },
  { name: 'آموزش', icon: AcademicCapIcon, value: 'education' },
  { name: 'کسب و کار', icon: BriefcaseIcon, value: 'business' },
  { name: 'سفر', icon: MapIcon, value: 'travel' },
  { name: 'ورزش', icon: StarIcon, value: 'sports' },
  { name: 'عمومی', icon: TagIcon, value: 'general' }
];

// Helper to flatten categories with indentation (flat array only)
const flattenCategories = (categories: AdminCategoryDto[], parentId: string = '', level: number = 0): (AdminCategoryDto & {level: number})[] => {
  let result: (AdminCategoryDto & {level: number})[] = [];
  categories.filter((cat: AdminCategoryDto) => (cat.parentId || '') === parentId).forEach((cat: AdminCategoryDto) => {
    result.push({ ...cat, level });
    result = result.concat(flattenCategories(categories, cat.id, level + 1));
  });
  return result;
};

const AdminCategoriesPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { startLoading, stopLoading } = useLoading();
  const [selectedCategoryForAttributes, setSelectedCategoryForAttributes] = useState<string>('');
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingAttribute, setEditingAttribute] = useState<CategoryAttributeDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Confirmation modal functions
  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const closeConfirmation = () => {
    setConfirmationModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {}
    });
  };

  const handleConfirm = () => {
    confirmationModal.onConfirm();
    closeConfirmation();
  };
  
  const [attributeForm, setAttributeForm] = useState({
    name: '',
    label: '',
    inputType: 'Text',
    isRequired: false,
    isFilterable: false,
    sort: 0,
    options: '',
    defaultValue: ''
  });

  // Fetch categories - MUST be before any conditional returns
  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories()
  });

  // Fetch category attributes
  const { data: categoryAttributes, refetch: refetchAttributes } = useQuery({
    queryKey: ['category-attributes', selectedCategoryForAttributes],
    queryFn: () => adminApi.getCategoryAttributes(selectedCategoryForAttributes),
    enabled: !!selectedCategoryForAttributes && typeof window !== 'undefined'
  });

  // Refetch categories when page is focused/loaded
  useEffect(() => {
    // Only fetch data in browser, not during static export build
    if (typeof window === 'undefined') return;
    
    refetchCategories();
  }, [refetchCategories]);

  // Debug: Log categories data to see what API returns
  useEffect(() => {
    if (categories?.data) {     
      categories.data.forEach(cat => {
        // Category loaded
      });
      
      // Auto-expand all parent categories that have children
      const parentsWithChildren = new Set<string>();
      categories.data.forEach(cat => {
        if (cat.parentId) {
          parentsWithChildren.add(cat.parentId);
        }
      });
      setExpandedCategories(parentsWithChildren);
    }
  }, [categories]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Helper to flatten categories with collapse/expand support
  const flattenCategoriesWithCollapse = (categories: AdminCategoryDto[], parentId: string | null | undefined = null, level: number = 0): (AdminCategoryDto & {level: number})[] => {
    let result: (AdminCategoryDto & {level: number})[] = [];
    const normalizedParentId = parentId || null;
    
    // Filter categories for this level and sort them by sort order
    const categoriesAtThisLevel = categories
      .filter((cat: AdminCategoryDto) => {
        const catParentId = cat.parentId || null;
        return catParentId === normalizedParentId;
      })
      .sort((a, b) => a.sort - b.sort);
    
    categoriesAtThisLevel.forEach((cat: AdminCategoryDto) => {
      result.push({ ...cat, level });
      // Only show children if parent is expanded
      if (expandedCategories.has(cat.id)) {
        result = result.concat(flattenCategoriesWithCollapse(categories, cat.id, level + 1));
      }
    });
    return result;
  };

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedCategory(categoryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory === targetCategoryId) return;

    // Here you would implement the API call to reorder categories
    
    // Reset drag state
    setDraggedCategory(null);
    toast.success('ترتیب دسته‌بندی‌ها تغییر یافت');
  };

  const handleManageAttributes = (categoryId: string) => {
    setSelectedCategoryForAttributes(categoryId);
    setShowAttributeModal(true);
  };

  const handleAddCategory = () => {
    router.push('/admin/categories/create');
  };

  const handleEditCategory = (category: AdminCategoryDto) => {
    router.push(`/admin/categories/edit?id=${category.id}`);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    showConfirmation(
      'حذف دسته‌بندی',
      'آیا از حذف این دسته‌بندی اطمینان دارید؟ این عمل قابل بازگشت نیست.',
      async () => {
        startLoading('در حال حذف دسته‌بندی...', true, 'high');
      try {
        await adminApi.deleteCategory(categoryId);
        toast.success('دسته‌بندی با موفقیت حذف شد');
        refetchCategories();
      } catch (error) {
        toast.error('خطا در حذف دسته‌بندی');
        } finally {
          stopLoading();
        }
    }
    );
  };

  const handleSaveAttribute = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    // Validation
    if (!attributeForm.label.trim()) {
      toast.error('برچسب نمایشی الزامی است');
      return;
    }

    if (!attributeForm.inputType.trim()) {
      toast.error('نوع ورودی الزامی است');
      return;
    }

    setIsSubmitting(true);
    startLoading('در حال ذخیره ویژگی...', true, 'high');

    if (!selectedCategoryForAttributes) {
      toast.error('دسته‌بندی انتخاب نشده است');
      return;
    }

    // Check for duplicate attribute names
    if (categoryAttributes?.data) {
      const existingAttribute = categoryAttributes.data.find(attr => 
        attr.title.toLowerCase() === attributeForm.label.trim().toLowerCase()
      );
      
      if (existingAttribute && (!editingAttribute || existingAttribute.id !== editingAttribute.id)) {
        showToast({
          type: 'error',
          title: 'خطا',
          message: `ویژگی "${attributeForm.label.trim()}" قبلاً برای این دسته‌بندی تعریف شده است`
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (editingAttribute) {
        // Update existing attribute
        let values: UpdateCategoryAttributeValueDto[] | undefined;
        
        // Parse options for Dropdown/MultiSelect types - simple line by line
        if ((attributeForm.inputType === 'Dropdown' || attributeForm.inputType === 'MultiSelect') && attributeForm.options.trim()) {
          const optionsArray = attributeForm.options
            .split('\n')
            .map(option => option.trim())
            .filter(option => option.length > 0);
          
          values = optionsArray.map((option: string, index: number) => {
            // Try to find existing value to preserve ID if it exists
            const existingValue = editingAttribute.values?.find(v => v.title === option);
            
            // Create the complete object at once instead of dynamic assignment
            return {
              Id: existingValue?.id || crypto.randomUUID(),
              CategoryAttributeId: editingAttribute.id,
              Title: option,
              Value: option,
              Sort: index,
              IsDefault: index === 0,
              CreatedAt: existingValue?.createdAt || new Date().toISOString(),
              UpdatedAt: new Date().toISOString()
            };
          });
        }

        const updateData: UpdateCategoryAttributeDto = {
          Id: editingAttribute.id,
          CategoryId: selectedCategoryForAttributes,
          Title: attributeForm.label.trim(),
          InputType: attributeForm.inputType,
          IsRequired: attributeForm.isRequired,
          IsFilterable: attributeForm.isFilterable,
          Sort: attributeForm.sort,
          Values: values
        };
        const response = await adminApi.updateCategoryAttribute(selectedCategoryForAttributes, editingAttribute.id, updateData);
        toast.success('ویژگی با موفقیت بروزرسانی شد');
      } else {
        // Create new attribute
        let values: CreateCategoryAttributeValueDto[] | undefined;
        
        // Parse options for Dropdown/MultiSelect types - simple line by line
        if ((attributeForm.inputType === 'Dropdown' || attributeForm.inputType === 'MultiSelect') && attributeForm.options.trim()) {
          const optionsArray = attributeForm.options
            .split('\n')
            .map(option => option.trim())
            .filter(option => option.length > 0);
          
          values = optionsArray.map((option: string, index: number) => ({
            title: option,
            value: option,
            sort: index,
            isDefault: index === 0 // First option is default
          }));
        }

        const createData: CreateCategoryAttributeDto = {
          CategoryId: selectedCategoryForAttributes,
          Title: attributeForm.label.trim(),
          InputType: attributeForm.inputType,
          IsRequired: attributeForm.isRequired,
          IsFilterable: attributeForm.isFilterable,
          Sort: attributeForm.sort,
          Values: values
        };
        
        const response = await adminApi.createCategoryAttribute(selectedCategoryForAttributes, createData);
        toast.success('ویژگی با موفقیت ایجاد شد');
      }

      // Reset form
      setAttributeForm({
        name: '',
        label: '',
        inputType: 'Text',
        isRequired: false,
        isFilterable: false,
        sort: 0,
        options: '',
        defaultValue: ''
      });
      setEditingAttribute(null);
      
      // Force refetch attributes to update the list
      await refetchAttributes();
    } catch (error: any) {
      // Extract error message from response - prioritize backend message
      let errorMessage = 'خطا در ذخیره ویژگی';
      
      if (error?.response?.data) {
        // If response data is a string (like the Persian message)
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
        // If response data has a message property
        else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        // If response data has errors array
        else if (error.response.data.errors) {
          const errors = Object.values(error.response.data.errors).flat();
          errorMessage = errors.join(', ');
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show error message to user using global toast
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };

  const handleEditAttribute = (attr: CategoryAttributeDto) => {
    setEditingAttribute(attr);
    
    // Convert values back to simple line-by-line format for editing
    let optionsString = '';
    if (attr.values && attr.values.length > 0) {
      optionsString = attr.values.map(v => v.title).join('\n');
    }
    
    setAttributeForm({
      name: attr.title, // Using title as name for now
      label: attr.title,
      inputType: attr.inputType,
      isRequired: attr.isRequired,
      isFilterable: attr.isFilterable,
      sort: attr.sort,
      options: optionsString,
      defaultValue: ''
    });
    
    // Open the modal for editing
    setShowAttributeModal(true);
  };

  const handleDeleteAttribute = async (attributeId: string) => {
    showConfirmation(
      'حذف ویژگی',
      'آیا از حذف این ویژگی اطمینان دارید؟ این عمل قابل بازگشت نیست.',
      async () => {
        startLoading('در حال حذف ویژگی...', true, 'high');
        try {
          await adminApi.deleteCategoryAttribute(attributeId);
          toast.success('ویژگی حذف شد');
          // Force refetch to update the list
          await refetchAttributes();
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || error?.message || 'خطا در حذف ویژگی';
          toast.error(errorMessage);
        } finally {
          stopLoading();
        }
      }
    );
  };

  const handleCancelEditAttribute = () => {
    setEditingAttribute(null);
    setAttributeForm({
      name: '',
      label: '',
      inputType: 'Text',
      isRequired: false,
      isFilterable: false,
      sort: 0,
      options: '',
      defaultValue: ''
    });
  };


  return (
    <div className="space-y-6">
      {/* Information Panel */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 rounded-full bg-blue-400 text-white flex items-center justify-center text-xs">ℹ</div>
          </div>
          <div className="mr-3">
            <h3 className="text-sm font-medium text-blue-800">راهنمای مدیریت دسته‌بندی‌ها</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>هم دسته‌بندی‌های اصلی و هم زیر دسته‌بندی‌ها می‌توانند ویژگی داشته باشند</li>
                <li>برای تغییر ترتیب، دسته‌بندی‌ها را بکشید و رها کنید</li>
                <li>ویژگی‌های اجباری در فرم درج آگهی لازم است</li>
                <li>ویژگی‌های قابل فیلتر در صفحه جستجو نمایش داده می‌شوند</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">مدیریت دسته‌بندی‌ها</h3>
              <p className="mt-1 text-sm text-gray-500">
                دسته‌بندی‌ها را مدیریت کنید و ویژگی‌های مخصوص هر دسته را تعریف کنید
              </p>
            </div>
            <button
              onClick={handleAddCategory}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-reverse space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>افزودن دسته‌بندی</span>
            </button>
          </div>

          {/* Categories Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ترتیب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    آیکون
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نام دسته‌بندی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تعداد آگهی‌ها
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ویژگی‌ها
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories?.data &&
                  flattenCategoriesWithCollapse(categories.data)
                    ?.map((category: AdminCategoryDto & {level: number}) => {
                      const IconComponent = getIconComponent('general'); // Default icon
                      const hasChildren = categories?.data?.some(cat => cat.parentId === category.id);
                      const isExpanded = expandedCategories.has(category.id);
                      
                      return (
                        <tr 
                          key={category.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, category.id)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, category.id)}
                          className={`hover:bg-gray-50 cursor-move ${draggedCategory === category.id ? 'opacity-50' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Bars3Icon className="h-4 w-4 text-gray-400 ml-2" />
                              <span className="text-sm font-medium text-gray-900">{category.sort}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <IconComponent className="h-6 w-6 text-gray-600" />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex items-center">
                                {/* Indentation and expand/collapse button */}
                                <div className="flex items-center" style={{ marginRight: `${category.level * 20}px` }}>
                                  {hasChildren ? (
                                    <button
                                      onClick={() => toggleCategoryExpansion(category.id)}
                                      className="p-1.5 hover:bg-blue-50 rounded-lg transition-all duration-300 group border border-transparent hover:border-blue-200 hover:shadow-sm"
                                      title={isExpanded ? 'بستن' : 'باز کردن'}
                                    >
                                      <div className={`transform transition-all duration-300 ${isExpanded ? 'rotate-0 scale-100' : 'rotate-0 scale-100'}`}>
                                        {isExpanded ? (
                                          <ChevronDownIcon className="h-4 w-4 text-blue-600 group-hover:text-blue-700 group-hover:scale-110 transition-all duration-200" />
                                        ) : (
                                          <ChevronRightIcon className="h-4 w-4 text-blue-500 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-200" />
                                        )}
                                      </div>
                                    </button>
                                  ) : (
                                    <div className="w-6 h-4 flex items-center justify-center">
                                      {category.level > 0 && (
                                        <div className="w-1.5 h-1.5 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full shadow-sm"></div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {category.title}
                                  </div>
                                  {category.description && (
                                    <div className="text-sm text-gray-500">
                                      {category.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              category.parentId 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {category.parentId ? 'زیر دسته‌بندی' : 'دسته‌بندی اصلی'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">0</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleManageAttributes(category.id)}
                              className="text-purple-600 hover:text-purple-900 text-sm font-medium flex items-center space-x-reverse space-x-1"
                            >
                              <TagIcon className="h-4 w-4" />
                              <span>مدیریت ویژگی‌ها</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-reverse space-x-2">
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                                title="ویرایش"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                title="حذف"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Category Attributes Management Modal */}
      {showAttributeModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                setShowAttributeModal(false);
                setSelectedCategoryForAttributes('');
                setEditingAttribute(null);
                handleCancelEditAttribute();
              }
            }}
            onTouchEnd={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                setShowAttributeModal(false);
                setSelectedCategoryForAttributes('');
                setEditingAttribute(null);
                handleCancelEditAttribute();
              }
            }}
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            aria-label="بستن مدیریت ویژگی‌ها"
          >
            <div className="relative top-10 mx-auto p-6 w-11/12 max-w-5xl">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100">
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-t-2xl px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-reverse space-x-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <TagIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                  مدیریت ویژگی‌های دسته‌بندی
                        </h3>
                  {selectedCategoryForAttributes && (
                          <p className="text-xs text-white/80 mt-0.5">
                            دسته‌بندی: {categories?.data?.find((c: AdminCategoryDto) => c.id === selectedCategoryForAttributes)?.title}
                          </p>
                        )}
                      </div>
                    </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAttributeModal(false);
                    setSelectedCategoryForAttributes('');
                        setEditingAttribute(null);
                        handleCancelEditAttribute();
                  }}
                      className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-200 touch-manipulation active:scale-90"
                  style={{ 
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  type="button"
                  aria-label="بستن"
                >
                      <span className="text-white text-xl leading-none pointer-events-none">✕</span>
                </button>
              </div>
                </div>
              
              <div className="p-6">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attribute Form */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-reverse space-x-2 mb-4">
                    <PlusIcon className="h-5 w-5 text-primary-600" />
                    <h4 className="font-semibold text-gray-900">
                      {editingAttribute ? 'ویرایش ویژگی' : 'افزودن ویژگی جدید'}
                    </h4>
                  </div>
                  <div className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">نام</label>
                    <input
                      type="text"
                      value={attributeForm.name}
                      onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="مثال: سال، مارک، مدل"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">برچسب نمایشی</label>
                    <input
                      type="text"
                      value={attributeForm.label}
                      onChange={(e) => setAttributeForm({ ...attributeForm, label: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="مثال: سال، مارک، مدل"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">نوع</label>
                    <select
                      value={attributeForm.inputType}
                      onChange={(e) => setAttributeForm({ ...attributeForm, inputType: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    >
                      <option value="Text">متن</option>
                      <option value="Number">عدد</option>
                      <option value="Boolean">بله/خیر</option>
                      <option value="Date">تاریخ</option>
                      <option value="Dropdown">کشویی</option>
                      <option value="MultiSelect">انتخاب چندگانه</option>
                      <option value="TextArea">ناحیه متنی</option>
                      <option value="Url">آدرس اینترنتی</option>
                      <option value="Email">ایمیل</option>
                    </select>
                  </div>

                  {(attributeForm.inputType === 'Dropdown' || attributeForm.inputType === 'MultiSelect') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">گزینه‌ها (هر گزینه در یک خط)</label>
                      <textarea
                        value={attributeForm.options}
                        onChange={(e) => setAttributeForm({ ...attributeForm, options: e.target.value })}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        rows={3}
                        placeholder="گزینه اول&#10;گزینه دوم&#10;گزینه سوم"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">مقدار پیش‌فرض</label>
                    <input
                      type="text"
                      value={attributeForm.defaultValue}
                      onChange={(e) => setAttributeForm({ ...attributeForm, defaultValue: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">ترتیب</label>
                    <input
                      type="number"
                      value={attributeForm.sort}
                      onChange={(e) => setAttributeForm({ ...attributeForm, sort: Number(e.target.value) })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={attributeForm.isRequired}
                        onChange={(e) => setAttributeForm({ ...attributeForm, isRequired: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2 w-4 h-4"
                      />
                      <span className="mr-2 text-sm font-medium text-gray-700 group-hover:text-gray-900">فیلد اجباری</span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={attributeForm.isFilterable}
                        onChange={(e) => setAttributeForm({ ...attributeForm, isFilterable: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2 w-4 h-4"
                      />
                      <span className="mr-2 text-sm font-medium text-gray-700 group-hover:text-gray-900">استفاده در فیلترها</span>
                    </label>
                  </div>

                  <div className="flex space-x-reverse space-x-3 pt-2">
                    <button
                      onClick={handleSaveAttribute}
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {isSubmitting ? 'در حال ذخیره...' : (editingAttribute ? 'بروزرسانی' : 'افزودن')} ویژگی
                    </button>
                    {editingAttribute && (
                      <button
                        onClick={handleCancelEditAttribute}
                        disabled={isSubmitting}
                        className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium transition-all duration-200"
                      >
                        لغو ویرایش
                      </button>
                    )}
                  </div>
                  </div>
                </div>

                {/* Existing Attributes List */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-reverse space-x-2 mb-4">
                    <TagIcon className="h-5 w-5 text-primary-600" />
                    <h4 className="font-semibold text-gray-900">ویژگی‌های موجود</h4>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {categoryAttributes?.data && categoryAttributes.data.length > 0 ? (
                      categoryAttributes.data.map((attr: CategoryAttributeDto) => (
                        <div key={attr.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-reverse space-x-2">
                                <span className="font-semibold text-gray-900">{attr.title}</span>
                                {attr.isRequired && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">الزامی</span>}
                                {attr.isFilterable && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">قابل فیلتر</span>}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                نوع: <span className="font-medium text-primary-600">{attr.inputType}</span>
                              </div>
                            </div>
                            <div className="flex space-x-reverse space-x-2">
                              <button
                                onClick={() => handleEditAttribute(attr)}
                                className="text-primary-600 hover:text-primary-800 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-primary-50 transition-colors"
                              >
                                ویرایش
                              </button>
                              <button
                                onClick={() => handleDeleteAttribute(attr.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                          {attr.values && attr.values.length > 0 ? (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="text-xs font-medium text-gray-500 mb-2">گزینه‌ها:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {attr.values.map((v, index) => (
                                  <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                    {v.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <TagIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">هنوز ویژگی‌ای تعریف نشده است</p>
                        <p className="text-xs text-gray-400 mt-1">از فرم سمت چپ برای افزودن ویژگی استفاده کنید</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              closeConfirmation();
            }
          }}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              closeConfirmation();
            }
          }}
          style={{ 
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          aria-label="بستن تأیید حذف"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-reverse space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <TrashIcon className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{confirmationModal.title}</h3>
              </div>
              <p className="text-gray-600 mb-6">{confirmationModal.message}</p>
              <div className="flex space-x-reverse space-x-3">
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  حذف
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeConfirmation();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeConfirmation();
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 font-medium transition-colors touch-manipulation active:scale-95"
                  style={{ 
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  type="button"
                >
                  لغو
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCategoriesPage;