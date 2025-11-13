'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, RefreshCw, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi, TicketDto, CreateTicketRequest } from '@/services/api';
import { Pagination } from '@/components/ui/pagination';
import { fileApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast';
import { toPersianNumber } from '@/utils/numberUtils';
import { useToastHelpers } from '@/hooks/useToastHelpers';

const TicketsPage: React.FC = () => {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTicketAttachments, setCreateTicketAttachments] = useState<File[]>([]);
  const { user, isAuthenticated } = useAuth();
  const toast = useToastHelpers();
  const queryClient = useQueryClient();

  const { data: ticketsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['my-tickets', user?.id, statusFilter, pageNumber, pageSize],
    queryFn: async () => {
      const response = await ticketApi.getMyTickets(statusFilter || undefined, pageNumber, pageSize);
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
  });

  const tickets: TicketDto[] = ticketsResponse?.data?.tickets || [];
  const pagination = ticketsResponse?.data ? {
    totalCount: ticketsResponse.data.totalCount,
    pageNumber: ticketsResponse.data.pageNumber,
    pageSize: ticketsResponse.data.pageSize,
    totalPages: ticketsResponse.data.totalPages,
    hasPreviousPage: ticketsResponse.data.hasPreviousPage,
    hasNextPage: ticketsResponse.data.hasNextPage
  } : null;

  const createTicketMutation = useMutation({
    mutationFn: async (data: { ticketData: CreateTicketRequest; attachments?: File[] }) => {
      if (!isAuthenticated) {
        throw new Error('لطفاً ابتدا وارد حساب کاربری خود شوید');
      }
      
      const formData = new FormData();
      formData.append('subject', data.ticketData.subject);
      formData.append('description', data.ticketData.description);
      formData.append('ticketType', data.ticketData.ticketType);
      formData.append('priority', data.ticketData.priority || 'Medium');
      
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }
      
      const response = await fileApi.post('/ticket/create', formData);
      
      return response.data;
    },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
        setShowCreateModal(false);
        setCreateTicketAttachments([]);
        setPageNumber(1);
        toast.success('تیکت با موفقیت ایجاد شد');
      },
    onError: (error: any) => {
      if (error.response?.status === 401) {
        toast.error('احراز هویت ناموفق بود. لطفاً دوباره وارد شوید');
      } else {
        toast.error(error.response?.data?.message || error.message || 'خطا در ایجاد تیکت');
      }
    },
  });


  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      'Open': { label: 'باز', className: 'bg-blue-100 text-blue-800', icon: Clock },
      'InProgress': { label: 'در حال بررسی', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Resolved': { label: 'حل شده', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Closed': { label: 'بسته شده', className: 'bg-gray-100 text-gray-800', icon: XCircle },
    };
    
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; className: string }> = {
      'Low': { label: 'پایین', className: 'bg-gray-100 text-gray-800' },
      'Medium': { label: 'متوسط', className: 'bg-yellow-100 text-yellow-800' },
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

  const handleCreateTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    const formData = new FormData(form);
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;
    const ticketType = formData.get('ticketType') as string;
    const priority = formData.get('priority') as string || 'Medium';
    
    if (!subject || !description || !ticketType) {
      toast.error('لطفاً تمام فیلدهای الزامی را پر کنید');
      return;
    }
    
    const data: CreateTicketRequest = {
      subject,
      description,
      ticketType,
      priority,
    };
    
    createTicketMutation.mutate({ 
      ticketData: data, 
      attachments: createTicketAttachments.length > 0 ? createTicketAttachments : undefined 
    });
  };

  const handleCreateTicketFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCreateTicketAttachments(Array.from(e.target.files));
    }
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
        <p className="text-red-500">خطا در بارگذاری تیکت‌ها</p>
        <Button onClick={() => refetch()} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-1" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Professional Tickets Header */}
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-indigo-600 via-purple-600 via-pink-600 to-rose-600 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">تیکت‌های پشتیبانی</h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">💬 مدیریت و پیگیری درخواست‌های پشتیبانی 🎫</p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-indigo-600 hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                تیکت جدید
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 lg:space-y-8">
          {/* Filter */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === '' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('');
                setPageNumber(1);
              }}
              size="sm"
            >
              همه
            </Button>
            <Button
              variant={statusFilter === 'Open' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('Open');
                setPageNumber(1);
              }}
              size="sm"
            >
              باز
            </Button>
            <Button
              variant={statusFilter === 'InProgress' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('InProgress');
                setPageNumber(1);
              }}
              size="sm"
            >
              در حال بررسی
            </Button>
            <Button
              variant={statusFilter === 'Resolved' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('Resolved');
                setPageNumber(1);
              }}
              size="sm"
            >
              حل شده
            </Button>
            <Button
              variant={statusFilter === 'Closed' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('Closed');
                setPageNumber(1);
              }}
              size="sm"
            >
              بسته شده
            </Button>
          </div>

          {/* Tickets List */}
          {tickets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">شما هنوز تیکتی ثبت نکرده‌اید</p>
              <p className="text-sm text-gray-400 mt-2">برای ایجاد تیکت جدید، روی دکمه "تیکت جدید" کلیک کنید</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>شماره تیکت: {ticket.ticketNumber}</span>
                          <span>تاریخ: {new Date(ticket.createdAt).toLocaleDateString('fa-IR')}</span>
                          <span>پیام‌ها: {toPersianNumber(ticket.messages?.length || 0)}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/profile/tickets/detail?id=${ticket.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        مشاهده
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={pagination.pageNumber}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalCount}
                pageSize={pagination.pageSize}
                onPageChange={(page) => setPageNumber(page)}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPageNumber(1);
                }}
                showPageSize={true}
                showInfo={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              setShowCreateModal(false);
            }
          }}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              setShowCreateModal(false);
            }
          }}
          style={{ 
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          aria-label="بستن مودال تیکت"
        >
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>ایجاد تیکت جدید</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">موضوع</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="موضوع تیکت را وارد کنید"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">نوع تیکت</label>
                  <select name="ticketType" required className="w-full px-3 py-2 border rounded-lg">
                    <option value="">انتخاب کنید</option>
                    <option value="Technical">فنی</option>
                    <option value="Billing">مالی</option>
                    <option value="General">عمومی</option>
                    <option value="Refund">بازگشت وجه</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">اولویت</label>
                  <select name="priority" defaultValue="Medium" className="w-full px-3 py-2 border rounded-lg">
                    <option value="Low">پایین</option>
                    <option value="Medium">متوسط</option>
                    <option value="High">بالا</option>
                    <option value="Urgent">فوری</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">توضیحات</label>
                  <textarea
                    name="description"
                    required
                    rows={5}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="توضیحات تیکت را وارد کنید"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">فایل‌های ضمیمه</label>
                  <input
                    type="file"
                    multiple
                    onChange={handleCreateTicketFileChange}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  {createTicketAttachments.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {createTicketAttachments.map((file, index) => (
                        <div key={index}>{file.name}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCreateModal(false);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCreateModal(false);
                    }}
                    className="touch-manipulation active:scale-95"
                    style={{ 
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    انصراف
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTicketMutation.isPending}
                  >
                    {createTicketMutation.isPending ? 'در حال ایجاد...' : 'ایجاد تیکت'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
};

export default TicketsPage;

