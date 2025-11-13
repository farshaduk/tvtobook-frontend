import axios, { AxiosResponse } from 'axios';

// Type declaration for process.env
declare const process: {
  env: {
    NODE_ENV: string;
  };
};


const BASE_URL = typeof window !== 'undefined' 
  ? (window.location.hostname === 'localhost' ? 'http://localhost:7262/api' : 'http://dev.tvtobook.com/api')
  : 'http://dev.tvtobook.com/api';



// Create axios instance for admin API
const adminApiClient = axios.create({ 
  baseURL: BASE_URL,
  withCredentials: true, // Include cookies for authentication
  headers: {
    'Content-Type': 'application/json',
  },
});


// Export the admin API client for use in other files
export { adminApiClient };

// Add request interceptor to ensure cookies are sent
adminApiClient.interceptors.request.use(
  (config) => {
    // Ensure credentials are always sent with admin requests
    config.withCredentials = true;
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔵 Admin API Request:', config.method?.toUpperCase(), config.url);
      console.log('🔵 Full URL:', `${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
adminApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🔴 Admin API Error');
      console.error('Request URL:', error.config?.url);
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data?.message || error.message);
      if (typeof document !== 'undefined') {
        console.error('Cookies:', document.cookie);
      }
      console.groupEnd();
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Only redirect to admin login if we're on admin pages but not already on login page
      const currentPath = window.location.pathname;
      const adminAuthEndpoints = ['/admin/login'];
      const isAdminAuthEndpoint = adminAuthEndpoints.some(endpoint => error.config?.url?.includes(endpoint));
      
      if (currentPath.startsWith('/admin') && !currentPath.includes('/login') && !isAdminAuthEndpoint) {
        console.warn('Admin unauthorized access detected, redirecting to admin login');
        window.location.replace('/admin/login');
      }
    }
    return Promise.reject(error);
  }
);

// Admin types
export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminUser {
  id: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  dateJoined: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  isVerified: boolean;
}

export interface AdminLoginResponse {
  message: string;
  user: AdminUser;
  requiresOtpVerification: boolean;
}

export interface CreateAdminRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: number; // 0=SuperAdmin, 1=Admin, 2=Moderator, 3=Support
}

export interface AdminDetailDto {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[]; // Support multiple roles
  isActive: boolean;
  createdDate: string;
  lastLoginDate?: string;
  profileImageUrl?: string;
  loginAttempts: number;
  lastPasswordChange?: string;
  createdBy?: string;
  permissions: string[];
}

export interface UpdateAdminRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: number[]; // Support multiple roles
  isActive: boolean;
}

export interface AdminRoleAssignmentRequest {
  adminId: string;
  roles: number[]; // Array of role numbers
}

// User Management Types
export interface RoleInfoDto {
  id: string;
  name: string;
  pageName?: string;
  description?: string;
  sort?: number;
}

export interface AdminUserDto {
  id: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  userType: string;
  isActive: boolean;
  isVerified: boolean;
  isAuthor?: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  city?: string;
  province?: string;
  businessName?: string;
  profileImageUrl?: string;
  totalAds: number;
  activeAds: number;
  roles?: RoleInfoDto[];
  roleTitle?: string;
}

export interface AdminUserDetailDto extends AdminUserDto {
  postalCode?: string;
  businessDescription?: string;
  businessWebsite?: string;
  allowPhoneContact: boolean;
  allowEmailContact: boolean;
  receiveNewsletters: boolean;
  receiveMarketingEmails: boolean;
  recentAds: AdminAdSummaryDto[];
}

export interface AdminUpdateUserDto {
  Id: string;
  FirstName: string;
  LastName: string;
  PhoneNumber?: string;
  IsActive: boolean;
  EmailConfirmed: boolean;
  PhoneNumberConfirmed: boolean;
  IsProfileComplete: boolean;
}

export interface AdminCreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  isVerified: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  city?: string;
  province?: string;
  postalCode?: string;
  businessName?: string;
  businessDescription?: string;
  businessWebsite?: string;
  userType: string;
}

// User Online Status Types
export interface UserOnlineStatusDto {
  userId: string;
  isOnline: boolean;
  activeSessionsCount: number;
  totalDevicesCount: number;
  lastActivity?: string;
  activeSessions: UserSessionInfoDto[];
  userDevices: UserDeviceInfoDto[];
}

export interface UserSessionInfoDto {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivityAt?: string;
  expiresAt: string;
  isActive: boolean;
}

export interface UserDeviceInfoDto {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  userAgent: string;
  ipAddress: string;
  firstLoginAt: string;
  lastLoginAt: string;
  isActive: boolean;
}

// Ad Management Types
export interface AdminAdDto {
  id: string;
  title: string;
  price: number;
  currency?: string;
  status: string;
  datePosted: string;
  dateUpdated?: string;
  expiryDate?: string;
  viewCount: number;
  isFeatured: boolean;
  isUrgent: boolean;
  isPromoted: boolean;
  city: string;
  province: string;
  categoryName: string;
  userName: string;
  userEmail: string;
  userIsVerified: boolean;
}

export interface AdminAdDetailDto extends AdminAdDto {
  description: string;
  isNegotiable: boolean;
  isHighlighted: boolean;
  isTopAd: boolean;
  allowPhoneContact: boolean;
  allowEmailContact: boolean;
  allowChatContact: boolean;
  address: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  userPhone?: string;
  images: AdminAdImageDto[];
  videos: AdminAdVideoDto[];
}

export interface AdminAdImageDto {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export interface AdminAdVideoDto {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
}

export interface AdminAdSummaryDto {
  id: string;
  title: string;
  price: number;
  status: string;
  datePosted: string;
  viewCount: number;
}

export interface AdminUpdateAdDto {
  title: string;
  description: string;
  price: number;
  isNegotiable: boolean;
  status: string;
  isFeatured: boolean;
  isUrgent: boolean;
  isHighlighted: boolean;
  isTopAd: boolean;
  isPromoted: boolean;
}

// Category Management Types
export interface AdminCategoryDto {
  id: string;
  parentId?: string;
  title: string;
  slug: string;
  iconUrl?: string;
  description?: string;
  isFilterable: boolean;
  isActive: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCreateCategoryDto {
  Title: string;
  Description?: string;
  Slug: string;
  IconUrl?: string;
  ParentId?: string;
  Sort: number;
  IsActive: boolean;
  IsFilterable: boolean;
}

export interface AdminUpdateCategoryDto {
  Id: string;
  Title: string;
  Description?: string;
  Slug: string;
  IconUrl?: string;
  ParentId?: string;
  Sort: number;
  IsActive: boolean;
  IsFilterable: boolean;
}

export interface CreateCategoryAttributeValueDto {
  title: string;
  value?: string;
  sort: number;
  isDefault: boolean;
}

export interface CategoryAttributeValueDto {
  id: string;
  categoryAttributeId: string;
  title: string;
  value?: string;
  sort: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryAttributeDto {
  id: string;
  categoryId: string;
  title: string;
  inputType: string;
  isRequired: boolean;
  isFilterable: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
  values?: CategoryAttributeValueDto[];
}

export interface CreateCategoryAttributeDto {
  CategoryId: string;
  Title: string;
  InputType: string;
  IsRequired: boolean;
  IsFilterable: boolean;
  Sort: number;
  Values?: CreateCategoryAttributeValueDto[];
}

export interface UpdateCategoryAttributeValueDto {
  Id: string;
  CategoryAttributeId: string;
  Title: string;
  Value?: string;
  Sort: number;
  IsDefault: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface UpdateCategoryAttributeDto {
  Id: string;
  CategoryId: string;
  Title: string;
  InputType: string;
  IsRequired: boolean;
  IsFilterable: boolean;
  Sort: number;
  Values?: UpdateCategoryAttributeValueDto[];
}

// Dashboard Types
export interface DashboardOverview {
  users: {
    total: number;
    active: number;
    verified: number;
    thisMonth: number;
    lastMonth: number;
    businessUsers: number;
    individualUsers: number;
  };
  ads: {
    total: number;
    active: number;
    pending: number;
    expired: number;
    rejected: number;
    featured: number;
    promoted: number;
    thisMonth: number;
    lastMonth: number;
    averagePrice: number;
    totalViews: number;
  };
  categories: {
    total: number;
    active: number;
    rootCategories: number;
    subCategories: number;
  };
  admins: {
    total: number;
    active: number;
    superAdmins: number;
    moderators: number;
  };
  growth: {
    userGrowthPercentage: number;
    adGrowthPercentage: number;
  };
}

// Mock data for development
const mockBanners: AdminBannerDto[] = [
  {
    id: '1',
    title: 'تبلیغ ویژه کتاب‌های جدید',
    description: 'کتاب‌های جدید با تخفیف ویژه',
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop',
    linkUrl: '/shop',
    position: 1,
    positionName: 'صفحه اصلی - بالا',
    isActive: true,
    sortOrder: 1,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    createdDate: '2024-01-01T00:00:00Z',
    updatedDate: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'پیشنهادات آخر هفته',
    description: 'تخفیف‌های ویژه آخر هفته',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
    linkUrl: '/shop?discount=true',
    position: 2,
    positionName: 'صفحه اصلی - وسط',
    isActive: true,
    sortOrder: 2,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    createdDate: '2024-01-01T00:00:00Z',
    updatedDate: '2024-01-01T00:00:00Z'
  }
];

// Admin API methods with mock implementations
const adminApi = {
  // Admin Authentication (separate from public auth)
  adminLogin: async (data: AdminLoginRequest): Promise<AxiosResponse<AdminLoginResponse>> => 
    adminApiClient.post('/admin/login', data),
  
  adminLogout: async (): Promise<AxiosResponse<{ message: string }>> => 
    adminApiClient.post('/admin/logout'),
  
  getAdminProfile: async (): Promise<AxiosResponse<AdminUser>> => 
    adminApiClient.get('/admin/profile'),

  // User Management
  getUsers: async (page = 1, pageSize = 50, search?: string): Promise<AxiosResponse<{users: AdminUserDto[], pagination: any}>> => 
    adminApiClient.get(`/admin/users?page=${page}&pageSize=${pageSize}${search ? `&search=${search}` : ''}`),

  getAllUsers: async (): Promise<AxiosResponse<AdminUserDto[]>> => 
    adminApiClient.get('/User/allusers'),
  
  getUser: async (id: string): Promise<AxiosResponse<AdminUserDetailDto>> => 
    adminApiClient.get(`/User/${id}`),
  
  getUserOnlineStatus: async (id: string): Promise<AxiosResponse<UserOnlineStatusDto>> => 
    adminApiClient.get(`/User/${id}/online-status`),
  
  updateUser: async (id: string, data: AdminUpdateUserDto): Promise<AxiosResponse<{message: string}>> => 
    adminApiClient.put(`/User/update/${id}`, data),
  
  createUser: async (data: AdminCreateUserDto): Promise<AxiosResponse<{message: string, userId: string}>> => 
    adminApiClient.post('/User', data),
  
  deleteUser: async (id: string): Promise<AxiosResponse<{message: string}>> => 
    adminApiClient.delete(`/User/${id}`),
  
  verifyUser: async (id: string): Promise<AxiosResponse<{message: string}>> => 
    adminApiClient.post(`/User/${id}/verify`),
  
  suspendUser: async (id: string, reason: string): Promise<AxiosResponse<{message: string}>> => 
    adminApiClient.post(`/User/${id}/suspend`, { reason }),

  // Role Management
  getAllRoles: async (): Promise<AxiosResponse<RoleInfoDto[]>> => 
    adminApiClient.get('/User/roles'),
  
  assignRolesToUser: async (userId: string, roleIds: string[]): Promise<AxiosResponse<{message: string}>> => 
    adminApiClient.post(`/User/${userId}/assign-roles`, { 
      userId: userId, 
      roleIds: roleIds 
    }),
  
  // getUserStats: async (): Promise<AxiosResponse<any>> => 
  //   adminApiClient.get('/users/stats'),

  // Ad Management
  getAds: async (page = 1, pageSize = 50, search?: string, status?: string, category?: string): Promise<AxiosResponse<{ads: AdminAdDto[], pagination: any}>> => {
    let url = `/admin/ads?page=${page}&pageSize=${pageSize}`;
    if (search) url += `&search=${search}`;
    if (status) url += `&status=${status}`;
    if (category) url += `&category=${category}`;
    return adminApiClient.get(url);
  },
  
  getAd: async (id: string): Promise<AxiosResponse<AdminAdDetailDto>> => 
    adminApiClient.get(`/admin/ads/${id}`),
  
  updateAd: async (id: string, data: AdminUpdateAdDto): Promise<AxiosResponse<{message: string}>> => 
    adminApiClient.put(`/admin/ads/${id}`, data),
  
  deleteAd: async (id: string): Promise<AxiosResponse<{message: string}>> => 
    adminApiClient.delete(`/admin/ads/${id}`),
  
  approveAd: async (id: string): Promise<AxiosResponse<{message: string}>> => 
    adminApiClient.post(`/admin/ads/${id}/approve`),
  
  rejectAd: async (id: string, reason: string): Promise<AxiosResponse<{message: string}>> => 
    adminApiClient.post(`/admin/ads/${id}/reject`, { reason }),
  
  featureAd: async (id: string, settings: any): Promise<AxiosResponse<{message: string}>> => 
    adminApiClient.post(`/admin/ads/${id}/feature`, settings),
  
  getPendingAds: async (page = 1, pageSize = 20): Promise<AxiosResponse<{ads: AdminAdDto[], pagination: any}>> => 
    adminApiClient.get(`/admin/ads/pending?page=${page}&pageSize=${pageSize}`),
  
  getAdStats: async (): Promise<AxiosResponse<any>> => 
    adminApiClient.get('/admin/ads/stats'),

  

  // Category Management
  getCategories: async (includeInactive = false): Promise<AxiosResponse<AdminCategoryDto[]>> => 
    adminApiClient.get(`/category?includeInactive=${includeInactive}`),
  
  getCategory: async (id: string): Promise<AxiosResponse<AdminCategoryDto>> => 
    adminApiClient.get(`/category/${id}`),
  
  createCategory: async (data: AdminCreateCategoryDto): Promise<AxiosResponse<{message: string, categoryId: string}>> => 
    adminApiClient.post('/category', data),
  
  updateCategory: async (id: string, data: AdminUpdateCategoryDto): Promise<AxiosResponse<{message: string}>> => 
    adminApiClient.put(`/category/${id}`, data),
  
  deleteCategory: async (id: string): Promise<AxiosResponse<{message: string}>> => 
    adminApiClient.delete(`/category/${id}`),
  
  getCategoryStats: async (): Promise<AxiosResponse<any>> => 
    adminApiClient.get('/admin/categories/stats'),

  // Category Attributes Management
  getCategoryAttributes: async (categoryId: string): Promise<AxiosResponse<CategoryAttributeDto[]>> =>
    adminApiClient.get(`/category/${categoryId}/attributes`),

  createCategoryAttribute: async (categoryId: string, data: CreateCategoryAttributeDto): Promise<AxiosResponse<CategoryAttributeDto>> =>
    adminApiClient.post(`/category/${categoryId}/attributes`, data),

  updateCategoryAttribute: async (categoryId: string, attributeId: string, data: UpdateCategoryAttributeDto): Promise<AxiosResponse<CategoryAttributeDto>> =>
    adminApiClient.put(`/category/attributes/${attributeId}`, data),

  deleteCategoryAttribute: async (attributeId: string): Promise<AxiosResponse<{message: string}>> =>
    adminApiClient.delete(`/category/attributes/${attributeId}`),

  // Dashboard
  getDashboardOverview: async (): Promise<AxiosResponse<DashboardOverview>> => 
    adminApiClient.get('/admin/dashboard/overview'),
  
  getRecentActivity: async (): Promise<AxiosResponse<any>> => 
    adminApiClient.get('/admin/dashboard/recent-activity'),
  
  getAnalytics: async (): Promise<AxiosResponse<any>> => 
    adminApiClient.get('/admin/dashboard/analytics'),
  
  getSystemHealth: async (): Promise<AxiosResponse<any>> => 
    adminApiClient.get('/admin/dashboard/system-health'),

  // Admin Management
  createAdmin: async (data: CreateAdminRequest): Promise<AxiosResponse<AdminUser>> => 
    adminApiClient.post('/admin/create', data),
  
  getAllAdmins: async (): Promise<AxiosResponse<AdminUser[]>> => 
    adminApiClient.get('/admin/all'),

  getAdminDetail: async (id: string): Promise<AxiosResponse<AdminDetailDto>> => 
    adminApiClient.get(`/admin/admins/${id}`),

  updateAdmin: async (id: string, data: UpdateAdminRequest): Promise<AxiosResponse<{ message: string }>> => 
    adminApiClient.put(`/admin/admins/${id}`, data),

  deleteAdmin: async (id: string): Promise<AxiosResponse<{ message: string }>> => 
    adminApiClient.delete(`/admin/admins/${id}`),

  toggleAdminActive: async (id: string): Promise<AxiosResponse<{ message: string }>> => 
    adminApiClient.post(`/admin/admins/${id}/toggle-active`),

  assignRoles: async (data: AdminRoleAssignmentRequest): Promise<AxiosResponse<{ message: string }>> => 
    adminApiClient.post('/admin/admins/assign-roles', data),

  resetAdminPassword: async (id: string, newPassword: string): Promise<AxiosResponse<{ message: string }>> => 
    adminApiClient.post(`/admin/admins/${id}/reset-password`, { password: newPassword }),

  getAdminStats: async (): Promise<AxiosResponse<any>> => 
    adminApiClient.get('/admin/admins/stats'),

  // Banner Management - Mock implementations
  getBanners: async (): Promise<AxiosResponse<AdminBannerDto[]>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: mockBanners } as AxiosResponse<AdminBannerDto[]>;
  },

  getBanner: async (id: string): Promise<AxiosResponse<AdminBannerDto>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const banner = mockBanners.find(b => b.id === id);
    if (!banner) throw new Error('Banner not found');
    return { data: banner } as AxiosResponse<AdminBannerDto>;
  },

  createBanner: async (data: CreateBannerDto): Promise<AxiosResponse<{ message: string; bannerId: string }>> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newBanner: AdminBannerDto = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl,
      position: data.position,
      positionName: `Position ${data.position}`,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      startDate: data.startDate,
      endDate: data.endDate,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString()
    };
    mockBanners.push(newBanner);
    return { data: { message: 'Banner created successfully', bannerId: newBanner.id } } as AxiosResponse<{ message: string; bannerId: string }>;
  },

  updateBanner: async (id: string, data: UpdateBannerDto): Promise<AxiosResponse<{ message: string }>> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const bannerIndex = mockBanners.findIndex(b => b.id === id);
    if (bannerIndex === -1) throw new Error('Banner not found');
    
    mockBanners[bannerIndex] = {
      ...mockBanners[bannerIndex],
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl,
      position: data.position,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      startDate: data.startDate,
      endDate: data.endDate,
      updatedDate: new Date().toISOString()
    };
    return { data: { message: 'Banner updated successfully' } } as AxiosResponse<{ message: string }>;
  },

  deleteBanner: async (id: string): Promise<AxiosResponse<{ message: string }>> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const bannerIndex = mockBanners.findIndex(b => b.id === id);
    if (bannerIndex === -1) throw new Error('Banner not found');
    mockBanners.splice(bannerIndex, 1);
    return { data: { message: 'Banner deleted successfully' } } as AxiosResponse<{ message: string }>;
  },

  toggleBannerActive: async (id: string): Promise<AxiosResponse<{ message: string }>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const banner = mockBanners.find(b => b.id === id);
    if (!banner) throw new Error('Banner not found');
    banner.isActive = !banner.isActive;
    banner.updatedDate = new Date().toISOString();
    return { data: { message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully` } } as AxiosResponse<{ message: string }>;
  },

  getBannersByPosition: async (position: number): Promise<AxiosResponse<AdminBannerDto[]>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const banners = mockBanners.filter(b => b.position === position);
    return { data: banners } as AxiosResponse<AdminBannerDto[]>;
  },

  uploadBannerImage: async (file: File): Promise<AxiosResponse<{ imageUrl: string; message: string }>> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock image upload - return a placeholder URL
    const mockImageUrl = `https://images.unsplash.com/photo-${Date.now()}?w=800&h=400&fit=crop`;
    return { data: { imageUrl: mockImageUrl, message: 'Image uploaded successfully' } } as AxiosResponse<{ imageUrl: string; message: string }>;
  },
};

export default adminApi;

// Banner Management Types
export interface AdminBannerDto {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  position: number;
  positionName: string;
  isActive: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
  createdDate: string;
  updatedDate?: string;
}

export interface CreateBannerDto {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  position: number;
  isActive: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateBannerDto {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  position: number;
  isActive: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
} 


// Ad Reports
export interface AdReportDto {
  id: string;
  adId: string;
  adTitle: string;
  adSlug: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  reporterJoinDate: string;
  reason: number;
  reasonText: string;
  description?: string;
  reportDate: string;
  status: number;
  statusText: string;
  reviewDate?: string;
  reviewedByName?: string;
  adminNotes?: string;
}

export interface UpdateReportStatusDto {
  status: number;
  adminNotes?: string;
}

export const adminReportsApi = {
  getReports: (params: { page: number; pageSize: number; status?: number; reason?: number }) =>
    adminApiClient.get<AdReportDto[]>('/adreport', { params }),

  updateStatus: (id: string, data: UpdateReportStatusDto) =>
    adminApiClient.put(`/adreport/${id}/status`, data),
};

// User Reports (different from Ad Reports)
export interface AdminUserReportDto {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reportedUserId?: string;
  reportedUserName?: string;
  reportedProductId?: string;
  reportedProductTitle?: string;
  reportedReviewId?: string;
  reportedReviewText?: string;
  reportType: string;
  reportReason: string;
  description: string;
  status: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  adminNotes?: string;
  resolutionAction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserReportListDto {
  reports: AdminUserReportDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const adminUserReportApi = {
  getAllReports: (params: { status?: string; reportType?: string; reportReason?: string; pageNumber?: number; pageSize?: number }) =>
    adminApiClient.get<{ data: AdminUserReportListDto; isSucceeded: boolean }>('/UserReport/all', { params }),

  getReport: (id: string) =>
    adminApiClient.get<{ data: AdminUserReportDto; isSucceeded: boolean }>(`/UserReport/${id}`),

  updateStatus: (id: string, data: { status: string; adminNotes?: string; resolutionAction?: string }) =>
    adminApiClient.put<{ data: AdminUserReportDto; isSucceeded: boolean; message: string }>(`/UserReport/${id}/status`, data),
};

// Rating Statistics
export interface AdminRatingStatisticsDto {
  totalReviews: number;
  approvedReviews: number;
  pendingReviews: number;
  averageRating: number;
  distribution: AdminRatingDistributionDto;
  monthlyTrends: AdminRatingTrendDto[];
  topRatedProducts: AdminTopRatedProductDto[];
  lowRatedProducts: AdminLowRatedProductDto[];
}

export interface AdminRatingDistributionDto {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
}

export interface AdminRatingTrendDto {
  month: string;
  year: number;
  count: number;
  averageRating: number;
}

export interface AdminTopRatedProductDto {
  productId: string;
  productTitle: string;
  averageRating: number;
  totalReviews: number;
}

export interface AdminLowRatedProductDto {
  productId: string;
  productTitle: string;
  averageRating: number;
  totalReviews: number;
}

export const adminRatingApi = {
  getStatistics: () =>
    adminApiClient.get<{ data: AdminRatingStatisticsDto; isSucceeded: boolean; message: string }>('/productreview/statistics'),
};

// Contact Feedback
export interface AdminContactFeedbackDto {
  id: string;
  userId?: string;
  userName: string;
  name: string;
  email: string;
  phoneNumber?: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  adminNotes?: string;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContactFeedbackListDto {
  feedbacks: AdminContactFeedbackDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AdminUpdateContactFeedbackStatusDto {
  status: string;
  adminNotes?: string;
  response?: string;
}

export const adminContactFeedbackApi = {
  getAllFeedbacks: (params: { status?: string; category?: string; pageNumber?: number; pageSize?: number }) =>
    adminApiClient.get<{ data: AdminContactFeedbackListDto; isSucceeded: boolean }>('/ContactFeedback/all', { params }),

  getFeedback: (id: string) =>
    adminApiClient.get<{ data: AdminContactFeedbackDto; isSucceeded: boolean }>(`/ContactFeedback/${id}`),

  updateStatus: (id: string, data: AdminUpdateContactFeedbackStatusDto) =>
    adminApiClient.put<{ data: AdminContactFeedbackDto; isSucceeded: boolean; message: string }>(`/ContactFeedback/${id}/status`, data),
};

// Content Statistics
export interface AdminContentStatisticsDto {
  products: AdminProductStatisticsDto;
  categories: AdminCategoryStatisticsDto;
  authors: AdminAuthorStatisticsDto;
  reviews: AdminReviewStatisticsDto;
  tags: AdminTagStatisticsDto;
}

export interface AdminProductStatisticsDto {
  total: number;
  active: number;
  inactive: number;
  thisMonth: number;
  lastMonth: number;
}

export interface AdminCategoryStatisticsDto {
  total: number;
  active: number;
  inactive: number;
  rootCategories: number;
  subCategories: number;
}

export interface AdminAuthorStatisticsDto {
  total: number;
  active: number;
  inactive: number;
  verified: number;
}

export interface AdminReviewStatisticsDto {
  total: number;
  approved: number;
  pending: number;
  averageRating: number;
}

export interface AdminTagStatisticsDto {
  total: number;
  active: number;
  inactive: number;
}

export const adminContentApi = {
  getStatistics: () =>
    adminApiClient.get<{ data: AdminContentStatisticsDto; isSucceeded: boolean; message: string }>('/Content/statistics'),
};

// Product Tags
export interface AdminProductTagDto {
  id: string;
  productId: string;
  productTitle?: string;
  name: string;
  slug?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

export interface AdminProductTagListDto {
  tags: AdminProductTagDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AdminCreateProductTagDto {
  productId: string;
  name: string;
  slug?: string;
  description?: string;
  isActive: boolean;
}

export interface AdminUpdateProductTagDto {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive: boolean;
}

export const adminProductTagApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string; isActive?: boolean; productId?: string }) =>
    adminApiClient.get<{ data: AdminProductTagListDto; isSucceeded: boolean; message: string }>('/ProductTag', { params }),

  getById: (id: string) =>
    adminApiClient.get<{ data: AdminProductTagDto; isSucceeded: boolean }>(`/ProductTag/${id}`),

  create: (data: AdminCreateProductTagDto) =>
    adminApiClient.post<{ message: string; isSucceeded: boolean }>('/ProductTag', data),

  update: (data: AdminUpdateProductTagDto) =>
    adminApiClient.put<{ data: AdminProductTagDto; message: string; isSucceeded: boolean }>('/ProductTag', data),

  delete: (id: string) =>
    adminApiClient.delete<{ message: string; isSucceeded: boolean }>(`/ProductTag/${id}`),
};

// Admin Payment DTOs
export interface AdminPaymentDto {
  id: string;
  orderId: string;
  userId: string;
  paymentNumber: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  gatewayName?: string;
  gatewayTransactionId?: string;
  status: string;
  paymentDate: string;
  completedAt?: string;
  failedAt?: string;
  refundedAmount: number;
  isRefunded: boolean;
  refundedAt?: string;
  refundReason?: string;
  description?: string;
  receiptUrl?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaymentListDto {
  payments: AdminPaymentDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const adminPaymentApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string; status?: string }) =>
    adminApiClient.get<{ data: AdminPaymentListDto; isSucceeded: boolean; message: string }>('/Payment/all', { params }),

  getById: (id: string) =>
    adminApiClient.get<{ data: AdminPaymentDto; isSucceeded: boolean }>(`/Payment/${id}`),
};

// Admin Royalty Payment DTOs
export interface AdminRoyaltyPaymentDto {
  id: string;
  authorId: string;
  authorName?: string;
  productId: string;
  productTitle?: string;
  orderId: string;
  orderNumber?: string;
  orderItemId: string;
  saleAmount: number;
  royaltyPercentage: number;
  royaltyAmount: number;
  status: string;
  paidAt?: string;
  paidBy?: string;
  settlementId?: string;
  settlementDate?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  gatewayName?: string;
  gatewayTransactionId?: string;
  paymentUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRoyaltyPaymentListDto {
  royalties: AdminRoyaltyPaymentDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AdminProcessRoyaltyPaymentDto {
  royaltyPaymentId: string;
  paymentMethod: 'Manual' | 'Gateway';
  settlementId?: string;
  notes?: string;
  receiptUrl?: string;
  gatewayName?: string;
}

export interface AdminInitiateGatewayPaymentDto {
  royaltyPaymentId: string;
  callbackUrl: string;
}

export const adminRoyaltyPaymentApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string; status?: string; authorId?: string }) =>
    adminApiClient.get<{ data: AdminRoyaltyPaymentListDto; isSucceeded: boolean; message: string }>('/RoyaltyPayment/all', { params }),

  getById: (id: string) =>
    adminApiClient.get<{ data: AdminRoyaltyPaymentDto; isSucceeded: boolean }>(`/RoyaltyPayment/${id}`),

  processPayment: (data: AdminProcessRoyaltyPaymentDto, receiptFile?: File) => {
    const formData = new FormData();
    formData.append('royaltyPaymentId', data.royaltyPaymentId);
    formData.append('paymentMethod', data.paymentMethod);
    if (data.settlementId) formData.append('settlementId', data.settlementId);
    if (data.notes) formData.append('notes', data.notes);
    if (data.receiptUrl) formData.append('receiptUrl', data.receiptUrl);
    if (data.gatewayName) formData.append('gatewayName', data.gatewayName);
    if (receiptFile) formData.append('receiptFile', receiptFile);
    
    return adminApiClient.post<{ data: AdminRoyaltyPaymentDto; message: string; isSucceeded: boolean }>('/RoyaltyPayment/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  initiateGatewayPayment: (data: AdminInitiateGatewayPaymentDto) =>
    adminApiClient.post<{ data: AdminRoyaltyPaymentDto; message: string; isSucceeded: boolean }>('/RoyaltyPayment/initiate-gateway', data),
};

// Admin Coupon DTOs
export interface AdminCouponDto {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: string;
  discountValue: number;
  maxUsageCount?: number;
  maxUsagePerUser?: number;
  currentUsageCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  minimumPurchaseAmount?: number;
  maximumDiscountAmount?: number;
  isApplicableToAllProducts: boolean;
  applicableProductIds?: string;
  applicableCategoryIds?: string;
  isApplicableToAllUsers: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCouponListDto {
  coupons: AdminCouponDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AdminCreateCouponDto {
  code: string;
  name: string;
  description: string;
  discountType: string;
  discountValue: number;
  maxUsageCount?: number;
  maxUsagePerUser?: number;
  validFrom: string;
  validTo: string;
  minimumPurchaseAmount?: number;
  maximumDiscountAmount?: number;
  isApplicableToAllProducts: boolean;
  applicableProductIds?: string;
  applicableCategoryIds?: string;
  isApplicableToAllUsers: boolean;
}

export interface AdminUpdateCouponDto {
  id: string;
  name?: string;
  description?: string;
  maxUsageCount?: number;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

export const adminCouponApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string; isActive?: boolean }) =>
    adminApiClient.get<{ data: AdminCouponListDto; isSucceeded: boolean; message: string }>('/Coupon/all', { params }),

  getById: (id: string) =>
    adminApiClient.get<{ data: AdminCouponDto; isSucceeded: boolean }>(`/Coupon/${id}`),

  create: (data: AdminCreateCouponDto) =>
    adminApiClient.post<{ data: AdminCouponDto; message: string; isSucceeded: boolean }>('/Coupon/create', data),

  update: (data: AdminUpdateCouponDto) =>
    adminApiClient.put<{ data: AdminCouponDto; message: string; isSucceeded: boolean }>('/Coupon/update', data),

  delete: (id: string) =>
    adminApiClient.delete<{ message: string; isSucceeded: boolean }>(`/Coupon/${id}`),
};

// Financial Reports DTOs
export interface FinancialStatisticsDto {
  totalRevenue: number;
  totalRefunds: number;
  totalRoyaltiesPaid: number;
  totalDiscountsGiven: number;
  netRevenue: number;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  completedPaymentsAmount: number;
  pendingPaymentsAmount: number;
  failedPaymentsAmount: number;
  paymentMethodStats: { [key: string]: PaymentMethodStatisticsDto };
  totalRefundsCount: number;
  approvedRefundsCount: number;
  pendingRefundsCount: number;
  rejectedRefundsCount: number;
  approvedRefundsAmount: number;
  pendingRefundsAmount: number;
  totalRoyaltiesCount: number;
  paidRoyaltiesCount: number;
  pendingRoyaltiesCount: number;
  paidRoyaltiesAmount: number;
  pendingRoyaltiesAmount: number;
  totalCouponsUsed: number;
  totalCouponDiscounts: number;
  couponUsageByType: { [key: string]: number };
  thisMonth: PeriodComparisonDto;
  lastMonth: PeriodComparisonDto;
  thisYear: PeriodComparisonDto;
  lastYear: PeriodComparisonDto;
  monthlyRevenue: MonthlyRevenueDto[];
  dailyRevenue: DailyRevenueDto[];
}

export interface PaymentMethodStatisticsDto {
  method: string;
  count: number;
  totalAmount: number;
  averageAmount: number;
}

export interface PeriodComparisonDto {
  revenue: number;
  paymentCount: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface MonthlyRevenueDto {
  month: string;
  year: number;
  revenue: number;
  paymentCount: number;
  orderCount: number;
  refunds: number;
  royalties: number;
  discounts: number;
}

export interface DailyRevenueDto {
  date: string;
  revenue: number;
  paymentCount: number;
  orderCount: number;
}

export const adminFinancialReportsApi = {
  getStatistics: (params?: { fromDate?: string; toDate?: string; paymentMethod?: string; paymentStatus?: string }) =>
    adminApiClient.get<{ data: FinancialStatisticsDto; isSucceeded: boolean; message: string }>('/FinancialReports/statistics', { params }),
};

// Admin Notification DTOs
export interface AdminNotificationDto {
  id: string;
  createdBy?: string;
  creatorName?: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  targetAudience: string;
  scheduledFor?: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
  status: string;
  sentAt?: string;
  totalRecipients: number;
  readCount: number;
  targetUserIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotificationListDto {
  notifications: AdminNotificationDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AdminCreateNotificationDto {
  title: string;
  message: string;
  type: string;
  priority: string;
  targetAudience: string;
  scheduledFor?: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
  targetUserIds?: string[];
}

export interface AdminUpdateNotificationDto {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  targetAudience: string;
  scheduledFor?: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
  targetUserIds?: string[];
}

export const adminNotificationApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string; status?: string; type?: string }) =>
    adminApiClient.get<{ data: AdminNotificationListDto; isSucceeded: boolean; message: string }>('/AdminNotification/all', { params }),

  getById: (id: string) =>
    adminApiClient.get<{ data: AdminNotificationDto; isSucceeded: boolean }>(`/AdminNotification/${id}`),

  create: (data: AdminCreateNotificationDto) =>
    adminApiClient.post<{ data: AdminNotificationDto; message: string; isSucceeded: boolean }>('/AdminNotification/create', data),

  update: (data: AdminUpdateNotificationDto) =>
    adminApiClient.put<{ data: AdminNotificationDto; message: string; isSucceeded: boolean }>('/AdminNotification/update', data),

  delete: (id: string) =>
    adminApiClient.delete<{ message: string; isSucceeded: boolean }>(`/AdminNotification/${id}`),

  send: (id: string) =>
    adminApiClient.post<{ data: boolean; message: string; isSucceeded: boolean }>(`/AdminNotification/${id}/send`),

  cancel: (id: string) =>
    adminApiClient.post<{ data: boolean; message: string; isSucceeded: boolean }>(`/AdminNotification/${id}/cancel`),
};

// SEO Management Types
export interface AdminSeoSettingDto {
  id: string;
  pageType: string;
  pagePath?: string;
  entityId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: string;
  robotsMeta?: string;
  additionalMetaTags?: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCreateSeoSettingDto {
  pageType: string;
  pagePath?: string;
  entityId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: string;
  robotsMeta?: string;
  additionalMetaTags?: string;
  isActive: boolean;
  priority: number;
}

export interface AdminUpdateSeoSettingDto {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: string;
  robotsMeta?: string;
  additionalMetaTags?: string;
  isActive: boolean;
  priority: number;
}

export interface AdminSeoSettingListDto {
  seoSettings: AdminSeoSettingDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export const adminSeoApi = {
  getAll: (params?: { page?: number; pageSize?: number; searchTerm?: string; pageType?: string }) =>
    adminApiClient.get<{ data: AdminSeoSettingDto[]; isSucceeded: boolean; message: string }>('/Seo/admin', { params }),

  getById: (id: string) =>
    adminApiClient.get<{ data: AdminSeoSettingDto; isSucceeded: boolean; message: string }>(`/Seo/admin/${id}`),

  create: (data: AdminCreateSeoSettingDto) =>
    adminApiClient.post<{ data: AdminSeoSettingDto; message: string; isSucceeded: boolean }>('/Seo/admin', data),

  update: (id: string, data: AdminUpdateSeoSettingDto) =>
    adminApiClient.put<{ data: AdminSeoSettingDto; message: string; isSucceeded: boolean }>(`/Seo/admin/${id}`, data),

  delete: (id: string) =>
    adminApiClient.delete<{ message: string; isSucceeded: boolean }>(`/Seo/admin/${id}`),

  toggleStatus: (id: string) =>
    adminApiClient.patch<{ message: string; isSucceeded: boolean }>(`/Seo/admin/${id}/toggle-status`),
};

// Log Management Types
export interface AdminLogDto {
  id: number;
  timeStamp: string;
  level: string;
  message: string;
  exception?: string;
  properties?: string;
  logEvent?: string;
}

export interface AdminLogStatisticsDto {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  informationCount: number;
  fatalCount: number;
  debugCount: number;
  levelDistribution: Array<{ level: string; count: number }>;
  hourlyTrends: Array<{ hour: string; count: number }>;
}

export const adminLogApi = {
  getAll: (params?: { page?: number; pageSize?: number; fromDate?: string; toDate?: string; level?: string; searchTerm?: string }) =>
    adminApiClient.get<{ data: AdminLogDto[]; isSucceeded: boolean; message: string }>('/Log/admin', { params }),

  getById: (id: number) =>
    adminApiClient.get<{ data: AdminLogDto; isSucceeded: boolean; message: string }>(`/Log/admin/${id}`),

  getStatistics: (params?: { fromDate?: string; toDate?: string }) =>
    adminApiClient.get<{ data: AdminLogStatisticsDto; isSucceeded: boolean; message: string }>('/Log/admin/statistics', { params }),

  delete: (id: number) =>
    adminApiClient.delete<{ message: string; isSucceeded: boolean }>(`/Log/admin/${id}`),

  deleteAll: (params?: { beforeDate?: string }) =>
    adminApiClient.delete<{ message: string; isSucceeded: boolean }>('/Log/admin', { params }),
};


