'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RestrictedPdfViewerProps {
  fileUrl: string;
  token: string;
  userEmail: string;
  onPageChange?: (page: number, totalPages: number) => void;
  isLoading?: boolean;
  goToPage?: number | null;
}

export function RestrictedPdfViewer({
  fileUrl,
  token,
  userEmail,
  onPageChange,
  isLoading = false,
  goToPage = null,
}: RestrictedPdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Stable render quality
  const QUALITY_SCALE = 3.0;

  /** -----------------------
   * MOUNT CHECK (fix hydration)
   * ----------------------- */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /** -----------------------
   * Load PDF.js library
   * ----------------------- */
  const loadPdfJs = async () => {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => resolve((window as any).pdfjsLib);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  /** -----------------------
   * Load PDF document
   * ----------------------- */
  useEffect(() => {
    if (!isMounted || !fileUrl || !token) return;

    const loadPdf = async () => {
      try {
        setError(null);

        const pdfjsLib = await loadPdfJs();
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`PDF load failed: ${response.status}`);

        const buffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (e: any) {
        setError(e.message);
      }
    };

    loadPdf();
  }, [fileUrl, token, isMounted]);

  /** -----------------------
   * Render page on canvas
   * ----------------------- */
  const renderPage = async (pageNum: number) => {
    try {
      if (!pdfDocRef.current || !canvasRef.current) return;

      setIsRendering(true);

      const pdf = pdfDocRef.current;
      const page = await pdf.getPage(pageNum);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pixelRatio = window.devicePixelRatio || 1;
      
      // Get base viewport at zoom level
      const baseViewport = page.getViewport({ scale: zoom });
      
      // Calculate high-quality rendering scale
      const renderScale = zoom * QUALITY_SCALE * pixelRatio;
      const renderViewport = page.getViewport({ scale: renderScale });

      // Set canvas to high resolution
      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;

      // CSS display size matches the zoom level (what user expects to see)
      canvas.style.width = `${baseViewport.width}px`;
      canvas.style.height = `${baseViewport.height}px`;

      // Smooth edges
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      await page.render({
        canvasContext: ctx,
        viewport: renderViewport,
      }).promise;

      /** WATERMARK */
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = 'rgba(255,0,0,0.3)';
      ctx.font = `${renderViewport.width / 20}px Arial`;
      ctx.textAlign = 'center';
      ctx.translate(renderViewport.width / 2, renderViewport.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(userEmail, 0, 0);
      ctx.restore();

      onPageChange?.(pageNum, totalPages);
    } finally {
      setIsRendering(false);
    }
  };

  /** Render page on zoom or navigation */
  useEffect(() => {
    if (pdfDocRef.current && totalPages > 0 && isMounted) {
      renderPage(currentPage);
    }
  }, [currentPage, zoom, totalPages, isMounted]);

  /** Navigate to bookmark page */
  useEffect(() => {
    if (goToPage && goToPage >= 1 && goToPage <= totalPages) {
      setCurrentPage(goToPage);
    }
  }, [goToPage, totalPages]);

  /** DRM Protection */
  useEffect(() => {
    if (!isMounted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const block = (e: any) => e.preventDefault();

    canvas.addEventListener("contextmenu", block);
    canvas.addEventListener("copy", block);
    canvas.addEventListener("dragstart", block);
    canvas.addEventListener("mousedown", block);

    document.addEventListener("keydown", (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["s", "p", "c", "u"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    });

    return () => {
      canvas.removeEventListener("contextmenu", block);
      canvas.removeEventListener("copy", block);
      canvas.removeEventListener("dragstart", block);
      canvas.removeEventListener("mousedown", block);
    };
  }, [isMounted]);

  /** -----------------------
   * UI SECTION
   * ----------------------- */

  if (!isMounted)
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-gray-100">

      {/* Toolbar */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between sticky top-0">

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage <= 1 || isRendering}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft />
          </Button>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="w-12 text-center bg-gray-700 text-white border border-gray-600 rounded"
            />
            <span>/ {totalPages}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage >= totalPages || isRendering}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}>
            <ZoomOut />
          </Button>
          <span>{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.min(4, z + 0.2))}>
            <ZoomIn />
          </Button>
        </div>

      </div>

      {/* Canvas Viewer */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gray-200">
        <canvas
          ref={canvasRef}
          style={{
            background: "white",
            boxShadow: "0 0 20px rgba(0,0,0,0.2)",
            userSelect: "none",
          }}
        />
      </div>

    </div>
  );
}