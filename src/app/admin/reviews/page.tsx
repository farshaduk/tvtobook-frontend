'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productReviewApi, ProductReviewDto, ProductReviewListDto } from '@/services/api';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { Pagination } from '@/components/ui/pagination';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { toPersianNumber } from '@/utils/numberUtils';

const AdminReviewsPage: React.FC = () => {
  const [selectedReview, setSelectedReview] = useState<ProductReviewDto | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPageSize, setReviewsPageSize] = useState(10);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const toast = useToastHelpers();
  const queryClient = useQueryClient();

  const { data: reviewsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-reviews', statusFilter, reviewsPage, reviewsPageSize],
    queryFn: async () => {
      const isApproved = statusFilter === 'approved' ? true : statusFilter === 'pending' ? false : undefined;
      const response = await productReviewApi.getAllReviews(reviewsPage, reviewsPageSize, isApproved);
      return response.data;
    },
  });

  const approveReviewMutation = useMutation({
    mutationFn: (reviewId: string) => productReviewApi.approveReview(reviewId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setShowReviewModal(false);
      setReviewsPage(1);
      toast.successPersian(response.data.message || 'نظر با موفقیت تأیید شد');
      setActionLoading(null);
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در تأیید نظر');
      setActionLoading(null);
    },
  });

  const rejectReviewMutation = useMutation({
    mutationFn: (reviewId: string) => productReviewApi.rejectReview(reviewId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setShowReviewModal(false);
      setReviewsPage(1);
      toast.successPersian(response.data.message || 'نظر با موفقیت رد شد');
      setActionLoading(null);
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در رد نظر');
      setActionLoading(null);
    },
  });

  const reviewsData: ProductReviewListDto | undefined = reviewsResponse?.data;
  const reviews: ProductReviewDto[] = reviewsData?.items || [];
  const totalCount = reviewsData?.totalCount || 0;
  const totalPages = reviewsData?.totalPages || 0;

  const handleApproveReview = (reviewId: string) => {
    setActionLoading(reviewId);
    approveReviewMutation.mutate(reviewId);
  };

  const handleRejectReview = (reviewId: string) => {
    setActionLoading(reviewId);
    rejectReviewMutation.mutate(reviewId);
  };

  const getStatusBadge = (isApproved: boolean) => {
    if (isApproved) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3" />
          تأیید شده
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3" />
          در انتظار تأیید
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">خطا در بارگذاری نظرات</p>
        <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت نظرات</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium">فیلتر وضعیت:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setReviewsPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">همه نظرات</option>
            <option value="approved">تأیید شده</option>
            <option value="pending">در انتظار تأیید</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">محصول</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">کاربر</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">امتیاز</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عنوان</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {totalCount === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    هیچ نظری یافت نشد
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {review.productImage && (
                          <img
                            src={review.productImage}
                            alt={review.productTitle}
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {review.productTitle || 'بدون عنوان'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {review.userName || `${review.userFirstName} ${review.userLastName}`.trim()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 mr-1">{review.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {review.title || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(review.isApproved)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          setShowReviewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="mt-6 px-6 pb-4">
            <Pagination
              currentPage={reviewsPage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={reviewsPageSize}
              onPageChange={(page) => setReviewsPage(page)}
              onPageSizeChange={(size) => {
                setReviewsPageSize(size);
                setReviewsPage(1);
              }}
              showPageSize={true}
              showInfo={true}
            />
          </div>
        )}
      </div>

      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">جزئیات نظر</h2>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedReview(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">محصول</p>
                  <div className="flex items-center gap-3">
                    {selectedReview.productImage && (
                      <img
                        src={selectedReview.productImage}
                        alt={selectedReview.productTitle}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                    <p className="font-semibold text-gray-900">{selectedReview.productTitle || 'بدون عنوان'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">کاربر</p>
                  <p className="font-semibold text-gray-900">
                    {selectedReview.userName || `${selectedReview.userFirstName} ${selectedReview.userLastName}`.trim()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">امتیاز</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < selectedReview.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 mr-1">{selectedReview.rating}/5</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">وضعیت</p>
                  <div>{getStatusBadge(selectedReview.isApproved)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">تاریخ ثبت</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedReview.createdAt).toLocaleDateString('fa-IR')}
                  </p>
                </div>
                {selectedReview.updatedAt && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">تاریخ بروزرسانی</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedReview.updatedAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                )}
                {selectedReview.isVerifiedPurchase && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">خرید تأیید شده</p>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <CheckCircleIcon className="h-3 w-3" />
                      بله
                    </span>
                  </div>
                )}
              </div>
              
              {selectedReview.title && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">عنوان</p>
                  <p className="p-3 bg-gray-50 rounded-lg text-gray-900 font-semibold">{selectedReview.title}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600 mb-1">متن نظر</p>
                <p className="p-3 bg-gray-50 rounded-lg text-gray-900 whitespace-pre-wrap">{selectedReview.comment}</p>
              </div>

              {(selectedReview.helpfulCount > 0 || selectedReview.notHelpfulCount > 0) && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">واکنش کاربران</p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-green-600">مفید: {toPersianNumber(selectedReview.helpfulCount)}</span>
                    <span className="text-sm text-red-600">غیرمفید: {toPersianNumber(selectedReview.notHelpfulCount)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              {!selectedReview.isApproved ? (
                <button
                  onClick={() => handleApproveReview(selectedReview.id)}
                  disabled={actionLoading === selectedReview.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  {actionLoading === selectedReview.id ? 'در حال تأیید...' : 'تأیید نظر'}
                </button>
              ) : (
                <button
                  onClick={() => handleRejectReview(selectedReview.id)}
                  disabled={actionLoading === selectedReview.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <XCircleIcon className="h-5 w-5" />
                  {actionLoading === selectedReview.id ? 'در حال رد...' : 'رد نظر'}
                </button>
              )}
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedReview(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;

