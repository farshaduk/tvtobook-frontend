'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, MessageSquare, Loader2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi, TicketDto, fileApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast';
import { TvtoBookSpinner } from '@/components/ui/spinner';
import UserLayout from '@/components/UserLayout';
import { useToastHelpers } from '@/hooks/useToastHelpers';

function TicketDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketId = searchParams.get('id') as string;
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const { user, isAuthenticated } = useAuth();
  const toast = useToastHelpers();
  const queryClient = useQueryClient();

  const { data: ticketResponse, isLoading, refetch } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const response = await ticketApi.getById(ticketId);
      return response.data;
    },
    enabled: !!ticketId && typeof window !== 'undefined',
  });

  const ticket: TicketDto | undefined = ticketResponse?.data;

  const addMessageMutation = useMutation({
    mutationFn: async (data: { ticketId: string; message: string; attachments?: File[] }) => {
      if (!isAuthenticated) {
        throw new Error('لطفاً ابتدا وارد حساب کاربری خود شوید');
      }
      
      const formData = new FormData();
      formData.append('ticketId', data.ticketId);
      formData.append('message', data.message);
      formData.append('isInternal', 'false');
      
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }
      
      const response = await fileApi.post('/ticket/add-message', formData);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setNewMessage('');
      setAttachments([]);
      toast.success('پیام با موفقیت ارسال شد');
    },
    onError: (error: any) => {
      toast.error(error.message || 'خطا در ارسال پیام');
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'Open': { label: 'باز', className: 'bg-blue-100 text-blue-800' },
      'InProgress': { label: 'در حال بررسی', className: 'bg-yellow-100 text-yellow-800' },
      'Resolved': { label: 'حل شده', className: 'bg-green-100 text-green-800' },
      'Closed': { label: 'بسته شده', className: 'bg-gray-100 text-gray-800' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; className: string }> = {
      'Low': { label: 'پایین', className: 'bg-gray-100 text-gray-800' },
      'Medium': { label: 'متوسط', className: 'bg-blue-100 text-blue-800' },
      'High': { label: 'بالا', className: 'bg-orange-100 text-orange-800' },
      'Urgent': { label: 'فوری', className: 'bg-red-100 text-red-800' },
    };
    const config = priorityConfig[priority] || { label: priority, className: 'bg-gray-100 text-gray-800' };
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleAddMessage = (ticketId: string) => {
    if (!newMessage.trim() && attachments.length === 0) {
      toast.error('لطفاً پیام یا فایل را وارد کنید');
      return;
    }
    addMessageMutation.mutate({ ticketId, message: newMessage, attachments: attachments.length > 0 ? attachments : undefined });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const userStats = {
    totalOrders: 0,
    totalSpent: 0,
    memberSince: user?.dateJoined || new Date().toISOString()
  };

  const handleTabSwitch = (tabId: string) => {
    if (tabId === 'tickets') {
      router.push('/profile/tickets');
    } else {
      router.push(`/profile?tab=${tabId}`);
    }
  };

  if (isLoading) {
    return (
      <UserLayout
        activeTab="tickets"
        onTabChange={handleTabSwitch}
        user={user}
        isOwnProfile={true}
        userStats={userStats}
      >
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </UserLayout>
    );
  }

  if (!ticket) {
    return (
      <UserLayout
        activeTab="tickets"
        onTabChange={handleTabSwitch}
        user={user}
        isOwnProfile={true}
        userStats={userStats}
      >
        <div className="container mx-auto p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">تیکت یافت نشد</p>
              <Button onClick={() => {
                window.location.href = '/profile?tab=tickets';
              }} className="mt-4">
                بازگشت به لیست تیکت‌ها
              </Button>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout
      activeTab="tickets"
      onTabChange={handleTabSwitch}
      user={user}
      isOwnProfile={true}
      userStats={userStats}
    >
      <div>
        {/* Professional Ticket Detail Header */}
        <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
          <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-indigo-600 via-purple-600 via-pink-600 to-rose-600 shadow-2xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">{ticket.subject}</h1>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                  <p className="text-blue-100 text-sm sm:text-base lg:text-lg font-medium text-right">
                    شماره تیکت: {ticket.ticketNumber} • تاریخ: {new Date(ticket.createdAt).toLocaleDateString('fa-IR')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = '/profile?tab=tickets';
                  }}
                  className="bg-white text-indigo-600 hover:bg-indigo-50"
                >
                  <ArrowRight className="h-4 w-4 ml-1" />
                  بازگشت
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-6 lg:space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>توضیحات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{ticket.description}</p>

                {/* Ticket Attachments */}
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">فایل‌های ضمیمه تیکت</h3>
                    <div className="space-y-1">
                      {ticket.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Paperclip className="h-4 w-4" />
                          {attachment.fileName}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">پیام‌ها</h3>
                  <div className="space-y-4">
                    {ticket.messages && ticket.messages.length > 0 ? (
                      ticket.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-lg ${
                            message.isFromSupport
                              ? 'bg-blue-50 border-r-4 border-blue-500'
                              : 'bg-gray-50 border-r-4 border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {message.isFromSupport ? 'پشتیبانی' : 'شما'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.createdAt).toLocaleString('fa-IR')}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment) => (
                                <a
                                  key={attachment.id}
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Paperclip className="h-4 w-4" />
                                  {attachment.fileName}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">هنوز پیامی وجود ندارد</p>
                    )}
                  </div>
                </div>

                {/* Add Message */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">ارسال پیام جدید</h3>
                  <div className="space-y-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="پیام خود را وارد کنید"
                    />
                    <div>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                      {attachments.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          {attachments.map((file, index) => (
                            <div key={index}>{file.name}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleAddMessage(ticket.id)}
                      disabled={addMessageMutation.isPending || (!newMessage.trim() && attachments.length === 0)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {addMessageMutation.isPending ? 'در حال ارسال...' : 'ارسال پیام'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default function TicketDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <TvtoBookSpinner />
      </div>
    }>
      <TicketDetailContent />
    </Suspense>
  );
}

