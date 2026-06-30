import { API_CONFIG } from '@/config/api';
import { tokenStore } from './tokenStore';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export interface TrendingBook {
  _id: string;
  title: string;
  subtitle?: string;
  slug: string;
  author: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  pages?: number;
  publishDate: string;
  image?: string;
  featured: boolean;
  isActive: boolean;
  views: number;
  sales: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrendingBookFormData {
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  pages?: number;
  publishDate?: string;
  image?: string;
  featured?: boolean;
  isActive?: boolean;
  tags?: string[];
}

/**
 * Trending Books API Service
 */
interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

class TrendingBooksApiService {
  private getAuthHeaders(): HeadersInit {
    const token = tokenStore.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get all trending books
   */
  async getTrendingBooks(params?: {
    page?: number;
    limit?: number;
    category?: string;
    featured?: boolean;
    search?: string;
    sortBy?: string;
  }): Promise<{ data: TrendingBook[]; pagination: Pagination }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.featured) queryParams.append('featured', 'true');
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);

    const response = await fetch(`${API_BASE_URL}/trending-books?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch trending books');
    }

    return response.json();
  }

  /**
   * Get featured trending books
   */
  async getFeaturedTrendingBooks(limit = 6): Promise<TrendingBook[]> {
    const response = await fetch(`${API_BASE_URL}/trending-books/featured?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch featured trending books');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get top trending books
   */
  async getTopTrending(limit = 10): Promise<TrendingBook[]> {
    const response = await fetch(`${API_BASE_URL}/trending-books/top?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch top trending books');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get single trending book
   */
  async getTrendingBook(id: string): Promise<TrendingBook> {
    const response = await fetch(`${API_BASE_URL}/trending-books/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch trending book');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Create trending book with image
   */
  async createTrendingBookWithFiles(
    formData: TrendingBookFormData,
    imageFile?: File
  ): Promise<TrendingBook> {
    const data = new FormData();
    
    // Add form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, String(value));
        }
      }
    });

    // Add image file if provided
    if (imageFile) {
      data.append('image', imageFile);
    }

    const token = tokenStore.getAccessToken();
    
    const response = await fetch(`${API_BASE_URL}/trending-books`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create trending book');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Update trending book with image
   */
  async updateTrendingBookWithFiles(
    id: string,
    formData: TrendingBookFormData,
    imageFile?: File
  ): Promise<TrendingBook> {
    const data = new FormData();
    
    // Add form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, String(value));
        }
      }
    });

    // Add image file if provided
    if (imageFile) {
      data.append('image', imageFile);
    }

    const token = tokenStore.getAccessToken();
    
    const response = await fetch(`${API_BASE_URL}/trending-books/${id}`, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update trending book');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Delete trending book
   */
  async deleteTrendingBook(id: string): Promise<void> {
    const token = tokenStore.getAccessToken();
    
    const response = await fetch(`${API_BASE_URL}/trending-books/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete trending book');
    }
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/trending-books/categories`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    return data.data;
  }
}

export const trendingBooksApi = new TrendingBooksApiService();
export type { TrendingBooksApiService };
