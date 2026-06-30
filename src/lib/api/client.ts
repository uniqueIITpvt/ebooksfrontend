/**
 * API Client for Backend Communication
 * Centralized API client with error handling and type safety
 */

import { API_CONFIG } from '@/config/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    stack?: string;
    details?: any;
  };
  message?: string;
  timestamp?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalBooks: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
}

export interface Book {
  _id: string;
  title: string;
  subtitle?: string;
  slug: string;
  author: string;
  description: string;
  category: string;
  type: 'Books' | 'Audiobook';
  price: number;
  originalPrice?: string;
  rating: number;
  reviews: number;
  pages?: number;
  duration?: string;
  narrator?: string;
  publishDate: string;
  isbn?: string;
  formats: string[];
  image?: string;
  coverImage?: string;
  featured: boolean;
  bestseller: boolean;
  status: 'draft' | 'review' | 'published' | 'archived';
  sales: number;
  tags: string[];
  isActive: boolean;
  isPublished: boolean;
  views: number;
  downloads: number;
  language: string;
  publisher?: string;
  edition?: string;
  inStock: boolean;
  stockCount: number;
  createdAt: string;
  updatedAt: string;
}

class ApiClient {
  private baseUrl: string;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second initial delay

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 429 rate limit with retry
      if (response.status === 429 && retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        await this.sleep(delay);
        return this.request(endpoint, options, retryCount + 1);
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Health and System Endpoints
  async getHealth() {
    return this.request('/health');
  }

  async getApiInfo() {
    return this.request('/');
  }

  async getV1Info() {
    return this.request('/api/v1');
  }

  async testV1() {
    return this.request('/api/v1/test');
  }

  // Books API Endpoints
  async getBooks(params?: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
    featured?: boolean;
    search?: string;
    sortBy?: string;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const query = queryParams.toString();
    return this.request<Book[]>(`/api/v1/books${query ? `?${query}` : ''}`);
  }

  async getFeaturedBooks(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<Book[]>(`/api/v1/books/featured${query}`);
  }

  async getBestsellerBooks(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<Book[]>(`/api/v1/books/bestsellers${query}`);
  }

  async getBookCategories() {
    return this.request<string[]>('/api/v1/books/categories');
  }

  async getBookStats() {
    return this.request('/api/v1/books/stats');
  }

  async searchBooks(query: string, filters?: {
    category?: string;
    type?: string;
    minRating?: number;
    maxPrice?: number;
    tags?: string[];
  }) {
    const params = new URLSearchParams({ q: query });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    return this.request<Book[]>(`/api/v1/books/search?${params.toString()}`);
  }

  async getBooksByCategory(category: string, params?: { limit?: number; page?: number }) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const query = queryParams.toString();
    return this.request<Book[]>(`/api/v1/books/category/${encodeURIComponent(category)}${query ? `?${query}` : ''}`);
  }

  async getBook(identifier: string) {
    return this.request<Book>(`/api/v1/books/${identifier}`);
  }

  async createBook(bookData: Partial<Book>) {
    return this.request<Book>('/api/v1/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  }

  async updateBook(id: string, bookData: Partial<Book>) {
    return this.request<Book>(`/api/v1/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    });
  }

  async deleteBook(id: string) {
    return this.request(`/api/v1/books/${id}`, {
      method: 'DELETE',
    });
  }

  async testBooksPost(testData: any) {
    return this.request('/api/v1/books/test', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
