'use client';

import React, { useState } from 'react';
import { Grid3X3, List, Eye, Download, FileText, Headphones, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { digitalLibraryApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToastHelpers } from '@/hooks/useToastHelpers';

interface LibraryItem {
  id: string;
  productId: string;
  productTitle?: string;
  formatType?: string;
  fileType?: string;
  fileUrl?: string;
  purchasedAt: string;
  downloadCount: number;
  maxDownloads: number;
}

const LibraryPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [libraryPage, setLibraryPage] = useState(1);
  const [libraryPageSize, setLibraryPageSize] = useState(12);
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToastHelpers();

  const { data: libraryResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['digital-library', user?.id],
    queryFn: async () => {
      const response = await digitalLibraryApi.getMyLibrary();
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
  });

  const libraryItems: LibraryItem[] = libraryResponse?.data || [];


  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ebook':
        return <FileText className="h-4 w-4" />;
      case 'audiobook':
        return <Headphones className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleDownload = async (item: LibraryItem) => {
    try {
      // Generate access token
      const tokenResponse = await digitalLibraryApi.generateToken(item.id);
      if (!tokenResponse.data.isSucceeded || !tokenResponse.data.data?.token) {
        toast.errorPersian(tokenResponse.data.message || 'خطا در تولید توکن دسترسی');
        return;
      }

      const token = tokenResponse.data.data.token;

      // Get file URL
      const fileResponse = await digitalLibraryApi.getFile(item.id, token);
      if (!fileResponse.data.isSucceeded || !fileResponse.data.data?.fileUrl) {
        toast.errorPersian(fileResponse.data.message || 'خطا در دریافت فایل');
        return;
      }

      const fileUrl = fileResponse.data.data.fileUrl;

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `${item.productTitle || 'file'}.${item.fileType || 'pdf'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.successPersian('در حال دانلود...');
    } catch (error: any) {
      toast.errorPersian(error.response?.data?.message || 'خطا در دانلود فایل');
    }
  };

  const handleRead = (item: LibraryItem) => {
    router.push(`/profile/library/detail?id=${item.id}`);
  };

  const getTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'ebook':
        return 'bg-blue-100 text-blue-800';
      case 'audiobook':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const startIndex = (libraryPage - 1) * libraryPageSize;
  const endIndex = startIndex + libraryPageSize;
  const currentLibrary = libraryItems.slice(startIndex, endIndex);
  const totalPages = Math.ceil(libraryItems.length / libraryPageSize);

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
        <p className="text-red-500">خطا در بارگذاری کتابخانه</p>
        <Button onClick={() => refetch()} className="mt-4">
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Professional Library Header */}
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-emerald-600 via-teal-600 via-cyan-600 to-blue-600 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 lg:space-x-4 mb-3 lg:mb-4 rtl:space-x-reverse">
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/80 rounded-full animate-bounce animation-delay-200"></div>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/60 rounded-full animate-bounce animation-delay-400"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">کتابخانه من</h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">📚 مدیریت کتاب‌ها و منابع دیجیتال دانلود شده 📖</p>
          </div>
        </div>
        
        <div className="space-y-6 lg:space-y-8">
          {/* Library Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2"
              >
                <Grid3X3 className="h-4 w-4" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, libraryItems.length)} of {libraryItems.length} items
            </div>
          </div>

          {/* Library Content */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {currentLibrary.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">کتابخانه شما خالی است</p>
                  <p className="text-sm text-gray-400 mt-2">پس از خرید محصولات دیجیتال، آن‌ها در اینجا نمایش داده می‌شوند</p>
                </div>
              ) : (
                currentLibrary.map((item) => (
                  <Card key={item.id} className="group hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="relative mb-4">
                        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-16 w-16 text-gray-400" />
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge className={`${getTypeColor(item.formatType)} text-xs`}>
                            {getTypeIcon(item.formatType || 'ebook')}
                            <span className="ml-1">{item.formatType || 'EBook'}</span>
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {item.productTitle || 'بدون عنوان'}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{item.fileType || 'N/A'}</span>
                          <span>{new Date(item.purchasedAt).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          دانلود: {item.downloadCount} / {item.maxDownloads}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleRead(item)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          مطالعه
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleDownload(item)}
                          disabled={item.downloadCount >= item.maxDownloads}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          دانلود
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {currentLibrary.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">کتابخانه شما خالی است</p>
                  <p className="text-sm text-gray-400 mt-2">پس از خرید محصولات دیجیتال، آن‌ها در اینجا نمایش داده می‌شوند</p>
                </div>
              ) : (
                currentLibrary.map((item) => (
                  <Card key={item.id} className="group hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-28 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {item.productTitle || 'بدون عنوان'}
                              </h3>
                              <p className="text-sm text-gray-600">{item.fileType || 'N/A'}</p>
                            </div>
                            <Badge className={`${getTypeColor(item.formatType)} text-xs`}>
                              {getTypeIcon(item.formatType || 'ebook')}
                              <span className="ml-1">{item.formatType || 'EBook'}</span>
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span>نوع فایل: {item.fileType || 'N/A'}</span>
                            <span>خریداری شده: {new Date(item.purchasedAt).toLocaleDateString('fa-IR')}</span>
                            <span>دانلود: {item.downloadCount} / {item.maxDownloads}</span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRead(item)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                مطالعه
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDownload(item)}
                                disabled={item.downloadCount >= item.maxDownloads}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                دانلود
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={libraryPage}
                totalPages={totalPages}
                onPageChange={setLibraryPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryPage;

