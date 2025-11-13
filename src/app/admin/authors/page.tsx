'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authorApi, ApiAuthorDto, ApiApprovalDto, ApiCreateAuthorByAdminDto } from '@/services/api';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { 
  PencilIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  UserCircleIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function AuthorsPage() {
  const { successPersian, errorPersian } = useToastHelpers();
  const queryClient = useQueryClient();
  const { isOpen, modalConfig, showModal, confirm, cancel } = useConfirmationModal();
  const [selectedAuthor, setSelectedAuthor] = useState<ApiAuthorDto | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<ApiAuthorDto | null>(null);
  const [newAuthor, setNewAuthor] = useState<ApiCreateAuthorByAdminDto>({
    UserId: '',
    PenName: '',
    Biography: '',
    Website: '',
    Nationality: '',
    ProfileImageUrl: '',
    DateOfBirth: '',
    ApprovalStatus: 'Approved',
    ApprovalNote: '',
    IsActive: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<any>(null);

  // Fetch all authors with pagination
  const { data: authorsResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-authors', currentPage, searchTerm],
    queryFn: async () => {
      const response = await authorApi.getAll({ pageNumber: currentPage, pageSize: 20, searchTerm: searchTerm || undefined });
      return response.data;
    },
    retry: 2,
  });

  // Handle response data structure (backward compatibility)
  const authors: ApiAuthorDto[] = React.useMemo(() => {
    if (!authorsResponse?.data) return [];
    
    // Check if data is paginated (has authors property) or legacy array
    if (Array.isArray(authorsResponse.data)) {
      return authorsResponse.data;
    }
    
    // Paginated response
    if (authorsResponse.data.authors) {
      setPagination({
        totalCount: authorsResponse.data.totalCount,
        pageNumber: authorsResponse.data.pageNumber,
        pageSize: authorsResponse.data.pageSize,
        totalPages: authorsResponse.data.totalPages,
        hasPreviousPage: authorsResponse.data.hasPreviousPage,
        hasNextPage: authorsResponse.data.hasNextPage
      });
      return authorsResponse.data.authors;
    }
    
    return [];
  }, [authorsResponse]);

  // Reset to page 1 when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Update author mutation
  const updateMutation = useMutation({
    mutationFn: (data: ApiAuthorDto) => authorApi.update(data),
    onSuccess: (response) => {
      successPersian(response.data.message || 'اطلاعات نویسنده با موفقیت بروزرسانی شد');
      setIsEditModalOpen(false);
      setEditingAuthor(null);
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در بروزرسانی اطلاعات نویسنده');
    },
  });

  // Approve/Reject mutation
  const approveMutation = useMutation({
    mutationFn: ({ authorId, data }: { authorId: string; data: ApiApprovalDto }) => 
      authorApi.approve(authorId, data),
    onSuccess: (response) => {
      successPersian(response.data.message || 'وضعیت نویسنده با موفقیت تغییر کرد');
      setIsApprovalModalOpen(false);
      setSelectedAuthor(null);
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در تغییر وضعیت نویسنده');
    },
  });

  // Delete author mutation
  const deleteMutation = useMutation({
    mutationFn: (authorId: string) => authorApi.delete(authorId),
    onSuccess: (response) => {
      successPersian(response.data.message || 'نویسنده با موفقیت حذف شد');
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در حذف نویسنده');
    },
  });

  // Create author mutation
  const createMutation = useMutation({
    mutationFn: (data: ApiCreateAuthorByAdminDto) => authorApi.createByAdmin(data),
    onSuccess: (response) => {
      successPersian(response.data.message || 'نویسنده با موفقیت ایجاد شد');
      setIsCreateModalOpen(false);
      setNewAuthor({
        UserId: '',
        PenName: '',
        Biography: '',
        Website: '',
        Nationality: '',
        ProfileImageUrl: '',
        DateOfBirth: '',
        ApprovalStatus: 'Approved',
        ApprovalNote: '',
        IsActive: true,
      });
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در ایجاد نویسنده');
    },
  });

  const handleApprove = (author: ApiAuthorDto, approve: boolean, note?: string) => {
    approveMutation.mutate({
      authorId: author.id,
      data: {
        UserId: author.userId,
        Approve: approve,
        Note: note,
      },
    });
  };

  const openEditModal = (author: ApiAuthorDto) => {
    setEditingAuthor({ ...author });
    setIsEditModalOpen(true);
  };

  const handleUpdateAuthor = () => {
    if (!editingAuthor) return;
    
    // Validate required fields
    if (!editingAuthor.penName || !editingAuthor.biography) {
      errorPersian('لطفاً فیلدهای الزامی را پر کنید');
      return;
    }

    updateMutation.mutate(editingAuthor);
  };

  const handleDeleteAuthor = (author: ApiAuthorDto) => {
    showModal({
      title: 'حذف نویسنده',
      message: `آیا مطمئن هستید که می‌خواهید نویسنده "${author.penName}" را حذف کنید؟`,
      confirmText: 'حذف',
      cancelText: 'انصراف',
      type: 'warning',
      isRtl: true,
      onConfirm: () => {
        deleteMutation.mutate(author.id);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">✓ تایید شده</span>;
      case 'Rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">✗ رد شده</span>;
      case 'Pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">⏳ در انتظار بررسی</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">{status}</span>;
    }
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
            <h1 className="text-3xl font-bold text-gray-900">مدیریت نویسندگان</h1>
            <p className="text-gray-600 mt-2">مشاهده و مدیریت درخواست‌های نویسندگی</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            افزودن نویسنده جدید
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو بر اساس نام مستعار، بیوگرافی، ملیت..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              dir="rtl"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Authors Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-sm font-medium opacity-90 mb-1">کل نویسندگان</p>
                <p className="text-4xl font-bold">{pagination?.totalCount ?? authors.length}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <UserCircleIcon className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-sm font-medium opacity-90 mb-1">تایید شده</p>
                <p className="text-4xl font-bold">
                  {authors.filter((a: ApiAuthorDto) => a.approvalStatus === 'Approved').length}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <CheckCircleIcon className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-sm font-medium opacity-90 mb-1">در انتظار بررسی</p>
                <p className="text-4xl font-bold">
                  {authors.filter((a: ApiAuthorDto) => a.approvalStatus === 'Pending').length}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <ClockIcon className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-sm font-medium opacity-90 mb-1">رد شده</p>
                <p className="text-4xl font-bold">
                  {authors.filter((a: ApiAuthorDto) => a.approvalStatus === 'Rejected').length}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <XCircleIcon className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نام مستعار
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  بیوگرافی
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ملیت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وضعیت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  فعال
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {authors.map((author: ApiAuthorDto) => (
                <tr key={author.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {author.profileImageUrl ? (
                        <img src={author.profileImageUrl} alt={author.penName} className="h-10 w-10 rounded-full ml-3" />
                      ) : (
                        <UserCircleIcon className="h-10 w-10 text-gray-400 ml-3" />
                      )}
                      <div className="text-sm font-medium text-gray-900">{author.penName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 line-clamp-2 max-w-md">{author.biography}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{author.nationality || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(author.approvalStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      author.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {author.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {author.approvalStatus === 'Pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedAuthor(author);
                              setIsApprovalModalOpen(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="بررسی درخواست"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openEditModal(author)}
                        className="text-purple-600 hover:text-purple-900"
                        title="ویرایش"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAuthor(author)}
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

        {authors.length === 0 && (
          <div className="text-center py-12">
            <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">نویسنده‌ای یافت نشد</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'نتیجه‌ای برای جستجوی شما یافت نشد.' : 'هنوز هیچ درخواست نویسندگی ثبت نشده است.'}
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
                <span className="font-medium">{pagination.totalCount || 0}</span> نویسنده
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
                      {pageNum}
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

      {/* Approval Modal */}
      {isApprovalModalOpen && selectedAuthor && (
        <ApprovalModal
          author={selectedAuthor}
          onClose={() => {
            setIsApprovalModalOpen(false);
            setSelectedAuthor(null);
          }}
          onApprove={handleApprove}
          isLoading={approveMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingAuthor && (
        <EditAuthorModal
          author={editingAuthor}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingAuthor(null);
          }}
          onUpdate={handleUpdateAuthor}
          onChange={setEditingAuthor}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateAuthorModal
          author={newAuthor}
          onClose={() => {
            setIsCreateModalOpen(false);
            setNewAuthor({
              UserId: '',
              PenName: '',
              Biography: '',
              Website: '',
              Nationality: '',
              ProfileImageUrl: '',
              DateOfBirth: '',
              ApprovalStatus: 'Approved',
              ApprovalNote: '',
              IsActive: true,
            });
          }}
          onCreate={() => {
            if (!newAuthor.PenName || !newAuthor.Biography) {
              errorPersian('لطفاً فیلدهای الزامی را پر کنید');
              return;
            }
            
            // Prepare data - only include fields with values
            const authorData: any = {
              PenName: newAuthor.PenName.trim(),
              Biography: newAuthor.Biography.trim(),
              ApprovalStatus: newAuthor.ApprovalStatus || 'Approved',
              IsActive: newAuthor.IsActive,
            };
            
            // Validate and include UserId if provided
            if (newAuthor.UserId && newAuthor.UserId.trim()) {
              const trimmedUserId = newAuthor.UserId.trim();
              const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
              if (!guidRegex.test(trimmedUserId)) {
                errorPersian('شناسه کاربر نامعتبر است (فرمت GUID اشتباه است)');
                return;
              }
              authorData.UserId = trimmedUserId;
            }
            
            // Only include optional string fields if they have values
            if (newAuthor.Website?.trim()) {
              authorData.Website = newAuthor.Website.trim();
            }
            if (newAuthor.Nationality?.trim()) {
              authorData.Nationality = newAuthor.Nationality.trim();
            }
            if (newAuthor.ProfileImageUrl?.trim()) {
              authorData.ProfileImageUrl = newAuthor.ProfileImageUrl.trim();
            }
            if (newAuthor.DateOfBirth?.trim()) {
              authorData.DateOfBirth = newAuthor.DateOfBirth.trim();
            }
            if (newAuthor.ApprovalNote?.trim()) {
              authorData.ApprovalNote = newAuthor.ApprovalNote.trim();
            }
            
            createMutation.mutate(authorData);
          }}
          onChange={setNewAuthor}
          isLoading={createMutation.isPending}
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

// Approval Modal Component
function ApprovalModal({
  author,
  onClose,
  onApprove,
  isLoading,
}: {
  author: ApiAuthorDto;
  onClose: () => void;
  onApprove: (author: ApiAuthorDto, approve: boolean, note?: string) => void;
  isLoading: boolean;
}) {
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">بررسی درخواست نویسندگی</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نام مستعار</label>
            <p className="text-gray-900">{author.penName}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">بیوگرافی</label>
            <p className="text-gray-900">{author.biography}</p>
          </div>
          
          {author.website && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وب‌سایت</label>
              <a href={author.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                {author.website}
              </a>
            </div>
          )}
          
          {author.nationality && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملیت</label>
              <p className="text-gray-900">{author.nationality}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">یادداشت مدیر (اختیاری)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="در صورت نیاز، یادداشتی برای نویسنده بنویسید..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            onClick={() => onApprove(author, false, note)}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <XCircleIcon className="h-5 w-5" />
            رد کردن
          </button>
          <button
            onClick={() => onApprove(author, true, note)}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircleIcon className="h-5 w-5" />
            تایید کردن
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Author Modal Component
function EditAuthorModal({
  author,
  onClose,
  onUpdate,
  onChange,
  isLoading,
}: {
  author: ApiAuthorDto;
  onClose: () => void;
  onUpdate: () => void;
  onChange: (author: ApiAuthorDto) => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ویرایش اطلاعات نویسنده</h2>
        
        <div className="space-y-4">
          {/* Pen Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نام مستعار *</label>
            <input
              type="text"
              value={author.penName}
              onChange={(e) => onChange({ ...author, penName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={200}
              required
            />
          </div>

          {/* Biography */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">بیوگرافی *</label>
            <textarea
              value={author.biography}
              onChange={(e) => onChange({ ...author, biography: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={2000}
              required
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وب‌سایت</label>
            <input
              type="url"
              value={author.website || ''}
              onChange={(e) => onChange({ ...author, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={200}
              placeholder="https://example.com"
            />
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملیت</label>
            <input
              type="text"
              value={author.nationality || ''}
              onChange={(e) => onChange({ ...author, nationality: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={100}
            />
          </div>

          {/* Approval Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت تایید *</label>
            <select
              value={author.approvalStatus}
              onChange={(e) => onChange({ ...author, approvalStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Approved">تایید شده</option>
              <option value="Pending">در انتظار بررسی</option>
              <option value="Rejected">رد شده</option>
            </select>
          </div>

          {/* Approval Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">یادداشت </label>
            <textarea
              value={author.approvalNote || ''}
              onChange={(e) => onChange({ ...author, approvalNote: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={500}
              placeholder="یادداشت مدیر درباره وضعیت نویسنده..."
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={author.isActive}
              onChange={(e) => onChange({ ...author, isActive: e.target.checked })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              فعال
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            onClick={onUpdate}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                در حال بروزرسانی...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                بروزرسانی
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Create Author Modal Component
function CreateAuthorModal({
  author,
  onClose,
  onCreate,
  onChange,
  isLoading,
}: {
  author: ApiCreateAuthorByAdminDto;
  onClose: () => void;
  onCreate: () => void;
  onChange: (author: ApiCreateAuthorByAdminDto) => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">افزودن نویسنده جدید</h2>
        
        <div className="space-y-4">
          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">شناسه کاربر (اختیاری)</label>
            <input
              type="text"
              value={author.UserId || ''}
              onChange={(e) => onChange({ ...author, UserId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="شناسه کاربر را وارد کنید (فرمت GUID) - در صورت عدم ثبت نام در سیستم خالی بگذارید"
            />
            <p className="mt-1 text-xs text-gray-500">فرمت: 00000000-0000-0000-0000-000000000000 (اختیاری - برای نویسندگان غیرثبت‌نامی خالی بگذارید)</p>
          </div>

          {/* Pen Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نام مستعار *</label>
            <input
              type="text"
              value={author.PenName}
              onChange={(e) => onChange({ ...author, PenName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={200}
              required
            />
          </div>

          {/* Biography */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">بیوگرافی *</label>
            <textarea
              value={author.Biography}
              onChange={(e) => onChange({ ...author, Biography: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={2000}
              required
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وب‌سایت</label>
            <input
              type="url"
              value={author.Website || ''}
              onChange={(e) => onChange({ ...author, Website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={200}
              placeholder="https://example.com"
            />
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملیت</label>
            <input
              type="text"
              value={author.Nationality || ''}
              onChange={(e) => onChange({ ...author, Nationality: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={100}
            />
          </div>

          {/* Profile Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">آدرس تصویر پروفایل</label>
            <input
              type="url"
              value={author.ProfileImageUrl || ''}
              onChange={(e) => onChange({ ...author, ProfileImageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={500}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ تولد</label>
            <input
              type="date"
              value={author.DateOfBirth || ''}
              onChange={(e) => onChange({ ...author, DateOfBirth: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Approval Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت تایید *</label>
            <select
              value={author.ApprovalStatus}
              onChange={(e) => onChange({ ...author, ApprovalStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Approved">تایید شده</option>
              <option value="Pending">در انتظار بررسی</option>
              <option value="Rejected">رد شده</option>
            </select>
          </div>

          {/* Approval Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">یادداشت</label>
            <textarea
              value={author.ApprovalNote || ''}
              onChange={(e) => onChange({ ...author, ApprovalNote: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={500}
              placeholder="یادداشت مدیر درباره وضعیت نویسنده..."
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveCreate"
              checked={author.IsActive}
              onChange={(e) => onChange({ ...author, IsActive: e.target.checked })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="isActiveCreate" className="text-sm text-gray-700">
              فعال
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            onClick={onCreate}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                در حال ایجاد...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                ایجاد
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}