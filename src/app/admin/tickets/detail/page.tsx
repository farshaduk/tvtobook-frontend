'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, MessageSquare, Loader2, Paperclip, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi, TicketDto, fileApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { useToastHelpers } from '@/hooks/useToastHelpers';

function AdminTicketDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketId = searchParams.get('id') as string;
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const { isAuthenticated } = useAuth();
  const toast = useToastHelpers();
  const queryClient = useQueryClient();

  const { data: ticketResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-ticket', ticketId],
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
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      setNewMessage('');
      setAttachments([]);
      toast.success('پیام افزوده شد');
    },
    onError: (error: any) => {
      toast.error(error.message || 'خطا در افزودن پیام');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: { ticketId: string; status: string }) => {
      const response = await ticketApi.updateStatus(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      toast.success('وضعیت بروزرسانی شد');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در بروزرسانی وضعیت');
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

  const handleUpdateStatus = (status: string) => {
    updateStatusMutation.mutate({ ticketId: ticket?.id || '', status });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" text="در حال بارگذاری تیکت..." />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">جزئیات تیکت</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">تیکت یافت نشد</p>
          <Button onClick={() => router.push('/admin/tickets')}>
            بازگشت به لیست تیکت‌ها
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">جزئیات تیکت</h1>
          <Button variant="outline" onClick={() => {
            window.location.href = '/admin/tickets';
          }}>
            <ArrowRight className="h-4 w-4 ml-1" />
            بازگشت به لیست
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">{ticket.subject}</h2>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                </div>
                <div className="text-sm text-gray-600">
                  <p>شماره تیکت: {ticket.ticketNumber}</p>
                  <p>تاریخ ایجاد: {new Date(ticket.createdAt).toLocaleString('fa-IR')}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-2">توضیحات</h3>
              <p className="text-sm text-gray-600">{ticket.description}</p>
            </div>

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

            {/* Admin Actions */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">عملیات</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleUpdateStatus('Resolved')}
                  disabled={updateStatusMutation.isPending || ticket.status === 'Resolved'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  حل شده
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('Closed')}
                  disabled={updateStatusMutation.isPending || ticket.status === 'Closed'}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  بستن
                </Button>
              </div>
            </div>

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
                          {message.isFromSupport ? 'پشتیبانی' : 'کاربر'}
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
          </div>
        </div>
      </div>
  );
}

export default function AdminTicketDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" text="در حال بارگذاری تیکت..." />
      </div>
    }>
      <AdminTicketDetailContent />
    </Suspense>
  );
}

