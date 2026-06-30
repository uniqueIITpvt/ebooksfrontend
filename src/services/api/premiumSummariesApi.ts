import { API_CONFIG } from '@/config/api';
import { tokenStore } from './tokenStore';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export interface PremiumSummary {
  _id: string;
  title: string;
  subtitle?: string;
  slug: string;
  author: string;
  description: string;
  category: string;
  originalBook?: string;
  price: number;
  originalPrice?: number;
  pages?: number;
  readingTime?: string;
  publishDate: string;
  image?: string;
  featured: boolean;
  isActive: boolean;
  views: number;
  downloads: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PremiumSummaryFormData {
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  category: string;
  originalBook?: string;
  price: number;
  originalPrice?: number;
  pages?: number;
  readingTime?: string;
  publishDate?: string;
  image?: string;
  featured?: boolean;
  isActive?: boolean;
  tags?: string[];
}

/**
 * Premium Summaries API Service
 */
interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

class PremiumSummariesApiService {
  private getAuthHeaders(): HeadersInit {
    const token = tokenStore.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get all premium summaries
   */
  async getPremiumSummaries(params?: {
    page?: number;
    limit?: number;
    category?: string;
    featured?: boolean;
    search?: string;
  }): Promise<{ data: PremiumSummary[]; pagination: Pagination }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.featured) queryParams.append('featured', 'true');
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}/premium-summaries?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch premium summaries');
    }

    return response.json();
  }

  /**
   * Get featured premium summaries
   */
  async getFeaturedPremiumSummaries(limit = 6): Promise<PremiumSummary[]> {
    const response = await fetch(`${API_BASE_URL}/premium-summaries/featured?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch featured premium summaries');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get latest premium summaries
   */
  async getLatestPremiumSummaries(limit = 10): Promise<PremiumSummary[]> {
    const response = await fetch(`${API_BASE_URL}/premium-summaries/latest?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch latest premium summaries');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get single premium summary
   */
  async getPremiumSummary(id: string): Promise<PremiumSummary> {
    const response = await fetch(`${API_BASE_URL}/premium-summaries/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch premium summary');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Create premium summary with image
   */
  async createPremiumSummaryWithFiles(
    formData: PremiumSummaryFormData,
    imageFile?: File
  ): Promise<PremiumSummary> {
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
    
    const response = await fetch(`${API_BASE_URL}/premium-summaries`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create premium summary');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Update premium summary with image
   */
  async updatePremiumSummaryWithFiles(
    id: string,
    formData: PremiumSummaryFormData,
    imageFile?: File
  ): Promise<PremiumSummary> {
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
    
    const response = await fetch(`${API_BASE_URL}/premium-summaries/${id}`, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update premium summary');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Delete premium summary
   */
  async deletePremiumSummary(id: string): Promise<void> {
    const token = tokenStore.getAccessToken();
    
    const response = await fetch(`${API_BASE_URL}/premium-summaries/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete premium summary');
    }
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/premium-summaries/categories`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    return data.data;
  }
}

export const premiumSummariesApi = new PremiumSummariesApiService();
export type { PremiumSummariesApiService };
