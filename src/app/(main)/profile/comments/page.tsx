'use client';

import React, { useState } from 'react';
import { MessageSquare, Star, Trash2, Loader2, RefreshCw, Edit3, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { useConfirmation } from '@/hooks/useConfirmationMo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productReviewApi, ProductReviewDto } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { useRouter } from 'next/navigation';
import { toPersianNumber } from '@/utils/numberUtils';

const CommentsPage: React.FC = () => {
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsPageSize, setCommentsPageSize] = useState(12);
  const { showConfirmation } = useConfirmation();
  const { user, isAuthenticated } = useAuth();
  const toast = useToastHelpers();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: commentsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['my-reviews', user?.id, commentsPage, commentsPageSize],
    queryFn: async () => {
      const response = await productReviewApi.getMyReviews(commentsPage, commentsPageSize);
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
    retry: 1,
  });

  const comments: ProductReviewDto[] = commentsResponse?.data?.items || [];
  const totalCount = commentsResponse?.data?.totalCount || 0;
  const totalPages = commentsResponse?.data?.totalPages || 0;
  const hasPreviousPage = commentsResponse?.data?.hasPreviousPage || false;
  const hasNextPage = commentsResponse?.data?.hasNextPage || false;

  const deleteReviewMutation = useMutation({
    mutationFn: (id: string) => productReviewApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      toast.successPersian('نظر با موفقیت حذف شد');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در حذف نظر');
    },
  });

  const handleDeleteReview = (reviewId: string) => {
    showConfirmation({
      title: 'حذف نظر',
      message: 'آیا مطمئن هستید که می‌خواهید این نظر را حذف کنید؟',
      confirmText: 'حذف',
      cancelText: 'لغو',
      type: 'warning',
      onConfirm: () => {
        deleteReviewMutation.mutate(reviewId);
      }
    });
  };

  const handleViewProduct = (productId: string) => {
    router.push(`/product?id=${productId}`);
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
        <p className="text-red-500 mb-4">خطا در بارگذاری نظرات</p>
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
      {/* Professional Comments Header */}
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-blue-600 via-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 lg:space-x-4 mb-3 lg:mb-4 rtl:space-x-reverse">
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/80 rounded-full animate-bounce animation-delay-200"></div>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/60 rounded-full animate-bounce animation-delay-400"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">نظرات من</h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">💬 مدیریت و مشاهده نظرات ثبت شده شما 📝</p>
          </div>
        </div>
        
        <div className="space-y-6 lg:space-y-8">
          {/* Comments Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{toPersianNumber(totalCount)}</div>
              <div className="text-sm text-blue-600/80 font-medium">کل نظرات</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-600">{toPersianNumber(comments.filter(c => c.isApproved).length)}</div>
              <div className="text-sm text-green-600/80 font-medium">نظرات تأیید شده</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{toPersianNumber(comments.filter(c => !c.isApproved).length)}</div>
              <div className="text-sm text-yellow-600/80 font-medium">در انتظار تأیید</div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((review) => (
              <Card key={review.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    {review.productImage && (
                      <div className="flex-shrink-0">
                        <img
                          src={review.productImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7Yp9mE2YXYp9ivINin2YTYqtmE2KfYsdipINmF2K/Yp9iv2Yc8L3RleHQ+PC9zdmc+'}
                          alt={review.productTitle}
                          className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-lg bg-gray-200 cursor-pointer"
                          onClick={() => handleViewProduct(review.productId)}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('data:image')) {
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7Yp9mE2YXYp9ivINin2YTYqtmE2KfYsdipINmF2K/Yp9iv2Yc8L3RleHQ+PC9zdmc+';
                            }
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Review Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                          <h3 
                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer mb-1"
                            onClick={() => handleViewProduct(review.productId)}
                          >
                            {review.productTitle || 'محصول بدون عنوان'}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('fa-IR')}
                            </span>
                            {review.isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3" />
                                تأیید شده
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <XCircle className="h-3 w-3" />
                                در انتظار تأیید
                              </span>
                            )}
                            {review.isVerifiedPurchase && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <CheckCircle className="h-3 w-3" />
                                خرید تأیید شده
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deleteReviewMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          حذف
                        </Button>
                      </div>
                      
                      {review.title && (
                        <h4 className="font-semibold text-base text-gray-900">{review.title}</h4>
                      )}
                      
                      <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                      
                      {(review.helpfulCount > 0 || review.notHelpfulCount > 0) && (
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>مفید: {toPersianNumber(review.helpfulCount)}</span>
                          <span>غیرمفید: {toPersianNumber(review.notHelpfulCount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={commentsPage}
                totalPages={totalPages}
                onPageChange={setCommentsPage}
              />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && comments.length === 0 && (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">هنوز نظری ثبت نکرده‌اید</h3>
              <p className="text-gray-600 mb-4">نظرات خود را در مورد محصولات خریداری شده ثبت کنید.</p>
              <Button onClick={() => router.push('/shop')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                مشاهده محصولات
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsPage;

