'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, BookOpen, Headphones, FileText, Loader2, Bookmark, BookmarkPlus, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { digitalLibraryApi, bookmarkApi, readingProgressApi, BookmarkDto, CreateBookmarkRequest } from '@/services/api';
import { TvtoBookSpinner } from '@/components/ui/spinner';

function DigitalReaderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToastHelpers();
  const libraryId = searchParams.get('id') as string;
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const hasFetchedRef = useRef(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [showBookmarksList, setShowBookmarksList] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [bookmarkDescription, setBookmarkDescription] = useState('');
  const [bookmarkPageNumber, setBookmarkPageNumber] = useState(1);
  const [bookmarkChapter, setBookmarkChapter] = useState('');
  const queryClient = useQueryClient();

  // Fetch library item details
  const { data: libraryResponse, isLoading: isLoadingLibrary } = useQuery({
    queryKey: ['digital-library-item', libraryId],
    queryFn: async () => {
      const response = await digitalLibraryApi.getById(libraryId);
      return response.data;
    },
    enabled: !!libraryId && !!user?.id && typeof window !== 'undefined',
  });

  const libraryItem = libraryResponse?.data;

  // Fetch reading progress to get current page
  const { data: readingProgressResponse } = useQuery({
    queryKey: ['reading-progress', libraryItem?.productId],
    queryFn: async () => {
      if (!libraryItem?.productId) return null;
      const response = await readingProgressApi.getByProduct(libraryItem.productId);
      return response.data;
    },
    enabled: !!libraryItem?.productId && !!user?.id && typeof window !== 'undefined',
  });

  const readingProgress = readingProgressResponse?.data;

  // Fetch bookmarks for this product
  const { data: bookmarksResponse } = useQuery({
    queryKey: ['bookmarks', libraryItem?.productId],
    queryFn: async () => {
      if (!libraryItem?.productId) return null;
      const response = await bookmarkApi.getMyBookmarks(libraryItem.productId);
      return response.data;
    },
    enabled: !!libraryItem?.productId && !!user?.id && typeof window !== 'undefined',
  });

  const bookmarks: BookmarkDto[] = bookmarksResponse?.data || [];

  // Create bookmark mutation
  const createBookmarkMutation = useMutation({
    mutationFn: (data: CreateBookmarkRequest) => bookmarkApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.successPersian('نشانک با موفقیت ایجاد شد');
      setShowBookmarkModal(false);
      setBookmarkTitle('');
      setBookmarkDescription('');
      setBookmarkChapter('');
      if (readingProgress?.currentPage) {
        setBookmarkPageNumber(readingProgress.currentPage);
      }
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در ایجاد نشانک');
    },
  });

  // Delete bookmark mutation
  const deleteBookmarkMutation = useMutation({
    mutationFn: (id: string) => bookmarkApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.successPersian('نشانک با موفقیت حذف شد');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در حذف نشانک');
    },
  });

  // Reset fetch flag when libraryId changes
  useEffect(() => {
    hasFetchedRef.current = false;
    setFileUrl(null);
    setAccessToken(null);
  }, [libraryId]);

  // Generate access token and get file URL
  useEffect(() => {
    // Only fetch data in browser, not during static export build
    if (typeof window === 'undefined') return;
    
    const fetchFile = async () => {
      if (!libraryId || !user?.id || !libraryItem) return;
      if (hasFetchedRef.current || isLoadingFile) return;

      hasFetchedRef.current = true;

      try {
        setIsLoadingFile(true);
        
        // Generate token
        const tokenResponse = await digitalLibraryApi.generateToken(libraryId);
        if (!tokenResponse.data.isSucceeded || !tokenResponse.data.data?.token) {
          toast.errorPersian(tokenResponse.data.message || 'خطا در تولید توکن دسترسی');
          hasFetchedRef.current = false;
          return;
        }

        const token = tokenResponse.data.data.token;
        setAccessToken(token);

        // Construct API endpoint URL for file access
        const apiBaseUrl = typeof window !== 'undefined' 
          ? (window.location.hostname === 'localhost' ? 'http://localhost:7262/api' : 'http://dev.tvtobook.com/api')
          : 'http://dev.tvtobook.com/api';
        const fileApiUrl = `${apiBaseUrl}/digitallibrary/${libraryId}/file?token=${encodeURIComponent(token)}`;
        setFileUrl(fileApiUrl);
      } catch (error: any) {
        toast.errorPersian(error.response?.data?.message || 'خطا در بارگذاری فایل');
        hasFetchedRef.current = false;
      } finally {
        setIsLoadingFile(false);
      }
    };

    if (libraryItem && !hasFetchedRef.current) {
      fetchFile();
    }
  }, [libraryId, user?.id, libraryItem]);

  const handleDownload = async () => {
    if (!libraryId || !accessToken) {
      toast.errorPersian('فایل در دسترس نیست');
      return;
    }

    try {
      // Construct download URL with download=true parameter
      const apiBaseUrl = typeof window !== 'undefined' 
        ? (window.location.hostname === 'localhost' ? 'http://localhost:7262/api' : 'http://dev.tvtobook.com/api')
        : 'http://dev.tvtobook.com/api';
      const downloadUrl = `${apiBaseUrl}/digitallibrary/${libraryId}/file?token=${encodeURIComponent(accessToken)}&download=true`;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${libraryItem?.productTitle || 'file'}.${libraryItem?.fileType || 'pdf'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.successPersian('در حال دانلود...');
    } catch (error: any) {
      toast.errorPersian('خطا در دانلود فایل');
    }
  };

  const handleCreateBookmark = () => {
    if (!libraryItem?.productId) {
      toast.errorPersian('اطلاعات محصول یافت نشد');
      return;
    }

    if (!bookmarkTitle.trim()) {
      toast.errorPersian('عنوان نشانک الزامی است');
      return;
    }

    const bookmarkData: CreateBookmarkRequest = {
      productId: libraryItem.productId,
      title: bookmarkTitle,
      description: bookmarkDescription || undefined,
      pageNumber: bookmarkPageNumber,
      chapter: bookmarkChapter || undefined,
      readingProgressId: readingProgress?.id,
    };

    createBookmarkMutation.mutate(bookmarkData);
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    if (confirm('آیا از حذف این نشانک اطمینان دارید؟')) {
      deleteBookmarkMutation.mutate(bookmarkId);
    }
  };

  const handleNavigateToBookmark = (pageNumber: number) => {
    if (!fileUrl) return;
    
    // For PDFs, use URL fragment to navigate to page
    const formatType = libraryItem?.formatType?.toLowerCase();
    const isEbookFormat = formatType === 'ebook';
    
    const iframe = document.querySelector('iframe');
    if (iframe && isEbookFormat) {
      // Try to navigate to the page in the PDF
      const newUrl = `${fileUrl}#page=${pageNumber}`;
      iframe.src = newUrl;
      setShowBookmarksList(false);
      toast.successPersian(`رفتن به صفحه ${pageNumber}`);
    } else if (isEbookFormat) {
      toast.errorPersian('امکان پرش به صفحه در حال حاضر در دسترس نیست');
    }
  };

  const handleOpenBookmarkModal = () => {
    if (readingProgress?.currentPage) {
      setBookmarkPageNumber(readingProgress.currentPage);
    }
    if (readingProgress?.currentChapter) {
      setBookmarkChapter(readingProgress.currentChapter);
    }
    setShowBookmarkModal(true);
  };

  const getTypeIcon = () => {
    const formatType = libraryItem?.formatType?.toLowerCase();
    if (formatType === 'ebook') {
      return <FileText className="h-6 w-6" />;
    } else if (formatType === 'audiobook') {
      return <Headphones className="h-6 w-6" />;
    }
    return <BookOpen className="h-6 w-6" />;
  };

  const formatType = libraryItem?.formatType?.toLowerCase();
  const isEbook = formatType === 'ebook';
  const isAudiobook = formatType === 'audiobook';

  if (isLoadingLibrary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!libraryItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">محصول یافت نشد</p>
        <Button onClick={() => router.push('/profile?tab=library')}>
          بازگشت به کتابخانه
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/profile?tab=library')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                بازگشت
              </Button>
              <div className="flex items-center gap-3">
                {getTypeIcon()}
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {libraryItem.productTitle || 'بدون عنوان'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {libraryItem.formatType} • {libraryItem.fileType}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBookmarksList(!showBookmarksList)}
                className="flex items-center gap-2"
                disabled={!fileUrl || isLoadingFile}
              >
                <Bookmark className="h-4 w-4" />
                نشانک‌ها ({bookmarks.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenBookmarkModal}
                className="flex items-center gap-2"
                disabled={!fileUrl || isLoadingFile}
              >
                <BookmarkPlus className="h-4 w-4" />
                افزودن نشانک
              </Button>
              <Button
                onClick={handleDownload}
                disabled={!fileUrl || isLoadingFile}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                دانلود
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bookmarks List Sidebar */}
      {showBookmarksList && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-20 overflow-y-auto" dir="rtl">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold">نشانک‌های من</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBookmarksList(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            {bookmarks.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-sm">شما هنوز نشانکی برای این کتاب ثبت نکرده‌اید</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setShowBookmarksList(false);
                    handleOpenBookmarkModal();
                  }}
                >
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  افزودن نشانک
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleNavigateToBookmark(bookmark.pageNumber)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{bookmark.title}</h4>
                        {bookmark.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{bookmark.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>صفحه {bookmark.pageNumber}</span>
                          {bookmark.chapter && <span>• {bookmark.chapter}</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBookmark(bookmark.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Bookmark Modal */}
      {showBookmarkModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              setShowBookmarkModal(false);
            }
          }}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              setShowBookmarkModal(false);
            }
          }}
          style={{ 
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          aria-label="بستن مودال نشانک"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">افزودن نشانک</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowBookmarkModal(false);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowBookmarkModal(false);
                }}
                className="touch-manipulation active:scale-90"
                style={{ 
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                type="button"
                aria-label="بستن"
              >
                <X className="h-4 w-4 pointer-events-none" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bookmark-title">عنوان *</Label>
                <Input
                  id="bookmark-title"
                  value={bookmarkTitle}
                  onChange={(e) => setBookmarkTitle(e.target.value)}
                  placeholder="عنوان نشانک"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bookmark-description">توضیحات</Label>
                <Textarea
                  id="bookmark-description"
                  value={bookmarkDescription}
                  onChange={(e) => setBookmarkDescription(e.target.value)}
                  placeholder="توضیحات (اختیاری)"
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="bookmark-page">شماره صفحه *</Label>
                <Input
                  id="bookmark-page"
                  type="number"
                  min="1"
                  value={bookmarkPageNumber}
                  onChange={(e) => setBookmarkPageNumber(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bookmark-chapter">فصل</Label>
                <Input
                  id="bookmark-chapter"
                  value={bookmarkChapter}
                  onChange={(e) => setBookmarkChapter(e.target.value)}
                  placeholder="فصل (اختیاری)"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateBookmark}
                  disabled={createBookmarkMutation.isPending}
                  className="flex-1"
                >
                  {createBookmarkMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      در حال ایجاد...
                    </>
                  ) : (
                    'ایجاد نشانک'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowBookmarkModal(false);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowBookmarkModal(false);
                  }}
                  className="flex-1 touch-manipulation active:scale-95"
                  style={{ 
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoadingFile ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">در حال بارگذاری فایل...</p>
            </div>
          </div>
        ) : fileUrl ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {isEbook ? (
              <div className="w-full" style={{ height: 'calc(100vh - 200px)' }}>
                <iframe
                  src={fileUrl}
                  className="w-full h-full border-0"
                  title={libraryItem.productTitle}
                />
              </div>
            ) : isAudiobook ? (
              <div className="p-8">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <Headphones className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {libraryItem.productTitle}
                    </h2>
                    <p className="text-gray-600">کتاب صوتی</p>
                  </div>
                  <audio
                    controls
                    className="w-full"
                    src={fileUrl}
                  >
                    مرورگر شما از پخش صوتی پشتیبانی نمی‌کند.
                  </audio>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-600">فرمت فایل پشتیبانی نمی‌شود</p>
                <Button
                  onClick={handleDownload}
                  className="mt-4"
                >
                  دانلود فایل
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-red-500 mb-4">خطا در بارگذاری فایل</p>
            <Button onClick={() => window.location.reload()}>
              تلاش مجدد
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DigitalReaderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <TvtoBookSpinner />
      </div>
    }>
      <DigitalReaderContent />
    </Suspense>
  );
}

