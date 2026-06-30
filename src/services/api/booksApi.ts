/**
 * Books API Service
 * Handles all book-related API operations for admin panel
 */

import { API_CONFIG } from '@/config/api';
import { tokenStore } from './tokenStore';

// API base URL - adjust based on your backend configuration
const API_BASE_URL = API_CONFIG.API_BASE_URL;

// File information interface
export interface BookFile {
  url: string;
  publicId?: string | null;
  originalName?: string | null;
  fileSize?: number;
  mimeType?: string | null;
  duration?: number | string | null;
  uploadedAt?: string;
}

export interface AudiobookTranscriptWord {
  text: string;
  startTime: number;
  endTime: number;
}

export interface AudiobookTranscriptSegment {
  id?: string;
  startTime?: number;
  endTime?: number;
  start: number;
  end: number;
  text: string;
  pageNumber?: number;
  words?: AudiobookTranscriptWord[];
}

export interface AudiobookTranscriptLanguage {
  code: string;
  name: string;
  segments: AudiobookTranscriptSegment[];
}

export interface AudiobookTranscript {
  languages: AudiobookTranscriptLanguage[];
}

export interface AudiobookReaderPage {
  pageNumber: number;
  title?: string;
  content: string;
}

export interface AudiobookAccessState {
  owned: boolean;
  canListen: boolean;
  requiresCheckout: boolean;
  action: 'buy' | 'claim' | 'listen';
  accessMode?: 'claim' | 'purchase' | null;
  status?: 'active' | 'refunded' | 'revoked' | null;
  isFree: boolean;
  checkoutMode?: 'buy' | 'claim' | null;
  redirectTarget?: string;
}

// Book interface matching backend response
export interface Book {
  id: string;
  _id?: string; // MongoDB _id field
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  category: string;
  type: 'Books' | 'Audiobook';
  componentType?: 'none' | 'free-summaries' | 'trending-books' | 'premium-summaries';
  price: string; // Backend sends formatted string like "$24.99"
  originalPrice?: string;
  formatPrices?: { [key: string]: string }; // Format-specific pricing (e.g., { "Hardcover": "$44.99", "Paperback": "$29.99", "E-book": "$19.99" })
  formatOriginalPrices?: { [key: string]: string }; // Format-specific original pricing
  rating: number;
  reviews: number;
  pages?: number;
  duration?: string;
  narrator?: string;
  narratorName?: string;
  publishDate: string;
  isbn?: string;
  format: string[];
  image?: string;
  featured: boolean;
  bestseller: boolean;
  tags: string[];
  status: 'draft' | 'review' | 'published' | 'archived';
  gst?: number;
  language?: string;
  slug?: string;
  views?: number;
  downloads?: number;
  sales?: number;
  accessLevel?: 'free' | 'premium';
  transcript?: AudiobookTranscript;
  readerPages?: AudiobookReaderPage[];
  scripts?: any;
  wordSync?: any;
  voice?: any;
  access?: AudiobookAccessState;
  createdAt: string;
  updatedAt: string;
  files?: {
    coverImage?: BookFile;
    ebook?: BookFile;
    audiobook?: BookFile;
  };
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalBooks: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
  message?: string;
  timestamp?: string;
}

// Book creation/update payload (numbers for backend)
export interface BookPayload {
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  category: string;
  type: 'Books' | 'Audiobook';
  componentType?: 'none' | 'free-summaries' | 'trending-books' | 'premium-summaries';
  price: number; // Send as number to backend
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  sales?: number;
  pages?: number;
  duration?: string;
  narrator?: string;
  publishDate: string;
  isbn?: string;
  gst?: number;
  language?: string;
  isActive?: boolean;
  isPublished?: boolean;
  accessLevel?: 'free' | 'premium';
  format: string[];
  image?: string;
  imageCloudinary?: {
    publicId?: string | null;
    url?: string | null;
    originalName?: string | null;
  } | null;
  featured: boolean;
  bestseller: boolean;
  tags: string[];
  status: 'draft' | 'review' | 'published' | 'archived';
  files?: {
    ebook?: BookFile | null;
    audiobook?: BookFile | null;
  };
  transcript?: AudiobookTranscript;
  readerPages?: AudiobookReaderPage[];
  // Additional fields for audiobooks
  scripts?: any;
  wordSync?: any;
  generatedAudio?: any;
  bookPages?: any;
  generation?: any;
  narratorName?: string;
  voice?: any;
  selectedVoice?: string;
}

class BooksApiService {
  private getToken(): string | null {
    return tokenStore.getAccessToken();
  }

  private getAuthHeaders(includeContentType = true): HeadersInit {
    const token = this.getToken();
    return {
      ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async fetchWithErrorHandling<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const defaultHeaders: Record<string, string> = {};

      // Only add Content-Type for non-FormData requests
      if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: `${API_BASE_URL}${url}`,
        });
        const apiMessage =
          errorData?.message ||
          errorData?.error?.message ||
          `HTTP error! status: ${response.status}`;
        const apiError = new Error(apiMessage) as Error & {
          status?: number;
          response?: { data: any; status: number; statusText: string };
        };
        apiError.status = response.status;
        apiError.response = {
          data: errorData,
          status: response.status,
          statusText: response.statusText,
        };
        throw apiError;
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond');
      }
      console.error('API Error:', error);
      throw error;
    }
  }

  // Get all books with pagination and filters
  async getAllBooks(params: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
    featured?: boolean;
    bestseller?: boolean;
    search?: string;
    sortBy?: string;
    status?: string;
    adminView?: boolean;
  } = {}): Promise<PaginatedResponse<Book>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const url = `/books${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchWithErrorHandling<PaginatedResponse<Book>>(url);
  }

  // Get single book by ID
  async getBookById(id: string): Promise<ApiResponse<Book>> {
    return this.fetchWithErrorHandling<ApiResponse<Book>>(`/books/${id}`);
  }

  async claim(identifier: string): Promise<ApiResponse<{ redirectTarget: string }>> {
    return this.fetchWithErrorHandling<ApiResponse<{ redirectTarget: string }>>(
      `/books/${identifier}/claim`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      }
    );
  }

  async getReadPayload(identifier: string): Promise<ApiResponse<Book>> {
    return this.fetchWithErrorHandling<ApiResponse<Book>>(
      `/books/${identifier}/read`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Create new book
  async createBook(bookData: BookPayload): Promise<ApiResponse<Book>> {
    return this.fetchWithErrorHandling<ApiResponse<Book>>('/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  }

  // Create new book with file uploads
  async createBookWithFiles(bookData: BookPayload, files: {
    coverImage?: File;
    ebookFile?: File;
    audiobookFile?: File;
  }): Promise<ApiResponse<Book>> {
    const formData = new FormData();
    
    // Add book data as JSON fields
    Object.entries(bookData).forEach(([key, value]) => {
      // Don't append if null or undefined
      if (value === null || value === undefined) return;

      // Handle empty string for fields that should be null (like ISBN) to avoid DB uniqueness conflicts
      if (typeof value === 'string' && value.trim() === '') {
        // Only skip if it's a field known for unique constraints, or just skip all empty strings 
        // as the backend defaults should take over. For ISBN specifically:
        if (key === 'isbn') return;
      }

      if (Array.isArray(value)) {
        // Standard way to send arrays in FormData is to append same key multiple times
        value.forEach((val) => {
          formData.append(key, val);
        });
      } else if (typeof value === 'boolean') {
        // Send as string "true"/"false" - Multer/Express will parse this if configured, 
        // otherwise backend handles it manually
        formData.append(key, value.toString());
      } else {
        formData.append(key, value.toString());
      }
    });
    
    // Add files
    if (files.coverImage) {
      formData.append('coverImage', files.coverImage);
    }
    if (files.ebookFile) {
      formData.append('ebookFile', files.ebookFile);
    }
    if (files.audiobookFile) {
      formData.append('audiobookFile', files.audiobookFile);
    }
    
    return this.fetchWithErrorHandling<ApiResponse<Book>>('/books', {
      method: 'POST',
      body: formData,
      // Remove Content-Type header to let browser set it with boundary
      headers: {},
    });
  }

  // Update existing book
  async updateBook(id: string, bookData: Partial<BookPayload>): Promise<ApiResponse<Book>> {
    return this.fetchWithErrorHandling<ApiResponse<Book>>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    });
  }

  // Update existing book with file uploads
  async updateBookWithFiles(id: string, bookData: Partial<BookPayload>, files: {
    coverImage?: File;
    ebookFile?: File;
    audiobookFile?: File;
  }): Promise<ApiResponse<Book>> {
    const formData = new FormData();
    
    // Add book data as JSON fields
    Object.entries(bookData).forEach(([key, value]) => {
      // Don't append if null or undefined
      if (value === null || value === undefined) return;

      // Skip base64 image field when coverImage file is provided
      if (key === 'image' && files.coverImage) {
        return;
      }

      // Handle empty string for fields that should be null (like ISBN) to avoid DB uniqueness conflicts
      if (typeof value === 'string' && value.trim() === '') {
        if (key === 'isbn') return;
      }

      if (Array.isArray(value)) {
        // Standard way to send arrays in FormData is to append same key multiple times
        value.forEach((val) => {
          formData.append(key, typeof val === 'object' ? JSON.stringify(val) : val.toString());
        });
      } else if (typeof value === 'boolean') {
        formData.append(key, value.toString());
      } else {
        formData.append(key, value.toString());
      }
    });
    
    // Add files
    if (files.coverImage) {
      formData.append('coverImage', files.coverImage);
    }
    if (files.ebookFile) {
      formData.append('ebookFile', files.ebookFile);
    }
    if (files.audiobookFile) {
      formData.append('audiobookFile', files.audiobookFile);
    }
    
    return this.fetchWithErrorHandling<ApiResponse<Book>>('/books/' + id, {
      method: 'PUT',
      body: formData,
      // Remove Content-Type header to let browser set it with boundary
      headers: {},
    });
  }

  // Delete book
  async deleteBook(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithErrorHandling<ApiResponse<{ message: string }>>(`/books/${id}`, {
      method: 'DELETE',
    });
  }

  // Search books
  async searchBooks(params: {
    q: string;
    category?: string;
    type?: string;
    minRating?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Book>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.fetchWithErrorHandling<PaginatedResponse<Book>>(`/books/search?${searchParams.toString()}`);
  }

  // Get trending books (using trending endpoint)
  async getTrendingBooks(limit: number = 10): Promise<PaginatedResponse<Book>> {
    return this.fetchWithErrorHandling<PaginatedResponse<Book>>(`/books/trending?limit=${limit}`);
  }

  // Get free summaries (using componentType filter)
  async getFreeSummaries(limit: number = 12): Promise<PaginatedResponse<Book>> {
    return this.fetchWithErrorHandling<PaginatedResponse<Book>>(`/books?componentType=free-summaries&limit=${limit}`);
  }

  // Get premium summaries (using componentType filter)
  async getPremiumSummaries(limit: number = 12): Promise<PaginatedResponse<Book>> {
    return this.fetchWithErrorHandling<PaginatedResponse<Book>>(`/books?componentType=premium-summaries&limit=${limit}`);
  }

  // Get books by component type (unified method)
  async getBooksByComponentType(componentType: 'free-summaries' | 'trending-books' | 'premium-summaries', limit: number = 12): Promise<PaginatedResponse<Book>> {
    return this.fetchWithErrorHandling<PaginatedResponse<Book>>(`/books?componentType=${componentType}&limit=${limit}`);
  }

  // Get featured books
  async getFeaturedBooks(limit: number = 5): Promise<PaginatedResponse<Book>> {
    return this.fetchWithErrorHandling<PaginatedResponse<Book>>(`/books?featured=true&limit=${limit}`);
  }

  // Get bestsellers
  async getBestsellers(limit: number = 10): Promise<PaginatedResponse<Book>> {
    return this.fetchWithErrorHandling<PaginatedResponse<Book>>(`/books?bestseller=true&limit=${limit}`);
  }

  // Get categories (hardcoded for now, can be made dynamic later)
  async getCategories(): Promise<{ success: boolean; data: string[] }> {
    return {
      success: true,
      data: ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'Biography', 'Self-Help']
    };
  }

  // Get statistics
  async getStats(): Promise<{ 
    success: boolean; 
    data: { 
      total: number; 
      published: number; 
      featured: number; 
      bestsellers: number; 
      totalSales: number;
      categories: string[];
    } 
  }> {
    try {
      const booksResponse = await this.getAllBooks({ limit: 1000 }); // Get all books for stats
      const books = booksResponse.data;
      
      return {
        success: true,
        data: {
          total: booksResponse.pagination.totalBooks,
          published: books.filter(book => book.status === 'published').length,
          featured: books.filter(book => book.featured).length,
          bestsellers: books.filter(book => book.bestseller).length,
          totalSales: books.reduce((sum, book) => sum + (book.sales || 0), 0),
          categories: ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'Biography', 'Self-Help']
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          total: 0,
          published: 0,
          featured: 0,
          bestsellers: 0,
          totalSales: 0,
          categories: []
        }
      };
    }
  }

  // Utility function to convert API book to admin form data
  convertApiBookToFormData(book: Book): BookPayload & { id: string } {
    return {
      id: book.id,
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      description: book.description,
      category: book.category,
      type: book.type,
      componentType: book.componentType,
      // Convert price strings back to numbers for form
      price: parseFloat(book.price.replace(/[^0-9.]/g, '')) || 0,
      originalPrice: book.originalPrice ? parseFloat(book.originalPrice.replace(/[^0-9.]/g, '')) : undefined,
      rating: book.rating,
      reviews: book.reviews,
      pages: book.pages,
      duration: book.duration,
      narrator: book.narrator,
      publishDate: book.publishDate,
      isbn: book.isbn,
      format: book.format,
      image: book.image,
      featured: book.featured,
      bestseller: book.bestseller,
      tags: book.tags,
      status: book.status,
      language: (book as any).language,
    };
  }

  // Update book rating
  async updateRating(id: string, rating: number): Promise<ApiResponse<Book>> {
    return this.fetchWithErrorHandling<ApiResponse<Book>>(`/books-rate/${id}`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  }
}

// Export singleton instance
export const booksApi = new BooksApiService();
export default booksApi;
