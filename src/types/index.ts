export interface Product {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  image: string;
  images?: string[]; // Array of additional images
  category: 'book' | 'ebook' | 'audiobook';
  format?: 'hardcover' | 'paperback' | 'pdf' | 'mp3' | 'streaming';
  pages?: number;
  duration?: number; // in minutes for audiobooks
  isbn?: string;
  publishedDate: string;
  rating: number;
  reviews: Review[];
  inStock: boolean;
  featured?: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'IsNormalUser' | 'IsAdmin';
  digitalLibrary: string[]; // Array of product IDs
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingAddress: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface FilterOptions {
  category?: string;
  priceRange?: [number, number];
  format?: string;
  author?: string;
  rating?: number;
}

export interface SortOption {
  field: 'title' | 'price' | 'rating' | 'publishedDate';
  direction: 'asc' | 'desc';
}
