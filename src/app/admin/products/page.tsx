'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  ShoppingBagIcon,
  EyeIcon,
  FunnelIcon,
  XMarkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import api, { 
  GetProductDto, 
  GetProductListModelDto,
  GetProductMediaDto,
  GetProductFormatDto,
  productApi, 
  ProductListParams, 
  PublisherLookupDto 
} from '@/services/api';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import { usePersianNumbers } from '@/hooks/usePersianNumbers';
import { Spinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { ProductDetailsModal } from '@/components/ui/product-details-modal';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdmin as checkIsSuperAdmin } from '@/utils/roleUtils';

export default function ProductsManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();
  const { isOpen: isConfirmationOpen, modalConfig, showModal: showConfirmation, confirm, cancel } = useConfirmationModal();
  const { formatNumber: toPersian } = usePersianNumbers();
  const { user } = useAuth();
  const isSuperAdmin = checkIsSuperAdmin(user);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    categoryId?: string;
    authorId?: string;
    publisherId?: string;
    isActive?: boolean | '';
    sortBy: string;
    sortDescending: boolean;
  }>({
    categoryId: undefined,
    authorId: undefined,
    publisherId: undefined,
    isActive: '',
    sortBy: 'CreatedAt',
    sortDescending: true,
  });
  
  const pageSize = 10;

  // Build API params
  const apiParams = useMemo<ProductListParams>(() => ({
    pageNumber: currentPage,
    pageSize: pageSize,
    searchTerm: searchTerm || undefined,
    categoryId: filters.categoryId || undefined,
    authorId: filters.authorId || undefined,
    publisherId: filters.publisherId || undefined,
    isActive: filters.isActive === '' ? undefined : filters.isActive,
    sortBy: filters.sortBy,
    sortDescending: filters.sortDescending,
  }), [currentPage, searchTerm, filters]);

  // Fetch products list
  const { data: productsResponse, isLoading, error } = useQuery({
    queryKey: ['products', apiParams],
    queryFn: async () => {
      const response = await productApi.getAll(apiParams);
      // Validate response structure
      const responseData = response?.data?.data as GetProductListModelDto;
      if (!responseData?.products) {
        console.error('Invalid API response structure:', responseData);
      }
      return response;
    },
    staleTime: 30000,
    retry: 1,
    retryDelay: 1000,
  });

  // Extract data from API response matching GetProductListModelDto structure
  const responseData = (productsResponse?.data?.data ?? {}) as GetProductListModelDto;
  const products = responseData.products ?? [];
  const publishers = responseData.publishers ?? [];
  const categories = responseData.categories ?? [];
  const authors = responseData.authors ?? [];
  const totalCount = responseData.totalCount ?? 0;
  const totalPages = responseData.totalPages ?? Math.ceil(totalCount / pageSize);

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (productId: string) => productApi.delete(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showSuccessToast('محصول با موفقیت حذف شد');
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'خطا در حذف محصول');
    }
  });

  const handleDelete = (product: GetProductDto) => {
    showConfirmation({
      title: 'حذف محصول',
      message: `آیا مطمئن هستید که می‌خواهید محصول "${product.title}" را حذف کنید؟`,
      confirmText: 'حذف',
      cancelText: 'انصراف',
      type: 'error',
      onConfirm: () => {
        deleteMutation.mutate(product.id);
      }
    });
  };

  const handleEdit = (productId: string) => {
    router.push(`/admin/products/edit?id=${productId}`);
  };

  const handleAddISBN = (product: GetProductDto) => {
    if (!isSuperAdmin) return;
    setSelectedProductForISBN(product);
    if (product.formats && product.formats.length > 0) {
      const firstFormatWithId = product.formats.find((f: GetProductFormatDto) => f.id);
      const formatId = firstFormatWithId?.id || '';
      setSelectedFormatId(formatId);
      if (formatId) {
        const formatISBN = (firstFormatWithId as any)?.isbn || (firstFormatWithId as any)?.ISBN || '';
        setIsbnValue(formatISBN || product.isbn || '');
      } else {
        setIsbnValue(product.isbn || '');
      }
    } else {
      setSelectedFormatId('');
      setIsbnValue(product.isbn || '');
    }
    setApprovalNotes('');
    setIsISBNModalOpen(true);
  };

  const handleSubmitISBN = async () => {
    if (!selectedProductForISBN || !isbnValue.trim()) {
      showErrorToast('لطفاً ISBN را وارد کنید');
      return;
    }
    if (!selectedFormatId || !selectedFormatId.trim()) {
      showErrorToast('لطفاً فرمت محصول را انتخاب کنید');
      return;
    }
    if (isbnValue.trim().length > 17) {
      showErrorToast('شماره ISBN نمی‌تواند بیش از 17 کاراکتر باشد');
      return;
    }

    try {
      const response = await productApi.addISBN(selectedFormatId, isbnValue, approvalNotes);
      if (response.data.isSucceeded) {
        showSuccessToast(response.data.message || 'ISBN با موفقیت اضافه شد');
        setIsISBNModalOpen(false);
        setSelectedProductForISBN(null);
        setIsbnValue('');
        setSelectedFormatId('');
        setApprovalNotes('');
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } else {
        showErrorToast(response.data.message || 'خطا در اضافه کردن ISBN');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'خطا در اضافه کردن ISBN';
      showErrorToast(errorMessage);
    }
  };

  const handleCloseISBNModal = () => {
    setIsISBNModalOpen(false);
    setSelectedProductForISBN(null);
    setIsbnValue('');
    setSelectedFormatId('');
    setApprovalNotes('');
  };

  const handleToggleStatus = (product: GetProductDto) => {
    if (!isSuperAdmin) return;
    
    const currentProductIsActive = product.isActive;
    const currentFormatIsAvailable = product.formats && product.formats.length > 0 
      ? product.formats[0].isAvailable 
      : false;
    
    const currentState = currentProductIsActive && currentFormatIsAvailable;
    const newStatus = !currentState;
    
    showConfirmation({
      title: newStatus ? 'فعال‌سازی محصول' : 'غیرفعال‌سازی محصول',
      message: `آیا مطمئن هستید که می‌خواهید وضعیت محصول "${product.title}" را تغییر دهید؟`,
      confirmText: newStatus ? 'فعال' : 'غیرفعال',
      cancelText: 'انصراف',
      type: 'warning',
      isRtl: true,
      onConfirm: async () => {
        try {
          const productCurrentIsActive = product.isActive;
          const formatCurrentIsAvailable = product.formats && product.formats.length > 0 
            ? product.formats[0].isAvailable 
            : false;
          
          const bothAreFalse = !productCurrentIsActive && !formatCurrentIsAvailable;
          const bothAreTrue = productCurrentIsActive && formatCurrentIsAvailable;
          
          let isAvailable: boolean;
          if (bothAreFalse) {
            isAvailable = true;
          } else if (bothAreTrue) {
            isAvailable = false;
          } else {
            isAvailable = !productCurrentIsActive;
          }
          
          const response = await productApi.changeAvailability(product.id, isAvailable);
          if (response.data.isSucceeded) {
            showSuccessToast(response.data.message || `وضعیت محصول ${isAvailable ? 'فعال' : 'غیرفعال'} شد`);
            queryClient.invalidateQueries({ queryKey: ['products'] });
          } else {
            showErrorToast(response.data.message || 'خطا در تغییر وضعیت محصول');
          }
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || error?.message || 'خطا در تغییر وضعیت محصول';
          showErrorToast(errorMessage);
        }
      }
    });
  };

  const [selectedProduct, setSelectedProduct] = useState<GetProductDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isISBNModalOpen, setIsISBNModalOpen] = useState(false);
  const [selectedProductForISBN, setSelectedProductForISBN] = useState<GetProductDto | null>(null);
  const [isbnValue, setIsbnValue] = useState('');
  const [selectedFormatId, setSelectedFormatId] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const handleView = (product: GetProductDto) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      categoryId: undefined,
      authorId: undefined,
      publisherId: undefined,
      isActive: '',
      sortBy: 'CreatedAt',
      sortDescending: true,
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(
    filters.categoryId || 
    filters.authorId || 
    filters.publisherId || 
    filters.isActive !== '' || 
    searchTerm
  );

  // Calculate stats
  const activeProducts = products.filter((p: GetProductDto) => p.isActive).length;
  const inactiveProducts = products.filter((p: GetProductDto) => !p.isActive).length;
  const totalProducts = totalCount;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            مدیریت محصولات
          </h1>
          <p className="text-gray-600 mt-1">مدیریت و ویرایش محصولات فروشگاه</p>
        </div>
        <button
          onClick={() => router.push('/admin/products/create')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          <PlusIcon className="w-5 h-5" />
          <span>افزودن محصول جدید</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">کل محصولات</p>
              <p className="text-3xl font-bold">{toPersian(totalProducts.toString())}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <BookOpenIcon className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">محصولات فعال</p>
              <p className="text-3xl font-bold">{toPersian(activeProducts.toString())}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <ShoppingBagIcon className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">محصولات غیرفعال</p>
              <p className="text-3xl font-bold">{toPersian(inactiveProducts.toString())}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <BookOpenIcon className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی محصول..."
              className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            جستجو
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${
              showFilters
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            <span>فیلترها</span>
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
              title="پاک کردن فیلترها"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                دسته‌بندی
              </label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) => {
                  setFilters({ ...filters, categoryId: e.target.value || undefined });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">همه دسته‌بندی‌ها</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Author Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نویسنده
              </label>
              <select
                value={filters.authorId || ''}
                onChange={(e) => {
                  setFilters({ ...filters, authorId: e.target.value || undefined });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">همه نویسندگان</option>
                {authors.map((author: any) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Publisher Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ناشر
              </label>
              <select
                value={filters.publisherId || ''}
                onChange={(e) => {
                  setFilters({ ...filters, publisherId: e.target.value || undefined });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">همه ناشرها</option>
                {publishers.map((publisher: any) => (
                  <option key={publisher.id} value={publisher.id}>
                    {publisher.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وضعیت
              </label>
              <select
                value={filters.isActive === '' ? '' : filters.isActive ? 'true' : 'false'}
                onChange={(e) => {
                  setFilters({ 
                    ...filters, 
                    isActive: e.target.value === '' ? '' : e.target.value === 'true' 
                  });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">همه محصولات</option>
                <option value="true">فعال</option>
                <option value="false">غیرفعال</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                مرتب‌سازی بر اساس
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  setFilters({ ...filters, sortBy: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="CreatedAt">تاریخ ایجاد</option>
                <option value="Title">عنوان</option>
                <option value="Price">قیمت</option>
                <option value="ViewCount">تعداد بازدید</option>
              </select>
            </div>

            {/* Sort Direction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ترتیب
              </label>
              <select
                value={filters.sortDescending ? 'desc' : 'asc'}
                onChange={(e) => {
                  setFilters({ ...filters, sortDescending: e.target.value === 'desc' });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="desc">نزولی (جدیدترین)</option>
                <option value="asc">صعودی (قدیمی‌ترین)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600">خطا در بارگذاری محصولات</p>
            <p className="text-gray-500 text-sm mt-2">{(error as any)?.message}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <BookOpenIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">هیچ محصولی یافت نشد</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">تصویر</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">عنوان</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">نویسنده</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">ناشر</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">قیمت</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">وضعیت</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product: GetProductDto) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="relative">
                          <img 
                            src={product.media?.find((m: GetProductMediaDto) => m.isMain)?.mediaUrl ? `${product.media.find((m: GetProductMediaDto) => m.isMain)?.mediaUrl}/${product.media.find((m: GetProductMediaDto) => m.isMain)?.title}` : '/placeholder-book.jpg'} 
                            alt={product.title}
                            className="w-12 h-16 object-cover rounded-lg shadow-sm"
                          />
                          {product.media?.find(m => m.isMain) && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] px-1 rounded">
                              اصلی
                            </div>
                          )}
                          {product.media && product.media.length > 1 && (
                            <div className="absolute -bottom-1 -right-1 bg-gray-600 text-white text-[10px] px-1 rounded">
                              {toPersian(product.media.length.toString())} تصویر
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-gray-900">{product.title}</p>
                          {product.subtitle && (
                            <p className="text-sm text-gray-500 mt-1">{product.subtitle}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-700">
                         {product.authors?.map((pa) => pa.authorName ?? '').join('، ') || '-'}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-700">
                          {publishers?.find((p: any) => (p.id ?? p.Id) === (product.publisherId ?? product.publisherId))?.name ?? '-'}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        {product.formats && product.formats.length > 0 ? (
                          <div className="space-y-1">
                            {product.formats.map((format: GetProductFormatDto, idx: number) => {
                              const displayPrice = format.discountedPrice && format.discountedPrice > 0 ? format.discountedPrice : format.price;
                              return (
                                <p key={idx} className="text-sm text-gray-700">
                                  💰 {toPersian(displayPrice)} تومان
                                </p>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-500">-</p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="مشاهده"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(product.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="ویرایش"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleAddISBN(product)}
                            disabled={!isSuperAdmin}
                            className={`p-2 rounded-lg transition-colors ${
                              isSuperAdmin 
                                ? 'text-blue-600 hover:bg-blue-50' 
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            title="اضافه کردن ISBN"
                          >
                            <DocumentTextIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(product)}
                            disabled={!isSuperAdmin}
                            className={`p-2 rounded-lg transition-colors ${
                              isSuperAdmin 
                                ? product.isActive 
                                  ? 'text-green-600 hover:bg-green-50' 
                                  : 'text-orange-600 hover:bg-orange-50'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            title={product.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                          >
                            {product.isActive ? (
                              <CheckCircleIcon className="w-5 h-5" />
                            ) : (
                              <XCircleIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-100 px-6 py-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
      />
      
      {/* Status Confirmation Modal */}
      {modalConfig && (
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          onClose={cancel}
          onConfirm={confirm}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          cancelText={modalConfig.cancelText}
          type={modalConfig.type}
          showCancel={modalConfig.showCancel !== false}
          isRtl={modalConfig.isRtl !== false}
        />
      )}
      
      {/* ISBN Modal */}
      {isISBNModalOpen && selectedProductForISBN && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              handleCloseISBNModal();
            }
          }}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              handleCloseISBNModal();
            }
          }}
          style={{ 
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          aria-label="بستن ISBN"
          dir="rtl"
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-out max-w-md w-full mx-4 animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 flex-row-reverse">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 leading-6">
                  اضافه کردن ISBN
                </h3>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCloseISBNModal();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCloseISBNModal();
                }}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 touch-manipulation active:scale-90"
                style={{ 
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                type="button"
                aria-label="بستن"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400 pointer-events-none" />
              </button>
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-start flex-row-reverse">
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 mr-0 ml-4">
                  <div className="text-blue-600">
                    <DocumentTextIcon className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 text-base leading-relaxed mb-4">
                    محصول: <span className="font-semibold">{selectedProductForISBN.title}</span>
                  </p>
                  <div className="space-y-4">
                    {selectedProductForISBN.formats && selectedProductForISBN.formats.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          فرمت محصول
                        </label>
                        <select
                          value={selectedFormatId}
                          onChange={(e) => {
                            const newFormatId = e.target.value;
                            setSelectedFormatId(newFormatId);
                            const selectedFormat = selectedProductForISBN.formats?.find((f: GetProductFormatDto) => String(f.id) === String(newFormatId));
                            const currentISBN = (selectedFormat as any)?.isbn || (selectedFormat as any)?.ISBN || '';
                            setIsbnValue(currentISBN);
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        >
                          {selectedProductForISBN.formats.map((format: GetProductFormatDto) => {
                            if (!format.id) return null;
                            const formatTypeLower = format.formatType ? format.formatType.toLowerCase() : '';
                            let formatTypeLabel = '';
                            if (formatTypeLower === 'physical') {
                              formatTypeLabel = 'فیزیکی';
                            } else if (formatTypeLower === 'ebook') {
                              formatTypeLabel = 'الکترونیکی';
                            } else if (formatTypeLower === 'audiobook') {
                              formatTypeLabel = 'صوتی';
                            } else if (format.formatType) {
                              formatTypeLabel = format.formatType;
                            }
                            return (
                              <option key={format.id} value={format.id}>
                                {formatTypeLabel} - {toPersian(format.price)} تومان
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        شماره ISBN <span className="text-red-500">*</span>
                      </label>
                      {selectedFormatId && selectedProductForISBN.formats && (() => {
                        const selectedFormat = selectedProductForISBN.formats.find((f: GetProductFormatDto) => String(f.id) === String(selectedFormatId));
                        const currentISBN = (selectedFormat as any)?.isbn || (selectedFormat as any)?.ISBN || '';
                        return (
                          <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-sm text-gray-600">ISBN فعلی: </span>
                            <span className="text-sm font-semibold text-gray-900" dir="ltr">{currentISBN || 'ندارد'}</span>
                          </div>
                        );
                      })()}
                      <input
                        type="text"
                        value={isbnValue}
                        onChange={(e) => setIsbnValue(e.target.value)}
                        placeholder="وارد کنید ISBN"
                        maxLength={17}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSubmitISBN();
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        یادداشت تایید (اختیاری)
                      </label>
                      <textarea
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="یادداشت تایید (حداکثر 500 کاراکتر)"
                        maxLength={500}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6 pt-2 flex-row-reverse justify-end">
              <button
                onClick={handleCloseISBNModal}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 min-w-[80px]"
              >
                انصراف
              </button>
              <button
                onClick={handleSubmitISBN}
                className="px-6 py-2.5 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 min-w-[80px] shadow-lg"
              >
                تایید
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
