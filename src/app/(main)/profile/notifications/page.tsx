'use client';

import React, { useState, Suspense } from 'react';
import { Bell, CheckCircle, XCircle, Info, AlertTriangle, AlertCircle, Loader2, RefreshCw, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, UserNotificationDto, UserNotificationListDto } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { useRouter } from 'next/navigation';
import { toPersianNumber } from '@/utils/numberUtils';

const NotificationsPageContent: React.FC = () => {
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [notificationsPageSize, setNotificationsPageSize] = useState(12);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { user, isAuthenticated } = useAuth();
  const toast = useToastHelpers();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: notificationsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['user-notifications', user?.id, notificationsPage, notificationsPageSize, statusFilter],
    queryFn: async () => {
      const response = await notificationApi.getUserNotifications({
        pageNumber: notificationsPage,
        pageSize: notificationsPageSize,
        isRead: statusFilter === 'read' ? true : statusFilter === 'unread' ? false : undefined
      });
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
    retry: 1,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (userNotificationId: string) => notificationApi.markAsRead(userNotificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications-unread-count'] });
      toast.successPersian('اعلان به عنوان خوانده شده علامت‌گذاری شد');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در علامت‌گذاری اعلان');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications-unread-count'] });
      toast.successPersian('همه اعلانات به عنوان خوانده شده علامت‌گذاری شدند');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در علامت‌گذاری اعلانات');
    },
  });

  const notificationsData: UserNotificationListDto | undefined = notificationsResponse?.data;
  const notifications: UserNotificationDto[] = notificationsData?.notifications || [];
  const totalCount = notificationsData?.totalCount || 0;
  const unreadCount = notificationsData?.unreadCount || 0;
  const totalPages = notificationsData?.totalPages || 0;
  const hasPreviousPage = notificationsData?.hasPreviousPage || false;
  const hasNextPage = notificationsData?.hasNextPage || false;

  const handleMarkAsRead = (userNotificationId: string) => {
    markAsReadMutation.mutate(userNotificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleActionClick = (actionUrl?: string) => {
    if (actionUrl) {
      if (actionUrl.startsWith('http')) {
        window.open(actionUrl, '_blank');
      } else {
        router.push(actionUrl);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'Warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'Success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'Urgent':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: { [key: string]: { bg: string; text: string } } = {
      Info: { bg: 'bg-blue-100 text-blue-800', text: 'اطلاعاتی' },
      Warning: { bg: 'bg-yellow-100 text-yellow-800', text: 'هشدار' },
      Success: { bg: 'bg-green-100 text-green-800', text: 'موفقیت' },
      Error: { bg: 'bg-red-100 text-red-800', text: 'خطا' },
      Urgent: { bg: 'bg-red-200 text-red-900', text: 'فوری' }
    };
    const badge = badges[type] || badges.Info;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg}`}>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">خطا در بارگذاری اعلانات</p>
        <p className="text-sm text-gray-500 mb-4">
          {(error as any)?.response?.data?.message || (error as any)?.message || 'خطای نامشخص'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Professional Notifications Header */}
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-blue-600 via-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                    اعلانات من
                  </h1>
                  <p className="text-white/90 text-sm sm:text-base">
                    {unreadCount > 0 ? (
                      <span>{toPersianNumber(unreadCount)} اعلان خوانده نشده</span>
                    ) : (
                      <span>همه اعلانات خوانده شده‌اند</span>
                    )}
                  </p>
                </div>
              </div>
              
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md"
                >
                  <CheckCheck className="w-4 h-4 ml-2" />
                  {markAllAsReadMutation.isPending ? 'در حال پردازش...' : 'علامت‌گذاری همه به عنوان خوانده شده'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => {
              setStatusFilter('');
              setNotificationsPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === ''
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            همه ({toPersianNumber(totalCount)})
          </button>
          <button
            onClick={() => {
              setStatusFilter('unread');
              setNotificationsPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'unread'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            خوانده نشده ({toPersianNumber(unreadCount)})
          </button>
          <button
            onClick={() => {
              setStatusFilter('read');
              setNotificationsPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'read'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            خوانده شده ({toPersianNumber(totalCount - unreadCount)})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">هیچ اعلانی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-lg ${
                !notification.isRead ? 'border-r-4 border-r-primary-600 bg-primary-50/50' : ''
              }`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className={`text-base sm:text-lg font-semibold mb-2 text-right ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap text-right mt-2">
                          {notification.message}
                        </p>
                      </div>
                      
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isPending}
                          className="flex-shrink-0 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="علامت‌گذاری به عنوان خوانده شده"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-4 justify-end">
                      {getTypeBadge(notification.type)}
                      {getPriorityBadge(notification.priority)}
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString('fa-IR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {notification.isRead && notification.readAt && (
                        <span className="text-xs text-gray-400">
                          خوانده شده در {new Date(notification.readAt).toLocaleDateString('fa-IR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>

                    {notification.actionUrl && notification.actionText && (
                      <div className="mt-4 text-right">
                        <Button
                          onClick={() => handleActionClick(notification.actionUrl)}
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          {notification.actionText}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={notificationsPage}
            totalPages={totalPages}
            onPageChange={setNotificationsPage}
          />
        </div>
      )}
    </div>
  );
};

const NotificationsPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <NotificationsPageContent />
    </Suspense>
  );
};

export default NotificationsPage;

