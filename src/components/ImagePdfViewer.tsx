'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { digitalLibraryApi } from '@/services/api';

interface ImagePdfViewerProps {
  libraryId: string;
  token: string;
  onPageChange?: (page: number, totalPages: number) => void;
  isLoading?: boolean;
  goToPage?: number | null;
}

export function ImagePdfViewer({
  libraryId,
  token,
  onPageChange,
  isLoading = false,
  goToPage = null,
}: ImagePdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Mark component as mounted (client-side only for static export)
  useEffect(() => {
    console.log('ImagePdfViewer: Component mounting...');
    setIsMounted(true);
    console.log('ImagePdfViewer: Component mounted, isMounted set to true');
  }, []);

  // Load page image
  useEffect(() => {
    console.log('ImagePdfViewer: Load page effect triggered', { isMounted, libraryId, token, currentPage });
    
    if (!isMounted) {
      console.log('ImagePdfViewer: Skipping - not mounted yet');
      return;
    }

    const loadPageImage = async () => {
      try {
        setError(null);
        setIsLoadingPage(true);
        
        console.log('ImagePdfViewer: Loading page image for page', currentPage);
        
        // Construct API endpoint URL
        const apiBaseUrl = typeof window !== 'undefined' 
          ? (window.location.hostname === 'localhost' ? 'http://localhost:7262/api' : 'http://dev.tvtobook.com/api')
          : 'http://dev.tvtobook.com/api';
        
        const pageImageUrl = `${apiBaseUrl}/digitallibrary/${libraryId}/page/${currentPage}?token=${encodeURIComponent(token)}`;
        
        console.log('ImagePdfViewer: Fetching from:', pageImageUrl);
        
        const response = await fetch(pageImageUrl, {
          method: 'GET',
          credentials: 'include',
        });

        console.log('ImagePdfViewer: Response received - Status:', response.status, response.statusText);

        if (!response.ok) {
          let errorMessage = `Failed to load page image: ${response.status} ${response.statusText}`;
          try {
            const errorText = await response.text();
            console.log('ImagePdfViewer: Error response body:', errorText);
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.message) {
                errorMessage = errorJson.message;
              }
            } catch {
              if (errorText.length < 200) {
                errorMessage = errorText;
              }
            }
          } catch (e) {
            console.log('ImagePdfViewer: Could not read error response');
          }
          throw new Error(errorMessage);
        }

        // Get metadata from headers
        const totalPagesHeader = response.headers.get('X-Total-Pages');
        const currentPageHeader = response.headers.get('X-Current-Page');
        
        if (totalPagesHeader) {
          const total = parseInt(totalPagesHeader);
          setTotalPages(total);
          console.log('ImagePdfViewer: Total pages from header:', total);
        }
        
        console.log('ImagePdfViewer: Converting response to blob...');
        const blob = await response.blob();
        console.log('ImagePdfViewer: Image blob size:', blob.size, 'bytes');
        
        // Create object URL for the image
        const objectUrl = URL.createObjectURL(blob);
        
        // Revoke old URL to prevent memory leak
        if (imageUrl) {
          URL.revokeObjectURL(imageUrl);
        }
        
        setImageUrl(objectUrl);
        
        console.log('ImagePdfViewer: Page image loaded successfully!');
        
        // Log page view for reading progress tracking
        try {
          await digitalLibraryApi.logPageView(libraryId, {
            token: token,
            pageNumber: currentPage
          });
          console.log('ImagePdfViewer: Page view logged successfully');
        } catch (logError) {
          // Don't fail the page load if logging fails
          console.warn('ImagePdfViewer: Failed to log page view:', logError);
        }
        
        // Call onPageChange callback
        if (totalPagesHeader) {
          onPageChange?.(currentPage, parseInt(totalPagesHeader));
        }
      } catch (err) {
        console.error('ImagePdfViewer: Page loading error:', err);
        console.error('ImagePdfViewer: Error details:', {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
        setError(err instanceof Error ? err.message : 'Failed to load page image');
      } finally {
        setIsLoadingPage(false);
      }
    };

    if (libraryId && token && currentPage > 0) {
      console.log('ImagePdfViewer: Conditions met, calling loadPageImage()');
      loadPageImage();
    } else {
      console.log('ImagePdfViewer: Conditions NOT met', { 
        hasLibraryId: !!libraryId, 
        hasToken: !!token,
        currentPage 
      });
    }

    // Cleanup object URL on unmount or page change
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [libraryId, token, currentPage, isMounted]);

  // Handle navigation to specific page (for bookmark navigation)
  useEffect(() => {
    if (goToPage !== null && goToPage > 0 && goToPage <= totalPages) {
      console.log('ImagePdfViewer: Navigating to page', goToPage);
      setCurrentPage(goToPage);
    }
  }, [goToPage, totalPages]);

  // DRM Protection: Disable selection, copy, context menu
  useEffect(() => {
    if (!isMounted) return;

    const image = imageRef.current;
    if (!image) return;

    // Prevent right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Prevent drag
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent copy
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    image.addEventListener('contextmenu', handleContextMenu);
    image.addEventListener('selectstart', handleSelectStart);
    image.addEventListener('dragstart', handleDragStart);
    image.addEventListener('copy', handleCopy);
    document.addEventListener('copy', handleCopy, true);

    return () => {
      image.removeEventListener('contextmenu', handleContextMenu);
      image.removeEventListener('selectstart', handleSelectStart);
      image.removeEventListener('dragstart', handleDragStart);
      image.removeEventListener('copy', handleCopy);
      document.removeEventListener('copy', handleCopy, true);
    };
  }, [isMounted, imageUrl]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Only render on client to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">خطا در بارگذاری صفحه</h3>
          <p className="text-gray-600">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoadingPage || isLoading}
            className="text-white hover:bg-gray-700"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={handlePageInput}
              disabled={isLoadingPage || isLoading}
              className="w-12 px-2 py-1 bg-gray-700 text-white text-center rounded border border-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <span className="text-sm">/ {totalPages || '...'}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || isLoadingPage || isLoading || totalPages === 0}
            className="text-white hover:bg-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={isLoadingPage || isLoading}
            className="text-white hover:bg-gray-700"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={isLoadingPage || isLoading}
            className="text-white hover:bg-gray-700"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-8 relative"
      >
        {(isLoadingPage || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 z-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">در حال بارگذاری صفحه {currentPage}...</p>
            </div>
          </div>
        )}
        {imageUrl && (
          <div className="relative inline-block bg-white shadow-2xl">
            <img
              ref={imageRef}
              src={imageUrl}
              alt={`Page ${currentPage}`}
              className="block"
              style={{
                maxWidth: '100%',
                height: 'auto',
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                pointerEvents: 'none',
              }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
