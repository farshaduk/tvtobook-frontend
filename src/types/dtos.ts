export interface ProductMedia {
  mediaUrl: string;
  title: string;
  isMain: boolean;
}

export interface ProductFormat {
  formatType: 'Physical' | 'Ebook' | 'Audio';
  price: number;
}

export interface ProductAuthor {
  authorId: string;
  authorName: string;
}

export interface GetProductDto {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  isActive: boolean;
  publisherId: string;
  media?: ProductMedia[];
  formats?: ProductFormat[];
  authors?: ProductAuthor[];
  isbn?: string;
  publicationDate?: string;
  language?: string;
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
  tags?: { id?: string; name: string; }[];
}

export interface CategoryTreeDto {
  id: string;
  name: string;
  parentId?: string;
  subCategories?: CategoryTreeDto[];
}

export interface AuthorLookupDto {
  id: string;
  name: string;
}

export interface PublisherLookupDto {
  id: string;
  name: string;
}

export interface GetProductListModelDto {
  totalCount: number;
  products: GetProductDto[];
  categories: CategoryTreeDto[];
  authors: AuthorLookupDto[];
  publishers: PublisherLookupDto[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}