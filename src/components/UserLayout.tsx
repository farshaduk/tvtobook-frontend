'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  ShoppingBag, 
  Download, 
  Heart, 
  Settings, 
  X, 
  Calendar,
  Edit3,
  Menu,
  BookOpen,
  Bookmark,
  FileText,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  MapPin,
  ThumbsUp,
  DollarSign,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/providers/LoadingProvider';
import { ProtectedUserRoute } from './ProtectedUserRoute';
import { Spinner } from '@/components/ui/spinner';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/services/api';

interface UserLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  user?: any;
  isOwnProfile?: boolean;
  onImageUpload?: (file: File) => void;
  isUploadingImage?: boolean;
  userStats?: {
    totalOrders: number;
    totalSpent: number;
    memberSince: string;
  };
  isAuthor?: boolean;
}

const UserLayoutContent: React.FC<UserLayoutProps> = ({
  children,
  activeTab = 'overview',
  onTabChange,
  user,
  isOwnProfile = true,
  onImageUpload,
  isUploadingImage = false,
  userStats = { totalOrders: 0, totalSpent: 0, memberSince: new Date().toISOString() },
  isAuthor = false
}) => {
  const router = useRouter();
  const { logout } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch unread notification count
  const { data: unreadCountResponse } = useQuery({
    queryKey: ['user-notifications-unread-count', user?.id],
    queryFn: async () => {
      const response = await notificationApi.getUnreadCount();
      return response.data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadNotificationCount = unreadCountResponse?.data || 0;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  const handleTabClick = async (tabId: string) => {
    if (tabId === 'logout') {
      await logout();
      router.push('/');
    } else if (onTabChange) {
      // Show loading when switching tabs
      const loadingMessages = {
        overview: 'در حال بارگذاری داشبورد...',
        orders: 'در حال بارگذاری سفارشات...',
        library: 'در حال بارگذاری کتابخانه...',
        wishlist: 'در حال بارگذاری لیست خرید...',
        likes: 'در حال بارگذاری علاقه‌مندی‌ها...',
        comments: 'در حال بارگذاری نظرات...',
        reports: 'در حال بارگذاری گزارشات...',
        notifications: 'در حال بارگذاری اعلانات...',
        settings: 'در حال بارگذاری تنظیمات...',
        tickets: 'در حال بارگذاری تیکت‌ها...',
        refunds: 'در حال بارگذاری بازگشت‌های وجه...',
        bookmarks: 'در حال بارگذاری نشانک‌ها...',
        notes: 'در حال بارگذاری یادداشت‌ها...',
        'reading-progress': 'در حال بارگذاری پیشرفت مطالعه...',
        addresses: 'در حال بارگذاری آدرس‌ها...',
        royalties: 'در حال بارگذاری سهم‌های نویسندگی...'
      };
      
      startLoading(loadingMessages[tabId as keyof typeof loadingMessages] || 'در حال بارگذاری...', true, 'high');
      
      // Close mobile menu if open
      setIsMobileMenuOpen(false);
      
      // Simulate loading time
      setTimeout(() => {
        stopLoading();
        onTabChange(tabId);
      }, 800);
    }
  };

  const navigationItems = [
    { id: 'overview', label: 'بررسی اجمالی', icon: User, badge: null },
    { id: 'orders', label: 'سفارشات', icon: ShoppingBag, badge: userStats.totalOrders },
    { id: 'library', label: 'کتابخانه', icon: Download, badge: null },
    { id: 'reading-progress', label: 'پیشرفت مطالعه', icon: TrendingUp, badge: null },
    { id: 'bookmarks', label: 'نشانک‌ها', icon: Bookmark, badge: null },
    { id: 'notes', label: 'یادداشت‌ها', icon: FileText, badge: null },
    { id: 'comments', label: 'نظرات من', icon: MessageSquare, badge: null },
    { id: 'reports', label: 'گزارشات من', icon: FileText, badge: null },
    { id: 'notifications', label: 'اعلانات', icon: Bell, badge: unreadNotificationCount > 0 ? unreadNotificationCount : null },
    { id: 'tickets', label: 'تیکت‌های پشتیبانی', icon: MessageSquare, badge: null },
    { id: 'refunds', label: 'بازگشت وجه', icon: RefreshCw, badge: null },
    { id: 'addresses', label: 'آدرس‌های من', icon: MapPin, badge: null },
    { id: 'wishlist', label: 'لیست خرید', icon: Heart, badge: null },
    { id: 'likes', label: 'علاقه‌مندی‌ها', icon: ThumbsUp, badge: null },
    ...(isAuthor ? [{ id: 'royalties', label: 'سهم‌های نویسندگی', icon: DollarSign, badge: null }] : []),
    { id: 'settings', label: 'تنظیمات', icon: Settings, badge: null },
    { id: 'logout', label: 'خروج', icon: X, badge: null }
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Floating Mobile Menu Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsMobileMenuOpen(!isMobileMenuOpen);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsMobileMenuOpen(!isMobileMenuOpen);
        }}
        className="fixed bottom-6 left-6 z-[60] lg:hidden w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 touch-manipulation active:scale-95 select-none cursor-pointer"
        style={{ 
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
        type="button"
        aria-label="Toggle mobile menu"
      >
        <Menu className="h-6 w-6 pointer-events-none" />
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden transition-opacity duration-300 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMobileMenuOpen(false);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMobileMenuOpen(false);
          }}
          style={{ 
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
          aria-label="Close menu overlay"
        />
      )}

      <div className="flex flex-col lg:flex-row">
        {/* Enhanced Sidebar - Responsive */}
        <div className={`w-full lg:w-80 bg-white shadow-lg border-b lg:border-l lg:border-b-0 border-gray-200 lg:min-h-screen max-h-96 lg:max-h-none overflow-y-auto lg:overflow-y-visible transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed lg:relative top-0 left-0 z-[50] lg:z-auto`}>
          {/* Profile Header - Responsive */}
          <div className="p-3 lg:p-6 border-b border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-100">
            {/* Mobile Close Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMobileMenuOpen(false);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMobileMenuOpen(false);
              }}
              className="absolute top-4 right-4 lg:hidden w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors shadow-sm touch-manipulation active:scale-90 select-none cursor-pointer"
              style={{ 
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
              type="button"
              aria-label="Close menu"
            >
              <X className="h-4 w-4 text-gray-600 pointer-events-none" />
            </button>
            
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-12 h-12 lg:w-20 lg:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm lg:text-2xl font-bold shadow-lg">
                  {isUploadingImage ? (
                    <Spinner size="sm" showText={false} className="border-white/20 border-t-white" />
                  ) : user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || 'U'
                  )}
                </div>
              </div>
              <div className="mt-2 lg:mt-4">
                <h2 className="text-sm lg:text-xl font-bold text-gray-900">
                  {`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'نام کاربر'}
                </h2>
                <p className="text-xs lg:text-sm text-gray-600 break-all">{user?.email || 'ایمیل کاربر'}</p>
                <div className="flex items-center justify-center mt-1 lg:mt-2 text-xs text-gray-500 rtl:flex-row-reverse">
                  <span className="rtl:mr-1 rtl:ml-0">عضویت از {new Date(userStats.memberSince).toLocaleDateString('fa-IR')}</span>
                  <Calendar className="h-3 w-3 lg:h-4 lg:w-4 rtl:mr-1 rtl:ml-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats - Responsive */}
          <div className="p-2 lg:p-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 gap-2 lg:gap-4">
              <div className="text-center">
                <div className="text-sm lg:text-xl font-bold text-indigo-600">{userStats.totalOrders}</div>
                <div className="text-xs text-gray-600">سفارشات</div>
              </div>
              <div className="text-center">
                <div className="text-sm lg:text-xl font-bold text-emerald-600">{userStats.totalSpent} تومان</div>
                <div className="text-xs text-gray-600">هزینه شده</div>
              </div>
            </div>
          </div>

          {/* Navigation - Responsive */}
          <nav className="p-2 lg:p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-2 lg:px-4 py-1.5 lg:py-3 text-right rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-700 shadow-sm'
                      : item.id === 'logout' 
                        ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center rtl:flex-row-reverse">
                    <span className="font-medium text-sm lg:text-base text-right rtl:mr-2 rtl:ml-0">{item.label}</span>
                    <Icon className={`h-4 w-4 lg:h-5 lg:w-5 rtl:mr-0 rtl:ml-0 ${
                      activeTab === item.id ? 'text-indigo-600' : item.id === 'logout' ? 'text-red-500' : 'text-gray-500'
                    }`} />
                  </div>
                  {item.badge && (
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 lg:px-2.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content - Responsive */}
        <div className="flex-1 overflow-auto relative">
          <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
            {/* Content loading area with specified div structure */}
            <div className="space-y-6 lg:space-y-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserLayout: React.FC<UserLayoutProps> = (props) => {
  return (
    <ProtectedUserRoute>
      <UserLayoutContent {...props} />
    </ProtectedUserRoute>
  );
};

export default UserLayout;
