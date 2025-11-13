'use client'

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  User, 
  Search, 
  Menu, 
  X, 
  Sun, 
  Moon,
  BookOpen,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  ShoppingBag,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner, TvtoBookSpinner } from '@/components/ui/spinner';
import { useCartStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/providers/ThemeProvider';
import { useLoading } from '@/providers/LoadingProvider';
import { getCurrentUser } from '@/utils/jwtUtils';
import { toPersianNumber } from '@/utils/numberUtils';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { getTotalItems, syncCart, items: cartItems } = useCartStore();
  const { user, isAuthenticated, isLoading: authLoading, logout, checkAuth } = useAuth();
  const { startLoading, stopLoading } = useLoading();

  // Handle client-side only rendering for cart badge to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update cart count when cart items change (after mount to prevent hydration mismatch)
  useEffect(() => {
    if (isMounted) {
      setCartItemCount(getTotalItems());
    }
  }, [cartItems, isMounted, getTotalItems]);

  // Check authentication on component mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Sync cart from database when authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      syncCart();
    }
  }, [authLoading, isAuthenticated, syncCart]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (isAuthenticated) {
        // First check the user from store
        const hasAdminRole = 
          user?.role === 'IsAdmin' || 
          user?.role === 'IsSuperAdmin' ||
          (user?.roles && (
            user.roles.includes('IsAdmin') || 
            user.roles.includes('IsSuperAdmin') ||
            user.roles.includes('SuperAdmin')
          ));

        if (hasAdminRole) {
          setIsAdmin(true);
          return;
        }

        // Fallback: Check with getCurrentUser
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          // Check single role property
          if (currentUser.role === 'IsAdmin' || currentUser.role === 'IsSuperAdmin' || currentUser.role === 'SuperAdmin') {
            setIsAdmin(true);
            return;
          }
          
          // Check multiple roles array
          if (currentUser.roles && Array.isArray(currentUser.roles)) {
            const hasAdmin = currentUser.roles.some((role: string) => 
              role === 'IsAdmin' || role === 'IsSuperAdmin' || role === 'SuperAdmin'
            );
            if (hasAdmin) {
              setIsAdmin(true);
              return;
            }
          }
        }
        setIsAdmin(false);
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdminRole();
  }, [isAuthenticated, user]);

  const navigation = [
    { name: 'خانه', href: '/' },
    { name: 'فروشگاه', href: '/shop' },
    { name: 'کتاب‌ها', href: '/shop?category=book' },
    { name: 'کتاب‌های الکترونیکی', href: '/shop?category=ebook' },
    { name: 'کتاب‌های صوتی', href: '/shop?category=audiobook' },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      startLoading('جستجوی کتاب‌ها...', true);
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
      stopLoading();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">TvtoBook</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
            {navigation.map((item) => {
              const isActive = (() => {
                if (item.href === '/') {
                  return pathname === '/';
                }
                if (item.href.startsWith('/shop')) {
                  const itemUrl = new URL(item.href, 'http://localhost');
                  const currentCategory = searchParams.get('category');
                  const itemCategory = itemUrl.searchParams.get('category');
                  
                  if (pathname === '/shop') {
                    if (item.href === '/shop') {
                      return !currentCategory;
                    }
                    return currentCategory === itemCategory;
                  }
                  return false;
                }
                return pathname === item.href;
              })();
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault()
                    startLoading('در حال بارگذاری...', true)
                    setTimeout(() => {
                      router.push(item.href)
                    }, 50)
                  }}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
                <Input
                  type="text"
                  placeholder="جستجوی کتاب، نویسنده..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 pl-4 rtl:pr-10 rtl:pl-4 ltr:pl-10 ltr:pr-4"
                />
              </div>
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Cart */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-9 w-9"
              onClick={async () => {
                startLoading('در حال بارگذاری سبد خرید...', true, 'high');
                await new Promise(resolve => setTimeout(resolve, 500));
                router.push('/cart');
                stopLoading();
              }}
            >
              <ShoppingCart className="h-4 w-4" />
              {isMounted && cartItemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center rtl:-right-1 ltr:-right-1"
                >
                  {toPersianNumber(cartItemCount)}
                </motion.span>
              )}
            </Button>

            {/* User Menu */}
            {authLoading ? (
              <div className="flex items-center h-9 px-3">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ) : isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2 rtl:space-x-reverse"
                >
                  <User className="h-4 w-4" />
                  <span>{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.fullName || user?.firstName || 'کاربر'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-50 rtl:left-0 ltr:right-0"
                  >
                    <div className="py-1">
                      {/* Welcome Message */}
                      <div className="px-4 py-2 text-sm text-muted-foreground border-b border-gray-200">
                        <div className="font-medium text-primary">خوش آمدید</div>
                        <div className="text-xs">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.fullName || user?.firstName || 'کاربر'}</div>
                      </div>
                      
                      <Link
                        href="/profile?tab=overview"
                        className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          startLoading('در حال بارگذاری داشبورد...', true, 'high');
                          setTimeout(() => stopLoading(), 1000);
                        }}
                      >
                        <LayoutDashboard className="h-4 w-4 ml-3 rtl:ml-3 ltr:mr-3" />
                        داشبورد من
                      </Link>
                      <Link
                        href="/profile?tab=orders"
                        className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          startLoading('در حال بارگذاری سفارشات...', true, 'high');
                          setTimeout(() => stopLoading(), 1000);
                        }}
                      >
                        <ShoppingBag className="h-4 w-4 ml-3 rtl:ml-3 ltr:mr-3" />
                        سفارشات من
                      </Link>
                      <Link
                        href="/profile?tab=settings"
                        className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          startLoading('در حال بارگذاری تنظیمات...', true, 'high');
                          setTimeout(() => stopLoading(), 1000);
                        }}
                      >
                        <Settings className="h-4 w-4 ml-3 rtl:ml-3 ltr:mr-3" />
                        تنظیمات
                      </Link>
                      
                      {/* Admin Dashboard Link - Only show for admin users */}
                      {isAdmin && (
                        <>
                          <hr className="my-1" />
                          <Link
                            href="/admin"
                            className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent"
                            onClick={() => {
                              setIsUserDropdownOpen(false);
                              startLoading('در حال بارگذاری پنل مدیریت...', true, 'high');
                              setTimeout(() => stopLoading(), 1000);
                            }}
                          >
                            <LayoutDashboard className="h-4 w-4 ml-3 rtl:ml-3 ltr:mr-3" />
                            پنل مدیریت
                          </Link>
                        </>
                      )}
                      
                      <hr className="my-1" />
                      <button
                        onClick={async () => {
                          await logout();
                          router.push('/');
                          setIsUserDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent"
                      >
                        <LogOut className="h-4 w-4 ml-3 rtl:ml-3 ltr:mr-3" />
                        خروج
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    ورود
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    ثبت نام
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t py-4"
          >
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => {
                const isActive = (() => {
                  if (item.href === '/') {
                    return pathname === '/';
                  }
                  if (item.href.startsWith('/shop')) {
                    const itemUrl = new URL(item.href, 'http://localhost');
                    const currentCategory = searchParams.get('category');
                    const itemCategory = itemUrl.searchParams.get('category');
                    
                    if (pathname === '/shop') {
                      if (item.href === '/shop') {
                        return !currentCategory;
                      }
                      return currentCategory === itemCategory;
                    }
                    return false;
                  }
                  return pathname === item.href;
                })();
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-primary hover:bg-accent'
                    }`}
                    onClick={(e) => {
                      e.preventDefault()
                      startLoading('در حال بارگذاری...', true)
                      setIsMenuOpen(false)
                      setTimeout(() => {
                        router.push(item.href)
                      }, 50)
                    }}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            

            {/* Mobile Search */}
            <div className="mt-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
                  <Input
                    type="text"
                    placeholder="جستجوی کتاب، نویسنده..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 pl-4 rtl:pr-10 rtl:pl-4 ltr:pl-10 ltr:pr-4"
                  />
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}
