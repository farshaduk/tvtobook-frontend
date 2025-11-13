'use client';

import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import WeeklyProgressChart from '@/components/ui/charts/weekly-progress-chart';
import CategoriesChart from '@/components/ui/charts/categories-chart';
import ReadingTrendChart from '@/components/ui/charts/reading-trend-chart';
import { readingProgressApi, digitalLibraryApi, productApi, productReviewApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toPersianNumber } from '@/utils/numberUtils';
import { Spinner } from '@/components/ui/spinner';

const OverviewPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch reading progress data
  const { data: progressResponse, isLoading: progressLoading } = useQuery({
    queryKey: ['my-reading-progress', user?.id],
    queryFn: async () => {
      const response = await readingProgressApi.getMyProgress();
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
  });

  // Fetch digital library data
  const { data: libraryResponse, isLoading: libraryLoading } = useQuery({
    queryKey: ['digital-library', user?.id],
    queryFn: async () => {
      const response = await digitalLibraryApi.getMyLibrary();
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
  });

  // Fetch user's reviews to calculate average rating
  const { data: reviewsResponse, isLoading: reviewsLoading } = useQuery({
    queryKey: ['my-reviews-for-rating', user?.id],
    queryFn: async () => {
      const response = await productReviewApi.getMyReviews(1, 1000);
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
  });

  const progressList = progressResponse?.data || [];
  const libraryItems = libraryResponse?.data || [];
  const reviews = reviewsResponse?.data?.items || [];

  // Calculate weekly progress from reading progress data
  const weeklyProgressData = useMemo(() => {
    const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - 1); // Start from Saturday (شنبه)
    weekStart.setHours(0, 0, 0, 0);

    const weeklyData = days.map((day, index) => {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + index);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      // Filter progress entries for this day
      const dayProgress = progressList.filter((p: any) => {
        const lastRead = p.lastReadAt ? new Date(p.lastReadAt) : null;
        return lastRead && lastRead >= dayStart && lastRead < dayEnd;
      });

      // Calculate total minutes for the day (using readingTime if available, or estimate from progress)
      const minutes = dayProgress.reduce((sum: number, p: any) => {
        if (p.readingTime) {
          // Parse readingTime - C# TimeSpan is serialized as "HH:mm:ss" or "d.HH:mm:ss"
          const timeStr = p.readingTime.toString();
          if (timeStr.includes(':')) {
            const parts = timeStr.split(':');
            const hours = parseInt(parts[0]) || 0;
            const mins = parseInt(parts[1]) || 0;
            const secs = parseInt(parts[2]) || 0;
            return sum + (hours * 60) + mins + (secs / 60);
          } else if (typeof p.readingTime === 'number') {
            // If it's already a number (total minutes or seconds)
            return sum + (p.readingTime > 1000 ? p.readingTime / 60 : p.readingTime); // Assume seconds if > 1000
          }
        }
        // Estimate: assume 2 minutes per page read
        return sum + Math.max(0, (p.currentPage || 0) * 2);
      }, 0);

      const goal = 80; // Default goal
      const progress = Math.min((minutes / goal) * 100, 100);

      return {
        day,
        progress: Math.round(progress),
        minutes: Math.round(minutes),
        maxValue: goal
      };
    });

    return weeklyData;
  }, [progressList]);

  // Fetch product details for categories (if needed)
  const productIds = useMemo(() => {
    return [...new Set(libraryItems.map((item: any) => item.productId))];
  }, [libraryItems]);

  const { data: productsData } = useQuery({
    queryKey: ['products-for-categories', productIds.join(',')],
    queryFn: async () => {
      // Fetch product details for library items to get category names
      const products = await Promise.all(
        productIds.map(async (productId: string) => {
          try {
            const response = await productApi.getById(productId);
            if (response.data?.data) {
              // Try to get category from product data
              const product = response.data.data;
              return { productId, categoryName: (product as any).categoryName || (product as any).category?.name || (product as any).category?.title || null };
            }
          } catch (error) {
            console.error(`Error fetching product ${productId}:`, error);
          }
          return { productId, categoryName: null };
        })
      );
      return products;
    },
    enabled: productIds.length > 0 && typeof window !== 'undefined',
  });

  // Calculate categories from digital library data
  const categoriesData = useMemo(() => {
    // Create a map of productId to categoryName
    const productCategoryMap = new Map<string, string>();
    if (productsData) {
      productsData.forEach((p: any) => {
        if (p.categoryName) {
          productCategoryMap.set(p.productId, p.categoryName);
        }
      });
    }

    // Group library items by category
    const categoryMap = new Map<string, number>();
    
    libraryItems.forEach((item: any) => {
      // Try to get category from product data, fallback to formatType
      const categoryName = productCategoryMap.get(item.productId);
      const category = categoryName || item.formatType || 'سایر';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#6b7280'];
    const total = libraryItems.length || 1;

    const categories = Array.from(categoryMap.entries()).map(([category, count], index) => ({
      category,
      count,
      percentage: Math.round((count / total) * 100),
      trend: '+0', // Could calculate from previous period
      total,
      color: colors[index % colors.length]
    }));

    // Sort by count descending
    categories.sort((a, b) => b.count - a.count);

    // If no categories, return default
    if (categories.length === 0) {
      return [
        { category: 'بدون دسته‌بندی', percentage: 100, count: 0, trend: '0', total: 0, color: '#6b7280' }
      ];
    }

    return categories;
  }, [libraryItems, productsData]);

  // Calculate monthly reading trend
  const readingTrendData = useMemo(() => {
    const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    
    // Group progress by month
    const monthlyMap = new Map<string, { books: Set<string>, minutes: number }>();
    
    progressList.forEach((p: any) => {
      if (p.lastReadAt) {
        const date = new Date(p.lastReadAt);
        const monthIndex = date.getMonth();
        const monthName = persianMonths[monthIndex];
        const year = date.getFullYear();
        const key = `${year}-${monthIndex}`;

        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, { books: new Set(), minutes: 0 });
        }

        const monthData = monthlyMap.get(key)!;
        monthData.books.add(p.productId);
        
        // Estimate minutes from reading time or progress
        if (p.readingTime) {
          const timeStr = p.readingTime.toString();
          if (timeStr.includes(':')) {
            const parts = timeStr.split(':');
            const hours = parseInt(parts[0]) || 0;
            const mins = parseInt(parts[1]) || 0;
            const secs = parseInt(parts[2]) || 0;
            monthData.minutes += (hours * 60) + mins + (secs / 60);
          } else if (typeof p.readingTime === 'number') {
            // If it's already a number (total minutes or seconds)
            monthData.minutes += (p.readingTime > 1000 ? p.readingTime / 60 : p.readingTime); // Assume seconds if > 1000
          }
        } else {
          // Estimate: 2 minutes per page
          monthData.minutes += Math.max(0, (p.currentPage || 0) * 2);
        }
      }
    });

    // Convert to array and sort by date
    const monthlyData = Array.from(monthlyMap.entries())
      .map(([key, data]) => {
        const [year, monthIndex] = key.split('-').map(Number);
        return {
          key,
          month: persianMonths[monthIndex],
          monthIndex,
          year,
          books: data.books.size,
          minutes: Math.round(data.minutes)
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthIndex - b.monthIndex;
      })
      .slice(-6) // Last 6 months
      .map(({ month, books, minutes }) => ({ month, books, minutes }));

    // If no data, return empty array with current month
    if (monthlyData.length === 0) {
      const now = new Date();
      return [{
        month: persianMonths[now.getMonth()],
        books: 0,
        minutes: 0
      }];
    }

    return monthlyData;
  }, [progressList]);

  // Calculate KPIs
  const completedBooks = useMemo(() => {
    return progressList.filter((p: any) => p.isCompleted).length;
  }, [progressList]);

  const totalDigitalItems = libraryItems.length;
  
  const consecutiveDays = useMemo(() => {
    // Calculate consecutive reading days from progress data
    if (progressList.length === 0) return 0;
    
    // Get unique dates when user read
    const uniqueDates = new Set(
      progressList
        .map((p: any) => p.lastReadAt ? new Date(p.lastReadAt).toDateString() : null)
        .filter(Boolean)
    );
    
    if (uniqueDates.size === 0) return 0;
    
    // Check consecutive days starting from today
    let consecutive = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    // Check up to 365 days back
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toDateString();
      if (uniqueDates.has(dateStr)) {
        consecutive++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return consecutive;
  }, [progressList]);

  // Calculate average rating from user's reviews
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
    return totalRating / reviews.length;
  }, [reviews]);

  // Calculate previous month data for comparisons
  const previousMonthData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Previous month
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Filter progress for previous month
    const prevMonthProgress = progressList.filter((p: any) => {
      if (!p.lastReadAt) return false;
      const date = new Date(p.lastReadAt);
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    });
    
    // Calculate previous month metrics
    const prevMonthCompleted = prevMonthProgress.filter((p: any) => p.isCompleted).length;
    const prevMonthMinutes = prevMonthProgress.reduce((sum: number, p: any) => {
      if (p.readingTime) {
        const timeStr = p.readingTime.toString();
        if (timeStr.includes(':')) {
          const parts = timeStr.split(':');
          const hours = parseInt(parts[0]) || 0;
          const mins = parseInt(parts[1]) || 0;
          const secs = parseInt(parts[2]) || 0;
          return sum + (hours * 60) + mins + (secs / 60);
        } else if (typeof p.readingTime === 'number') {
          return sum + (p.readingTime > 1000 ? p.readingTime / 60 : p.readingTime);
        }
      }
      return sum + Math.max(0, (p.currentPage || 0) * 2);
    }, 0);
    
    // Get previous month library count (items purchased before current month)
    const prevMonthLibraryCount = libraryItems.filter((item: any) => {
      if (!item.purchasedAt) return false;
      const date = new Date(item.purchasedAt);
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    }).length;
    
    // Calculate previous month average rating
    const prevMonthReviews = reviews.filter((r: any) => {
      if (!r.createdAt) return false;
      const date = new Date(r.createdAt);
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    });
    const prevMonthAvgRating = prevMonthReviews.length > 0
      ? prevMonthReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / prevMonthReviews.length
      : 0;
    
    return {
      completedBooks: prevMonthCompleted,
      digitalItems: prevMonthLibraryCount,
      avgRating: prevMonthAvgRating,
      totalMinutes: prevMonthMinutes
    };
  }, [progressList, libraryItems, reviews]);

  const totalReadingMinutes = useMemo(() => {
    return progressList.reduce((sum: number, p: any) => {
      if (p.readingTime) {
        const timeStr = p.readingTime.toString();
        if (timeStr.includes(':')) {
          const parts = timeStr.split(':');
          const hours = parseInt(parts[0]) || 0;
          const mins = parseInt(parts[1]) || 0;
          const secs = parseInt(parts[2]) || 0;
          return sum + (hours * 60) + mins + (secs / 60);
        } else if (typeof p.readingTime === 'number') {
          // If it's already a number (total minutes or seconds)
          return sum + (p.readingTime > 1000 ? p.readingTime / 60 : p.readingTime); // Assume seconds if > 1000
        }
      }
      // Estimate: 2 minutes per page
      return sum + Math.max(0, (p.currentPage || 0) * 2);
    }, 0);
  }, [progressList]);

  const activeReadingDays = useMemo(() => {
    const uniqueDates = new Set(
      progressList
        .map((p: any) => p.lastReadAt ? new Date(p.lastReadAt).toDateString() : null)
        .filter(Boolean)
    );
    return uniqueDates.size;
  }, [progressList]);

  const avgMinutesPerDay = useMemo(() => {
    if (activeReadingDays === 0) return 0;
    return Math.round(totalReadingMinutes / activeReadingDays);
  }, [totalReadingMinutes, activeReadingDays]);

  const isLoading = progressLoading || libraryLoading || reviewsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" text="در حال بارگذاری..." />
      </div>
    );
  }

  return (
    <div>
      {/* Professional Analytics Header */}
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-indigo-600 via-purple-600 via-pink-600 to-red-600 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 lg:space-x-4 mb-3 lg:mb-4 rtl:space-x-reverse">
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/80 rounded-full animate-bounce animation-delay-200"></div>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/60 rounded-full animate-bounce animation-delay-400"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">داشبورد تحلیلی</h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">📊 تجزیه و تحلیل جامع فعالیت‌های مطالعه و عملکرد 📈</p>
          </div>
        </div>
        
        <div className="space-y-6 lg:space-y-8">
          {/* Key Performance Indicators */}
          <div className="space-y-4 lg:space-y-6">
            <div className="flex items-center space-x-2 lg:space-x-3 rtl:space-x-reverse">
              <div className="p-1.5 lg:p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg">
                <BarChart3 className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 text-right">شاخص‌های کلیدی عملکرد</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-800/30 rounded-xl sm:rounded-2xl border border-amber-100 dark:border-amber-800/30 hover:shadow-lg transition-all duration-300">
                <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{toPersianNumber(avgRating.toFixed(1))}</div>
                <div className="text-xs sm:text-sm text-amber-600/80 dark:text-amber-400/80 font-medium">میانگین امتیاز</div>
                {previousMonthData.avgRating > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center justify-center gap-1">
                    <span>↑</span>
                    <span>{toPersianNumber((avgRating - previousMonthData.avgRating).toFixed(1))} از ماه قبل</span>
              </div>
                )}
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-800/30 rounded-xl sm:rounded-2xl border border-purple-100 dark:border-purple-800/30 hover:shadow-lg transition-all duration-300">
                <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{toPersianNumber(consecutiveDays)}</div>
                <div className="text-xs sm:text-sm text-purple-600/80 dark:text-purple-400/80 font-medium">روز متوالی مطالعه</div>
                {consecutiveDays >= 7 && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center justify-center gap-1">
                    <span>↑</span>
                    <span>{toPersianNumber(consecutiveDays - 7)}+ روز</span>
                  </div>
                )}
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-800/30 rounded-xl sm:rounded-2xl border border-emerald-100 dark:border-emerald-800/30 hover:shadow-lg transition-all duration-300">
                <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{toPersianNumber(totalDigitalItems)}</div>
                <div className="text-xs sm:text-sm text-emerald-600/80 dark:text-emerald-400/80 font-medium">موارد دیجیتال</div>
                {previousMonthData.digitalItems > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center justify-center gap-1">
                    <span>↑</span>
                    <span>{toPersianNumber(Math.round(((totalDigitalItems - previousMonthData.digitalItems) / previousMonthData.digitalItems) * 100))}% از ماه قبل</span>
                  </div>
                )}
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-800/30 rounded-xl sm:rounded-2xl border border-blue-100 dark:border-blue-800/30 hover:shadow-lg transition-all duration-300">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{toPersianNumber(completedBooks)}</div>
                <div className="text-xs sm:text-sm text-blue-600/80 dark:text-blue-400/80 font-medium">کتاب‌های خوانده شده</div>
                {previousMonthData.completedBooks > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center justify-center gap-1">
                    <span>↑</span>
                    <span>{toPersianNumber(Math.round(((completedBooks - previousMonthData.completedBooks) / previousMonthData.completedBooks) * 100))}% از ماه قبل</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Reading Progress Chart */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800/50 dark:to-gray-900/50 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
              <WeeklyProgressChart data={weeklyProgressData} goal={80} />
            </div>
            
            {/* Reading Categories Chart */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/30 dark:to-purple-800/30 rounded-xl sm:rounded-2xl border border-indigo-200 dark:border-indigo-700 shadow-lg">
              <CategoriesChart data={categoriesData} averageRating={avgRating} />
            </div>
          </div>

          {/* Reading Trend Chart */}
          <div className="p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-800/30 rounded-xl sm:rounded-2xl border border-emerald-200 dark:border-emerald-700 shadow-lg">
            <ReadingTrendChart data={readingTrendData} />
          </div>

          {/* Monthly Performance Overview */}
          <div className="p-3 sm:p-4 bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/30 dark:to-pink-800/30 rounded-xl sm:rounded-2xl border border-rose-200 dark:border-rose-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 text-right">نمای کلی عملکرد ماهانه</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{toPersianNumber(Math.round(avgMinutesPerDay))}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">میانگین دقیقه/روز</div>
                {previousMonthData.totalMinutes > 0 && avgMinutesPerDay > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center justify-center gap-1">
                    <span>↑</span>
                    <span>{toPersianNumber(Math.round(avgMinutesPerDay - (previousMonthData.totalMinutes / 30)))} دقیقه</span>
                  </div>
                )}
              </div>
              <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{toPersianNumber(activeReadingDays)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">روز مطالعه فعال</div>
                {activeReadingDays > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center justify-center gap-1">
                    <span>↑</span>
                    <span>{toPersianNumber(activeReadingDays - Math.floor(activeReadingDays * 0.9))} روز</span>
                  </div>
                )}
              </div>
              <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{toPersianNumber(Math.round(totalReadingMinutes))}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">دقیقه مطالعه کل</div>
                {previousMonthData.totalMinutes > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center justify-center gap-1">
                    <span>↑</span>
                    <span>{toPersianNumber(Math.round(((totalReadingMinutes - previousMonthData.totalMinutes) / previousMonthData.totalMinutes) * 100))}% از ماه قبل</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-800/30 rounded-xl sm:rounded-2xl border border-yellow-200 dark:border-yellow-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 text-right">🏆 دستاوردها و نشان‌ها</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`text-center p-2 rounded-lg ${completedBooks >= 10 ? 'bg-yellow-200 dark:bg-yellow-800/50' : 'bg-white/50 dark:bg-gray-800/50'}`}>
                <div className="text-lg">📚</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">کتابخوان ماه</div>
                {completedBooks >= 10 && <div className="text-xs text-green-600 dark:text-green-400 mt-1">✓</div>}
              </div>
              <div className={`text-center p-2 rounded-lg ${consecutiveDays >= 7 ? 'bg-orange-200 dark:bg-orange-800/50' : 'bg-white/50 dark:bg-gray-800/50'}`}>
                <div className="text-lg">🔥</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">استریک 7 روزه</div>
                {consecutiveDays >= 7 && <div className="text-xs text-green-600 dark:text-green-400 mt-1">✓</div>}
              </div>
              <div className={`text-center p-2 rounded-lg ${avgRating >= 4.5 ? 'bg-yellow-200 dark:bg-yellow-800/50' : 'bg-white/50 dark:bg-gray-800/50'}`}>
                <div className="text-lg">⭐</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">امتیاز عالی</div>
                {avgRating >= 4.5 && <div className="text-xs text-green-600 dark:text-green-400 mt-1">✓</div>}
              </div>
              <div className={`text-center p-2 rounded-lg ${avgMinutesPerDay >= 60 ? 'bg-blue-200 dark:bg-blue-800/50' : 'bg-white/50 dark:bg-gray-800/50'}`}>
                <div className="text-lg">🎯</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">هدف‌مند</div>
                {avgMinutesPerDay >= 60 && <div className="text-xs text-green-600 dark:text-green-400 mt-1">✓</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
