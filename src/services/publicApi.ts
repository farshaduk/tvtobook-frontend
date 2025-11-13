import { default as api } from './api';

// DTOs matching backend structure
export interface PublicProductFormatDto {
  id: string;
  formatType: string;
  fileType?: string;
  price: number;
  discountPrice?: number;
  isAvailable: boolean;
  stockQuantity?: number;
  isTrackable: boolean;
  isbn?: string;
  sku?: string;
  fileSize?: number;
  createdAt: string;
  finalPrice: number;
  hasDiscount: boolean;
  discountPercentage?: number;
  fileSizeDisplay: string;
}

export interface PublicProductAuthorDto {
  authorId: string;
  authorName: string;
  role?: string;
  displayOrder?: number;
  authorBiography?: string;
  authorProfileImageUrl?: string;
}

export interface PublicProductMediaDto {
  id: string;
  mediaUrl: string;
  mediaType?: string;
  mediaRole?: string;
  isMain: boolean;
  title?: string;
  description?: string;
  sortOrder: number;
  fileExtension?: string;
  fileSize?: number;
  durationInSeconds?: number;
  createdAt: string;
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  durationDisplay?: string;
}

export interface PublicProductTagDto {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface PublicProductDto {
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
  coverImageUrl?: string;
  backCoverImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: string;
  publisherName?: string;
  categoryName?: string;
  formats: PublicProductFormatDto[];
  authors: PublicProductAuthorDto[];
  media: PublicProductMediaDto[];
  tags: PublicProductTagDto[];
  mainMedia?: PublicProductMediaDto;
  minPrice?: number;
  maxPrice?: number;
  hasAvailableFormats: boolean;
  authorsDisplay: string;
  averageRating: number;
  totalRatings: number;
  totalReviews: number;
  publisher?: {
    id?: string;
    name?: string;
  };
}

export interface PublicProductListDto {
  products: PublicProductDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  appliedFilters?: PublicProductFiltersDto;
  aggregations?: PublicProductAggregationsDto;
}

export interface PublicProductFiltersDto {
  searchTerm?: string;
  categoryId?: string;
  authorId?: string;
  publisherId?: string;
  formatType?: string;
  minPrice?: number;
  maxPrice?: number;
  language?: string;
  ageGroup?: string;
  onlyAvailable?: boolean;
  sortBy?: string;
}

export interface FilterOptionDto {
  key: string;
  label: string;
  count: number;
  isSelected: boolean;
  parentId?: string;
}

export interface PriceRangeDto {
  minPrice: number;
  maxPrice: number;
  distribution: number[];
}

export interface PublicProductAggregationsDto {
  categories: FilterOptionDto[];
  authors: FilterOptionDto[];
  publishers: FilterOptionDto[];
  formatTypes: FilterOptionDto[];
  languages: FilterOptionDto[];
  ageGroups: FilterOptionDto[];
  priceRange?: PriceRangeDto;
}

export interface InpPublicProductListDto {
  searchTerm?: string;
  categoryId?: string;
  authorId?: string;
  publisherId?: string;
  formatType?: string;
  minPrice?: number;
  maxPrice?: number;
  language?: string;
  ageGroup?: string;
  onlyAvailable?: boolean;
  sortBy?: string;
  pageNumber?: number;
  pageSize?: number;
  includeAggregations?: boolean;
}

export interface PublicSearchResultDto {
  searchTerm: string;
  productResults: PublicProductListDto;
  suggestions: SearchSuggestionDto[];
  totalResultsCount: number;
  searchDuration: string;
}

export interface SearchSuggestionDto {
  text: string;
  type: string;
  resultCount: number;
}

export const publicApi = {
  // Homepage products
  getHomepageProducts: async (pageNumber: number = 1, pageSize: number = 12) => {
    return api.get<{ message: string; data: PublicProductListDto; isSucceeded: boolean }>(
      `/public/homepage/products?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
  },

  getHomepageProductsSimple: async (count: number = 12) => {
    return api.get<{ message: string; data: PublicProductListDto; isSucceeded: boolean }>(
      `/public/homepage/products/simple?count=${count}`
    );
  },

  // Latest products
  getLatestProducts: async (pageNumber: number = 1, pageSize: number = 12) => {
    return api.get<{ message: string; data: PublicProductListDto; isSucceeded: boolean }>(
      `/public/products/latest?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
  },

  getLatestProductsSimple: async (count: number = 12) => {
    return api.get<{ message: string; data: PublicProductListDto; isSucceeded: boolean }>(
      `/public/products/latest/simple?count=${count}`
    );
  },

  // Best selling products
  getBestSellingProducts: async (pageNumber: number = 1, pageSize: number = 12) => {
    return api.get<{ message: string; data: PublicProductListDto; isSucceeded: boolean }>(
      `/public/products/bestselling?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
  },

  getBestSellingProductsSimple: async (count: number = 12) => {
    return api.get<{ message: string; data: PublicProductListDto; isSucceeded: boolean }>(
      `/public/products/bestselling/simple?count=${count}`
    );
  },

  // Category products
  getProductsByCategory: async (categoryId: string, pageNumber: number = 1, pageSize: number = 12) => {
    return api.get<{ message: string; data: PublicProductListDto; isSucceeded: boolean }>(
      `/public/category/${categoryId}/products?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
  },

  getProductsByCategorySimple: async (categoryId: string, count: number = 8) => {
    return api.get<{ message: string; data: PublicProductListDto; isSucceeded: boolean }>(
      `/public/category/${categoryId}/products/simple?count=${count}`
    );
  },

  // Product list with filters
  getProducts: async (input: InpPublicProductListDto) => {
    const params = new URLSearchParams();
    if (input.searchTerm) params.append('searchTerm', input.searchTerm);
    if (input.categoryId) params.append('categoryId', input.categoryId);
    if (input.authorId) params.append('authorId', input.authorId);
    if (input.publisherId) params.append('publisherId', input.publisherId);
    if (input.formatType) params.append('formatType', input.formatType);
    if (input.minPrice !== undefined) params.append('minPrice', input.minPrice.toString());
    if (input.maxPrice !== undefined) params.append('maxPrice', input.maxPrice.toString());
    if (input.language) params.append('language', input.language);
    if (input.ageGroup) params.append('ageGroup', input.ageGroup);
    if (input.onlyAvailable !== undefined) params.append('onlyAvailable', input.onlyAvailable.toString());
    if (input.sortBy) params.append('sortBy', input.sortBy);
    params.append('pageNumber', (input.pageNumber || 1).toString());
    params.append('pageSize', (input.pageSize || 12).toString());
    if (input.includeAggregations) params.append('includeAggregations', 'true');

    return api.get<{ message: string; data: PublicProductListDto; isSucceeded: boolean }>(
      `/public/products?${params.toString()}`
    );
  },

  // Search products
  searchProducts: async (searchTerm: string, pageNumber: number = 1, pageSize: number = 12) => {
    return api.get<{ message: string; data: PublicSearchResultDto; searchTerm: string; isSucceeded: boolean }>(
      `/public/search?searchTerm=${encodeURIComponent(searchTerm)}&pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
  },

  // Product details
  getProductById: async (id: string) => {
    return api.get<{ message: string; data: PublicProductDto; isSucceeded: boolean }>(
      `/public/products/${id}`
    );
  },

  getProductBySlug: async (slug: string) => {
    return api.get<{ message: string; data: PublicProductDto; isSucceeded: boolean }>(
      `/public/products/slug/${encodeURIComponent(slug)}`
    );
  },
};

