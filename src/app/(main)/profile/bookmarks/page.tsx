'use client';

import React, { useState } from 'react';
import { Bookmark, Loader2, RefreshCw, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarkApi, BookmarkDto, CreateBookmarkRequest } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { toPersianNumber } from '@/utils/numberUtils';

const BookmarksPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkDto | null>(null);
  const { user } = useAuth();
  const toast = useToastHelpers();
  const queryClient = useQueryClient();

  const { data: bookmarksResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['my-bookmarks', user?.id],
    queryFn: async () => {
      const response = await bookmarkApi.getMyBookmarks();
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
  });

  const bookmarks: BookmarkDto[] = bookmarksResponse?.data || [];

  const deleteBookmarkMutation = useMutation({
    mutationFn: (id: string) => bookmarkApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookmarks'] });
      toast.successPersian('نشانک با موفقیت حذف شد');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در حذف نشانک');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('آیا از حذف این نشانک اطمینان دارید؟')) {
      deleteBookmarkMutation.mutate(id);
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
        <p className="text-red-500">خطا در بارگذاری نشانک‌ها</p>
        <Button onClick={() => refetch()} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-1" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-yellow-600 via-amber-600 via-orange-600 to-red-600 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl text-right">نشانک‌های من</h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">🔖 مدیریت نشانک‌های مطالعه 📑</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Bookmark className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">شما هنوز نشانکی ثبت نکرده‌اید</p>
              <p className="text-sm text-gray-400 mt-2">نشانک‌های شما در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks.map((bookmark) => (
                <Card key={bookmark.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{bookmark.title}</h3>
                        {bookmark.productTitle && (
                          <p className="text-sm text-[#81858b] mb-2">کتاب: {bookmark.productTitle}</p>
                        )}
                        {bookmark.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{bookmark.description}</p>
                        )}
                      </div>
                      {bookmark.color && (
                        <div
                          className="w-4 h-4 rounded-full ml-2"
                          style={{ backgroundColor: bookmark.color }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                      <span>صفحه: {toPersianNumber(bookmark.pageNumber)}</span>
                      {bookmark.chapter && <span>• فصل: {bookmark.chapter}</span>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingBookmark(bookmark)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        ویرایش
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(bookmark.id)}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarksPage;

