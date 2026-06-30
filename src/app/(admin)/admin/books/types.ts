import type { BookPayload } from '@/services/api/booksApi';

// Form data interface for admin operations
export interface BookFormData extends Omit<BookPayload, 'price' | 'originalPrice' | 'tags'> {
  _id?: string;
  id?: string;
  discountPrice: number; // Form uses numbers
  originalPrice?: number;
  sales?: number;
  createdAt?: string;
  updatedAt?: string;
  coverImage?: string;
  views?: number;
  downloads?: number;
  slug?: string;
  // Override fields to make them optional for form
  tags?: string[]; // Optional in form, will default to empty array
  componentType?: 'none' | 'free-summaries' | 'trending-books' | 'premium-summaries';
  gst?: number;
}

export interface ValidationErrors {
  title?: string;
  author?: string;
  category?: string;
  description?: string;
  discountPrice?: string;
  pages?: string;
  isbn?: string;
  publishDate?: string;
  rating?: string;
  reviews?: string;
  sales?: string;
  format?: string;
  coverImage?: string;
}

export interface ConfirmDialog {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

// Pagination state
export interface PaginationState {
  page: number;
  totalPages: number;
  totalBooks: number;
  limit: number;
}

export type UploadTarget = 'cover' | 'ebook' | 'audio';
