'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminNotificationApi, AdminNotificationDto, AdminNotificationListDto, AdminCreateNotificationDto, AdminUpdateNotificationDto } from '@/services/adminApi';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { Pagination } from '@/components/ui/pagination';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  BellIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  XMarkIcon as XIcon
} from '@heroicons/react/24/outline';
import { toPersianNumber } from '@/utils/numberUtils';
import { SearchableSelect } from '@/components/ui/searchable-select';
import adminApi, { AdminUserDto } from '@/services/adminApi';
import { useConfirmation } from '@/hooks/useConfirmationMo';

const AdminNotificationsPage: React.FC = () => {
  const [selectedNotification, setSelectedNotification] = useState<AdminNotificationDto | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [notificationsPageSize, setNotificationsPageSize] = useState(10);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdminCreateNotificationDto>({
    title: '',
    message: '',
    type: 'Info',
    priority: 'Normal',
    targetAudience: 'All',
    scheduledFor: undefined,
    expiresAt: undefined,
    actionUrl: '',
    actionText: '',
    targetUserIds: undefined
  });
  const [isEditing, setIsEditing] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<AdminUserDto[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);
  const toast = useToastHelpers();
  const queryClient = useQueryClient();
  const { showConfirmation } = useConfirmation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUserSearch(false);
      }
    };

    if (showUserSearch) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserSearch]);

  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-search', userSearchQuery],
    queryFn: async () => {
      const response = await adminApi.getUsers(1, 50, userSearchQuery || undefined);
      return response.data;
    },
    enabled: formData.targetAudience === 'SpecificUsers' && showUserSearch && typeof window !== 'undefined',
  });

  const availableUsers: AdminUserDto[] = usersResponse?.users || [];

  const { data: notificationsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-notifications', statusFilter, typeFilter, searchTerm, notificationsPage, notificationsPageSize],
    queryFn: async () => {
      const response = await adminNotificationApi.getAll({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        searchTerm: searchTerm || undefined,
        pageNumber: notificationsPage,
        pageSize: notificationsPageSize
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AdminCreateNotificationDto) => 
      adminNotificationApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      setShowCreateModal(false);
      setNotificationsPage(1);
      resetForm();
      toast.successPersian(response.data.message || 'اعلان با موفقیت ایجاد شد');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در ایجاد اعلان');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: AdminUpdateNotificationDto) => 
      adminNotificationApi.update(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      setShowNotificationModal(false);
      setNotificationsPage(1);
      resetForm();
      toast.successPersian(response.data.message || 'اعلان با موفقیت بروزرسانی شد');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در بروزرسانی اعلان');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      adminNotificationApi.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      setShowNotificationModal(false);
      setNotificationsPage(1);
      toast.successPersian(response.data.message || 'اعلان با موفقیت حذف شد');
      setActionLoading(null);
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در حذف اعلان');
      setActionLoading(null);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => 
      adminNotificationApi.send(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      setShowNotificationModal(false);
      setNotificationsPage(1);
      toast.successPersian(response.data.message || 'اعلان با موفقیت ارسال شد');
      setActionLoading(null);
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در ارسال اعلان');
      setActionLoading(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => 
      adminNotificationApi.cancel(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      setShowNotificationModal(false);
      setNotificationsPage(1);
      toast.successPersian(response.data.message || 'اعلان با موفقیت لغو شد');
      setActionLoading(null);
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در لغو اعلان');
      setActionLoading(null);
    },
  });

  const notificationsData: AdminNotificationListDto | undefined = notificationsResponse?.data;
  const notifications: AdminNotificationDto[] = notificationsData?.notifications || [];
  const totalCount = notificationsData?.totalCount || 0;
  const totalPages = notificationsData?.totalPages || 0;

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'Info',
      priority: 'Normal',
      targetAudience: 'All',
      scheduledFor: undefined,
      expiresAt: undefined,
      actionUrl: '',
      actionText: '',
      targetUserIds: undefined
    });
    setIsEditing(false);
    setSelectedNotification(null);
    setSelectedUsers([]);
    setUserSearchQuery('');
    setShowUserSearch(false);
  };

  const handleCreate = () => {
    if (!formData.title || !formData.message) {
      toast.errorPersian('لطفاً عنوان و متن اعلان را وارد کنید');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!formData.title || !formData.message || !selectedNotification) {
      toast.errorPersian('لطفاً عنوان و متن اعلان را وارد کنید');
      return;
    }
    const updateData: AdminUpdateNotificationDto = {
      id: selectedNotification.id,
      ...formData
    };
    updateMutation.mutate(updateData);
  };

  const handleDelete = (notificationId: string) => {
    showConfirmation({
      title: 'حذف اعلان',
      message: 'آیا از حذف این اعلان اطمینان دارید؟',
      confirmText: 'حذف',
      cancelText: 'انصراف',
      type: 'warning',
      onConfirm: () => {
        setActionLoading(notificationId);
        deleteMutation.mutate(notificationId);
      }
    });
  };

  const handleSend = (notificationId: string) => {
    showConfirmation({
      title: 'ارسال اعلان',
      message: 'آیا از ارسال این اعلان اطمینان دارید؟',
      confirmText: 'ارسال',
      cancelText: 'انصراف',
      type: 'info',
      onConfirm: () => {
        setActionLoading(notificationId);
        sendMutation.mutate(notificationId);
      }
    });
  };

  const handleCancel = (notificationId: string) => {
    showConfirmation({
      title: 'لغو اعلان',
      message: 'آیا از لغو این اعلان اطمینان دارید؟',
      confirmText: 'لغو',
      cancelText: 'انصراف',
      type: 'warning',
      onConfirm: () => {
        setActionLoading(notificationId);
        cancelMutation.mutate(notificationId);
      }
    });
  };

  const handleViewNotification = async (notificationId: string) => {
    try {
      const response = await adminNotificationApi.getById(notificationId);
      if (response.data.isSucceeded && response.data.data) {
        const notification = response.data.data;
        setSelectedNotification(notification);
        setFormData({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          targetAudience: notification.targetAudience,
          scheduledFor: notification.scheduledFor,
          expiresAt: notification.expiresAt,
          actionUrl: notification.actionUrl || '',
          actionText: notification.actionText || '',
          targetUserIds: notification.targetUserIds
        });
        setIsEditing(false);
        setShowNotificationModal(true);
        
        if (notification.targetAudience === 'SpecificUsers' && notification.targetUserIds && notification.targetUserIds.length > 0) {
          setShowUserSearch(true);
          const usersResponse = await adminApi.getUsers(1, 100);
          const allUsers = usersResponse.data.users || [];
          const selected = allUsers.filter(u => notification.targetUserIds?.includes(u.id));
          setSelectedUsers(selected);
        } else {
          setShowUserSearch(false);
          setSelectedUsers([]);
        }
      }
    } catch (error: any) {
      toast.errorPersian(error.response?.data?.message || 'خطا در دریافت جزئیات اعلان');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const getTypeBadge = (type: string) => {
    const badges: { [key: string]: { bg: string; text: string; icon: any } } = {
      Info: { bg: 'bg-blue-100 text-blue-800', text: 'اطلاعاتی', icon: InformationCircleIcon },
      Warning: { bg: 'bg-yellow-100 text-yellow-800', text: 'هشدار', icon: ExclamationTriangleIcon },
      Success: { bg: 'bg-green-100 text-green-800', text: 'موفقیت', icon: CheckCircleIcon },
      Error: { bg: 'bg-red-100 text-red-800', text: 'خطا', icon: XCircleIcon },
      Urgent: { bg: 'bg-red-200 text-red-900', text: 'فوری', icon: BellIcon }
    };
    const badge = badges[type] || badges.Info;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges: { [key: string]: { bg: string; text: string } } = {
      Normal: { bg: 'bg-gray-100 text-gray-800', text: 'عادی' },
      Important: { bg: 'bg-orange-100 text-orange-800', text: 'مهم' },
      Urgent: { bg: 'bg-red-100 text-red-800', text: 'فوری' }
    };
    const badge = badges[priority] || badges.Normal;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg}`}>
        {badge.text}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string; icon: any } } = {
      Draft: { bg: 'bg-gray-100 text-gray-800', text: 'پیش‌نویس', icon: PencilIcon },
      Scheduled: { bg: 'bg-blue-100 text-blue-800', text: 'زمان‌بندی شده', icon: ClockIcon },
      Sent: { bg: 'bg-green-100 text-green-800', text: 'ارسال شده', icon: CheckCircleIcon },
      Cancelled: { bg: 'bg-red-100 text-red-800', text: 'لغو شده', icon: XCircleIcon }
    };
    const badge = badges[status] || badges.Draft;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getTargetAudienceLabel = (audience: string) => {
    const labels: { [key: string]: string } = {
      All: 'همه کاربران',
      Authors: 'نویسندگان',
      Verified: 'کاربران تأیید شده',
      SpecificUsers: 'کاربران خاص'
    };
    return labels[audience] || audience;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">در حال بارگذاری...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">خطا در بارگذاری اعلانات</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">مدیریت اعلانات</h1>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          ایجاد اعلان جدید
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">جستجو</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setNotificationsPage(1);
                }}
                placeholder="جستجو در عنوان و متن..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setNotificationsPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">همه</option>
              <option value="Draft">پیش‌نویس</option>
              <option value="Scheduled">زمان‌بندی شده</option>
              <option value="Sent">ارسال شده</option>
              <option value="Cancelled">لغو شده</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setNotificationsPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">همه</option>
              <option value="Info">اطلاعاتی</option>
              <option value="Warning">هشدار</option>
              <option value="Success">موفقیت</option>
              <option value="Error">خطا</option>
              <option value="Urgent">فوری</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عنوان</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اولویت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مخاطب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">گیرندگان</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    هیچ اعلانی یافت نشد
                  </td>
                </tr>
              ) : (
                notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{notification.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(notification.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(notification.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getTargetAudienceLabel(notification.targetAudience)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(notification.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{toPersianNumber(notification.totalRecipients)}</div>
                      {notification.status === 'Sent' && (
                        <div className="text-xs text-gray-500">خوانده شده: {toPersianNumber(notification.readCount)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(notification.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewNotification(notification.id)}
                          className="text-primary-600 hover:text-primary-900"
                          title="مشاهده"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        {notification.status === 'Draft' && (
                          <>
                            <button
                              onClick={() => {
                                handleViewNotification(notification.id);
                                setTimeout(() => handleEdit(), 100);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="ویرایش"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleSend(notification.id)}
                              disabled={actionLoading === notification.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="ارسال"
                            >
                              <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(notification.id)}
                              disabled={actionLoading === notification.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="حذف"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {notification.status === 'Scheduled' && (
                          <>
                            <button
                              onClick={() => {
                                handleViewNotification(notification.id);
                                setTimeout(() => handleEdit(), 100);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="ویرایش"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleCancel(notification.id)}
                              disabled={actionLoading === notification.id}
                              className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                              title="لغو"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination
              currentPage={notificationsPage}
              totalPages={totalPages}
              onPageChange={setNotificationsPage}
            />
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showNotificationModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {showCreateModal ? 'ایجاد اعلان جدید' : isEditing ? 'ویرایش اعلان' : 'جزئیات اعلان'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowNotificationModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {(showCreateModal || isEditing) ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">عنوان *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="عنوان اعلان"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">متن *</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="متن اعلان"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">نوع</label>
                      <SearchableSelect
                        options={[
                          { value: 'Info', label: 'اطلاعاتی' },
                          { value: 'Warning', label: 'هشدار' },
                          { value: 'Success', label: 'موفقیت' },
                          { value: 'Error', label: 'خطا' },
                          { value: 'Urgent', label: 'فوری' }
                        ]}
                        value={formData.type}
                        onChange={(value) => setFormData({ ...formData, type: value })}
                        placeholder="انتخاب نوع"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">اولویت</label>
                      <SearchableSelect
                        options={[
                          { value: 'Normal', label: 'عادی' },
                          { value: 'Important', label: 'مهم' },
                          { value: 'Urgent', label: 'فوری' }
                        ]}
                        value={formData.priority}
                        onChange={(value) => setFormData({ ...formData, priority: value })}
                        placeholder="انتخاب اولویت"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">مخاطب</label>
                    <SearchableSelect
                      options={[
                        { value: 'All', label: 'همه کاربران' },
                        { value: 'Authors', label: 'نویسندگان' },
                        { value: 'Verified', label: 'کاربران تأیید شده' },
                        { value: 'SpecificUsers', label: 'کاربران خاص' }
                      ]}
                      value={formData.targetAudience}
                      onChange={(value) => {
                        setFormData({ ...formData, targetAudience: value, targetUserIds: value !== 'SpecificUsers' ? undefined : [] });
                        if (value === 'SpecificUsers') {
                          setShowUserSearch(true);
                        } else {
                          setShowUserSearch(false);
                          setSelectedUsers([]);
                        }
                      }}
                      placeholder="انتخاب مخاطب"
                    />
                  </div>

                  {formData.targetAudience === 'SpecificUsers' && (
                    <div ref={userSearchRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">انتخاب کاربران</label>
                      <div className="space-y-2">
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            onFocus={() => setShowUserSearch(true)}
                            placeholder="جستجوی کاربران..."
                            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>

                        {showUserSearch && (
                          <div className="relative">
                            <div className="absolute z-50 w-full border border-gray-300 rounded-lg bg-white max-h-60 overflow-y-auto shadow-lg">
                              {usersLoading ? (
                                <div className="p-4 text-center text-gray-500">در حال بارگذاری...</div>
                              ) : availableUsers.length > 0 ? (
                                availableUsers
                                  .filter(user => !selectedUsers.find(su => su.id === user.id))
                                  .map((user) => (
                                    <button
                                      key={user.id}
                                      type="button"
                                      onClick={() => {
                                        const newSelectedUsers = [...selectedUsers, user];
                                        setSelectedUsers(newSelectedUsers);
                                        setFormData({
                                          ...formData,
                                          targetUserIds: newSelectedUsers.map(u => u.id)
                                        });
                                        setUserSearchQuery('');
                                      }}
                                      className="w-full px-4 py-2 text-right hover:bg-gray-100 flex items-center justify-between border-b border-gray-200 last:border-b-0"
                                    >
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {user.firstName} {user.lastName}
                                        </div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                      </div>
                                      <PlusIcon className="w-4 h-4 text-primary-600" />
                                    </button>
                                  ))
                              ) : (
                                <div className="p-4 text-center text-gray-500">نتیجه‌ای یافت نشد</div>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedUsers.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs text-gray-600 mb-2">
                              کاربران انتخاب شده ({toPersianNumber(selectedUsers.length)})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {selectedUsers.map((user) => (
                                <span
                                  key={user.id}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                                >
                                  <span>{user.firstName} {user.lastName}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSelectedUsers = selectedUsers.filter(u => u.id !== user.id);
                                      setSelectedUsers(newSelectedUsers);
                                      setFormData({
                                        ...formData,
                                        targetUserIds: newSelectedUsers.length > 0 ? newSelectedUsers.map(u => u.id) : undefined
                                      });
                                    }}
                                    className="hover:text-primary-900"
                                  >
                                    <XIcon className="w-4 h-4" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">زمان ارسال (اختیاری)</label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledFor || ''}
                        onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ انقضا (اختیاری)</label>
                      <input
                        type="datetime-local"
                        value={formData.expiresAt || ''}
                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">لینک عملیات (اختیاری)</label>
                    <input
                      type="url"
                      value={formData.actionUrl || ''}
                      onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">متن دکمه عملیات (اختیاری)</label>
                    <input
                      type="text"
                      value={formData.actionText || ''}
                      onChange={(e) => setFormData({ ...formData, actionText: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="مشاهده بیشتر"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowNotificationModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      انصراف
                    </button>
                    <button
                      onClick={showCreateModal ? handleCreate : handleUpdate}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {showCreateModal ? 'ایجاد' : 'ذخیره'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {selectedNotification && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">عنوان</label>
                        <div className="text-gray-900">{selectedNotification.title}</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">متن</label>
                        <div className="text-gray-900 whitespace-pre-wrap">{selectedNotification.message}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">نوع</label>
                          {getTypeBadge(selectedNotification.type)}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">اولویت</label>
                          {getPriorityBadge(selectedNotification.priority)}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">مخاطب</label>
                        <div className="text-gray-900">{getTargetAudienceLabel(selectedNotification.targetAudience)}</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
                        {getStatusBadge(selectedNotification.status)}
                      </div>

                      {selectedNotification.scheduledFor && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">زمان ارسال</label>
                          <div className="text-gray-900">{new Date(selectedNotification.scheduledFor).toLocaleString('fa-IR')}</div>
                        </div>
                      )}

                      {selectedNotification.sentAt && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">زمان ارسال واقعی</label>
                          <div className="text-gray-900">{new Date(selectedNotification.sentAt).toLocaleString('fa-IR')}</div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">آمار</label>
                        <div className="text-gray-900">
                          گیرندگان: {toPersianNumber(selectedNotification.totalRecipients)} | 
                          خوانده شده: {toPersianNumber(selectedNotification.readCount)}
                        </div>
                      </div>

                      {selectedNotification.actionUrl && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">لینک عملیات</label>
                          <a href={selectedNotification.actionUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                            {selectedNotification.actionText || selectedNotification.actionUrl}
                          </a>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-4">
                        {selectedNotification.status === 'Draft' && (
                          <>
                            <button
                              onClick={handleEdit}
                              className="px-4 py-2 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              ویرایش
                            </button>
                            <button
                              onClick={() => handleSend(selectedNotification.id)}
                              disabled={actionLoading === selectedNotification.id}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              ارسال
                            </button>
                            <button
                              onClick={() => handleDelete(selectedNotification.id)}
                              disabled={actionLoading === selectedNotification.id}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              حذف
                            </button>
                          </>
                        )}
                        {selectedNotification.status === 'Scheduled' && (
                          <>
                            <button
                              onClick={handleEdit}
                              className="px-4 py-2 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              ویرایش
                            </button>
                            <button
                              onClick={() => handleCancel(selectedNotification.id)}
                              disabled={actionLoading === selectedNotification.id}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                            >
                              لغو
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setShowNotificationModal(false);
                            resetForm();
                          }}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          بستن
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsPage;

