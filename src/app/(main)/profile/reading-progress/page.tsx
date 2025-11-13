'use client';

import React, { useState, Suspense } from 'react';
import { BookOpen, Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { readingProgressApi, ReadingProgressDto } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast';
import { toPersianNumber } from '@/utils/numberUtils';
import { useToastHelpers } from '@/hooks/useToastHelpers';

const ReadingProgressPageContent: React.FC = () => {
  const { user } = useAuth();
  const toast = useToastHelpers();

  const { data: progressResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['my-reading-progress', user?.id],
    queryFn: async () => {
      const response = await readingProgressApi.getMyProgress();
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
  });

  const progressList: ReadingProgressDto[] = progressResponse?.data || [];

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
        <p className="text-red-500">خطا در بارگذاری پیشرفت مطالعه</p>
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
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-green-600 via-emerald-600 via-teal-600 to-cyan-600 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl text-right">پیشرفت مطالعه</h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">📊 پیگیری پیشرفت مطالعه شما 📈</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {progressList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">شما هنوز پیشرفت مطالعه‌ای ثبت نکرده‌اید</p>
              <p className="text-sm text-gray-400 mt-2">پیشرفت مطالعه شما در اینجا نمایش داده می‌شود</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progressList.map((progress) => (
                <Card key={progress.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <h3 className="font-semibold truncate" title={progress.productTitle || 'بدون عنوان'}>
                          {progress.productTitle || 'بدون عنوان'}
                        </h3>
                      </div>
                      {progress.isCompleted && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex-shrink-0">تکمیل شده</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">صفحه فعلی</span>
                        <span className="font-semibold">{toPersianNumber(progress.currentPage)} / {toPersianNumber(progress.totalPages)}</span>
                      </div>
                      <Progress value={progress.progressPercentage} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{toPersianNumber(Math.round(progress.progressPercentage))}%</span>
                        {progress.lastReadAt && (
                          <span>آخرین مطالعه: {new Date(progress.lastReadAt).toLocaleDateString('fa-IR')}</span>
                        )}
                      </div>
                      {progress.currentChapter && (
                        <div className="text-xs text-gray-500">
                          فصل: {progress.currentChapter}
                        </div>
                      )}
                      {progress.readingTime && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <TrendingUp className="h-3 w-3" />
                          <span>زمان مطالعه: {progress.readingTime}</span>
                        </div>
                      )}
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

const ReadingProgressPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ReadingProgressPageContent />
    </Suspense>
  );
};

export default ReadingProgressPage;

