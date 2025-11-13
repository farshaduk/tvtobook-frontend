'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userReportApi, CreateUserReportDto } from '@/services/api';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { Button } from '@/components/ui/button';
import { XCircle, AlertTriangle } from 'lucide-react';

interface ProductReportModalProps {
  productId: string;
  productTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductReportModal: React.FC<ProductReportModalProps> = ({
  productId,
  productTitle,
  isOpen,
  onClose
}) => {
  const [reportReason, setReportReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const toast = useToastHelpers();
  const queryClient = useQueryClient();

  const createReportMutation = useMutation({
    mutationFn: (data: CreateUserReportDto) => userReportApi.createReport(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['user-reports'] });
      onClose();
      setReportReason('');
      setDescription('');
      toast.successPersian(response.data.message || 'گزارش با موفقیت ثبت شد');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در ثبت گزارش');
    },
  });

  const handleSubmit = () => {
    if (!reportReason || !description) {
      toast.errorPersian('لطفاً تمام فیلدهای الزامی را پر کنید');
      return;
    }

    createReportMutation.mutate({
      reportType: 'Product',
      reportReason: reportReason,
      description: description,
      reportedProductId: productId
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
          setReportReason('');
          setDescription('');
        }
      }}
      onTouchEnd={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
          setReportReason('');
          setDescription('');
        }
      }}
      style={{ 
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      aria-label="بستن مودال گزارش"
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">ثبت گزارش محصول</h2>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                setReportReason('');
                setDescription('');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                setReportReason('');
                setDescription('');
              }}
              className="text-gray-400 hover:text-gray-600 touch-manipulation active:scale-90 select-none p-1"
              style={{ 
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none'
              }}
              type="button"
              aria-label="بستن"
            >
              <XCircle className="h-6 w-6 pointer-events-none" />
            </button>
          </div>

          {productTitle && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">محصول:</p>
              <p className="text-base font-medium text-gray-900">{productTitle}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">دلیل گزارش *</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">انتخاب کنید</option>
                <option value="InappropriateContent">محتوای نامناسب</option>
                <option value="Copyright">نقض حق تکثیر</option>
                <option value="Other">سایر</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="توضیحات کامل گزارش خود را وارد کنید..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={createReportMutation.isPending}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createReportMutation.isPending ? 'در حال ثبت...' : 'ثبت گزارش'}
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  setReportReason('');
                  setDescription('');
                }}
                variant="outline"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                انصراف
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

