import axios, { AxiosResponse } from 'axios';

const BASE_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' ? 'http://localhost:7262/api' : 'http://dev.tvtobook.com/api')
  : 'http://dev.tvtobook.com/api';

// Create axios instance for analytics API
const analyticsApiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Analytics types
export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  conversionRate: number;
  averageOrderValue: number;
  userGrowthRate: number;
  revenueGrowthRate: number;
}

export interface DashboardAnalyticsDto {
  users: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisMonth: number;
    newUsersLastMonth: number;
    verifiedUsers: number;
    authors: number;
    userGrowthRate: number;
  };
  orders: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    ordersToday: number;
    ordersThisMonth: number;
    ordersLastMonth: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  products: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    newProductsThisMonth: number;
    newProductsLastMonth: number;
    productGrowthRate: number;
  };
  revenue: {
    totalRevenue: number;
    revenueToday: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
    revenueThisYear: number;
    revenueLastYear: number;
    revenueGrowthRate: number;
    averageOrderValue: number;
  };
  monthlyUserTrends: Array<{ month: string; year: number; count: number; amount: number }>;
  monthlyOrderTrends: Array<{ month: string; year: number; count: number; amount: number }>;
  monthlyRevenueTrends: Array<{ month: string; year: number; count: number; amount: number }>;
  categoryStatistics: Array<{ categoryName: string; productCount: number; orderCount: number; revenue: number }>;
  geographicStatistics: Array<{ location: string; userCount: number; orderCount: number; revenue: number }>;
  deviceStatistics: {
    desktopUsers: number;
    mobileUsers: number;
    tabletUsers: number;
    desktopPercentage: number;
    mobilePercentage: number;
    tabletPercentage: number;
  };
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  users: number;
}

export interface UserActivityData {
  date: string;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
}

export interface CategoryAnalytics {
  category: string;
  revenue: number;
  orders: number;
  users: number;
  growth: number;
}

export interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  conversionRate: number;
}

export interface GeographicData {
  country: string;
  users: number;
  revenue: number;
  orders: number;
}

// Mock data
const mockAnalyticsOverview: AnalyticsOverview = {
  totalUsers: 15420,
  activeUsers: 8920,
  totalRevenue: 2450000,
  monthlyRevenue: 180000,
  totalOrders: 12500,
  conversionRate: 3.2,
  averageOrderValue: 196,
  userGrowthRate: 12.5,
  revenueGrowthRate: 8.7
};

const mockRevenueData: RevenueData[] = [
  { date: '2024-01-01', revenue: 45000, orders: 230, users: 1200 },
  { date: '2024-01-02', revenue: 52000, orders: 280, users: 1350 },
  { date: '2024-01-03', revenue: 48000, orders: 250, users: 1280 },
  { date: '2024-01-04', revenue: 61000, orders: 320, users: 1450 },
  { date: '2024-01-05', revenue: 55000, orders: 290, users: 1320 },
  { date: '2024-01-06', revenue: 67000, orders: 350, users: 1580 },
  { date: '2024-01-07', revenue: 59000, orders: 310, users: 1420 },
  { date: '2024-01-08', revenue: 63000, orders: 330, users: 1500 },
  { date: '2024-01-09', revenue: 58000, orders: 300, users: 1380 },
  { date: '2024-01-10', revenue: 65000, orders: 340, users: 1520 },
  { date: '2024-01-11', revenue: 62000, orders: 325, users: 1480 },
  { date: '2024-01-12', revenue: 68000, orders: 360, users: 1620 },
  { date: '2024-01-13', revenue: 60000, orders: 315, users: 1440 },
  { date: '2024-01-14', revenue: 64000, orders: 335, users: 1510 }
];

const mockUserActivityData: UserActivityData[] = [
  { date: '2024-01-01', activeUsers: 1200, newUsers: 45, returningUsers: 1155 },
  { date: '2024-01-02', activeUsers: 1350, newUsers: 52, returningUsers: 1298 },
  { date: '2024-01-03', activeUsers: 1280, newUsers: 38, returningUsers: 1242 },
  { date: '2024-01-04', activeUsers: 1450, newUsers: 68, returningUsers: 1382 },
  { date: '2024-01-05', activeUsers: 1320, newUsers: 41, returningUsers: 1279 },
  { date: '2024-01-06', activeUsers: 1580, newUsers: 75, returningUsers: 1505 },
  { date: '2024-01-07', activeUsers: 1420, newUsers: 48, returningUsers: 1372 },
  { date: '2024-01-08', activeUsers: 1500, newUsers: 62, returningUsers: 1438 },
  { date: '2024-01-09', activeUsers: 1380, newUsers: 44, returningUsers: 1336 },
  { date: '2024-01-10', activeUsers: 1520, newUsers: 58, returningUsers: 1462 },
  { date: '2024-01-11', activeUsers: 1480, newUsers: 51, returningUsers: 1429 },
  { date: '2024-01-12', activeUsers: 1620, newUsers: 78, returningUsers: 1542 },
  { date: '2024-01-13', activeUsers: 1440, newUsers: 46, returningUsers: 1394 },
  { date: '2024-01-14', activeUsers: 1510, newUsers: 55, returningUsers: 1455 }
];

const mockCategoryAnalytics: CategoryAnalytics[] = [
  { category: 'ادبیات', revenue: 450000, orders: 2300, users: 1800, growth: 15.2 },
  { category: 'تاریخ', revenue: 320000, orders: 1600, users: 1200, growth: 8.5 },
  { category: 'علوم', revenue: 280000, orders: 1400, users: 1100, growth: 12.1 },
  { category: 'فلسفه', revenue: 180000, orders: 900, users: 700, growth: 6.8 },
  { category: 'هنر', revenue: 220000, orders: 1100, users: 850, growth: 9.3 },
  { category: 'سایر', revenue: 150000, orders: 750, users: 600, growth: 4.2 }
];

const mockTopProducts: TopProduct[] = [
  { id: '1', name: 'کتاب کلاسیک فارسی', revenue: 125000, orders: 650, conversionRate: 4.2 },
  { id: '2', name: 'تاریخ ایران', revenue: 98000, orders: 490, conversionRate: 3.8 },
  { id: '3', name: 'فلسفه اسلامی', revenue: 87000, orders: 435, conversionRate: 3.5 },
  { id: '4', name: 'ادبیات معاصر', revenue: 76000, orders: 380, conversionRate: 3.2 },
  { id: '5', name: 'علوم تجربی', revenue: 68000, orders: 340, conversionRate: 2.9 }
];

const mockGeographicData: GeographicData[] = [
  { country: 'ایران', users: 8500, revenue: 1200000, orders: 6100 },
  { country: 'آمریکا', users: 2100, revenue: 420000, orders: 2100 },
  { country: 'کانادا', users: 1800, revenue: 360000, orders: 1800 },
  { country: 'انگلستان', users: 1200, revenue: 240000, orders: 1200 },
  { country: 'آلمان', users: 900, revenue: 180000, orders: 900 },
  { country: 'سایر', users: 920, revenue: 184000, orders: 920 }
];

// Analytics API
export const analyticsApi = {
  // Get analytics overview
  getOverview: async (fromDate?: string, toDate?: string): Promise<AxiosResponse<{ data: DashboardAnalyticsDto; isSucceeded: boolean; message: string }>> => {
    const params: any = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    return analyticsApiClient.get('/Statistics', { params });
  },

  // Get revenue data
  getRevenueData: async (startDate?: string, endDate?: string): Promise<AxiosResponse<RevenueData[]>> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return { data: mockRevenueData } as AxiosResponse<RevenueData[]>;
  },

  // Get user activity data
  getUserActivityData: async (startDate?: string, endDate?: string): Promise<AxiosResponse<UserActivityData[]>> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return { data: mockUserActivityData } as AxiosResponse<UserActivityData[]>;
  },

  // Get category analytics
  getCategoryAnalytics: async (): Promise<AxiosResponse<CategoryAnalytics[]>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: mockCategoryAnalytics } as AxiosResponse<CategoryAnalytics[]>;
  },

  // Get top products
  getTopProducts: async (limit: number = 10): Promise<AxiosResponse<TopProduct[]>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: mockTopProducts.slice(0, limit) } as AxiosResponse<TopProduct[]>;
  },

  // Get geographic data
  getGeographicData: async (): Promise<AxiosResponse<GeographicData[]>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: mockGeographicData } as AxiosResponse<GeographicData[]>;
  },

  // Get real-time metrics
  getRealTimeMetrics: async (): Promise<AxiosResponse<any>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { 
      data: {
        currentUsers: Math.floor(Math.random() * 100) + 50,
        currentOrders: Math.floor(Math.random() * 20) + 5,
        currentRevenue: Math.floor(Math.random() * 5000) + 1000,
        lastUpdated: new Date().toISOString()
      }
    } as AxiosResponse<any>;
  },

  // Get conversion funnel data
  getConversionFunnel: async (): Promise<AxiosResponse<any>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      data: {
        visitors: 10000,
        pageViews: 25000,
        addToCart: 1500,
        checkout: 800,
        completed: 500,
        conversionRate: 5.0
      }
    } as AxiosResponse<any>;
  },

  // Get device analytics
  getDeviceAnalytics: async (): Promise<AxiosResponse<any>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      data: {
        desktop: { users: 4500, percentage: 45 },
        mobile: { users: 3800, percentage: 38 },
        tablet: { users: 1700, percentage: 17 }
      }
    } as AxiosResponse<any>;
  },

  // Get browser analytics
  getBrowserAnalytics: async (): Promise<AxiosResponse<any>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      data: {
        chrome: { users: 5500, percentage: 55 },
        firefox: { users: 2000, percentage: 20 },
        safari: { users: 1500, percentage: 15 },
        edge: { users: 1000, percentage: 10 }
      }
    } as AxiosResponse<any>;
  }
};

export default analyticsApi;

