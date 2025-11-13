'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { 
  UserIcon, 
  ListBulletIcon, 
  StarIcon, 
  HeartIcon,
  CreditCardIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  InformationCircleIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CameraIcon,
  PhotoIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  SparklesIcon,
  LightBulbIcon,
  BoltIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import UserLayout from '@/components/UserLayout';
import { useConfirmation } from '@/hooks/useConfirmationMo';
import WeeklyProgressChart from '@/components/ui/charts/weekly-progress-chart';
import CategoriesChart from '@/components/ui/charts/categories-chart';
import ReadingTrendChart from '@/components/ui/charts/reading-trend-chart';
import { authApi, userApi, analyticsApi, paymentApi, adsApi, authorApi, orderApi, readingProgressApi, digitalLibraryApi, productApi, productReviewApi } from '@/services/api';
import OrdersPage from './orders/page';
import LibraryPage from './library/page';
import TicketsPage from './tickets/page';
import RefundsPage from './refunds/page';
import BookmarksPage from './bookmarks/page';
import NotesPage from './notes/page';
import ReadingProgressPage from './reading-progress/page';
import AddressesPage from './addresses/page';
import WishlistPage from './wishlist/page';
import LikesPage from './likes/page';
import CommentsPage from './comments/page';
import ReportsPage from './reports/page';
import RoyaltiesPage from './royalties/page';
import NotificationsPage from './notifications/page';

const UserProfilePageContent: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = '/profile';
  const { user: currentUser, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [viewPeriod, setViewPeriod] = useState(30);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { showConfirmation, showWarning, showError, showSuccess, showInfo } = useConfirmation();
  const { showToast } = useToast();
  
  // Create toast helper functions
  const toast = {
    success: (message: string) => showToast({ type: 'success', title: message }),
    error: (message: string) => showToast({ type: 'error', title: message }),
    warning: (message: string) => showToast({ type: 'warning', title: message }),
    info: (message: string) => showToast({ type: 'info', title: message }),
  };
  
  // Search and filter state - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const [isSwitchingTab, setIsSwitchingTab] = useState(false);
  const [pageSize] = useState(10);
  
  // Category dropdown state
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [boostingAds, setBoostingAds] = useState<Set<string>>(new Set());
  const [markingSoldAds, setMarkingSoldAds] = useState<Set<string>>(new Set());
  const [applyingPromotions, setApplyingPromotions] = useState<Set<string>>(new Set());
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  
  // Advanced filters modal state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: { start: '', end: '' },
    priceRange: { min: '', max: '' },
    viewsRange: { min: '', max: '' },
    favoritesRange: { min: '', max: '' },
    sortBy: 'createdAt',
    sortOrder: 'desc',
    promotionalFeatures: {
      featured: false,
      urgent: false,
      premium: false
    }
  });

  // Author request state
  const [authorRequest, setAuthorRequest] = useState({
    PenName: '',
    Biography: '',
    Website: '',
    Nationality: ''
  });
  const [isSubmittingAuthorRequest, setIsSubmittingAuthorRequest] = useState(false);

  // Sync activeTab with URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  // Get user data from API - ALL HOOKS MUST BE CALLED BEFORE CONDITIONAL RETURNS
  const safeParams = { ...params };
  const userId = safeParams?.id || currentUser?.id;
  
  // Fetch user data from API
  const { data: userData, isLoading: userLoading, error: userError, refetch: refetchUserData } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      try {
        if (userId && userId !== currentUser?.id) {
          return await userApi.getById(userId as string);
        } else {
          return await authApi.getCurrentUser();
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('خطا در بارگذاری اطلاعات کاربر');
        throw error;
      }
    },
    enabled: !!userId && !!isAuthenticated && typeof window !== 'undefined',
    retry: 2,
  });

  // Fetch user orders for stats
  const { data: ordersResponse } = useQuery({
    queryKey: ['my-orders', userId],
    queryFn: async () => {
      const response = await orderApi.getMyOrders();
      return response.data;
    },
    enabled: !!userId && !!isAuthenticated && typeof window !== 'undefined',
    retry: 2,
  });

  const orders = ordersResponse?.data || [];

  // Fetch reading progress data
  const { data: progressResponse } = useQuery({
    queryKey: ['my-reading-progress', userId],
    queryFn: async () => {
      const response = await readingProgressApi.getMyProgress();
      return response.data;
    },
    enabled: !!userId && !!isAuthenticated && typeof window !== 'undefined',
  });

  // Fetch digital library data
  const { data: libraryResponse } = useQuery({
    queryKey: ['digital-library', userId],
    queryFn: async () => {
      const response = await digitalLibraryApi.getMyLibrary();
      return response.data;
    },
    enabled: !!userId && !!isAuthenticated && typeof window !== 'undefined',
  });

  // Fetch user's reviews to calculate average rating
  const { data: reviewsResponse } = useQuery({
    queryKey: ['my-reviews-for-rating', userId],
    queryFn: async () => {
      const response = await productReviewApi.getMyReviews(1, 1000);
      return response.data;
    },
    enabled: !!userId && !!isAuthenticated && typeof window !== 'undefined',
  });

  const progressList = progressResponse?.data || [];
  const libraryItems = libraryResponse?.data || [];
  const reviews = reviewsResponse?.data?.items || [];

  // Derive user object from query results
  const user = (userData?.data as any)?.User || userData?.data || currentUser;
  const isOwnProfile = !safeParams?.id || safeParams?.id === currentUser?.id;

  const userStats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    memberSince: user?.dateJoined || new Date().toISOString()
  };

  // Calculate real user stats from actual data
  const completedBooks = progressList.filter((p: any) => p.isCompleted).length;
  const totalDigitalItems = libraryItems.length;
  
  const consecutiveDays = React.useMemo(() => {
    if (progressList.length === 0) return 0;
    const uniqueDates = new Set(
      progressList
        .map((p: any) => p.lastReadAt ? new Date(p.lastReadAt).toDateString() : null)
        .filter(Boolean)
    );
    if (uniqueDates.size === 0) return 0;
    let consecutive = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
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

  const avgRating = React.useMemo(() => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
    return totalRating / reviews.length;
  }, [reviews]);

  const realUserStats = {
    totalAds: 0,
    activeAds: 0,
    totalViews: 0,
    totalFavorites: 0,
    totalClicks: 0,
    conversionRate: 0,
    avgRating: avgRating,
    totalReviews: reviews.length
  };

  // Calculate weekly progress from reading progress data
  const weeklyProgressData = React.useMemo(() => {
    const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - 1);
    weekStart.setHours(0, 0, 0, 0);

    return days.map((day, index) => {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + index);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const dayProgress = progressList.filter((p: any) => {
        const lastRead = p.lastReadAt ? new Date(p.lastReadAt) : null;
        return lastRead && lastRead >= dayStart && lastRead < dayEnd;
      });

      const minutes = dayProgress.reduce((sum: number, p: any) => {
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

      const goal = 80;
      const progress = Math.min((minutes / goal) * 100, 100);

      return {
        day,
        progress: Math.round(progress),
        minutes: Math.round(minutes),
        maxValue: goal
      };
    });
  }, [progressList]);

  // Fetch product details for categories
  const productIds = React.useMemo(() => {
    return [...new Set(libraryItems.map((item: any) => item.productId))];
  }, [libraryItems]);

  const { data: productsData } = useQuery({
    queryKey: ['products-for-categories', productIds.join(',')],
    queryFn: async () => {
      const products = await Promise.all(
        productIds.map(async (productId: string) => {
          try {
            const response = await productApi.getById(productId);
            if (response.data?.data) {
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
  const categoriesData = React.useMemo(() => {
    const productCategoryMap = new Map<string, string>();
    if (productsData) {
      productsData.forEach((p: any) => {
        if (p.categoryName) {
          productCategoryMap.set(p.productId, p.categoryName);
        }
      });
    }

    const categoryMap = new Map<string, number>();
    libraryItems.forEach((item: any) => {
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
      trend: '+0',
      total,
      color: colors[index % colors.length]
    }));

    categories.sort((a, b) => b.count - a.count);

    if (categories.length === 0) {
      return [
        { category: 'بدون دسته‌بندی', percentage: 100, count: 0, trend: '0', total: 0, color: '#6b7280' }
      ];
    }

    return categories;
  }, [libraryItems, productsData]);

  // Calculate monthly reading trend
  const readingTrendData = React.useMemo(() => {
    const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    const monthlyMap = new Map<string, { books: Set<string>, minutes: number }>();
    
    progressList.forEach((p: any) => {
      if (p.lastReadAt) {
        const date = new Date(p.lastReadAt);
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${monthIndex}`;

        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, { books: new Set(), minutes: 0 });
        }

        const monthData = monthlyMap.get(key)!;
        monthData.books.add(p.productId);
        
        if (p.readingTime) {
          const timeStr = p.readingTime.toString();
          if (timeStr.includes(':')) {
            const parts = timeStr.split(':');
            const hours = parseInt(parts[0]) || 0;
            const mins = parseInt(parts[1]) || 0;
            const secs = parseInt(parts[2]) || 0;
            monthData.minutes += (hours * 60) + mins + (secs / 60);
          } else if (typeof p.readingTime === 'number') {
            monthData.minutes += (p.readingTime > 1000 ? p.readingTime / 60 : p.readingTime);
          }
        } else {
          monthData.minutes += Math.max(0, (p.currentPage || 0) * 2);
        }
      }
    });

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
      .slice(-6)
      .map(({ month, books, minutes }) => ({ month, books, minutes }));

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

  // Calculate previous month data for comparisons
  const previousMonthData = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const prevMonthProgress = progressList.filter((p: any) => {
      if (!p.lastReadAt) return false;
      const date = new Date(p.lastReadAt);
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    });
    
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
    
    const prevMonthLibraryCount = libraryItems.filter((item: any) => {
      if (!item.purchasedAt) return false;
      const date = new Date(item.purchasedAt);
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    }).length;
    
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

  const totalReadingMinutes = React.useMemo(() => {
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
          return sum + (p.readingTime > 1000 ? p.readingTime / 60 : p.readingTime);
        }
      }
      return sum + Math.max(0, (p.currentPage || 0) * 2);
    }, 0);
  }, [progressList]);

  const activeReadingDays = React.useMemo(() => {
    const uniqueDates = new Set(
      progressList
        .map((p: any) => p.lastReadAt ? new Date(p.lastReadAt).toDateString() : null)
        .filter(Boolean)
    );
    return uniqueDates.size;
  }, [progressList]);

  const avgMinutesPerDay = React.useMemo(() => {
    if (activeReadingDays === 0) return 0;
    return Math.round(totalReadingMinutes / activeReadingDays);
  }, [totalReadingMinutes, activeReadingDays]);

  const sidebarItems = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'listings', label: 'My Ads', icon: ListBulletIcon, badge: 12 },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'favorites', label: 'Favorites', icon: HeartIcon },
    { id: 'payments', label: 'Payment Details', icon: CreditCardIcon },
    { id: 'plans', label: 'Plans', icon: DocumentIcon },
    { id: 'settings', label: 'Account Settings', icon: CogIcon },
    { id: 'help', label: 'Help', icon: QuestionMarkCircleIcon },
  ];

  const handleImageUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image');
      return;
    }

    setIsUploadingImage(true);
    // Simulate upload
    setTimeout(() => {
      setIsUploadingImage(false);
      toast.success('Profile image updated successfully');
    }, 2000);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Sign out failed');
    }
  };

  const handleTabSwitch = (tabId: string) => {
    if (tabId === 'logout') {
      showConfirmation({
        title: 'Sign Out',
        message: 'Are you sure you want to sign out of your account?',
        confirmText: 'Sign Out',
        cancelText: 'Cancel',
        type: 'warning',
        onConfirm: handleSignOut
      });
    } else {
      setIsSwitchingTab(true);
      setActiveTab(tabId);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tabId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      setTimeout(() => setIsSwitchingTab(false), 500);
    }
  };

  const handleAuthorRequest = async () => {
    if (!authorRequest.PenName.trim()) {
      toast.error('لطفاً نام  خود را وارد کنید');
      return;
    }

    if (!authorRequest.Biography.trim()) {
      toast.error('لطفاً بیوگرافی خود را وارد کنید');
      return;
    }

    // Check if user is authenticated and has ID
    if (!currentUser?.id) {
      toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید');
      return;
    }

    setIsSubmittingAuthorRequest(true);
    try {
    
      const requestData = {
        UserId: currentUser.id,
        PenName: authorRequest.PenName,
        Biography: authorRequest.Biography,
        Website: authorRequest.Website || undefined,
        Nationality: authorRequest.Nationality || undefined,
      };
      
      const response = await authorApi.create(requestData);
      
      // Handle successful response
      if (response.data?.isSucceeded) {
        const successMessage = response.data.message || 'درخواست نویسندگی شما با موفقیت ثبت شد';
        toast.success(successMessage);
        setAuthorRequest({ PenName: '', Biography: '', Website: '', Nationality: '' });
        // Refetch author profile to show the new status
        refetchAuthorProfile();
      } else {
        // Handle unsuccessful response (isSucceeded: false)
        const errorMessage = response.data?.message || 'خطا در ثبت درخواست نویسندگی';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      // Handle exceptions (network errors, 4xx, 5xx status codes)
      console.error('Author request error:', error);
      console.error('Error response data:', error.response?.data);
      
      // Extract error message from response (backend returns: { message, isSucceeded })
      let errorMessage = 'خطا در ثبت درخواست نویسندگی رخ داد';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.Message) {
        errorMessage = error.response.data.Message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('Displaying error toast:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmittingAuthorRequest(false);
    }
  };

  const getTabLoadingMessage = (tab: string) => {
    const messages = {
      profile: 'Loading profile information...',
      listings: 'Loading your ads...',
      analytics: 'Loading analytics data...',
      favorites: 'Loading favorites...',
      payments: 'Loading payment details...',
      plans: 'Loading subscription plans...',
      settings: 'Loading account settings...',
      help: 'Loading help information...'
    };
    return messages[tab as keyof typeof messages] || 'Loading...';
  };


  // Fetch author profile data
  const { data: authorProfileData, isLoading: authorProfileLoading, refetch: refetchAuthorProfile } = useQuery({
    queryKey: ['author-profile', userId],
    queryFn: async () => {
      try {
        const response = await authorApi.getMyAuthorProfile();
        // Return the data object from the response
        return response.data.data ? { data: response.data.data } : null;
      } catch (error: any) {
        // If 404 or no profile found, return null (user hasn't requested yet)
        if (error.response?.status === 404 || error.response?.status === 400) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!userId && !!isAuthenticated && typeof window !== 'undefined',
    retry: false,
  });

  // Refetch data when switching between tabs
  useEffect(() => {
    // Only fetch data in browser, not during static export build
    if (typeof window === 'undefined') return;
    if (!userId || !isAuthenticated) return;

    switch (activeTab) {
      case 'overview':
        // Refetch overview data
        refetchUserData();
        break;
      case 'profile':
        // Refetch user profile data
        refetchUserData();
        break;
      case 'analytics':
        // Refetch analytics data
        refetchUserData();
        break;
      case 'orders':
        // Refetch orders data
        refetchUserData();
        break;
      case 'library':
        // Refetch library data
        refetchUserData();
        break;
      case 'wishlist':
        // Refetch wishlist data
        refetchUserData();
        break;
      case 'settings':
        // Refetch settings and author profile data
        refetchUserData();
        refetchAuthorProfile();
        break;
      default:
        break;
    }
  }, [activeTab, userId, isAuthenticated, refetchUserData, refetchAuthorProfile]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const analyticsData = readingTrendData.map((item: any) => ({
    name: item.month,
    views: item.books,
    clicks: item.minutes,
    favorites: Math.floor(item.books * 0.1)
  }));

  const categoryData = categoriesData.map((item: any) => ({
    name: item.category,
    value: item.count,
    color: item.color
  }));

  const isAuthor = authorProfileData?.data?.approvalStatus === 'Approved';

  return (
    <UserLayout
      activeTab={activeTab}
      onTabChange={handleTabSwitch}
      user={user}
      isOwnProfile={isOwnProfile}
      onImageUpload={handleImageUpload}
      isUploadingImage={isUploadingImage}
      userStats={userStats}
      isAuthor={isAuthor}
    >
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6 lg:space-y-8 animate-fade-in">
          {/* Professional Analytics Header */}
          <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
            <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-indigo-600 via-purple-600 via-pink-600 to-red-600 shadow-2xl">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-2 lg:space-x-4 mb-3 lg:mb-4">
                  <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/80 rounded-full animate-bounce animation-delay-200"></div>
                  <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/60 rounded-full animate-bounce animation-delay-400"></div>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text">Profile</h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium">✨ Manage personal information and account statistics ✨</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
              {/* Personal Information */}
              <div className="space-y-4 lg:space-y-8">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="p-1.5 lg:p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <UserIcon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Personal Information</h2>
                </div>
                
                <div className="space-y-4 lg:space-y-6">
                  <div className="group hover:bg-blue-50/50 p-3 lg:p-4 rounded-xl transition-all duration-300 border border-transparent hover:border-blue-200">
                    <label className="text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">Full Name</label>
                    <div className="mt-2 flex items-center text-gray-900">
                      <div className="p-1.5 lg:p-2 bg-blue-100 rounded-lg mr-2 lg:mr-3 group-hover:bg-blue-200 transition-colors">
                        <UserIcon className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                      </div>
                      <span className="text-base lg:text-lg font-medium">{user.firstName} {user.lastName}</span>
                    </div>
                  </div>
                  
                  <div className="group hover:bg-green-50/50 p-3 lg:p-4 rounded-xl transition-all duration-300 border border-transparent hover:border-green-200">
                    <label className="text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">Email Address</label>
                    <div className="mt-2 flex items-center text-gray-900">
                      <div className="p-1.5 lg:p-2 bg-green-100 rounded-lg mr-2 lg:mr-3 group-hover:bg-green-200 transition-colors">
                        <EnvelopeIcon className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
                      </div>
                      <span className="text-base lg:text-lg font-medium">{user.email}</span>
                    </div>
                  </div>
                  
                  <div className="group hover:bg-purple-50/50 p-3 lg:p-4 rounded-xl transition-all duration-300 border border-transparent hover:border-purple-200">
                    <label className="text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">Phone Number</label>
                    <div className="mt-2 flex items-center text-gray-900">
                      <div className="p-1.5 lg:p-2 bg-purple-100 rounded-lg mr-2 lg:mr-3 group-hover:bg-purple-200 transition-colors">
                        <PhoneIcon className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600" />
                      </div>
                      <span className="text-base lg:text-lg font-medium">{user.phoneNumber}</span>
                    </div>
                  </div>
                  
                  <div className="group hover:bg-orange-50/50 p-3 lg:p-4 rounded-xl transition-all duration-300 border border-transparent hover:border-orange-200">
                    <label className="text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">Member Since</label>
                    <div className="mt-2 flex items-center text-gray-900">
                      <div className="p-1.5 lg:p-2 bg-orange-100 rounded-lg mr-2 lg:mr-3 group-hover:bg-orange-200 transition-colors">
                        <CalendarIcon className="h-4 w-4 lg:h-5 lg:w-5 text-orange-600" />
                      </div>
                      <span className="text-base lg:text-lg font-medium">{new Date(user.dateJoined).toLocaleDateString('en-US')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4 lg:space-y-8">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="p-1.5 lg:p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
                    <BuildingOfficeIcon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Business Information</h2>
                </div>
                
                <div className="space-y-4 lg:space-y-6">
                  <div className="group hover:bg-indigo-50/50 p-3 lg:p-4 rounded-xl transition-all duration-300 border border-transparent hover:border-indigo-200">
                    <label className="text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">Business Name</label>
                    <div className="mt-2 flex items-center text-gray-900">
                      <div className="p-1.5 lg:p-2 bg-indigo-100 rounded-lg mr-2 lg:mr-3 group-hover:bg-indigo-200 transition-colors">
                        <BuildingOfficeIcon className="h-4 w-4 lg:h-5 lg:w-5 text-indigo-600" />
                      </div>
                      <span className="text-base lg:text-lg font-medium">{user.businessName}</span>
                    </div>
                  </div>
                  
                  <div className="group hover:bg-teal-50/50 p-3 lg:p-4 rounded-xl transition-all duration-300 border border-transparent hover:border-teal-200">
                    <label className="text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">Business Address</label>
                    <div className="mt-2 flex items-center text-gray-900">
                      <div className="p-1.5 lg:p-2 bg-teal-100 rounded-lg mr-2 lg:mr-3 group-hover:bg-teal-200 transition-colors">
                        <MapPinIcon className="h-4 w-4 lg:h-5 lg:w-5 text-teal-600" />
                      </div>
                      <span className="text-base lg:text-lg font-medium">{user.businessAddress}</span>
                    </div>
                  </div>
                  
                  <div className="group hover:bg-pink-50/50 p-3 lg:p-4 rounded-xl transition-all duration-300 border border-transparent hover:border-pink-200">
                    <label className="text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">Business Description</label>
                    <div className="mt-2 flex items-start text-gray-900">
                      <div className="p-1.5 lg:p-2 bg-pink-100 rounded-lg mr-2 lg:mr-3 group-hover:bg-pink-200 transition-colors mt-1">
                        <DocumentIcon className="h-4 w-4 lg:h-5 lg:w-5 text-pink-600" />
                      </div>
                      <span className="text-base lg:text-lg font-medium">{user.businessDescription}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 lg:space-y-8">
          <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
            <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-indigo-600 via-purple-600 via-pink-600 to-red-600 shadow-2xl">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-2 lg:space-x-4 mb-3 lg:mb-4">
                  <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/80 rounded-full animate-bounce animation-delay-200"></div>
                  <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/60 rounded-full animate-bounce animation-delay-400"></div>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text">Analytics Dashboard</h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium">📊 Comprehensive analysis of your business performance 📈</p>
              </div>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 lg:p-6 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Ads</p>
                    <p className="text-2xl lg:text-3xl font-bold text-blue-900">{realUserStats.totalAds}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DocumentIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 lg:p-6 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Active Ads</p>
                    <p className="text-2xl lg:text-3xl font-bold text-green-900">{realUserStats.activeAds}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-violet-100 p-4 lg:p-6 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total Views</p>
                    <p className="text-2xl lg:text-3xl font-bold text-purple-900">{realUserStats.totalViews}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <EyeIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-pink-50 to-rose-100 p-4 lg:p-6 rounded-xl border border-pink-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-pink-600">Conversion Rate</p>
                    <p className="text-2xl lg:text-3xl font-bold text-pink-900">{realUserStats.conversionRate}%</p>
                  </div>
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="bg-white p-4 lg:p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="clicks" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-4 lg:p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 lg:space-y-8">
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
                    <ChartBarIcon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 text-right">شاخص‌های کلیدی عملکرد</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-800/30 rounded-xl sm:rounded-2xl border border-amber-100 dark:border-amber-800/30 hover:shadow-lg transition-all duration-300">
                    <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{avgRating > 0 ? avgRating.toFixed(1) : '0'}</div>
                    <div className="text-xs sm:text-sm text-amber-600/80 dark:text-amber-400/80 font-medium">میانگین امتیاز</div>
                    {previousMonthData.avgRating > 0 && (
                      <div className="text-xs text-green-600 mt-1">↗ +{(avgRating - previousMonthData.avgRating).toFixed(1)} از ماه قبل</div>
                    )}
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-800/30 rounded-xl sm:rounded-2xl border border-purple-100 dark:border-purple-800/30 hover:shadow-lg transition-all duration-300">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{consecutiveDays}</div>
                    <div className="text-xs sm:text-sm text-purple-600/80 dark:text-purple-400/80 font-medium">روز متوالی مطالعه</div>
                    {consecutiveDays >= 7 && (
                      <div className="text-xs text-green-600 mt-1">↗ +{consecutiveDays - 7} روز</div>
                    )}
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-800/30 rounded-xl sm:rounded-2xl border border-emerald-100 dark:border-emerald-800/30 hover:shadow-lg transition-all duration-300">
                    <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalDigitalItems}</div>
                    <div className="text-xs sm:text-sm text-emerald-600/80 dark:text-emerald-400/80 font-medium">موارد دیجیتال</div>
                    {previousMonthData.digitalItems > 0 && (
                      <div className="text-xs text-green-600 mt-1">↗ +{Math.round(((totalDigitalItems - previousMonthData.digitalItems) / previousMonthData.digitalItems) * 100)}% از ماه قبل</div>
                    )}
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-800/30 rounded-xl sm:rounded-2xl border border-blue-100 dark:border-blue-800/30 hover:shadow-lg transition-all duration-300">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{completedBooks}</div>
                    <div className="text-xs sm:text-sm text-blue-600/80 dark:text-blue-400/80 font-medium">کتاب‌های خوانده شده</div>
                    {previousMonthData.completedBooks > 0 && (
                      <div className="text-xs text-green-600 mt-1">↗ +{Math.round(((completedBooks - previousMonthData.completedBooks) / previousMonthData.completedBooks) * 100)}% از ماه قبل</div>
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
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{Math.round(avgMinutesPerDay)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">میانگین دقیقه/روز</div>
                    {previousMonthData.totalMinutes > 0 && avgMinutesPerDay > 0 && (
                      <div className="text-xs text-green-600 mt-1">↗ +{Math.round(avgMinutesPerDay - (previousMonthData.totalMinutes / 30))} دقیقه</div>
                    )}
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{activeReadingDays}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">روز مطالعه فعال</div>
                    {activeReadingDays > 0 && (
                      <div className="text-xs text-green-600 mt-1">↗ +{activeReadingDays - Math.floor(activeReadingDays * 0.9)} روز</div>
                    )}
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{Math.round(totalReadingMinutes)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">دقیقه مطالعه کل</div>
                    {previousMonthData.totalMinutes > 0 && (
                      <div className="text-xs text-green-600 mt-1">↗ +{Math.round(((totalReadingMinutes - previousMonthData.totalMinutes) / previousMonthData.totalMinutes) * 100)}% از ماه قبل</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Achievement Badges */}
              <div className="p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-800/30 rounded-xl sm:rounded-2xl border border-yellow-200 dark:border-yellow-700">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 text-right">🏆 دستاوردها و نشان‌ها</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-lg">📚</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">کتابخوان ماه</div>
                  </div>
                  <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-lg">🔥</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">استریک 7 روزه</div>
                  </div>
                  <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-lg">⭐</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">امتیاز عالی</div>
                  </div>
                  <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-lg">🎯</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">هدف‌مند</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && <OrdersPage />}

      {/* Library Tab */}
      {activeTab === 'library' && <LibraryPage />}
      
      {/* Tickets Tab */}
      {activeTab === 'tickets' && <TicketsPage />}
      
      {/* Refunds Tab */}
      {activeTab === 'refunds' && <RefundsPage />}
      
      {/* Addresses Tab */}
      {activeTab === 'addresses' && <AddressesPage />}
      
      {/* Bookmarks Tab */}
      {activeTab === 'bookmarks' && <BookmarksPage />}
      
      {/* Notes Tab */}
      {activeTab === 'notes' && <NotesPage />}
      
      {/* Reading Progress Tab */}
      {activeTab === 'reading-progress' && <ReadingProgressPage />}

      {/* Wishlist Tab */}
      {activeTab === 'wishlist' && <WishlistPage />}

      {/* Likes Tab */}
      {activeTab === 'likes' && <LikesPage />}

      {/* Comments Tab */}
      {activeTab === 'comments' && <CommentsPage />}
      {activeTab === 'reports' && <ReportsPage />}
      {activeTab === 'royalties' && <RoyaltiesPage />}
      {activeTab === 'notifications' && <NotificationsPage />}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6 lg:space-y-8">
          {/* Professional Settings Header */}
          <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
            <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-gray-600 via-slate-600 via-zinc-600 to-neutral-600 shadow-2xl">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-2 lg:space-x-4 mb-3 lg:mb-4 rtl:space-x-reverse">
                  <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/80 rounded-full animate-bounce animation-delay-200"></div>
                  <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/60 rounded-full animate-bounce animation-delay-400"></div>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">تنظیمات حساب</h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">⚙️ مدیریت اطلاعات شخصی و تنظیمات حساب کاربری 🔧</p>
              </div>
            </div>
            
            <div className="space-y-6 lg:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Personal Information Settings */}
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4 sm:mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-right">اطلاعات شخصی</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">نام کامل</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        defaultValue={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">ایمیل</label>
                      <input 
                        type="email" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        defaultValue={user?.email || ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">شماره تلفن</label>
                      <input 
                        type="tel" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        defaultValue={user?.phoneNumber || ''}
                      />
                    </div>
                    <button className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
                      ذخیره تغییرات
                    </button>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4 sm:mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BellIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-right">تنظیمات اعلانات</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 text-right">اعلانات ایمیل</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 text-right">اعلانات پیامکی</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 text-right">اعلانات سیستم</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Author Request Section */}
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4 sm:mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-right">درخواست نویسندگی</h2>
                  </div>
                  
                  {authorProfileLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <span className="mr-3 text-gray-600">در حال بارگذاری...</span>
                    </div>
                  ) : authorProfileData?.data ? (
                    // Show status if user has already requested
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3 rtl:space-x-reverse">
                          <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-blue-900 text-right mb-2">اطلاعات درخواست نویسندگی</h3>
                            <div className="space-y-2 text-sm text-blue-800">
                              <p className="text-right"><span className="font-medium">نام :</span> {authorProfileData.data.penName}</p>
                              <p className="text-right"><span className="font-medium">بیوگرافی:</span> {authorProfileData.data.biography}</p>
                              {authorProfileData.data.website && (
                                <p className="text-right"><span className="font-medium">وب‌سایت:</span> {authorProfileData.data.website}</p>
                              )}
                              {authorProfileData.data.nationality && (
                                <p className="text-right"><span className="font-medium">ملیت:</span> {authorProfileData.data.nationality}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 text-right">وضعیت درخواست:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          authorProfileData.data.approvalStatus === 'Approved' 
                            ? 'bg-green-100 text-green-800' 
                            : authorProfileData.data.approvalStatus === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {authorProfileData.data.approvalStatus === 'Approved' 
                            ? '✓ تایید شده' 
                            : authorProfileData.data.approvalStatus === 'Rejected'
                            ? '✗ رد شده'
                            : '⏳ در انتظار بررسی'}
                        </span>
                      </div>

                      {/* Approval Note if exists */}
                      {authorProfileData.data.approvalNote && (
                        <div className={`p-4 rounded-lg border ${
                          authorProfileData.data.approvalStatus === 'Rejected'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                          <p className="text-sm font-medium text-gray-700 text-right mb-1">یادداشت مدیر:</p>
                          <p className="text-sm text-gray-600 text-right">{authorProfileData.data.approvalNote}</p>
                        </div>
                      )}

                      {/* Approved Date */}
                      {authorProfileData.data.approvedAt && (
                        <div className="text-xs text-gray-500 text-right">
                          تاریخ بررسی: {new Date(authorProfileData.data.approvedAt).toLocaleDateString('fa-IR')}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Show form if user hasn't requested yet
                    <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">نام  *</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                        placeholder="نام  خود را وارد کنید"
                        value={authorRequest.PenName}
                        onChange={(e) => setAuthorRequest({ ...authorRequest, PenName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">بیوگرافی *</label>
                      <textarea 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                        rows={4}
                        placeholder="درباره خود و تجربیات نویسندگی خود بنویسید..."
                        value={authorRequest.Biography}
                        onChange={(e) => setAuthorRequest({ ...authorRequest, Biography: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">وب‌سایت</label>
                      <input 
                        type="url" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                        placeholder="https://example.com"
                        value={authorRequest.Website}
                        onChange={(e) => setAuthorRequest({ ...authorRequest, Website: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">ملیت</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                        placeholder="مثلاً: ایرانی، آمریکایی، انگلیسی و ..."
                        value={authorRequest.Nationality}
                        onChange={(e) => setAuthorRequest({ ...authorRequest, Nationality: e.target.value })}
                      />
                    </div>
                    <button 
                      onClick={handleAuthorRequest}
                      disabled={isSubmittingAuthorRequest}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
                    >
                      {isSubmittingAuthorRequest ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>در حال ارسال...</span>
                        </>
                      ) : (
                        <>
                          <PencilIcon className="h-4 w-4" />
                          <span>ارسال درخواست نویسندگی</span>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 text-right">
                      * فیلدهای ضروری - درخواست شما پس از بررسی توسط تیم ما پردازش خواهد شد
                    </p>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs can be added here */}
      {activeTab !== 'profile' && activeTab !== 'analytics' && activeTab !== 'overview' && activeTab !== 'orders' && activeTab !== 'library' && activeTab !== 'wishlist' && activeTab !== 'likes' && activeTab !== 'comments' && activeTab !== 'reports' && activeTab !== 'royalties' && activeTab !== 'notifications' && activeTab !== 'settings' && activeTab !== 'tickets' && activeTab !== 'refunds' && activeTab !== 'addresses' && activeTab !== 'bookmarks' && activeTab !== 'notes' && activeTab !== 'reading-progress' && (
        <div className="space-y-6 lg:space-y-8">
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
              <CogIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">This section is under development and will be available soon.</p>
          </div>
        </div>
      )}
    </UserLayout>
  );
};

const UserProfilePage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <UserProfilePageContent />
    </Suspense>
  );
};

export default UserProfilePage;