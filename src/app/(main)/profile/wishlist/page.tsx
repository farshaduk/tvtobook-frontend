'use client';

import React, { useState } from 'react';
import { Plus, Heart, ShoppingBag, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { useConfirmation } from '@/hooks/useConfirmationMo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi, WishlistDto } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { useRouter } from 'next/navigation';
import { toPersianNumber, toPersianCurrency } from '@/utils/numberUtils';

const WishlistPage: React.FC = () => {
  const [wishlistPage, setWishlistPage] = useState(1);
  const [wishlistPageSize, setWishlistPageSize] = useState(12);
  const { showConfirmation, showSuccess } = useConfirmation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const toast = useToastHelpers();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: wishlistResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['wishlist', user?.id, wishlistPage, wishlistPageSize],
    queryFn: async () => {
      const response = await wishlistApi.getWishlist(wishlistPage, wishlistPageSize);
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
    retry: 1,
  });

  // Handle response structure - data can be array or object with items
  const wishlistData = wishlistResponse?.data;
  const wishlist: WishlistDto[] = Array.isArray(wishlistData) 
    ? wishlistData 
    : (wishlistData?.items || []);
  const totalCount = Array.isArray(wishlistData) 
    ? wishlistData.length 
    : (wishlistData?.totalCount || 0);
  const totalPages = Array.isArray(wishlistData)
    ? Math.ceil(wishlistData.length / wishlistPageSize)
    : (wishlistData?.totalPages || 0);

  const removeItemMutation = useMutation({
    mutationFn: (id: string) => wishlistApi.removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.successPersian('کتاب از لیست علاقه‌مندی‌ها حذف شد');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در حذف از لیست علاقه‌مندی‌ها');
    },
  });

  const handleRemoveFromWishlist = (itemId: string) => {
    showConfirmation({
      title: 'حذف از لیست علاقه‌مندی‌ها',
      message: 'آیا مطمئن هستید که می‌خواهید این کتاب را از لیست علاقه‌مندی‌ها حذف کنید؟',
      confirmText: 'حذف',
      cancelText: 'لغو',
      type: 'warning',
      onConfirm: () => {
        removeItemMutation.mutate(itemId);
      }
    });
  };

  const handleAddToCart = (item: WishlistDto) => {
    router.push(`/product?id=${item.productId}`);
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
        <p className="text-red-500 mb-4">خطا در بارگذاری لیست علاقه‌مندی‌ها</p>
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

  const currentWishlist = wishlist;

  return (
    <div>
      {/* Professional Wishlist Header */}
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-pink-600 via-rose-600 via-red-600 to-orange-600 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 lg:space-x-4 mb-3 lg:mb-4 rtl:space-x-reverse">
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/80 rounded-full animate-bounce animation-delay-200"></div>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/60 rounded-full animate-bounce animation-delay-400"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">لیست خرید</h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">🛒 مدیریت محصولات ذخیره شده برای خرید بعدی 💝</p>
          </div>
        </div>
        
        <div className="space-y-6 lg:space-y-8">
          {/* Wishlist Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl border border-pink-200">
              <div className="text-2xl font-bold text-pink-600">{toPersianNumber(totalCount)}</div>
              <div className="text-sm text-pink-600/80 font-medium">کل آیتم‌ها</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-100 rounded-xl border border-red-200">
              <div className="text-2xl font-bold text-red-600">{toPersianCurrency(wishlist.reduce((sum, item) => sum + (item.productPrice || 0), 0))}</div>
              <div className="text-sm text-red-600/80 font-medium">مبلغ صفحه فعلی</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-yellow-100 rounded-xl border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{toPersianNumber(wishlistPage)}</div>
              <div className="text-sm text-orange-600/80 font-medium">صفحه فعلی از {toPersianNumber(totalPages)}</div>
            </div>
          </div>

          {/* Wishlist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {currentWishlist.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4">
                  <div className="relative mb-4">
                    <img
                      src={item.productImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7Yp9mE2YXYp9ivINin2YTYqtmE2KfYsdipINmF2K/Yp9iv2Yc8L3RleHQ+PC9zdmc+'}
                      alt={item.productTitle}
                      className="w-full h-48 object-cover rounded-lg bg-gray-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('data:image')) {
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7Yp9mE2YXYp9ivINin2YTYqtmE2KfYsdipINmF2K/Yp9iv2Yc8L3RleHQ+PC9zdmc+';
                        }
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveFromWishlist(item.id)}
                        disabled={removeItemMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {item.productPrice && (
                      <div className="absolute bottom-2 left-2">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-gray-700">
                          {toPersianCurrency(item.productPrice)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2">
                      {item.productTitle}
                    </h3>
                    {item.productAuthor && (
                      <p className="text-sm text-gray-600">{item.productAuthor}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      اضافه شده: {new Date(item.addedAt).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingBag className="h-4 w-4 mr-1" />
                      افزودن به سبد
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleViewProduct(item.productId)}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      مشاهده
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {!isLoading && wishlist.length === 0 && (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
                <Heart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">لیست خرید خالی است</h3>
              <p className="text-gray-600 mb-4">هنوز محصولی به لیست خریدتان اضافه نکرده‌اید.</p>
              <Button onClick={() => router.push('/shop')}>
                <Plus className="h-4 w-4 mr-2" />
                شروع خرید
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={wishlistPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setWishlistPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;

