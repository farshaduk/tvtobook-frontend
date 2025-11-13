'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  BarChart3, 
  Settings, 
  FileText,
  Shield,
  X,
  Menu,
  LogOut,
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/providers/LoadingProvider';
import { useConfirmation } from '@/hooks/useConfirmationMo';
import { ProtectedAdminRoute } from '@/components/ProtectedRoute';
import { SessionWarning } from '@/components/SessionWarning';
import { getUserDisplayName } from '@/utils/roleUtils';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  adminStats?: {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    pendingReports: number;
  };
}

export default function AdminLayout({
  children,
  activeTab = 'dashboard',
  onTabChange,
  adminStats = { totalUsers: 0, totalOrders: 0, totalRevenue: 0, pendingReports: 0 }
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const { showConfirmation } = useConfirmation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['main']);
  const [currentActiveTab, setCurrentActiveTab] = useState('dashboard');

  // Update active tab based on current route
  useEffect(() => {
    const routeToTabMap: { [key: string]: string } = {
      '/admin/dashboard': 'dashboard',
      '/admin/users': 'users',
      '/admin/business-users': 'business',
      '/admin/ads': 'ads',
      '/admin/categories': 'categories',
      '/admin/authors': 'authors',
      '/admin/products': 'products',
      '/admin/products/create': 'products',
      '/admin/banners': 'banners',
      '/admin/analytics': 'analytics',
      '/admin/financial-reports': 'financial-reports',
      '/admin/user-reports': 'user-reports',
      '/admin/orders': 'orders',
      '/admin/payments': 'payments',
      '/admin/refunds': 'refunds',
      '/admin/tickets': 'tickets',
      '/admin/coupons': 'coupons',
      '/admin/royalties': 'royalties',
      '/admin/reviews': 'comments',
      '/admin/email-templates': 'email-templates',
      '/admin/seo': 'seo',
      '/admin/logs': 'logs'
    };

    const tabFromRoute = routeToTabMap[pathname] || 'dashboard';
    setCurrentActiveTab(tabFromRoute);
  }, [pathname]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleTabClick = async (tabId: string) => {
    if (tabId === 'logout') {
      showConfirmation({
        title: 'خروج از پنل مدیریت',
        message: 'آیا مطمئن هستید که می‌خواهید از پنل مدیریت خارج شوید؟',
        confirmText: 'خروج',
        cancelText: 'انصراف',
        type: 'warning',
        onConfirm: async () => {
          startLoading('در حال خروج از پنل مدیریت...', true);
          router.push('/login');
          try {
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            stopLoading();
          }
        }
      });
    } else if (tabId === 'dashboard') {
      router.push('/admin/dashboard');
    } else if (tabId === 'categories') {
      router.push('/admin/categories');
    } else if (tabId === 'orders') {
      router.push('/admin/orders');
    } else if (tabId === 'payments') {
      router.push('/admin/payments');
    } else if (tabId === 'refunds') {
      router.push('/admin/refunds');
    } else if (tabId === 'tickets') {
      router.push('/admin/tickets');
    } else if (tabId === 'coupons') {
      router.push('/admin/coupons');
    } else if (tabId === 'royalties') {
      router.push('/admin/royalties');
    } else {
      // Show loading when switching tabs
      const loadingMessages = {
        // Main Dashboard
        dashboard: 'در حال بارگذاری داشبورد...',
        
        // User Management
        users: 'در حال بارگذاری مدیریت کاربران...',
        support: 'در حال بارگذاری مدیریت پشتیبانی...',
        feedback: 'در حال بارگذاری مدیریت بازخوردها...',
        ratings: 'در حال بارگذاری مدیریت امتیازات...',
        'user-reports': 'در حال بارگذاری مدیریت گزارشات کاربران...',
        
        // Content Management
        content: 'در حال بارگذاری مدیریت محتوا...',
        comments: 'در حال بارگذاری مدیریت نظرات...',
        categories: 'در حال بارگذاری مدیریت دسته‌بندی‌ها...',
        authors: 'در حال بارگذاری مدیریت نویسندگان...',
        products: 'در حال بارگذاری مدیریت محصولات...',
        tags: 'در حال بارگذاری مدیریت برچسب‌ها...',
        
        // Financial Management
        orders: 'در حال بارگذاری مدیریت سفارشات...',
        payments: 'در حال بارگذاری مدیریت پرداخت‌ها...',
        refunds: 'در حال بارگذاری مدیریت بازگشت‌های وجه...',
        royalties: 'در حال بارگذاری مدیریت سهم نویسندگان...',
        coupons: 'در حال بارگذاری مدیریت کوپن‌ها...',
        'financial-reports': 'در حال بارگذاری گزارشات مالی...',
        discounts: 'در حال بارگذاری مدیریت تخفیفات...',
        
        // System Management
        tickets: 'در حال بارگذاری مدیریت تیکت‌های پشتیبانی...',
        system: 'در حال بارگذاری مدیریت سیستم...',
        notifications: 'در حال بارگذاری مدیریت اعلانات...',
        'email-templates': 'در حال بارگذاری مدیریت ایمیل‌ها...',
        backup: 'در حال بارگذاری پشتیبان‌گیری...',
        
        // Analytics & Monitoring
        analytics: 'در حال بارگذاری آمار و گزارشات...',
        'user-behavior': 'در حال بارگذاری تحلیل رفتار کاربران...',
        seo: 'در حال بارگذاری مدیریت SEO...',
        performance: 'در حال بارگذاری گزارشات عملکرد...',
        logs: 'در حال بارگذاری مدیریت لاگ‌ها...',
        
        // Security & Compliance
        security: 'در حال بارگذاری مدیریت امنیت...',
        'access-control': 'در حال بارگذاری مدیریت دسترسی‌ها...',
        'ip-management': 'در حال بارگذاری مدیریت IP ها...',
        gdpr: 'در حال بارگذاری مدیریت GDPR...',
        
        
      };

      // Close mobile menu if open
      setIsMobileMenuOpen(false);

      // Navigate to the appropriate admin route
      const routeMap: { [key: string]: string } = {
        dashboard: '/admin/dashboard',
        users: '/admin/users',
        business: '/admin/business-users',
        ads: '/admin/ads',
        categories: '/admin/categories',
        authors: '/admin/authors',
        products: '/admin/products',
        banners: '/admin/banners',
        analytics: '/admin/analytics',
        'user-reports': '/admin/user-reports',
        orders: '/admin/orders',
        payments: '/admin/payments',
        refunds: '/admin/refunds',
        tickets: '/admin/tickets',
        coupons: '/admin/coupons',
        royalties: '/admin/royalties',
        'financial-reports': '/admin/dashboard?tab=financial-reports',
        comments: '/admin/reviews',
        ratings: '/admin/ratings',
        feedback: '/admin/feedback',
        content: '/admin/content',
        tags: '/admin/tags',
        system: '/admin/system',
        notifications: '/admin/notifications',
        'email-templates': '/admin/email-templates',
        seo: '/admin/seo',
        logs: '/admin/logs'
      };

      const targetRoute = routeMap[tabId] || '/admin/dashboard';
      
      router.push(targetRoute);
    }
  };

  const navigationCategories = [
    {
      id: 'main',
      label: 'اصلی',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard, badge: null }
      ]
    },
    {
      id: 'users',
      label: 'مدیریت کاربران',
      icon: Users,
      items: [
        { id: 'users', label: 'کاربران', icon: Users, badge: null },
        { id: 'orders', label: 'سفارشات', icon: ShoppingBag, badge: null },
        { id: 'support', label: 'پشتیبانی', icon: Users, badge: null },
        { id: 'feedback', label: 'بازخوردها', icon: FileText, badge: null },
        { id: 'ratings', label: 'امتیازات', icon: BarChart3, badge: null },
        { id: 'user-reports', label: 'گزارشات کاربران', icon: FileText, badge: null }
      ]
    },
    {
      id: 'content',
      label: 'مدیریت محتوا',
      icon: FileText,
      items: [
        { id: 'content', label: 'محتوا', icon: FileText, badge: null },
        { id: 'comments', label: 'نظرات', icon: FileText, badge: null },
        { id: 'categories', label: 'دسته‌بندی‌ها', icon: FileText, badge: null },
        { id: 'authors', label: 'نویسندگان', icon: Users, badge: null },
        { id: 'products', label: 'محصولات', icon: ShoppingBag, badge: null },
        { id: 'tags', label: 'برچسب‌ها', icon: FileText, badge: null }
      ]
    },
    {
      id: 'financial',
      label: 'مدیریت مالی',
      icon: ShoppingBag,
      items: [
        { id: 'orders', label: 'سفارشات', icon: ShoppingBag, badge: null },
        { id: 'payments', label: 'پرداخت‌ها', icon: ShoppingBag, badge: null },
        { id: 'refunds', label: 'بازگشت‌های وجه', icon: ShoppingBag, badge: null },
        { id: 'royalties', label: 'سهم نویسندگان', icon: ShoppingBag, badge: null },
        { id: 'coupons', label: 'کوپن‌ها', icon: ShoppingBag, badge: null },
        { id: 'financial-reports', label: 'گزارشات مالی', icon: FileText, badge: null }
      ]
    },
    {
      id: 'system',
      label: 'مدیریت سیستم',
      icon: Settings,
      items: [
        { id: 'tickets', label: 'تیکت‌های پشتیبانی', icon: FileText, badge: null },
        { id: 'system', label: 'سیستم', icon: Settings, badge: null },
        { id: 'notifications', label: 'اعلانات', icon: Bell, badge: null },
        { id: 'email-templates', label: 'قالب‌های ایمیل', icon: FileText, badge: null },
        { id: 'backup', label: 'پشتیبان‌گیری', icon: FileText, badge: null }
      ]
    },
    {
      id: 'analytics',
      label: 'آمار و گزارشات',
      icon: BarChart3,
      items: [
        { id: 'analytics', label: 'آمار', icon: BarChart3, badge: null },
        { id: 'user-behavior', label: 'تحلیل رفتار کاربران', icon: BarChart3, badge: null },
        { id: 'seo', label: 'مدیریت SEO', icon: BarChart3, badge: null },
        { id: 'performance', label: 'گزارشات عملکرد', icon: BarChart3, badge: null },
        { id: 'logs', label: 'لاگ‌ها', icon: FileText, badge: null }
      ]
    },
    {
      id: 'security',
      label: 'امنیت ',
      icon: Shield,
      items: [
        { id: 'security', label: 'امنیت', icon: Shield, badge: null },
        { id: 'access-control', label: 'کنترل دسترسی', icon: Shield, badge: null },
        { id: 'ip-management', label: 'مدیریت IP', icon: Shield, badge: null },
        { id: 'gdpr', label: 'GDPR', icon: Shield, badge: null }
      ]
    },
    {
      id: 'settings',
      label: 'تنظیمات',
      icon: Settings,
      items: [
        { id: 'logout', label: 'خروج', icon: LogOut, badge: null }
      ]
    }
  ];

  return (
    <ProtectedAdminRoute>
      <SessionWarning />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100" dir="rtl">
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
          className="fixed bottom-6 left-6 z-[60] lg:hidden w-14 h-14 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl touch-manipulation active:scale-95 select-none cursor-pointer"
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[45] lg:hidden transition-opacity duration-300 cursor-pointer"
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
          {/* Admin Sidebar - Responsive */}
          <div className={`w-full lg:w-80 bg-white/95 backdrop-blur-xl shadow-2xl border-b lg:border-l lg:border-b-0 border-gray-200/50 lg:min-h-screen max-h-96 lg:max-h-none overflow-y-auto lg:overflow-y-visible transition-all duration-500 ease-out lg:translate-x-0 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:relative top-0 left-0 z-[50] lg:z-auto`}>
          
          {/* Admin Header - Responsive */}
          <div className="p-4 lg:p-8 border-b border-gray-200/50 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-black/10">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            </div>
            
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
              className="absolute top-4 right-4 lg:hidden w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 touch-manipulation active:scale-90 select-none cursor-pointer"
              style={{ 
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
              type="button"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-white pointer-events-none" />
            </button>
            
            <div className="text-center relative z-10">
              <div className="relative inline-block">
                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white shadow-2xl border border-white/30">
                  <Shield className="h-8 w-8 lg:h-12 lg:w-12" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="mt-4 lg:mt-6">
                <h2 className="text-lg lg:text-2xl font-bold text-white drop-shadow-sm">
                  پنل مدیریت
                </h2>
                <p className="text-sm lg:text-base text-white/90 mt-1">
                  {getUserDisplayName(user)}
                </p>
                <div className="flex items-center justify-center mt-2 text-xs text-white/80 rtl:flex-row-reverse bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 inline-flex">
                  <span className="rtl:mr-1 rtl:ml-0">مدیر سیستم</span>
                  <Shield className="h-3 w-3 rtl:mr-1 rtl:ml-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Admin Quick Stats - Responsive */}
          <div className="p-4 lg:p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-200">
                <div className="text-center">
                  <div className="text-lg lg:text-2xl font-bold text-blue-600 mb-1">{adminStats.totalUsers}</div>
                  <div className="text-xs lg:text-sm text-gray-600 font-medium">کاربران</div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-200">
                <div className="text-center">
                  <div className="text-lg lg:text-2xl font-bold text-green-600 mb-1">{adminStats.totalOrders}</div>
                  <div className="text-xs lg:text-sm text-gray-600 font-medium">سفارشات</div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-200">
                <div className="text-center">
                  <div className="text-lg lg:text-2xl font-bold text-purple-600 mb-1">${adminStats.totalRevenue}</div>
                  <div className="text-xs lg:text-sm text-gray-600 font-medium">درآمد</div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 lg:p-4 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-200">
                <div className="text-center">
                  <div className="text-lg lg:text-2xl font-bold text-orange-600 mb-1">{adminStats.pendingReports}</div>
                  <div className="text-xs lg:text-sm text-gray-600 font-medium">گزارشات</div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Navigation - Responsive */}
          <nav className="p-3 lg:p-6 space-y-1">
            {navigationCategories.map((category) => {
              const CategoryIcon = category.icon;
              const isExpanded = expandedCategories.includes(category.id);
              const hasActiveItem = category.items.some(item => currentActiveTab === item.id);
              
              return (
                <div key={category.id} className="space-y-1">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 lg:px-4 py-2 lg:py-3 text-right rounded-lg transition-all duration-300 group ${
                      hasActiveItem
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <div className="flex items-center rtl:flex-row-reverse">
                      <CategoryIcon className="h-4 w-4 lg:h-5 lg:w-5 rtl:mr-2 rtl:ml-0 text-gray-500 group-hover:text-gray-700" />
                      <span className="font-semibold text-sm lg:text-base rtl:mr-2 rtl:ml-0">{category.label}</span>
                    </div>
                    <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                  
                  {/* Category Items */}
                  {isExpanded && (
                    <div className="mr-4 lg:mr-6 space-y-1">
                      {category.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={`w-full flex items-center justify-between px-3 lg:px-4 py-2 lg:py-3 text-right rounded-lg transition-all duration-300 group ${
                              currentActiveTab === item.id
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 transform scale-[1.02]'
                                : item.id === 'logout' 
                                  ? 'text-red-600 hover:bg-red-50 hover:text-red-700 hover:shadow-md'
                                  : 'text-gray-700 hover:bg-white/80 hover:text-gray-900 hover:shadow-md hover:backdrop-blur-sm'
                            }`}
                          >
                            <div className="flex items-center rtl:flex-row-reverse">
                              <ItemIcon className={`h-4 w-4 lg:h-5 lg:w-5 rtl:mr-2 rtl:ml-0 transition-all duration-200 ${
                                currentActiveTab === item.id ? 'text-white' : item.id === 'logout' ? 'text-red-500' : 'text-gray-500 group-hover:text-gray-700'
                              }`} />
                              <span className="font-medium text-sm lg:text-base rtl:mr-2 rtl:ml-0 transition-all duration-200">{item.label}</span>
                            </div>
                            {item.badge && item.badge > 0 && (
                              <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center transition-all duration-200 ${
                                currentActiveTab === item.id 
                                  ? 'bg-white/30 text-white' 
                                  : 'bg-primary-100 text-primary-700 group-hover:bg-primary-200'
                              }`}>
                                <Bell className="h-3 w-3 ml-1" />
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Main Content - Responsive */}
        <div className="flex-1 overflow-auto relative">
          <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 h-full">
            {/* Content loading area with specified div structure */}
            <div className="space-y-6 lg:space-y-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-xl border border-white/20 h-full">
              {children}
            </div>
          </div>
        </div>
      </div>
       </div> 
    </ProtectedAdminRoute>
  );
}
