'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { type GetProductCreationModelDto, type CategoryTreeDto, type AuthorLookupDto, type PublisherLookupDto } from '@/services/api';
import { productApi } from '@/services/productApi';
import { useAuth } from '@/contexts/AuthContext';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { useLoading } from '@/providers/LoadingProvider';
import { isAdmin as checkIsAdmin, isSuperAdmin as checkIsSuperAdmin } from '@/utils/roleUtils';
import DatePicker from '@hassanmojab/react-modern-calendar-datepicker';
import '@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  BookOpenIcon,
  PhotoIcon,
  TagIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

interface ProductFormat {
  formatType: 'physical' | 'ebook' | 'audiobook';
  price: string;
  discountedPrice: string;
  stockQuantity: string;
  isAvailable: boolean;
  fileUrl?: string;
  file?: File;
  fileType?: string;
  fileSize?: number;
}

interface ProductAuthor {
  authorId: string;
  role: string;
  displayOrder: number;
}

export default function CreateProductPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { successPersian, errorPersian } = useToastHelpers();
  const { startLoading, stopLoading } = useLoading();

  // Determine whether current user has admin rights using centralized function
  const isAdmin = checkIsAdmin(user);
  const isSuperAdmin = checkIsSuperAdmin(user);

  // Fetch creation model data
  const { data: creationModelResponse, isLoading: modelLoading } = useQuery({
    queryKey: ['product-creation-model'],
    queryFn: async () => {
      const response = await productApi.getCreationModel();
      return response.data;
    },
    // Only fetch if user is authenticated and is admin
    enabled: isAuthenticated && isAdmin && typeof window !== 'undefined'
  });

  const categories = creationModelResponse?.data?.categories || [];
  const authors = creationModelResponse?.data?.authors || [];
  const publishers = creationModelResponse?.data?.publishers || [];

  // Form state
  const [selectedDate, setSelectedDate] = useState<{ day: number; month: number; year: number } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    isbn: '',
    publicationDate: '',
    language: 'fa',
    pages: '',
    dimensions: '',
    weight: '',
    ageGroup: '',
    edition: '',
    series: '',
    volume: '',
    coverImageUrl: '',
    backCoverImageUrl: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    isActive: true,
  });

  // Category states
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryTreeDto | null>(null);
  const [attributeValues, setAttributeValues] = useState<{[key: string]: string}>({});
  
  // Other form states
  const [selectedPublisher, setSelectedPublisher] = useState<string>('');
  const [productAuthors, setProductAuthors] = useState<ProductAuthor[]>([]);
  const [productFormats, setProductFormats] = useState<ProductFormat[]>([{
    formatType: 'physical',
    price: '',
    discountedPrice: '',
    stockQuantity: '',
    isAvailable: true,
    file: undefined,
    fileUrl: undefined
  }]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Product media state
  const [productMedia, setProductMedia] = useState<Array<{
    mediaType: string;
    file?: File;
    url?: string;
    title?: string;
    preview?: string;
    role?: 'cover' | 'backCover' | 'gallery';
  }>>([]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAddAuthor = () => {
    setProductAuthors([...productAuthors, { authorId: '', role: 'author', displayOrder: productAuthors.length + 1 }]);
  };

  const handleRemoveAuthor = (index: number) => {
    setProductAuthors(productAuthors.filter((_, i) => i !== index));
  };

  const handleAuthorChange = (index: number, field: keyof ProductAuthor, value: string | number) => {
    const updated = [...productAuthors];
    updated[index] = { ...updated[index], [field]: value };
    setProductAuthors(updated);
  };

  const handleFormatChange = (index: number, field: keyof ProductFormat, value: string | boolean) => {
    const updated = [...productFormats];
    updated[index] = { ...updated[index], [field]: value };
    setProductFormats(updated);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Product media handlers
  const handleAddMedia = () => {
    setProductMedia([...productMedia, { mediaType: 'image', role: 'gallery', title: '' }]);
  };

  const handleMultipleFilesUpload = (files: FileList) => {
    const newMedia = Array.from(files).map(file => {
      const mediaItem: any = {
        mediaType: 'image',
        role: 'gallery',
        title: '',
        file,
        url: undefined,
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          mediaItem.preview = reader.result as string;
          setProductMedia(prev => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      return mediaItem;
    });

    setProductMedia(prev => [...prev, ...newMedia]);
  };

  const handleRemoveMedia = (index: number) => {
    const mediaToRemove = productMedia[index];
    if (mediaToRemove.role === 'cover' || mediaToRemove.role === 'backCover') {
      setFormData(prev => ({
        ...prev,
        [mediaToRemove.role === 'cover' ? 'coverImageUrl' : 'backCoverImageUrl']: ''
      }));
    }
    setProductMedia(productMedia.filter((_, i) => i !== index));
  };

  const handleMediaFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const updated = [...productMedia];
      updated[index] = {
        ...updated[index],
        file,
        url: undefined,
      };
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          updated[index].preview = reader.result as string;
          setProductMedia([...updated]);
          
          // Update form data if this is cover or back cover
          if (updated[index].role === 'cover' || updated[index].role === 'backCover') {
            setFormData(prev => ({
              ...prev,
              [updated[index].role === 'cover' ? 'coverImageUrl' : 'backCoverImageUrl']: reader.result as string
            }));
          }
        };
        reader.readAsDataURL(file);
      } else {
        setProductMedia(updated);
      }
    }
  };

  const handleMediaChange = (index: number, field: string, value: string) => {
    const updated = [...productMedia];
    updated[index] = { ...updated[index], [field]: value };
    
    // Handle role changes for cover/back cover
    if (field === 'role') {
      // If changing to cover/backCover, update form data
      if (value === 'cover' || value === 'backCover') {
        setFormData(prev => ({
          ...prev,
          [value === 'cover' ? 'coverImageUrl' : 'backCoverImageUrl']: 
            updated[index].preview || updated[index].url || ''
        }));
      }
      
      // If changing from cover/backCover, clear the old form data
      if ((updated[index].role === 'cover' || updated[index].role === 'backCover')) {
        setFormData(prev => ({
          ...prev,
          [updated[index].role === 'cover' ? 'coverImageUrl' : 'backCoverImageUrl']: ''
        }));
      }
    }
    
    setProductMedia(updated);
  };

  // Format file upload handler
  const handleFormatFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const updated = [...productFormats];
      updated[index] = {
        ...updated[index],
        file,
        fileType: file.type,
        fileSize: file.size,
      };
      
      // Validate file size (max 6MB)
      if (file.size > 6291456) {
        errorPersian('حجم فایل نباید بیشتر از 6 مگابایت باشد');
        return;
      }

      // Validate file type based on format
      const format = updated[index].formatType;
      if (format === 'ebook' && file.type !== 'application/pdf') {
        errorPersian('فقط فایل‌های PDF پشتیبانی می‌شوند');
        return;
      } else if (format === 'audiobook' && !file.type.startsWith('audio/')) {
        errorPersian('فقط فایل‌های صوتی پشتیبانی می‌شوند');
        return;
      }

      setProductFormats(updated);
    }
  };

  // Category helpers
  const findCategory = (categories: CategoryTreeDto[], id: string): CategoryTreeDto | null => {
    for (const category of categories) {
      if (category.id === id) return category;
      if (category.children?.length) {
        const found = findCategory(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Category handlers
  const handleCategorySelect = (categoryId: string) => {

    const findPath = (categories: CategoryTreeDto[], id: string, path: string[] = []): string[] | null => {
      for (const category of categories) {
        const newPath = [...path, category.id];
        if (category.id === id) return newPath;
        if (category.children?.length) {
          const found = findPath(category.children, id, newPath);
          if (found) return found;
        }
      }
      return null;
    };

    const category = findCategory(categories, categoryId);
    if (category) {
      setSelectedCategory(category);
      const path = findPath(categories, categoryId) || [categoryId];
      setSelectedCategoryPath(path);
      
      // Reset attribute values for new category
      setAttributeValues({});
    }
  };

  const handleAttributeChange = (attributeId: string, value: string) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: value
    }));
  };

  const validateAttributes = () => {
    // Attributes are not collected on this page, so skip validation
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation with specific error messages and field identification
    
    // 1. Validate title
    if (!formData.title || formData.title.trim() === '') {
      errorPersian('عنوان محصول الزامی است');
      document.querySelector('input[name="title"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (document.querySelector('input[name="title"]') as HTMLInputElement)?.focus();
      return;
    }

    // 2. Validate description
    if (!formData.description || formData.description.trim() === '') {
      errorPersian('توضیحات محصول الزامی است');
      document.querySelector('textarea[name="description"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (document.querySelector('textarea[name="description"]') as HTMLTextAreaElement)?.focus();
      return;
    }

    // 3. Validate category
    if (!selectedCategory) {
      errorPersian('انتخاب دسته‌بندی محصول الزامی است');
      document.getElementById('category-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 4. Validate category attributes
    if (!validateAttributes()) {
      errorPersian('لطفاً تمام ویژگی‌های اجباری دسته‌بندی را وارد کنید');
      document.getElementById('category-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 5. Validate at least one format
    if (productFormats.length === 0) {
      errorPersian('حداقل یک فرمت محصول (فیزیکی، الکترونیکی یا صوتی) الزامی است');
      document.getElementById('formats-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 6. Validate format details
    for (let i = 0; i < productFormats.length; i++) {
      const f = productFormats[i];
      
      // Check price
      if (!f.price || parseFloat(String(f.price)) <= 0) {
        errorPersian(`قیمت برای فرمت شماره ${i + 1} الزامی است`);
        document.getElementById('formats-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      
      // Check stock quantity for physical format
      if (f.formatType === 'physical' && (!f.stockQuantity || parseInt(String(f.stockQuantity)) < 0)) {
        errorPersian(`تعداد موجودی برای فرمت فیزیکی (فرمت شماره ${i + 1}) الزامی است`);
        document.getElementById('formats-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      
      // Check file for digital formats
      if (f.formatType === 'ebook' && !f.file) {
        errorPersian(`انتخاب فایل PDF برای فرمت الکترونیکی (فرمت شماره ${i + 1}) الزامی است`);
        document.getElementById('formats-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      
      if (f.formatType === 'audiobook' && !f.file) {
        errorPersian(`انتخاب فایل صوتی برای فرمت صوتی (فرمت شماره ${i + 1}) الزامی است`);
        document.getElementById('formats-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // 7. Validate at least one author
    if (productAuthors.length === 0) {
      errorPersian('حداقل یک نویسنده برای محصول الزامی است');
      document.getElementById('authors-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 8. Validate publisher
    if (!selectedPublisher || selectedPublisher.trim() === '') {
      errorPersian('انتخاب ناشر محصول الزامی است');
      document.getElementById('publisher-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 9. Validate media (at least cover image)
    const coverImage = productMedia.find(m => m.role === 'cover');
    if (!coverImage || !coverImage.file) {
      errorPersian('تصویر جلد محصول الزامی است');
      document.getElementById('media-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 10. Validate meta title
    if (!formData.metaTitle || formData.metaTitle.trim() === '') {
      errorPersian('عنوان متا (SEO) الزامی است');
      document.getElementById('seo-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (document.querySelector('input[name="metaTitle"]') as HTMLInputElement)?.focus();
      return;
    }

    // 11. Validate meta description
    if (!formData.metaDescription || formData.metaDescription.trim() === '') {
      errorPersian('توضیحات متا (SEO) الزامی است');
      document.getElementById('seo-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (document.querySelector('textarea[name="metaDescription"]') as HTMLTextAreaElement)?.focus();
      return;
    }

    // 12. Validate meta keywords
    if (!formData.metaKeywords || formData.metaKeywords.trim() === '') {
      errorPersian('کلمات کلیدی متا (SEO) الزامی است');
      document.getElementById('seo-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (document.querySelector('input[name="metaKeywords"]') as HTMLInputElement)?.focus();
      return;
    }

    try {
      const backCoverImage = productMedia.find(m => m.role === 'backCover');
      const galleryImages = productMedia.filter(m => m.role === 'gallery');

      // Convert date to ISO format if exists
      const publicationDate = selectedDate 
        ? `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`
        : undefined;

      // Prepare form data for API (match InpProductCreationDto shape)
      const formDataForApi = {
        Title: formData.title,
        Slug: formData.slug,
        Subtitle: formData.subtitle || undefined,
        Description: formData.description,
        ISBN: formData.isbn || undefined,
        PublicationDate: publicationDate || undefined,
        Language: formData.language,
        Pages: formData.pages ? parseInt(formData.pages) : undefined,
        Dimensions: formData.dimensions || undefined,
        Weight: formData.weight ? parseInt(formData.weight) : undefined,
        AgeGroup: formData.ageGroup || undefined,
        Edition: formData.edition || undefined,
        Series: formData.series || undefined,
        Volume: formData.volume ? parseInt(formData.volume) : undefined,
        IsActive: Boolean(formData.isActive),
        MetaTitle: formData.metaTitle || '',
        MetaDescription: formData.metaDescription || '',
        MetaKeywords: formData.metaKeywords || '',
        PublisherId: selectedPublisher || '',
        CategoryId: selectedCategory.id,
        Formats: productFormats.map((format) => ({
          FormatType: format.formatType,
          FileType: format.fileType || undefined,
          ISBN: undefined,
          SKU: undefined,
          Price: parseFloat(String(format.price || '0')),
          DiscountPrice: format.discountedPrice ? parseFloat(String(format.discountedPrice)) : undefined,
          IsAvailable: Boolean(format.isAvailable),
          // Only include StockQuantity for physical formats
          StockQuantity: format.formatType === 'physical' && format.stockQuantity ? parseInt(String(format.stockQuantity)) : undefined,
          // IsTrackable is derived by logic: true for physical, false for digital
          IsTrackable: format.formatType === 'physical',
          FileUrl: format.fileUrl || undefined,
          // Only include the file field for digital formats (ebook/audiobook)
          FormFromatFile: (format.formatType === 'ebook' || format.formatType === 'audiobook') ? (format.file || undefined) : undefined,
        })),
        Authors: productAuthors.map((pa, idx) => ({
          AuthorId: pa.authorId,
          AuthorName: authors.find((a: any) => a.id === pa.authorId)?.penName || '',
          Role: pa.role || undefined,
          DisplayOrder: pa.displayOrder || (idx + 1)
        })),
        // Map selected category attributes into request payload (only include those with values)
        Attributes: selectedCategory?.attributes
          ? selectedCategory.attributes
              .filter(attr => attributeValues[attr.id] !== undefined && attributeValues[attr.id] !== '')
              .map(attr => ({
                CategoryAttributeId: attr.id,
                Value: attributeValues[attr.id]
              }))
          : [],
        Tags: tags.map((t) => ({ Name: t, IsActive: true })),
        Media: [],
        coverImage: coverImage?.file,
        backCoverImage: backCoverImage?.file,
        galleryImages: galleryImages.map(img => img.file).filter((file): file is File => file !== undefined),
      };

      // Log file information for debugging
      console.log('Files being sent:');
      if (coverImage?.file) {
        console.log('Cover image:', { name: coverImage.file.name, type: coverImage.file.type, size: coverImage.file.size });
      }
      if (backCoverImage?.file) {
        console.log('Back cover image:', { name: backCoverImage.file.name, type: backCoverImage.file.type, size: backCoverImage.file.size });
      }
      if (galleryImages.length > 0) {
        galleryImages.forEach((img, idx) => {
          if (img.file) {
            console.log(`Gallery image ${idx + 1}:`, { name: img.file.name, type: img.file.type, size: img.file.size });
          }
        });
      }

      // Send to API with loading indicator
      startLoading('در حال ایجاد محصول...', true, 'high');
      const response = await productApi.add(formDataForApi as any);
      
      if (response.data.isSucceeded) {
        stopLoading();
        successPersian('محصول با موفقیت ایجاد شد');
        router.push('/admin/products');
      } else {
        stopLoading();
        // Show detailed error message from backend
        const errorMessage = response.data.message || response.data.errors?.join(', ') || 'خطا در ایجاد محصول';
        errorPersian(errorMessage);
      }
    } catch (error: any) {
      stopLoading();
      console.error('Error creating product:', error);
      
      // Extract detailed error message from response
      let errorMessage = 'خطا در ایجاد محصول. لطفاً مجدداً تلاش کنید';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Check for validation errors
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.join(', ');
        } else if (data.errors && typeof data.errors === 'object') {
          // Handle object format errors (like { field: ["error1", "error2"] })
          const errorMessages = Object.values(data.errors).flat().join(', ');
          errorMessage = errorMessages || data.message || errorMessage;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.title) {
          errorMessage = data.title;
        }
      }
      
      errorPersian(errorMessage);
    }
  };

  if (authLoading || modelLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if user is not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">افزودن محصول جدید</h1>
        <p className="text-gray-600 mt-2">اطلاعات محصول را وارد کنید</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Categories & Attributes */}
        <div id="category-section" className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <TagIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">دسته‌بندی و ویژگی‌ها</h2>
          </div>

          {/* Category Tree */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">انتخاب دسته‌بندی</label>
              
              {/* Main Category Dropdown */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">دسته‌بندی اصلی</label>
                  <SearchableSelect
                    options={categories.map((cat: CategoryTreeDto) => ({
                      value: cat.id,
                      label: cat.title
                    }))}
                    value={selectedCategoryPath[0] || ''}
                    onChange={(categoryId) => {
                      const category = findCategory(categories, categoryId);
                      if (category) {
                        setSelectedCategory(category);
                        setSelectedCategoryPath([categoryId]);
                        setAttributeValues({});
                      }
                    }}
                    placeholder="انتخاب کنید"
                  />
                </div>

                {/* Sub Categories */}
                {selectedCategoryPath.map((categoryId, index) => {
                  const parentCategory = findCategory(categories, categoryId);
                  if (!parentCategory || !parentCategory.children?.length) return null;

                  return (
                    <div key={categoryId}>
                      <label className="block text-sm text-gray-600 mb-1">زیر دسته {index + 1}</label>
                      <SearchableSelect
                        options={parentCategory.children.map((cat) => ({
                          value: cat.id,
                          label: cat.title
                        }))}
                        value={selectedCategoryPath[index + 1] || ''}
                        onChange={(newCategoryId) => {
                          const category = findCategory(categories, newCategoryId);
                          if (category) {
                            setSelectedCategory(category);
                            setSelectedCategoryPath(prev => [...prev.slice(0, index + 1), newCategoryId]);
                            setAttributeValues({});
                          }
                        }}
                        placeholder="انتخاب کنید"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category attributes are intentionally not shown on this page */}
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpenIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">اطلاعات اصلی</h2>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">نام انگلیسی کتاب</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">زیرعنوان</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Book Details Grid */}
            <div className="space-y-4">
              {/* First Row: ISBN, تاریخ انتشار, زبان */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ انتشار</label>
                  <DatePicker 
                    value={selectedDate}
                    onChange={(date: { day: number; month: number; year: number } | null) => {
                      setSelectedDate(date);
                      if (date) {
                        const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                        setFormData(prev => ({ ...prev, publicationDate: formattedDate }));
                      } else {
                        setFormData(prev => ({ ...prev, publicationDate: '' }));
                      }
                    }}
                    inputPlaceholder="انتخاب تاریخ"
                    shouldHighlightWeekends
                    locale="fa"
                    colorPrimary="#9333ea"
                    wrapperClassName="w-full" 
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">زبان</label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="fa">فارسی</option>
                    <option value="en">انگلیسی</option>
                    <option value="ar">عربی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">گروه سنی</label>
                  <select
                    name="ageGroup"
                    value={formData.ageGroup}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">انتخاب کنید</option>
                    <option value="بزرگسال">بزرگسال</option>
                    <option value="نوجوان">نوجوان</option>
                    <option value="کودک">کودک</option>
                  </select>
                </div>
              </div>

              {/* Second Row: تعداد صفحات, ابعاد, وزن, گروه سنی */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تعداد صفحات</label>
                  <input
                    type="number"
                    name="pages"
                    dir="ltr"
                    value={formData.pages}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ابعاد (سانتی‌متر)</label>
                  <input
                    type="text"
                    name="dimensions"
                    dir="ltr"
                    value={formData.dimensions}
                    onChange={handleInputChange}
                    placeholder="20x14x2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">وزن (گرم)</label>
                  <input
                    type="number"
                    name="weight"
                    dir="ltr"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
              </div>

              {/* Third Row: ویرایش, سری, جلد */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ویرایش</label>
                  <input
                    type="text"
                    name="edition"
                    value={formData.edition}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سری</label>
                  <input
                    type="text"
                    name="series"
                    value={formData.series}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">جلد</label>
                  <input
                    type="number"
                    name="volume"
                    dir="ltr"
                    value={formData.volume}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Authors */}
        <div id="authors-section" className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">نویسندگان</h2>
            </div>
            <button
              type="button"
              onClick={handleAddAuthor}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              افزودن نویسنده
            </button>
          </div>

          {productAuthors.map((author, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نویسنده</label>
                <select
                  value={author.authorId}
                  onChange={(e) => handleAuthorChange(index, 'authorId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">انتخاب کنید</option>
                  {authors.map((a: AuthorLookupDto) => (
                    <option key={a.id} value={a.id}>{a.penName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نقش</label>
                <select
                  value={author.role}
                  onChange={(e) => handleAuthorChange(index, 'role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="author">نویسنده</option>
                  <option value="translator">مترجم</option>
                  <option value="editor">ویراستار</option>
                  <option value="illustrator">تصویرگر</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => handleRemoveAuthor(index)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Publisher */}
        <div id="publisher-section" className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">ناشر</h2>
          </div>

          <SearchableSelect
            options={publishers.map((p: PublisherLookupDto) => ({
              value: p.id,
              label: p.name
            }))}
            value={selectedPublisher}
            onChange={(value) => setSelectedPublisher(value)}
            placeholder="انتخاب ناشر"
          />
        </div>

        {/* Formats & Pricing */}
        <div id="formats-section" className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">فرمت و قیمت‌گذاری</h2>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع فرمت</label>
                <select
                  value={productFormats[0]?.formatType || 'physical'}
                  onChange={(e) => handleFormatChange(0, 'formatType', e.target.value as 'physical' | 'ebook' | 'audiobook')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="physical">چاپی</option>
                  <option value="ebook">کتاب الکترونیکی</option>
                  <option value="audiobook">کتاب صوتی</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">قیمت (تومان)</label>
                <input
                  type="number"
                  dir="ltr"
                  value={productFormats[0]?.price || ''}
                  onChange={(e) => handleFormatChange(0, 'price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">قیمت با تخفیف</label>
                <input
                  type="number"
                  dir="ltr"
                  value={productFormats[0]?.discountedPrice || ''}
                  onChange={(e) => handleFormatChange(0, 'discountedPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">قابل فروش</label>
                <select
                  value={productFormats[0]?.isAvailable ? 'true' : 'false'}
                  onChange={(e) => handleFormatChange(0, 'isAvailable', e.target.value === 'true')}
                  disabled={!isSuperAdmin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="true">قابل فروش</option>
                  <option value="false">غیرفعال</option>
                </select>
              </div>
            </div>

            {/* StockQuantity only applies to physical formats */}
            {productFormats[0]?.formatType === 'physical' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">موجودی</label>
                <input
                  type="number"
                  dir="ltr"
                  value={productFormats[0]?.stockQuantity || ''}
                  onChange={(e) => handleFormatChange(0, 'stockQuantity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}
            {/* File upload for digital formats (ebook/audiobook) */}
            {(productFormats[0]?.formatType === 'ebook' || productFormats[0]?.formatType === 'audiobook') && (
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {productFormats[0]?.formatType === 'ebook' ? '📱 فایل کتاب الکترونیکی' : '🎧 فایل کتاب صوتی'}
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                    <div className="flex items-center gap-2 text-gray-600">
                      <DocumentTextIcon className="h-5 w-5" />
                      <span className="text-sm">
                        {productFormats[0]?.file 
                          ? `✓ ${productFormats[0].file.name}` 
                          : productFormats[0]?.formatType === 'ebook' 
                            ? 'انتخاب فایل PDF' 
                            : 'انتخاب فایل (MP3, M4A, M4B)'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept={productFormats[0]?.formatType === 'ebook' ? '.pdf' : '.mp3,.m4a,.m4b'}
                      onChange={(e) => handleFormatFileChange(0, e)}
                      className="hidden"
                    />
                  </label>
                  {productFormats[0]?.file && (
                    <div className="text-sm text-gray-500">
                      {(productFormats[0].file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  )}
                </div>
                {productFormats[0]?.file && (
                  <p className="text-xs text-green-600 mt-2">✓ فایل انتخاب شده و آماده آپلود است</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Images and Media */}
        <div id="media-section" className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PhotoIcon className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">تصاویر و رسانه‌ها</h2>
            </div>
            <div className="flex gap-2">
              <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
                افزودن چند تصویر
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleMultipleFilesUpload(e.target.files)}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleAddMedia}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                افزودن یک رسانه
              </button>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          {productMedia.length === 0 && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) {
                  handleMultipleFilesUpload(e.dataTransfer.files);
                }
              }}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer"
              onClick={() => document.getElementById('multi-file-input')?.click()}
            >
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">تصاویر را اینجا بکشید یا کلیک کنید</p>
              <p className="text-sm text-gray-500">می‌توانید چندین تصویر را همزمان انتخاب کنید</p>
              <input
                id="multi-file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleMultipleFilesUpload(e.target.files)}
                className="hidden"
              />
            </div>
          )}

          {/* Media Grid */}
          {productMedia.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productMedia.map((media, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-3">
                  {/* Image Preview */}
                  {media.preview ? (
                    <div className="relative">
                      <img 
                        src={media.preview} 
                        alt={media.title || 'Media Preview'} 
                        className={`w-full h-40 object-cover rounded-lg ${
                          media.role === 'cover' || media.role === 'backCover' 
                            ? 'ring-2 ring-purple-500' 
                            : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(index)}
                        className="absolute top-2 left-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}

                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">نقش تصویر</label>
                    <select
                      value={media.role || 'gallery'}
                      onChange={(e) => handleMediaChange(index, 'role', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="gallery">گالری</option>
                      <option value="cover" disabled={productMedia.some(m => m.role === 'cover' && m !== media)}>تصویر جلد</option>
                      <option value="backCover" disabled={productMedia.some(m => m.role === 'backCover' && m !== media)}>تصویر پشت جلد</option>
                    </select>
                  </div>

                  {/* Title Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">عنوان (اختیاری)</label>
                    <input
                      type="text"
                      value={media.title || ''}
                      onChange={(e) => handleMediaChange(index, 'title', e.target.value)}
                      placeholder="عنوان رسانه"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* File Name or Upload Button */}
                  {!media.file && (
                    <label className="block w-full px-2 py-1.5 text-sm text-center border border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                      انتخاب فایل
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleMediaFileChange(index, e)}
                        className="hidden"
                      />
                    </label>
                  )}
                  {media.file && (
                    <p className="text-xs text-gray-600 truncate" title={media.file.name}>
                      {media.file.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add More Button (when there are already images) */}
          {productMedia.length > 0 && (
            <div className="mt-4 flex gap-2 justify-center">
              <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
                افزودن تصاویر بیشتر
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleMultipleFilesUpload(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <TagIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">برچسب‌ها</h2>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="برچسب جدید"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              افزودن
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-purple-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* SEO */}
        <div id="seo-section" className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">سئو</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عنوان متا</label>
              <input
                type="text"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات متا</label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">کلمات کلیدی متا</label>
              <input
                type="text"
                name="metaKeywords"
                value={formData.metaKeywords}
                onChange={handleInputChange}
                placeholder="کلمات را با ویرگول جدا کنید"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              disabled={!isSuperAdmin}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              محصول فعال است
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            انصراف
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <CheckCircleIcon className="h-5 w-5" />
            ایجاد محصول
          </button>
        </div>
      </form>
    </div>
  );
}
