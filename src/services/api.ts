import axios, { AxiosResponse } from 'axios';

// Type declaration for process.env
declare const process: {
  env: {
    NODE_ENV: string;
  };
};

// Use the correct backend port
// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = typeof window !== 'undefined' 
  ? (window.location.hostname === 'localhost' ? 'http://localhost:7262/api' : 'http://dev.tvtobook.com/api')
  : 'http://dev.tvtobook.com/api';


// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials and httpOnly cookies
});

// Create separate axios instance for file uploads without Content-Type header
const fileApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for httpOnly cookies
  // No Content-Type header - let browser set it automatically
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // HttpOnly cookies are automatically sent by the browser
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Silently handle ad view tracking errors to prevent console spam for visitors
    if (error.config?.url?.includes('/view') && (error.response?.status === 404 || error.response?.status === 401)) {
      // Return a mock successful response for view tracking errors
      return Promise.resolve({
        data: { message: 'View tracking skipped' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config
      });
    }

    // Only log errors in development mode for non-view-tracking requests
    // Do not log author-profile lookup errors (e.g. `/author/my-authors`) —
    // it's expected for users who haven't created an author profile yet and
    // should not trigger the dev console overlay. Keep error propagation unchanged.
    const isAuthorLookupEndpoint = error.config?.url?.includes('/author/my-authors') || error.config?.url?.includes('/author/my-authors/');
    const isAuthorNotFound = error.config?.url?.includes('/author') && error.response?.status === 404;

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Only redirect to login if we're not already on auth pages and not making auth-related calls
      const currentPath = window.location.pathname;
      const authPages = ['/login', '/register', '/admin/login', '/'];
      const publicPages = ['/search', '/category', '/ad', '/ads', '/user'];
      const authEndpoints = ['/auth/login', '/auth/verify-otp', '/auth/register', '/auth/me'];
      const publicEndpoints = ['/category', '/banner', '/location'];
      
      const isAuthEndpoint = authEndpoints.some(endpoint => error.config?.url?.includes(endpoint));
      const isPublicEndpoint = publicEndpoints.some(endpoint => error.config?.url?.includes(endpoint));
      const isViewEndpoint = error.config?.url?.includes('/view');
      const isReportEndpoint = error.config?.url?.includes('/adreport');
      const isOnPublicPage = authPages.includes(currentPath) || publicPages.some(page => currentPath.startsWith(page));
      
      // Don't redirect if we're on public pages, making auth/public calls, view tracking, report submission, or during app initialization
      if (!isOnPublicPage && !isAuthEndpoint && !isPublicEndpoint && !isViewEndpoint && !isReportEndpoint) {
        console.warn('Unauthorized access detected, redirecting to login');
        // Use replace to avoid creating history entries
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

// Add the same interceptors to fileApi as the main api
fileApi.interceptors.request.use(
  (config) => {
    // HttpOnly cookies are automatically sent by the browser
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

fileApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log errors in development mode
    if (process.env.NODE_ENV === 'development') {
      console.group('🔴 File API Error');
      console.error('Request URL:', error.config?.url);
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data?.message || error.message);
      console.groupEnd();
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Only redirect to login if we're not already on auth pages and not making auth-related calls
      const currentPath = window.location.pathname;
      const authPages = ['/login', '/register', '/admin/login', '/'];
      const publicPages = ['/search', '/category', '/ad', '/ads', '/user'];
      const authEndpoints = ['/auth/login', '/auth/verify-otp', '/auth/register', '/auth/me'];
      const isAuthEndpoint = authEndpoints.some(endpoint => error.config?.url?.includes(endpoint));
      const isOnPublicPage = authPages.includes(currentPath) || publicPages.some(page => currentPath.startsWith(page));
      
      // Don't redirect if we're on public pages, making auth calls, or during app initialization
      if (!isOnPublicPage && !isAuthEndpoint) {
        console.warn('Unauthorized file upload detected, redirecting to login');
        // Use replace to avoid creating history entries
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Combined first and last name
  profileImageUrl?: string;
  dateJoined: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  isVerified: boolean;
  role?: string; // Single role (deprecated)
  roles?: string[]; // Array of roles: ["IsAdmin", "IsSuperAdmin", etc.]
}

export interface BusinessHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

export interface UpdateBusinessProfileRequest {
  businessName?: string;
  businessDescription?: string;
  businessWebsite?: string;
  businessAddress?: string;
  businessHours?: BusinessHours;
}

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  city?: string;
  province?: string;
  emailOtpCode?: string;
  phoneOtpCode?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  sortOrder: number;
  isActive: boolean;
  parentCategoryId?: string;
  subCategories: Category[];
}

export interface CategoryAttribute {
  id: string;
  name: string;
  label: string;
  type: 'Text' | 'Number' | 'Boolean' | 'Date' | 'Dropdown' | 'MultiSelect' | 'TextArea' | 'Url' | 'Email';
  defaultValue?: string;
  isRequired: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  sortOrder: number;
  validationRules?: string;
  options?: string; // JSON string for dropdown options
}

export interface CategoryMetadata {
  id: string;
  name: string;
  displayLayout?: 'default' | 'automotive' | 'electronics' | 'realestate' | 'fashion';
  attributeGroups?: { [groupName: string]: string[] };
  highlightFields?: string[]; // Fields to highlight in selling points
}

export interface Ad {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName: string;
  subCategoryId?: string;
  subCategoryName?: string;
  status: 'Active' | 'Sold' | 'Expired' | 'Paused' | 'PendingApproval';
  city: string;
  province: string;
  postalCode: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  userId: string;
  userName: string;
  userIsVerified: boolean;
  userType: 'Individual' | 'Business';
  userPhoneNumber?: string;
  businessSlug?: string;
  businessApprovalStatus?: number | string;
  datePosted: string;
  dateUpdated?: string;
  viewCount: number;
  images: AdImage[];
  videos: AdVideo[];
  attributes: AdAttribute[];
  isFavorited: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
  isHighlighted: boolean;
  isTopAd: boolean;
  isPromoted: boolean;
  isNegotiable?: boolean;
  allowPhoneContact?: boolean;
  allowEmailContact?: boolean;
  allowChatContact?: boolean;
}

export interface AdListItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  categoryName: string;
  subCategoryName?: string;
  status?: 'Active' | 'Sold' | 'Expired' | 'Paused' | 'PendingApproval';
  city: string;
  province: string;
  datePosted: string;
  viewCount: number;
  favoriteCount: number;
  primaryImageUrl?: string;
  isFavorited: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
  isHighlighted: boolean;
  isTopAd: boolean;
  distance?: number;
}

export interface AdImage {
  id: string;
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface AdVideo {
  id: string;
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  sortOrder: number;
  durationSeconds?: number;
}

export interface AdAttribute {
  id: string;
  name: string;
  label: string;
  type: 'Text' | 'Number' | 'Boolean' | 'Dropdown' | 'Date';
  value: string;
}

export interface CreateAdRequest {
  title: string;
  description: string;
  price: number;
  categoryId: string;
  subCategoryId?: string;
  city: string;
  province: string;
  postalCode: string;
  address: string;
  latitude: number;
  longitude: number;
  attributes?: { [key: string]: string };
  promotionPackageId: string;
}

export interface UpdateAdRequest extends Partial<CreateAdRequest> {}

export interface SearchRequest {
  searchTerm?: string;
  categoryId?: string;
  userId?: string;
  excludeUserId?: string;
  excludeAdId?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  province?: string;
  sortBy?: 'date_new' | 'date_old' | 'price_low' | 'price_high';
  page?: number;
  pageSize?: number;
}

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface VerifyOtpRequest {
  EmailOrPhone: string;
  Code: string;
}

export interface RegisterFormData {
  FirstName: string;
  LastName: string;
  Email: string;
  phoneNumber: string;
  password?: string;
  confirmPassword?: string;
}

export interface RegisterRequest {
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber?: string;
  Password?: string;
}

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<AxiosResponse<{ message: string; user?: User; requiresOtpVerification?: boolean }>> => 
    api.post('/auth/login', data, {
      withCredentials: true  // ✅ Send cookies automatically
    }),
  
  verifyOtp: async (data: VerifyOtpRequest): Promise<AxiosResponse<{ message: string; user: User }>> => 
    api.post('/auth/verify-otp', data, {
      withCredentials: true
    }),
  
  register: async (data: RegisterRequest): Promise<AxiosResponse<{ message: string; data?: User; isSucceeded?: boolean }>> => 
    api.post('/auth/register', data),
  
  activateEmail: async (data: { token: string }): Promise<AxiosResponse<{ message: string }>> => 
    api.post('/auth/activate-email', data),
  
  getCurrentUser: async (): Promise<AxiosResponse<User>> => 
    api.get('/auth/me', {
      withCredentials: true  // ✅ Send cookies automatically
    }),
  
  checkAuth: async (): Promise<AxiosResponse<User>> => 
    api.get('/auth/me', {
      withCredentials: true
    }),

  resendActivationEmail: async (data: { email: string }): Promise<AxiosResponse<{ message: string }>> => 
    api.post('/auth/resend-activation', data),
  
  logout: async (): Promise<AxiosResponse<{ message: string }>> => {
    // ✅ Backend expects LogoutRequestDto with RefreshToken property
    // ❌ Cannot read HttpOnly cookies from JavaScript - they're secure!
    // Backend will read refreshToken from HttpOnly cookie automatically
    
    try {
      const response = await api.post('/auth/logout', {
        RefreshToken: '' // Backend will read from HttpOnly cookie
      }, {
        withCredentials: true  // ✅ Send HttpOnly cookies automatically
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  logoutOthers: async (id: string): Promise<AxiosResponse<{ message: string }>> => 
    api.post(`/auth/logout-others?Id=${encodeURIComponent(id)}`, {}, {
      withCredentials: true
    }),

  updateProfile: async (data: UpdateUserProfileRequest): Promise<AxiosResponse<{ message: string; data: User; isSucceeded: boolean }>> => 
    api.put('/auth/update-profile', data, {
      withCredentials: true
    }),

  sendOtpForProfileUpdate: async (data: { emailOrPhone: string; type: 'email' | 'phone' }): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> => 
    api.post('/auth/send-otp-for-profile-update', data, {
      withCredentials: true
    }),
};

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<AxiosResponse<Category[]>> => 
    api.get('/category'),
  
  getById: async (id: string): Promise<AxiosResponse<Category>> => 
    api.get(`/category/${id}`),
  
  getAttributes: async (id: string): Promise<AxiosResponse<CategoryAttribute[]>> => 
    api.get(`/category/${id}/attributes`),
  
  createAttribute: async (categoryId: string, data: any): Promise<AxiosResponse<CategoryAttribute>> => 
    api.post(`/admin/categories/${categoryId}/attributes`, data),
  
  updateAttribute: async (categoryId: string, attributeId: string, data: any): Promise<AxiosResponse<CategoryAttribute>> => 
    api.put(`/admin/categories/${categoryId}/attributes/${attributeId}`, data),
  
  deleteAttribute: async (categoryId: string, attributeId: string): Promise<AxiosResponse<{ message: string }>> => 
    api.delete(`/admin/categories/${categoryId}/attributes/${attributeId}`),
  
  getMetadata: async (id: string): Promise<AxiosResponse<CategoryMetadata>> => 
    api.get(`/category/${id}/metadata`),
};

// Ads API
export const adsApi = {
  search: async (params: SearchRequest): Promise<AxiosResponse<{ ads: AdListItem[]; totalCount: number }>> => 
    api.get('/ad/search', { params }),
  
  getById: async (id: string): Promise<AxiosResponse<Ad>> => 
    api.get(`/ad/${id}`),
  
  getBySlug: async (slug: string): Promise<AxiosResponse<Ad>> => 
    api.get(`/ad/slug/${slug}`),
  
  create: async (data: CreateAdRequest): Promise<AxiosResponse<Ad>> => 
    api.post('/ad', data),
  
  update: async (id: string, data: UpdateAdRequest): Promise<AxiosResponse<Ad>> => 
    api.put(`/ad/${id}`, data),
  
  delete: async (id: string): Promise<AxiosResponse<{ message: string }>> => 
    api.delete(`/ad/${id}`),
  
  getMyAds: async (): Promise<AxiosResponse<AdListItem[]>> => 
    api.get('/ad/my-ads'),
  
  getUserAds: async (userId: string): Promise<AxiosResponse<AdListItem[]>> => 
    api.get(`/ad/user/${userId}`),
  
  toggleFavorite: async (id: string): Promise<AxiosResponse<{ message: string; isFavorited: boolean }>> => 
    api.post(`/ad/${id}/favorite`),
  
  getFavorites: async (page: number = 1, pageSize: number = 10): Promise<AxiosResponse<PagedResult<AdListItem>>> => 
    api.get(`/ad/favorites?page=${page}&pageSize=${pageSize}`),
  
  incrementView: async (id: string): Promise<AxiosResponse<{ message: string }>> => {
    // Return a mock response without making the actual API call
    // This prevents any console errors for visitors
    return Promise.resolve({
      data: { message: 'View tracking handled silently' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        url: `/ad/${id}/view`,
        method: 'post'
      }
    } as AxiosResponse<{ message: string }>);
  },

  boostAdRanking: async (id: string): Promise<AxiosResponse<{ message: string; remainingBoosts: number }>> => 
    api.post(`/ad/${id}/boost-ranking`),

  bumpUpAd: async (id: string): Promise<AxiosResponse<{ message: string; remainingBumpUps: number }>> => 
    api.post(`/ad/${id}/bump-up`),

  markAsSold: async (id: string): Promise<AxiosResponse<{ message: string }>> => 
    api.post(`/ad/${id}/mark-sold`),

  applyTopAd: async (id: string): Promise<AxiosResponse<{ message: string }>> => 
    api.post(`/ad/${id}/apply-top-ad`),

  applyHighlight: async (id: string): Promise<AxiosResponse<{ message: string }>> => 
    api.post(`/ad/${id}/apply-highlight`),

  applyUrgentTag: async (id: string): Promise<AxiosResponse<{ message: string }>> => 
    api.post(`/ad/${id}/apply-urgent-tag`),
};

// File Upload API
export const fileUploadApi = {
  uploadImage: async (adId: string, file: File, isPrimary: boolean = false): Promise<AxiosResponse<AdImage>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrimary', isPrimary.toString());
    
    // Use dedicated fileApi instance without Content-Type header
    return fileApi.post(`/fileupload/ad/${adId}/image`, formData);
  },
  
  uploadVideo: async (adId: string, file: File): Promise<AxiosResponse<AdVideo>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Use dedicated fileApi instance without Content-Type header
    return fileApi.post(`/fileupload/ad/${adId}/video`, formData);
  },
  
  deleteImage: async (imageId: string): Promise<AxiosResponse<{ message: string }>> => 
    api.delete(`/fileupload/image/${imageId}`),
  
  deleteVideo: async (videoId: string): Promise<AxiosResponse<{ message: string }>> => 
    api.delete(`/fileupload/video/${videoId}`),
  
  setPrimaryImage: async (imageId: string): Promise<AxiosResponse<{ message: string }>> => 
    api.put(`/fileupload/image/${imageId}/primary`),
  
  getAdImages: async (adId: string): Promise<AxiosResponse<AdImage[]>> => 
    api.get(`/fileupload/ad/${adId}/images`),
  
  getAdVideos: async (adId: string): Promise<AxiosResponse<AdVideo[]>> => 
    api.get(`/fileupload/ad/${adId}/videos`),
};

// Location API
export const locationApi = {
  getProvinces: async (): Promise<AxiosResponse<{ id: string; name: string; code: string }[]>> => 
    api.get('/location/provinces'),
  
  getCities: async (province?: string): Promise<AxiosResponse<{ id: string; name: string; province: string; provinceCode: string; population?: number }[]>> => 
    api.get('/location/cities', { params: province ? { province } : {} }),
  
  getPopularLocations: async (): Promise<AxiosResponse<{ city: string; province: string; count: number }[]>> => 
    api.get('/location/popular-locations'),

  seedLocations: async (): Promise<AxiosResponse<{ message: string }>> => 
    api.post('/location/seed'),
};

// Payment API
export interface CreatePaymentSessionRequest {
  packageId: string;
  packageName: string;
  amount: number;
}

export interface PaymentDto {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  transactionId?: string;
  paymentProcessorId?: string;
  createdDate: string;
  completedDate?: string;
  failureReason?: string;
  userId: string;
  promotionPackageId?: string;
}

export interface UserPlanDto {
  id: string;
  promotionPackageId: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  purchaseDate: string;
  expirationDate: string;
  isActive: boolean;
  isExpired: boolean;
  remainingDays: number;
  maxAdsCount: number;
  usedAdsCount: number;
  remainingAdsCount: number;
  hasRemainingAds: boolean;
  features: string;
  iconEmoji: string;
  colorClass: string;
  rankingBoost: number;
  usedRankingBoosts: number;
  remainingRankingBoosts: number;
  
  // Count-based promotional features
  usedTopAdCount: number;
  usedHighlightCount: number;
  usedUrgentTagCount: number;
  usedBumpUpCount: number;
  usedHomepageGalleryCount: number;
  remainingTopAdCount: number;
  remainingHighlightCount: number;
  remainingUrgentTagCount: number;
  remainingBumpUpCount: number;
  remainingHomepageGalleryCount: number;
}

export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// Order API
export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    productFormatId: string;
    quantity: number;
  }>;
  shippingFirstName: string;
  shippingLastName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingPhoneNumber?: string;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
}

export interface OrderDto {
  id: string;
  userId: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  shippingFirstName: string;
  shippingLastName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingPhoneNumber?: string;
  paymentMethod: string;
  paymentId?: string;
  couponCode?: string;
  notes?: string;
  trackingNumber?: string;
  shippedDate?: string;
  deliveredDate?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: Array<{
    id: string;
    orderId: string;
    productId: string;
    productFormatId: string;
    productTitle: string;
    formatType: string;
    fileType?: string;
    unitPrice: number;
    discountPrice: number;
    quantity: number;
    totalPrice: number;
    status: string;
    isDigital: boolean;
    isDelivered: boolean;
    deliveredAt?: string;
    createdAt: string;
  }>;
}

export const orderApi = {
  create: async (data: CreateOrderRequest): Promise<AxiosResponse<{ message: string; data: OrderDto; isSucceeded: boolean }>> =>
    api.post('/order/create', data),
    
  getById: async (id: string): Promise<AxiosResponse<{ message: string; data: OrderDto; isSucceeded: boolean }>> =>
    api.get(`/order/${id}`),
    
  getMyOrders: async (): Promise<AxiosResponse<{ message: string; data: OrderDto[]; isSucceeded: boolean }>> =>
    api.get('/order/my-orders'),
    
  getAll: async (status?: string): Promise<AxiosResponse<{ message: string; data: OrderDto[]; isSucceeded: boolean }>> =>
    api.get('/order/all', { params: status ? { status } : {} }),
    
  updateStatus: async (data: { orderId: string; status: string; trackingNumber?: string; notes?: string }): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.put('/order/update-status', data),
};

export const paymentApi = {
  create: async (data: {
    orderId: string;
    amount: number;
    currency?: string;
    paymentMethod: string;
    gatewayName?: string;
    description?: string;
  }): Promise<AxiosResponse<{ message: string; data: PaymentDto; isSucceeded: boolean }>> =>
    api.post('/payment/create', data),
    
  getById: async (id: string): Promise<AxiosResponse<{ message: string; data: PaymentDto; isSucceeded: boolean }>> =>
    api.get(`/payment/${id}`),
    
  process: async (data: {
    paymentId: string;
    gatewayTransactionId?: string;
    status: string;
    gatewayResponse?: string;
    receiptUrl?: string;
    failureReason?: string;
  }): Promise<AxiosResponse<{ message: string; data: PaymentDto; isSucceeded: boolean }>> =>
    api.post('/payment/process', data),
    
  getMyPayments: async (): Promise<AxiosResponse<{ message: string; data: PaymentDto[]; isSucceeded: boolean }>> =>
    api.get('/payment/my-payments'),
    
  getAll: async (status?: string): Promise<AxiosResponse<{ message: string; data: PaymentDto[]; isSucceeded: boolean }>> =>
    api.get('/payment/all', { params: status ? { status } : {} }),
    
  // Legacy methods (keep for backward compatibility)
  createSession: async (data: CreatePaymentSessionRequest): Promise<AxiosResponse<{ message: string; checkoutUrl: string }>> =>
    api.post('/payment/create-session', data),
    
  verifyPayment: async (sessionId: string): Promise<AxiosResponse<{ status: string; message: string; payment?: PaymentDto }>> =>
    api.post('/payment/verify-payment', { sessionId }),
    
  getPayment: async (id: string): Promise<AxiosResponse<PaymentDto>> =>
    api.get(`/payment/${id}`),
    
  getUserPayments: async (page: number = 1, pageSize: number = 10): Promise<AxiosResponse<PagedResult<PaymentDto>>> =>
    api.get(`/payment/user-payments?page=${page}&pageSize=${pageSize}`),
    
  getUserPlans: async (): Promise<AxiosResponse<UserPlanDto[]>> =>
    api.get('/payment/user-plans'),

  activateFreePlan: async (packageId: string): Promise<AxiosResponse<{ message: string; planId: string }>> =>
    api.post('/payment/activate-free-plan', { packageId }),
};

// User Analytics API
export const analyticsApi = {
  getUserStats: async () => {
    console.log('Calling getUserStats API...');
    try {
      const response = await api.get('/useranalytics/user-stats');
      console.log('getUserStats response:', response);
      return response;
    } catch (error) {
      console.error('getUserStats error:', error);
      throw error;
    }
  },

  getAdViews: async (days: number = 30) => {
    console.log('Calling getAdViews API with days:', days);
    try {
      const response = await api.get(`/useranalytics/ad-views?days=${days}`);
      console.log('getAdViews response:', response);
      return response;
    } catch (error) {
      console.error('getAdViews error:', error);
      throw error;
    }
  },

  getCategoryStats: async () => {
    console.log('Calling getCategoryStats API...');
    try {
      const response = await api.get('/useranalytics/category-stats');
      console.log('getCategoryStats response:', response);
      return response;
    } catch (error) {
      console.error('getCategoryStats error:', error);
      throw error;
    }
  },

  getMonthlyStats: async () => {
    console.log('Calling getMonthlyStats API...');
    try {
      const response = await api.get('/useranalytics/monthly-stats');
      console.log('getMonthlyStats response:', response);
      return response;
    } catch (error) {
      console.error('getMonthlyStats error:', error);
      throw error;
    }
  }
};

export interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  position: BannerPosition;
  isActive: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
  createdDate: string;
}

export const BannerPosition = {
  SearchDropdown: 0,
  HomePage_Hero: 1,
  HomePage_Sidebar: 2,
  SearchPage_Top: 3,
  SearchPage_Sidebar: 4,
  AdDetails_Top: 5,
  AdDetails_Sidebar: 6,
  UserProfile_Top: 7,
  Footer: 8
} as const;

export type BannerPosition = typeof BannerPosition[keyof typeof BannerPosition];

export interface SiteSetting {
  id: number;
  frontendUrl: string;
  backendUrl: string;
  apiBaseUrl?: string;
  cdnUrl?: string;
  siteTitle: string;
  siteDescription: string;
  metaKeywords?: string;
  siteLogoUrl?: string;
  faviconUrl?: string;
  openGraphImageUrl?: string;
  siteAuthor: string;
  defaultLanguage: string;
  businessName: string;
  contactEmail: string;
  supportEmail?: string;
  contactPhone?: string;
  businessAddress?: string;
  copyrightText: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  telegramUrl?: string;
  linkedInUrl?: string;
  maintenanceMode: boolean;
  siteActive: boolean;
  maxFileUploadSizeMB: number;
  allowedFileTypes: string;
  defaultCurrency: string;
  timezone: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  termsOfServiceUrl?: string;
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
  enableRegistration: boolean;
  enableGuestPosting: boolean;
  enableMessaging: boolean;
  enableReviews: boolean;
  enableOtpOnlyLogin: boolean;
  maxActiveSessionsPerUser: number;
  globalDeviceLimit: number;
  enableSessionLimitEnforcement: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicSiteSetting {
  siteTitle: string;
  siteDescription: string;
  metaKeywords?: string;
  siteLogoUrl?: string;
  faviconUrl?: string;
  openGraphImageUrl?: string;
  siteAuthor: string;
  defaultLanguage: string;
  businessName: string;
  contactEmail: string;
  contactPhone?: string;
  copyrightText: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  telegramUrl?: string;
  linkedInUrl?: string;
  maintenanceMode: boolean;
  enableRegistration: boolean;
  enableGuestPosting: boolean;
  enableMessaging: boolean;
  enableReviews: boolean;
  enableOtpOnlyLogin: boolean;
  defaultCurrency: string;
  maxFileUploadSizeMB: number;
  allowedFileTypes: string;
}

export interface UpdateSiteSettingRequest {
  frontendUrl: string;
  backendUrl: string;
  apiBaseUrl?: string;
  cdnUrl?: string;
  siteTitle: string;
  siteDescription: string;
  metaKeywords?: string;
  siteLogoUrl?: string;
  faviconUrl?: string;
  openGraphImageUrl?: string;
  siteAuthor: string;
  defaultLanguage: string;
  businessName: string;
  contactEmail: string;
  supportEmail?: string;
  contactPhone?: string;
  businessAddress?: string;
  copyrightText: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  telegramUrl?: string;
  linkedInUrl?: string;
  maintenanceMode: boolean;
  siteActive: boolean;
  maxFileUploadSizeMB: number;
  allowedFileTypes: string;
  defaultCurrency: string;
  timezone: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  termsOfServiceUrl?: string;
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
  enableRegistration: boolean;
  enableGuestPosting: boolean;
  enableMessaging: boolean;
  enableReviews: boolean;
  enableOtpOnlyLogin: boolean;
  maxActiveSessionsPerUser: number;
  globalDeviceLimit: number;
  enableSessionLimitEnforcement: boolean;
}

// Business Moderation Types
export interface BusinessProfile {
  id: string;
  businessName?: string;
  businessDescription?: string;
  businessWebsite?: string;
  businessHours?: string;
  businessSlug?: string;
  isBusinessVerified: boolean;
  businessApprovalStatus: BusinessApprovalStatus;
  lastBusinessApprovedAt?: string;
  businessRejectionReason?: string;
  businessSubmittedAt?: string;
  galleryImages: BusinessGalleryImage[];
}

export interface BusinessGalleryImage {
  id: string;
  imageUrl: string;
  imageDescription?: string;
  uploadedAt: string;
  moderationStatus: ImageModerationStatus;
  moderatedAt?: string;
  rejectionReason?: string;
  displayOrder: number;
}

export interface UploadBusinessGalleryImageRequest {
  imageUrl: string;
  imageDescription?: string;
  displayOrder?: number;
}

export interface BusinessModerationItem {
  userId: string;
  businessName: string;
  currentStatus: BusinessApprovalStatus;
  submittedAt?: string;
  pendingChanges?: string;
  pendingImages: BusinessGalleryImage[];
}

export interface ApproveBusinessProfileRequest {
  userId: string;
  isApproved: boolean;
  rejectionReason?: string;
  moderationNotes?: string;
}

export interface ModerateGalleryImageRequest {
  imageId: string;
  status: ImageModerationStatus;
  rejectionReason?: string;
  moderationNotes?: string;
}

export const BusinessApprovalStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2
} as const;

export type BusinessApprovalStatus = typeof BusinessApprovalStatus[keyof typeof BusinessApprovalStatus];

export const ImageModerationStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
  UnderReview: 3
} as const;

export type ImageModerationStatus = typeof ImageModerationStatus[keyof typeof ImageModerationStatus];


// Banner API
export const bannerApi = {
  getByPosition: (position: BannerPosition): Promise<AxiosResponse<Banner[]>> =>
    api.get(`/banner/position/${position}`),

  getAll: (): Promise<AxiosResponse<Banner[]>> =>
    api.get('/banner'),

  getById: (id: string): Promise<AxiosResponse<Banner>> =>
    api.get(`/banner/${id}`),
};

// Site Settings API
export const siteSettingsApi = {
  // Public endpoint - no authentication required
  getPublic: (): Promise<AxiosResponse<PublicSiteSetting>> =>
    api.get('/sitesetting/public'),

  // Admin endpoints - require authentication
  get: (): Promise<AxiosResponse<SiteSetting>> =>
    api.get('/SiteSetting/admin'),

  update: (data: UpdateSiteSettingRequest): Promise<AxiosResponse<SiteSetting>> =>
    api.put('/SiteSetting/admin', data),

  initialize: (): Promise<AxiosResponse<SiteSetting>> =>
    api.post('/SiteSetting/admin/initialize'),
};

// User Profile API
export const userApi = {
  getById: (id: string): Promise<AxiosResponse<{ User: User; GalleryImages: BusinessGalleryImage[] }>> =>
    api.get(`/user/${id}`),

  getBusinessBySlugAndId: (slug: string, id: string): Promise<AxiosResponse<{ user?: User; redirectSlug?: string }>> =>
    api.get(`/user/business/${slug}/${id}`),

  getBusinessBySlug: (slug: string): Promise<AxiosResponse<{ User: User; GalleryImages: BusinessGalleryImage[] }>> =>
    api.get(`/user/business/${slug}`),

  updateProfile: (data: UpdateUserProfileRequest): Promise<AxiosResponse<{ message: string; user: User }>> =>
    api.put('/user/profile', data),

  updateBusinessProfile: (data: UpdateBusinessProfileRequest): Promise<AxiosResponse<{ message: string; user: User }>> => {
    // Convert BusinessHours object to JSON string for backend
    const requestData = {
      ...data,
      businessHours: data.businessHours ? JSON.stringify(data.businessHours) : undefined
    };
    return api.put('/user/business-profile', requestData);
  },
};

// Business Profile API (deprecated - use userApi instead)
export const businessApi = {
  updateProfile: (data: UpdateBusinessProfileRequest): Promise<AxiosResponse<User>> =>
    api.put('/user/business-profile', data),

  uploadGalleryImage: (file: File): Promise<AxiosResponse<{ imageUrl: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/user/business-gallery', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteGalleryImage: (imageUrl: string): Promise<AxiosResponse<void>> =>
    api.delete('/user/business-gallery', { data: { imageUrl } }),
};

// Business Moderation API
export const businessModerationApi = {
  // Business Profile Management
  submitProfile: (data: UpdateBusinessProfileRequest): Promise<AxiosResponse<BusinessProfile>> => {
    // Convert BusinessHours object to JSON string for backend
    const requestData = {
      ...data,
      businessHours: data.businessHours ? JSON.stringify(data.businessHours) : undefined
    };
    return api.post('/businessmoderation/submit-profile', requestData);
  },

  resubmitProfile: (): Promise<AxiosResponse<BusinessProfile>> =>
    api.post('/user/resubmit-business-profile'),

  getPendingProfiles: (): Promise<AxiosResponse<BusinessModerationItem[]>> =>
    api.get('/businessmoderation/pending-profiles'),

  approveProfile: (data: ApproveBusinessProfileRequest): Promise<AxiosResponse<BusinessProfile>> =>
    api.post('/businessmoderation/approve-profile', data),

  // Gallery Image Management
  uploadGalleryImage: (data: UploadBusinessGalleryImageRequest): Promise<AxiosResponse<BusinessGalleryImage>> =>
    api.post('/businessmoderation/upload-gallery-image', data),

  getPendingImages: (): Promise<AxiosResponse<BusinessGalleryImage[]>> =>
    api.get('/businessmoderation/pending-images'),

  moderateImage: (data: ModerateGalleryImageRequest): Promise<AxiosResponse<BusinessGalleryImage>> =>
    api.post('/businessmoderation/moderate-image', data),

  getApprovedImages: (businessUserId: string): Promise<AxiosResponse<BusinessGalleryImage[]>> =>
    api.get(`/businessmoderation/approved-images/${businessUserId}`),

  deleteGalleryImage: (imageId: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/businessmoderation/gallery-image/${imageId}`),
};

// Email Template Types
export const EmailTemplateType = {
  Registration: 1,
  EmailVerification: 2,
  PasswordReset: 3,
  Welcome: 4,
  Newsletter: 5,
  AdApproved: 6,
  AdRejected: 7,
  AdExpiring: 8,
  BusinessApproved: 9,
  BusinessRejected: 10,
  PaymentConfirmation: 11,
  PromotionActivated: 12,
  SystemNotification: 13,
  Advertisement: 14,
  ContactForm: 15
} as const;

export type EmailTemplateType = typeof EmailTemplateType[keyof typeof EmailTemplateType];

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  type: EmailTemplateType;
  typeName: string;
  isActive: boolean;
  isDefault: boolean;
  description?: string;
  availableVariables?: string[];
  createdAt: string;
  updatedAt: string;
  createdByAdminName?: string;
}

export interface CreateEmailTemplateRequest {
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  type: EmailTemplateType;
  isActive: boolean;
  isDefault: boolean;
  description?: string;
}

export interface UpdateEmailTemplateRequest {
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  isActive: boolean;
  description?: string;
}

export interface EmailTemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  inactiveTemplates: number;
  templatesByType: Record<EmailTemplateType, number>;
  hasDefaultTemplate: Record<EmailTemplateType, boolean>;
}

export interface EmailTemplatePreview {
  subject: string;
  htmlBody: string;
  textBody?: string;
}

// Email Template API
export const emailTemplateApi = {
  getAll: (): Promise<AxiosResponse<{ data: EmailTemplate[]; isSucceeded: boolean }>> =>
    api.get('/admin/adminemailtemplate'),

  getByType: (type: EmailTemplateType): Promise<AxiosResponse<EmailTemplate[]>> =>
    api.get(`/admin/adminemailtemplate/by-type/${type}`),

  getById: (id: string): Promise<AxiosResponse<EmailTemplate>> =>
    api.get(`/admin/adminemailtemplate/${id}`),

  create: (data: CreateEmailTemplateRequest): Promise<AxiosResponse<EmailTemplate>> =>
    api.post('/admin/adminemailtemplate', data),

  update: (id: string, data: UpdateEmailTemplateRequest): Promise<AxiosResponse<EmailTemplate>> =>
    api.put(`/admin/adminemailtemplate/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/admin/adminemailtemplate/${id}`),

  setAsDefault: (id: string): Promise<AxiosResponse<void>> =>
    api.put(`/admin/adminemailtemplate/${id}/set-default`),

  toggleActive: (id: string): Promise<AxiosResponse<void>> =>
    api.put(`/admin/adminemailtemplate/${id}/toggle-active`),

  getStats: (): Promise<AxiosResponse<EmailTemplateStats>> =>
    api.get('/admin/adminemailtemplate/stats'),

  preview: (id: string, variables: Record<string, string>): Promise<AxiosResponse<EmailTemplatePreview>> =>
    api.post(`/admin/adminemailtemplate/${id}/preview`, variables),
};

// Author Types
export interface ApiCreateAuthorDto {
  UserId: string; // Required - Guid of the authenticated user (backend expects PascalCase)
  PenName: string; // backend expects PascalCase
  Biography: string; // backend expects PascalCase
  Website?: string; // backend expects PascalCase
  Nationality?: string; // backend expects PascalCase
}

export interface ApiCreateAuthorByAdminDto {
  UserId?: string;
  PenName: string;
  Biography: string;
  Website?: string;
  Nationality?: string;
  ProfileImageUrl?: string;
  DateOfBirth?: string;
  ApprovalStatus: string;
  ApprovalNote?: string;
  IsActive: boolean;
}

export interface ApiApprovalDto {
  UserId: string;
  Approve: boolean;
  Note?: string;
}

export interface AuthorLookupDto {
  id: string;
  penName: string;
}

export interface ApiAuthorDto {
  id: string;
  userId: string;
  penName: string;
  biography: string;
  profileImageUrl?: string;
  website?: string;
  dateOfBirth?: string;
  nationality?: string;
  approvalStatus: string;
  approvalNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Author API
export const authorApi = {
  create: (data: ApiCreateAuthorDto): Promise<AxiosResponse<{ message: string; data: ApiAuthorDto; isSucceeded: boolean }>> =>
    api.post('/author/create', data),

  createByAdmin: (data: ApiCreateAuthorByAdminDto): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.post('/author/createbyadmin', data),

  update: (data: ApiAuthorDto): Promise<AxiosResponse<{ message: string; data: ApiAuthorDto; isSucceeded: boolean }>> =>
    api.put('/author/update', data),

  getMyAuthorProfile: (): Promise<AxiosResponse<{ data: ApiAuthorDto; message: string; isSucceeded: boolean }>> =>
    api.get('/author/my-authors'),

  getAll: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }): Promise<AxiosResponse<{ data: ApiAuthorDto[] | { authors: ApiAuthorDto[]; totalCount: number; pageNumber: number; pageSize: number; totalPages: number; hasPreviousPage: boolean; hasNextPage: boolean }; message: string; isSucceeded: boolean }>> =>
    api.get('/author/all', { params }),

  getApprovedAuthors: (): Promise<AxiosResponse<{ data: AuthorLookupDto[]; message: string; isSucceeded: boolean }>> =>
    api.get('/author/approved'),

  approve: (authorId: string, data: ApiApprovalDto): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.post(`/author/approve/${authorId}`, data),

  delete: (authorId: string): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.delete(`/author/${authorId}`),

  validateAuthors: (authorIds: string[]): Promise<AxiosResponse<{ data: { validIds: string[]; invalidIds: string[]; allValid: boolean }; message: string; isSucceeded: boolean }>> =>
    api.post('/author/validate-authors', authorIds),
};

// Royalty Payment DTOs
export interface RoyaltyPaymentDto {
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
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoyaltyPaymentListDto {
  royalties: RoyaltyPaymentDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Royalty Payment API
export const royaltyPaymentApi = {
  getAuthorRoyalties: (authorId: string, params?: { pageNumber?: number; pageSize?: number; status?: string }): Promise<AxiosResponse<{ data: RoyaltyPaymentListDto; message: string; isSucceeded: boolean }>> =>
    api.get(`/RoyaltyPayment/author/${authorId}`, { params }),
};

// Product Types
export interface PublisherLookupDto {
  id: string;
  name: string;
}

export interface CategoryAttributeValueDto {
  id: string;
  attributeId: string;
  value: string;
  sort: number;
}

export interface CategoryAttributeDto {
  id: string;
  categoryId: string;
  title: string;
  inputType: string; // Select, Text, Number
  isRequired: boolean;
  isFilterable: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
  values?: CategoryAttributeValueDto[];
}

export interface CategoryTreeDto {
  id: string;
  parentId?: string;
  title: string;
  slug?: string;
  description?: string;
  isActive: boolean;
  sort: number;
  children?: CategoryTreeDto[];
  attributes: CategoryAttributeDto[];
}

export interface GetProductFormatDto {
  id?: string;
  formatType: string;
  price: number;
  discountedPrice?: number;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface GetProductAuthorDto {
  authorId: string;
  authorName?: string;
  role: string;
  displayOrder: number;
}

export interface ProductTagDto {
  id?: string;
  name: string;
}

export interface GetProductMediaDto {
  mediaUrl: string;     // Base path like "/image/jpeg/2025/11"
  mediaRole: string;    // "cover"
  mediaType: string;    // "image/webp"
  isMain: boolean;
  title: string;        // The filename like "4a8b93abadc0454e93feb38be1935ad7.jpg"
}

export interface GetProductDto {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  isbn?: string;
  publicationDate?: string;
  language: string;
  pages?: number;
  dimensions?: string;
  weight?: number;
  ageGroup?: string;
  edition?: string;
  series?: string;
  volume?: number;
  isActive: boolean;
  coverImageUrl?: string;
  backCoverImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isbnApprovedBy?: string;
  isbnApprovedAt?: string;
  createdAt: string;
  publisherId?: string;
  formats?: GetProductFormatDto[];
  authors?: GetProductAuthorDto[];
  tags?: ProductTagDto[];
  media?: GetProductMediaDto[];
}

export interface GetProductListResponse {
  data: GetProductListModelDto;
  publishers: PublisherLookupDto[];
  isSucceeded: boolean;
}

export interface GetProductListModelDto {
  products: GetProductDto[];
  categories: CategoryTreeDto[];
  authors: AuthorLookupDto[];
  publishers?: PublisherLookupDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface GetProductCreationModelDto {
  product: GetProductDto;
  categories: CategoryTreeDto[];
  authors: AuthorLookupDto[];
  publishers: PublisherLookupDto[];
}

// Product API
export interface ProductListParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  categoryId?: string;
  authorId?: string;
  publisherId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDescending?: boolean;
}

export const productApi = {
  getCreationModel: (): Promise<AxiosResponse<{ message: string; data: GetProductCreationModelDto; isSucceeded: boolean }>> =>
    api.get('/product/creation-model'),
  
  getAll: (params?: ProductListParams): Promise<AxiosResponse<GetProductListResponse>> =>
    api.get('/product/list', { params }),
  
  getById: (id: string): Promise<AxiosResponse<{ data: GetProductDto; isSucceeded: boolean }>> =>
    api.get(`/product/${id}`),
  
  create: (data: any): Promise<AxiosResponse<{ message: string; data: any; isSucceeded: boolean }>> =>
    api.post('/product', data),
  
  update: (id: string, data: any): Promise<AxiosResponse<{ message: string; data: any; isSucceeded: boolean }>> =>
    api.put(`/product/${id}`, data),
  
  save: (data: any): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.put('/product/save', data, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    }),
  
  delete: (id: string): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.delete(`/product/${id}`),
  
  addISBN: (productFormatId: string, isbn: string, approvalNotes?: string): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> => {
    if (!productFormatId || !productFormatId.trim()) {
      throw new Error('Product Format ID is required');
    }
    if (!isbn || !isbn.trim()) {
      throw new Error('ISBN is required');
    }
    if (isbn.trim().length > 17) {
      throw new Error('ISBN cannot exceed 17 characters');
    }
    if (approvalNotes && approvalNotes.length > 500) {
      throw new Error('Approval notes cannot exceed 500 characters');
    }

    const payload: {
      ProductFormatId: string;
      ISBN: string;
      ApprovalNotes?: string;
    } = {
      ProductFormatId: productFormatId.trim(),
      ISBN: isbn.trim()
    };

    if (approvalNotes && approvalNotes.trim()) {
      payload.ApprovalNotes = approvalNotes.trim();
    }

    return api.put('/product/format/add-isbn', payload, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },
  
  changeAvailability: (productId: string, isAvailable: boolean): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> => {
    if (!productId || !productId.trim()) {
      throw new Error('Product ID is required');
    }

    return api.put('/product/change-availability', {
      ProductId: productId.trim(),
      IsAvailable: isAvailable,
      IsActive: isAvailable
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// Reading Progress API
export interface ReadingProgressDto {
  id: string;
  userId: string;
  productId: string;
  digitalLibraryId: string;
  productTitle?: string;
  currentPage: number;
  totalPages: number;
  progressPercentage: number;
  currentChapter?: string;
  currentSection?: string;
  readingTime: string;
  lastReadAt?: string;
  completedAt?: string;
  isCompleted: boolean;
  currentPosition?: number;
  totalDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateReadingProgressRequest {
  productId: string;
  digitalLibraryId: string;
  currentPage?: number;
  totalPages?: number;
  currentChapter?: string;
  currentSection?: string;
  currentPosition?: number;
  totalDuration?: number;
  isCompleted?: boolean;
}

export const readingProgressApi = {
  update: async (data: UpdateReadingProgressRequest): Promise<AxiosResponse<{ message: string; data: ReadingProgressDto; isSucceeded: boolean }>> =>
    api.post('/readingprogress/update', data),
    
  getByProduct: async (productId: string): Promise<AxiosResponse<{ message: string; data: ReadingProgressDto; isSucceeded: boolean }>> =>
    api.get(`/readingprogress/product/${productId}`),
    
  getMyProgress: async (): Promise<AxiosResponse<{ message: string; data: ReadingProgressDto[]; isSucceeded: boolean }>> =>
    api.get('/readingprogress/my-progress'),
};

// Bookmark API
export interface BookmarkDto {
  id: string;
  userId: string;
  productId: string;
  productTitle: string;
  readingProgressId?: string;
  title: string;
  description?: string;
  pageNumber: number;
  chapter?: string;
  section?: string;
  position?: number;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookmarkRequest {
  productId: string;
  readingProgressId?: string;
  title: string;
  description?: string;
  pageNumber: number;
  chapter?: string;
  section?: string;
  position?: number;
  color?: string;
  icon?: string;
}

export interface UpdateBookmarkRequest {
  id: string;
  title?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export const bookmarkApi = {
  create: async (data: CreateBookmarkRequest): Promise<AxiosResponse<{ message: string; data: BookmarkDto; isSucceeded: boolean }>> =>
    api.post('/bookmark/create', data),
    
  update: async (data: UpdateBookmarkRequest): Promise<AxiosResponse<{ message: string; data: BookmarkDto; isSucceeded: boolean }>> =>
    api.put('/bookmark/update', data),
    
  delete: async (id: string): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.delete(`/bookmark/${id}`),
    
  getMyBookmarks: async (productId?: string): Promise<AxiosResponse<{ message: string; data: BookmarkDto[]; isSucceeded: boolean }>> =>
    api.get('/bookmark/my-bookmarks', { params: productId ? { productId } : {} }),
};

// Wishlist API
export interface WishlistDto {
  id: string;
  userId: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  productPrice?: number;
  productAuthor?: string;
  addedAt: string;
  priority: number;
  notes?: string;
}

export interface WishlistListDto {
  items: WishlistDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AddWishlistItemRequest {
  productId: string;
  priority?: number;
  notes?: string;
}

export interface UpdateWishlistItemRequest {
  id: string;
  priority?: number;
  notes?: string;
}

export const wishlistApi = {
  getWishlist: async (pageNumber: number = 1, pageSize: number = 12): Promise<AxiosResponse<{ message: string; data: WishlistListDto; isSucceeded: boolean }>> =>
    api.get('/wishlist', { params: { pageNumber, pageSize } }),
    
  addItem: async (data: AddWishlistItemRequest): Promise<AxiosResponse<{ message: string; data: WishlistDto; isSucceeded: boolean }>> =>
    api.post('/wishlist/add-item', data),
    
  updateItem: async (data: UpdateWishlistItemRequest): Promise<AxiosResponse<{ message: string; data: WishlistDto; isSucceeded: boolean }>> =>
    api.put('/wishlist/update-item', data),
    
  removeItem: async (id: string): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.delete(`/wishlist/${id}`),
    
  clearWishlist: async (): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.delete('/wishlist/clear'),
};

// Note API
export interface NoteDto {
  id: string;
  userId: string;
  productId: string;
  readingProgressId?: string;
  bookmarkId?: string;
  title: string;
  content: string;
  pageNumber: number;
  chapter?: string;
  section?: string;
  position?: number;
  highlightedText?: string;
  highlightColor?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  productId: string;
  readingProgressId?: string;
  bookmarkId?: string;
  title: string;
  content: string;
  pageNumber: number;
  chapter?: string;
  section?: string;
  position?: number;
  highlightedText?: string;
  highlightColor?: string;
  isPrivate?: boolean;
}

export interface UpdateNoteRequest {
  id: string;
  title?: string;
  content?: string;
  highlightColor?: string;
  isPrivate?: boolean;
}

export const noteApi = {
  create: async (data: CreateNoteRequest): Promise<AxiosResponse<{ message: string; data: NoteDto; isSucceeded: boolean }>> =>
    api.post('/note/create', data),
    
  update: async (data: UpdateNoteRequest): Promise<AxiosResponse<{ message: string; data: NoteDto; isSucceeded: boolean }>> =>
    api.put('/note/update', data),
    
  delete: async (id: string): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.delete(`/note/${id}`),
    
  getMyNotes: async (productId?: string): Promise<AxiosResponse<{ message: string; data: NoteDto[]; isSucceeded: boolean }>> =>
    api.get('/note/my-notes', { params: productId ? { productId } : {} }),
};

// Ticket API
export interface TicketDto {
  id: string;
  userId: string;
  assignedTo?: string;
  ticketNumber: string;
  subject: string;
  description: string;
  ticketType: string;
  priority: string;
  status: string;
  relatedOrderId?: string;
  relatedProductId?: string;
  createdAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  updatedAt: string;
  messages: TicketMessageDto[];
  attachments?: TicketAttachmentDto[];
}

export interface TicketMessageDto {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isInternal: boolean;
  isFromSupport: boolean;
  createdAt: string;
  updatedAt: string;
  attachments?: TicketAttachmentDto[];
}

export interface TicketAttachmentDto {
  id: string;
  ticketId?: string;
  ticketMessageId?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  ticketType: string;
  priority?: string;
  relatedOrderId?: string;
  relatedProductId?: string;
}

export interface AddTicketMessageRequest {
  ticketId: string;
  message: string;
  isInternal?: boolean;
}

export interface TicketListDto {
  tickets: TicketDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const ticketApi = {
  create: async (data: CreateTicketRequest): Promise<AxiosResponse<{ message: string; data: TicketDto; isSucceeded: boolean }>> =>
    api.post('/ticket/create', data),
    
  getById: async (id: string): Promise<AxiosResponse<{ message: string; data: TicketDto; isSucceeded: boolean }>> =>
    api.get(`/ticket/${id}`),
    
  getMyTickets: async (status?: string, pageNumber: number = 1, pageSize: number = 10): Promise<AxiosResponse<{ message: string; data: TicketListDto; isSucceeded: boolean }>> =>
    api.get('/ticket/my-tickets', { params: { status, pageNumber, pageSize } }),
    
  getAll: async (status?: string, pageNumber: number = 1, pageSize: number = 10): Promise<AxiosResponse<{ message: string; data: TicketListDto; isSucceeded: boolean }>> =>
    api.get('/ticket/all', { params: { status, pageNumber, pageSize } }),
    
  addMessage: async (data: AddTicketMessageRequest): Promise<AxiosResponse<{ message: string; data: TicketMessageDto; isSucceeded: boolean }>> =>
    api.post('/ticket/add-message', data),
    
  updateStatus: async (data: { ticketId: string; status: string; assignedTo?: string }): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.put('/ticket/update-status', data),
};

// Refund API
export interface RefundDto {
  id: string;
  orderId: string;
  orderItemId?: string;
  paymentId: string;
  userId: string;
  processedBy?: string;
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
  userPhoneNumber?: string;
  refundNumber: string;
  refundAmount: number;
  refundType: string;
  status: string;
  reason: string;
  adminNotes?: string;
  rejectionReason?: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  gatewayRefundId?: string;
  gatewayResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRefundRequest {
  orderId: string;
  orderItemId?: string;
  reason: string;
}

export interface ProcessRefundRequest {
  refundId: string;
  approve: boolean;
  adminNotes?: string;
  rejectionReason?: string;
  gatewayRefundId?: string;
  gatewayResponse?: string;
}

export interface RefundListDto {
  items: RefundDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const refundApi = {
  request: async (data: CreateRefundRequest): Promise<AxiosResponse<{ message: string; data: RefundDto; isSucceeded: boolean }>> =>
    api.post('/refund/request', data),
    
  getById: async (id: string): Promise<AxiosResponse<{ message: string; data: RefundDto; isSucceeded: boolean }>> =>
    api.get(`/refund/${id}`),
    
  getMyRefunds: async (pageNumber: number = 1, pageSize: number = 10): Promise<AxiosResponse<{ message: string; data: RefundListDto; isSucceeded: boolean }>> =>
    api.get('/refund/my-refunds', { params: { pageNumber, pageSize } }),
    
  getAll: async (status?: string, pageNumber: number = 1, pageSize: number = 10): Promise<AxiosResponse<{ message: string; data: RefundListDto; isSucceeded: boolean }>> =>
    api.get('/refund/all', { params: { ...(status ? { status } : {}), pageNumber, pageSize } }),
    
  process: async (data: ProcessRefundRequest): Promise<AxiosResponse<{ message: string; data: RefundDto; isSucceeded: boolean }>> =>
    api.post('/refund/process', data),
};

// Coupon API (User side)
export interface CouponDto {
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

export interface ValidateCouponRequest {
  code: string;
  orderAmount: number;
  productIds?: string[];
  userId?: string;
}

export interface ValidateCouponResponse {
  isValid: boolean;
  discountAmount: number;
  errorMessage?: string;
  coupon?: CouponDto;
}

export interface ApplyCouponRequest {
  code: string;
  orderId: string;
}

export const couponApi = {
  validate: async (data: ValidateCouponRequest): Promise<AxiosResponse<{ message: string; data: ValidateCouponResponse; isSucceeded: boolean }>> =>
    api.post('/coupon/validate', data),
    
  apply: async (data: ApplyCouponRequest): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.post('/coupon/apply', data),
    
  getByCode: async (code: string): Promise<AxiosResponse<{ message: string; data: CouponDto; isSucceeded: boolean }>> =>
    api.get(`/coupon/code/${code}`),
    
  getPublicCoupons: async (): Promise<AxiosResponse<{ message: string; data: CouponDto[]; isSucceeded: boolean }>> =>
    api.get('/coupon/public'),
    
  getAll: async (isActive?: boolean): Promise<AxiosResponse<{ message: string; data: CouponDto[]; isSucceeded: boolean }>> =>
    api.get('/coupon/all', { params: isActive !== undefined ? { isActive } : {} }),
    
  create: async (data: any): Promise<AxiosResponse<{ message: string; data: CouponDto; isSucceeded: boolean }>> =>
    api.post('/coupon/create', data),
    
  update: async (data: any): Promise<AxiosResponse<{ message: string; data: CouponDto; isSucceeded: boolean }>> =>
    api.put('/coupon/update', data),
    
  delete: async (id: string): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.delete(`/coupon/${id}`),
};

// Digital Library API (additional methods)
export interface DigitalLibraryDto {
  id: string;
  userId: string;
  productId: string;
  productFormatId: string;
  orderId: string;
  orderItemId: string;
  purchasedAt: string;
  expiresAt?: string;
  isActive: boolean;
  accessToken?: string;
  accessTokenExpiresAt?: string;
  downloadCount: number;
  maxDownloads: number;
  createdAt: string;
  updatedAt: string;
  productTitle?: string;
  formatType?: string;
  fileType?: string;
  fileUrl?: string;
}

export const digitalLibraryApi = {
  getMyLibrary: async (): Promise<AxiosResponse<{ message: string; data: DigitalLibraryDto[]; isSucceeded: boolean }>> =>
    api.get('/digitallibrary/my-library'),
    
  getById: async (id: string): Promise<AxiosResponse<{ message: string; data: DigitalLibraryDto; isSucceeded: boolean }>> =>
    api.get(`/digitallibrary/${id}`),
    
  generateToken: async (id: string): Promise<AxiosResponse<{ message: string; data: { token: string }; isSucceeded: boolean }>> =>
    api.post(`/digitallibrary/${id}/generate-token`),
    
  getFile: async (id: string, token: string): Promise<AxiosResponse<{ message: string; data: { fileUrl: string }; isSucceeded: boolean }>> =>
    api.get(`/digitallibrary/${id}/file?token=${encodeURIComponent(token)}`),
    
  addFromOrder: async (data: { orderId: string; orderItemId: string }): Promise<AxiosResponse<{ message: string; data: DigitalLibraryDto; isSucceeded: boolean }>> =>
    api.post('/digitallibrary/add-from-order', data),
    
  logPageView: async (id: string, data: { token: string; pageNumber: number }): Promise<AxiosResponse<{ message: string; data: boolean; isSucceeded: boolean }>> =>
    api.post(`/digitallibrary/${id}/log-page-view`, data),
};

// User Address API
export interface UserAddressDto {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  label?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserAddressRequest {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  label?: string;
  isDefault?: boolean;
}

export interface UpdateUserAddressRequest {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  label?: string;
  isDefault?: boolean;
}

export const userAddressApi = {
  create: async (data: CreateUserAddressRequest): Promise<AxiosResponse<{ message: string; data: UserAddressDto; isSucceeded: boolean }>> =>
    api.post('/useraddress/create', data),
    
  update: async (data: UpdateUserAddressRequest): Promise<AxiosResponse<{ message: string; data: UserAddressDto; isSucceeded: boolean }>> =>
    api.put('/useraddress/update', data),
    
  delete: async (addressId: string): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.delete(`/useraddress/${addressId}`),
    
  getAll: async (): Promise<AxiosResponse<{ message: string; data: UserAddressDto[]; isSucceeded: boolean }>> =>
    api.get('/useraddress/all'),
    
  getById: async (addressId: string): Promise<AxiosResponse<{ message: string; data: UserAddressDto; isSucceeded: boolean }>> =>
    api.get(`/useraddress/${addressId}`),
    
  setDefault: async (addressId: string): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.put(`/useraddress/set-default/${addressId}`),
};

// Cart API
export interface CartDto {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  cartItems: CartItemDto[];
}

export interface CartItemDto {
  id: string;
  cartId: string;
  productId: string;
  productFormatId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  productTitle?: string;
  formatType?: string;
  price?: number;
  finalPrice?: number;
}

export interface AddCartItemRequest {
  productId: string;
  productFormatId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  cartItemId: string;
  quantity: number;
}

export const cartApi = {
  getCart: async (): Promise<AxiosResponse<{ message: string; data: CartDto; isSucceeded: boolean }>> =>
    api.get('/cart'),
    
  addItem: async (data: AddCartItemRequest): Promise<AxiosResponse<{ message: string; data: CartItemDto; isSucceeded: boolean }>> =>
    api.post('/cart/add-item', data),
    
  updateItem: async (data: UpdateCartItemRequest): Promise<AxiosResponse<{ message: string; data: CartItemDto; isSucceeded: boolean }>> =>
    api.put('/cart/update-item', data),
    
  removeItem: async (cartItemId: string): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.delete(`/cart/remove-item/${cartItemId}`),
    
  clearCart: async (): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.delete('/cart/clear'),
};

// Product Review API
export interface ProductReviewDto {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userFirstName: string;
  userLastName: string;
  productFormatId?: string;
  parentReviewId?: string;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  updatedAt?: string;
  replies?: ProductReviewDto[];
  productTitle?: string;
  productImage?: string;
  userVote?: string;  // "helpful", "notHelpful", or undefined
}

export interface CreateProductReviewRequest {
  productId: string;
  productFormatId?: string;
  rating: number;
  title: string;
  comment: string;
}

export interface UpdateProductReviewRequest {
  id: string;
  rating?: number;
  title?: string;
  comment?: string;
}

export interface ProductReviewListDto {
  items: ProductReviewDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// User Report interfaces
export interface UserReportDto {
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

export interface CreateUserReportDto {
  reportType: string;
  reportReason: string;
  description: string;
  reportedUserId?: string;
  reportedProductId?: string;
  reportedReviewId?: string;
}

export interface UpdateUserReportStatusDto {
  status: string;
  adminNotes?: string;
  resolutionAction?: string;
}

export interface UserReportListDto {
  reports: UserReportDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const userReportApi = {
  createReport: async (data: CreateUserReportDto): Promise<AxiosResponse<{ data: UserReportDto; isSucceeded: boolean; message: string }>> =>
    api.post('/UserReport/create', data),

  getReport: async (id: string): Promise<AxiosResponse<{ data: UserReportDto; isSucceeded: boolean }>> =>
    api.get(`/UserReport/${id}`),

  getMyReports: async (params: { status?: string; reportType?: string; pageNumber?: number; pageSize?: number }): Promise<AxiosResponse<{ data: UserReportListDto; isSucceeded: boolean }>> =>
    api.get('/UserReport/my-reports', { params }),

  getAllReports: async (params: { status?: string; reportType?: string; reportReason?: string; pageNumber?: number; pageSize?: number }): Promise<AxiosResponse<{ data: UserReportListDto; isSucceeded: boolean }>> =>
    api.get('/UserReport/all', { params }),

  updateStatus: async (id: string, data: UpdateUserReportStatusDto): Promise<AxiosResponse<{ data: UserReportDto; isSucceeded: boolean; message: string }>> =>
    api.put(`/UserReport/${id}/status`, data),
};

export const productReviewApi = {
  getProductReviews: async (productId: string, onlyApproved: boolean = true): Promise<AxiosResponse<{ message: string; data: ProductReviewDto[]; isSucceeded: boolean }>> =>
    api.get(`/productreview/product/${productId}`, { params: { onlyApproved } }),
    
  getById: async (id: string): Promise<AxiosResponse<{ message: string; data: ProductReviewDto; isSucceeded: boolean }>> =>
    api.get(`/productreview/${id}`),
    
  create: async (data: CreateProductReviewRequest): Promise<AxiosResponse<{ message: string; data: ProductReviewDto; isSucceeded: boolean }>> =>
    api.post('/productreview/create', data),
    
  update: async (data: UpdateProductReviewRequest): Promise<AxiosResponse<{ message: string; data: ProductReviewDto; isSucceeded: boolean }>> =>
    api.put('/productreview/update', data),
    
  delete: async (id: string): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.delete(`/productreview/${id}`),
    
  markHelpful: async (reviewId: string, isHelpful: boolean): Promise<AxiosResponse<{ message: string; isSucceeded: boolean }>> =>
    api.post(`/productreview/${reviewId}/helpful`, isHelpful),
    
  getMyReviews: async (pageNumber: number = 1, pageSize: number = 12): Promise<AxiosResponse<{ message: string; data: ProductReviewListDto; isSucceeded: boolean }>> =>
    api.get('/productreview/my-reviews', { params: { pageNumber, pageSize } }),
    
  getAllReviews: async (pageNumber: number = 1, pageSize: number = 12, isApproved?: boolean): Promise<AxiosResponse<{ message: string; data: ProductReviewListDto; isSucceeded: boolean }>> =>
    api.get('/productreview/all', { params: { pageNumber, pageSize, isApproved } }),
    
  approveReview: async (reviewId: string): Promise<AxiosResponse<{ message: string; data: ProductReviewDto; isSucceeded: boolean }>> =>
    api.post(`/productreview/${reviewId}/approve`),
    
  rejectReview: async (reviewId: string): Promise<AxiosResponse<{ message: string; data: ProductReviewDto; isSucceeded: boolean }>> =>
    api.post(`/productreview/${reviewId}/reject`),
    
  getRatingStatistics: async (): Promise<AxiosResponse<{ message: string; data: RatingStatisticsDto; isSucceeded: boolean }>> =>
    api.get('/productreview/statistics'),
};

// Rating Statistics interfaces
export interface RatingStatisticsDto {
  totalReviews: number;
  approvedReviews: number;
  pendingReviews: number;
  averageRating: number;
  distribution: RatingDistributionDto;
  monthlyTrends: RatingTrendDto[];
  topRatedProducts: TopRatedProductDto[];
  lowRatedProducts: LowRatedProductDto[];
}

export interface RatingDistributionDto {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
}

export interface RatingTrendDto {
  month: string;
  year: number;
  count: number;
  averageRating: number;
}

export interface TopRatedProductDto {
  productId: string;
  productTitle: string;
  averageRating: number;
  totalReviews: number;
}

export interface LowRatedProductDto {
  productId: string;
  productTitle: string;
  averageRating: number;
  totalReviews: number;
}

// Contact Feedback API
export interface CreateContactFeedbackDto {
  name: string;
  email: string;
  phoneNumber?: string;
  subject: string;
  message: string;
  category: string;
}

export const contactFeedbackApi = {
  createFeedback: async (data: CreateContactFeedbackDto): Promise<AxiosResponse<{ data: any; isSucceeded: boolean; message: string }>> =>
    api.post('/ContactFeedback/create', data),
};

// Product Like API
export interface ProductLikeDto {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  createdAt: string;
  productTitle?: string;
  productImage?: string;
  productPrice?: number;
  productAuthor?: string;
}

export const productLikeApi = {
  toggleLike: async (productId: string): Promise<AxiosResponse<{ message: string; data: ProductLikeDto | null; isSucceeded: boolean }>> =>
    api.post(`/productlike/toggle/${productId}`),
    
  checkLike: async (productId: string): Promise<AxiosResponse<{ message: string; data: boolean; isSucceeded: boolean }>> =>
    api.get(`/productlike/check/${productId}`),
    
  getLikeCount: async (productId: string): Promise<AxiosResponse<{ message: string; data: number; isSucceeded: boolean }>> =>
    api.get(`/productlike/count/${productId}`),
    
  getProductLikes: async (productId: string): Promise<AxiosResponse<{ message: string; data: ProductLikeDto[]; isSucceeded: boolean }>> =>
    api.get(`/productlike/product/${productId}`),
    
  getMyLikes: async (): Promise<AxiosResponse<{ message: string; data: ProductLikeDto[]; isSucceeded: boolean }>> =>
    api.get('/productlike/my-likes'),
};

// User Notification DTOs
export interface UserNotificationDto {
  id: string;
  notificationId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface UserNotificationListDto {
  notifications: UserNotificationDto[];
  totalCount: number;
  unreadCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const notificationApi = {
  getUserNotifications: async (params?: { pageNumber?: number; pageSize?: number; isRead?: boolean }): Promise<AxiosResponse<{ data: UserNotificationListDto; isSucceeded: boolean; message: string }>> =>
    api.get('/Notification/user', { params }),

  getUnreadCount: async (): Promise<AxiosResponse<{ data: number; isSucceeded: boolean; message: string }>> =>
    api.get('/Notification/user/unread-count'),

  markAsRead: async (userNotificationId: string): Promise<AxiosResponse<{ data: boolean; isSucceeded: boolean; message: string }>> =>
    api.post(`/Notification/user/${userNotificationId}/mark-read`),

  markAllAsRead: async (): Promise<AxiosResponse<{ data: boolean; isSucceeded: boolean; message: string }>> =>
    api.post('/Notification/user/mark-all-read'),
};

export default api;
export const apiService = api;
export { fileApi }; 