'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ticketApi } from '@/services/api';
import { toast } from 'react-hot-toast';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { 
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface TicketDto {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  userId: string;
  messages: Array<{
    id: string;
    message: string;
    isFromSupport: boolean;
    createdAt: string;
  }>;
}

const AdminTicketsPage: React.FC = () => {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pagination, setPagination] = useState<{
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  } | null>(null);

  useEffect(() => {
    // Only fetch data in browser, not during static export build
    if (typeof window === 'undefined') return;
    
    fetchTickets();
  }, [statusFilter, pageNumber, pageSize]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketApi.getAll(statusFilter !== 'all' ? statusFilter : undefined, pageNumber, pageSize);
      if (response.data.isSucceeded && response.data.data) {
        setTickets(response.data.data.tickets);
        setPagination({
          totalCount: response.data.data.totalCount,
          pageNumber: response.data.data.pageNumber,
          pageSize: response.data.data.pageSize,
          totalPages: response.data.data.totalPages,
          hasPreviousPage: response.data.data.hasPreviousPage,
          hasNextPage: response.data.data.hasNextPage
        });
      } else {
        setTickets([]);
        setPagination(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطا در بارگذاری تیکت‌ها');
      setTickets([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status: string) => {
    const config: { [key: string]: { color: string; icon: any } } = {
      'Open': { color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
      'InProgress': { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      'Resolved': { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      'Closed': { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon }
    };
    const { color, icon: Icon } = config[status] || { color: 'bg-gray-100 text-gray-800', icon: ClockIcon };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" text="در حال بارگذاری تیکت‌ها..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">مدیریت تیکت‌های پشتیبانی</h1>

      <div className="bg-white rounded-lg shadow p-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPageNumber(1);
          }}
          className="w-full md:w-auto px-4 py-2 border rounded-lg"
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="Open">باز</option>
          <option value="InProgress">در حال بررسی</option>
          <option value="Resolved">حل شده</option>
          <option value="Closed">بسته شده</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">شماره تیکت</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">موضوع</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اولویت</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وضعیت</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاریخ</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{ticket.ticketNumber}</td>
                <td className="px-6 py-4 text-sm">{ticket.subject}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.priority}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(ticket.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(ticket.createdAt).toLocaleDateString('fa-IR')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => router.push(`/admin/tickets/detail?id=${ticket.id}`)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
  );
};

export default AdminTicketsPage;

