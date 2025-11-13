'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductTagApi, AdminProductTagDto, AdminCreateProductTagDto, AdminUpdateProductTagDto } from '@/services/adminApi';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { 
  PencilIcon, 
  TrashIcon,
  PlusIcon,
  TagIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { toPersianNumber } from '@/utils/numberUtils';
import { productApi } from '@/services/api';

export default function AdminTagsPage() {
  const { successPersian, errorPersian } = useToastHelpers();
  const queryClient = useQueryClient();
  const { isOpen, modalConfig, showModal, confirm, cancel } = useConfirmationModal();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<AdminProductTagDto | null>(null);
  const [newTag, setNewTag] = useState<AdminCreateProductTagDto>({
    productId: '',
    name: '',
    slug: '',
    description: '',
    isActive: true
  });

  // Fetch products for dropdown
  const { data: productsResponse } = useQuery({
    queryKey: ['admin-products-simple'],
    queryFn: async () => {
      try {
        const response = await productApi.getAll({ pageNumber: 1, pageSize: 1000 });
        const responseData = response?.data?.data as any;
        return responseData || { products: [] };
      } catch (error) {
        return { products: [] };
      }
    }
  });

  const products = productsResponse?.products || [];

  // Fetch tags with pagination
  const { data: tagsResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-tags', currentPage, searchTerm, filterActive, selectedProductId],
    queryFn: async () => {
      const response = await adminProductTagApi.getAll({
        pageNumber: currentPage,
        pageSize: 20,
        searchTerm: searchTerm || undefined,
        isActive: filterActive !== null ? filterActive : undefined,
        productId: selectedProductId || undefined
      });
      return response.data;
    },
    retry: 2,
  });

  const tags = tagsResponse?.data?.tags || [];
  const pagination = tagsResponse?.data;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterActive, selectedProductId]);

  // Create tag mutation
  const createMutation = useMutation({
    mutationFn: (data: AdminCreateProductTagDto) => adminProductTagApi.create(data),
    onSuccess: (response) => {
      successPersian(response.data.message || 'برچسب با موفقیت ایجاد شد');
      setIsCreateModalOpen(false);
      setNewTag({
        productId: '',
        name: '',
        slug: '',
        description: '',
        isActive: true
      });
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در ایجاد برچسب');
    },
  });

  // Update tag mutation
  const updateMutation = useMutation({
    mutationFn: (data: AdminUpdateProductTagDto) => adminProductTagApi.update(data),
    onSuccess: (response) => {
      successPersian(response.data.message || 'برچسب با موفقیت بروزرسانی شد');
      setIsEditModalOpen(false);
      setEditingTag(null);
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در بروزرسانی برچسب');
    },
  });

  // Delete tag mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminProductTagApi.delete(id),
    onSuccess: (response) => {
      successPersian(response.data.message || 'برچسب با موفقیت حذف شد');
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در حذف برچسب');
    },
  });

  const handleCreateTag = () => {
    if (!newTag.productId || !newTag.name.trim()) {
      errorPersian('لطفاً محصول و نام برچسب را وارد کنید');
      return;
    }
    createMutation.mutate(newTag);
  };

  const handleUpdateTag = () => {
    if (!editingTag || !editingTag.name.trim()) {
      errorPersian('لطفاً نام برچسب را وارد کنید');
      return;
    }
    updateMutation.mutate({
      id: editingTag.id,
      name: editingTag.name,
      slug: editingTag.slug,
      description: editingTag.description,
      isActive: editingTag.isActive
    });
  };

  const handleDeleteTag = (tag: AdminProductTagDto) => {
    showModal({
      title: 'حذف برچسب',
      message: `آیا مطمئن هستید که می‌خواهید برچسب "${tag.name}" را حذف کنید؟`,
      confirmText: 'حذف',
      cancelText: 'انصراف',
      type: 'warning',
      isRtl: true,
      onConfirm: () => {
        deleteMutation.mutate(tag.id);
      }
    });
  };

  const openEditModal = (tag: AdminProductTagDto) => {
    setEditingTag({ 
      ...tag,
      slug: tag.slug || '',
      description: tag.description || ''
    });
    setIsEditModalOpen(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">فعال</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">غیرفعال</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">مدیریت برچسب‌ها</h1>
            <p className="text-gray-600 mt-2">مشاهده و مدیریت برچسب‌های محصولات</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            افزودن برچسب جدید
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو بر اساس نام، توضیحات، محصول..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              dir="rtl"
            />
          </div>

          <select
            value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
            onChange={(e) => {
              if (e.target.value === 'all') setFilterActive(null);
              else setFilterActive(e.target.value === 'active');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="inactive">غیرفعال</option>
          </select>

          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">همه محصولات</option>
            {products.map((product: any) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-sm font-medium opacity-90 mb-1">کل برچسب‌ها</p>
                <p className="text-4xl font-bold">{toPersianNumber(pagination?.totalCount || 0)}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <TagIcon className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-sm font-medium opacity-90 mb-1">برچسب‌های فعال</p>
                <p className="text-4xl font-bold">
                  {toPersianNumber(tags.filter((t: AdminProductTagDto) => t.isActive).length)}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <TagIcon className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-sm font-medium opacity-90 mb-1">برچسب‌های غیرفعال</p>
                <p className="text-4xl font-bold">
                  {toPersianNumber(tags.filter((t: AdminProductTagDto) => !t.isActive).length)}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <TagIcon className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tags Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نام برچسب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  محصول
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  توضیحات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وضعیت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاریخ ایجاد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tags.map((tag: AdminProductTagDto) => (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TagIcon className="h-5 w-5 text-purple-600 ml-2" />
                      <div className="text-sm font-medium text-gray-900">{tag.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{tag.productTitle || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{tag.slug || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 line-clamp-2 max-w-md">{tag.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(tag.isActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(tag.createdAt).toLocaleDateString('fa-IR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(tag)}
                        className="text-purple-600 hover:text-purple-900"
                        title="ویرایش"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="حذف"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tags.length === 0 && (
          <div className="text-center py-12">
            <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">برچسبی یافت نشد</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterActive !== null || selectedProductId
                ? 'نتیجه‌ای برای فیلترهای انتخابی یافت نشد.'
                : 'هنوز هیچ برچسبی ثبت نشده است.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 rounded-b-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              قبلی
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
              disabled={currentPage === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              بعدی
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                نمایش <span className="font-medium">{((currentPage - 1) * (pagination.pageSize || 20)) + 1}</span> تا{' '}
                <span className="font-medium">{Math.min(currentPage * (pagination.pageSize || 20), pagination.totalCount || 0)}</span> از{' '}
                <span className="font-medium">{toPersianNumber(pagination.totalCount || 0)}</span> برچسب
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">قبلی</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {toPersianNumber(pageNum.toString())}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">بعدی</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateTagModal
          tag={newTag}
          onChange={setNewTag}
          onClose={() => {
            setIsCreateModalOpen(false);
            setNewTag({
              productId: '',
              name: '',
              slug: '',
              description: '',
              isActive: true
            });
          }}
          onSave={handleCreateTag}
          isLoading={createMutation.isPending}
          products={products}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingTag && (
        <EditTagModal
          tag={editingTag}
          onChange={setEditingTag}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTag(null);
          }}
          onSave={handleUpdateTag}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isOpen}
        onClose={cancel}
        onConfirm={confirm}
        title={modalConfig?.title}
        message={modalConfig?.message || ''}
        confirmText={modalConfig?.confirmText}
        cancelText={modalConfig?.cancelText}
        type={modalConfig?.type}
        showCancel={modalConfig?.showCancel}
        isRtl={modalConfig?.isRtl}
      />
    </div>
  );
}

// Create Tag Modal Component
function CreateTagModal({
  tag,
  onChange,
  onClose,
  onSave,
  isLoading,
  products
}: {
  tag: AdminCreateProductTagDto;
  onChange: (tag: AdminCreateProductTagDto) => void;
  onClose: () => void;
  onSave: () => void;
  isLoading: boolean;
  products: any[];
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">افزودن برچسب جدید</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">محصول *</label>
            <select
              value={tag.productId}
              onChange={(e) => onChange({ ...tag, productId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">انتخاب محصول</option>
              {products.map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نام برچسب *</label>
            <input
              type="text"
              value={tag.name}
              onChange={(e) => onChange({ ...tag, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={tag.slug || ''}
              onChange={(e) => onChange({ ...tag, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="به صورت خودکار از نام ایجاد می‌شود"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
            <textarea
              value={tag.description || ''}
              onChange={(e) => onChange({ ...tag, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={1000}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveCreate"
              checked={tag.isActive}
              onChange={(e) => onChange({ ...tag, isActive: e.target.checked })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="isActiveCreate" className="text-sm text-gray-700">
              فعال
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            onClick={onSave}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                در حال ایجاد...
              </>
            ) : (
              'ایجاد'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Tag Modal Component
function EditTagModal({
  tag,
  onChange,
  onClose,
  onSave,
  isLoading
}: {
  tag: AdminProductTagDto;
  onChange: (tag: AdminProductTagDto) => void;
  onClose: () => void;
  onSave: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ویرایش برچسب</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">محصول</label>
            <input
              type="text"
              value={tag.productTitle || '-'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نام برچسب *</label>
            <input
              type="text"
              value={tag.name}
              onChange={(e) => onChange({ ...tag, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={tag.slug || ''}
              onChange={(e) => onChange({ ...tag, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
            <textarea
              value={tag.description || ''}
              onChange={(e) => onChange({ ...tag, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={1000}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveEdit"
              checked={tag.isActive}
              onChange={(e) => onChange({ ...tag, isActive: e.target.checked })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="isActiveEdit" className="text-sm text-gray-700">
              فعال
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            onClick={onSave}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                در حال بروزرسانی...
              </>
            ) : (
              'بروزرسانی'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

