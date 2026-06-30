import { API_CONFIG } from '@/config/api';
import { tokenStore } from './tokenStore';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export interface FreeSummary {
  _id: string;
  title: string;
  subtitle?: string;
  slug: string;
  author: string;
  description: string;
  category: string;
  originalBook?: string;
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

export interface FreeSummaryFormData {
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  category: string;
  originalBook?: string;
  pages?: number;
  readingTime?: string;
  publishDate?: string;
  image?: string;
  featured?: boolean;
  isActive?: boolean;
  tags?: string[];
}

/**
 * Free Summaries API Service
 */
interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

class FreeSummariesApiService {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined'
      ? tokenStore.getAccessToken()
      : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get all free summaries
   */
  async getFreeSummaries(params?: {
    page?: number;
    limit?: number;
    category?: string;
    featured?: boolean;
    search?: string;
  }): Promise<{ data: FreeSummary[]; pagination: Pagination }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.featured) queryParams.append('featured', 'true');
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}/free-summaries?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch free summaries');
    }

    return response.json();
  }

  /**
   * Get featured free summaries
   */
  async getFeaturedFreeSummaries(limit = 6): Promise<FreeSummary[]> {
    const response = await fetch(`${API_BASE_URL}/free-summaries/featured?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch featured free summaries');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get single free summary
   */
  async getFreeSummary(id: string): Promise<FreeSummary> {
    const response = await fetch(`${API_BASE_URL}/free-summaries/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch free summary');
    }

    const data = await response.json();
    return data.data;
  }

  async claim(id: string): Promise<{ success: boolean; data: { redirectTarget: string }; message?: string }> {
    const response = await fetch(`${API_BASE_URL}/free-summaries/${id}/claim`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async getReadPayload(id: string): Promise<FreeSummary> {
    const response = await fetch(`${API_BASE_URL}/free-summaries/${id}/read`, {
      headers: this.getAuthHeaders(),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data.data;
  }

  /**
   * Create free summary with image
   */
  async createFreeSummaryWithFiles(
    formData: FreeSummaryFormData,
    imageFile?: File
  ): Promise<FreeSummary> {
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
    
    const response = await fetch(`${API_BASE_URL}/free-summaries`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create free summary');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Update free summary with image
   */
  async updateFreeSummaryWithFiles(
    id: string,
    formData: FreeSummaryFormData,
    imageFile?: File
  ): Promise<FreeSummary> {
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
    
    const response = await fetch(`${API_BASE_URL}/free-summaries/${id}`, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update free summary');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Delete free summary
   */
  async deleteFreeSummary(id: string): Promise<void> {
    const token = tokenStore.getAccessToken();
    
    const response = await fetch(`${API_BASE_URL}/free-summaries/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete free summary');
    }
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/free-summaries/categories`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    return data.data;
  }
}

export const freeSummariesApi = new FreeSummariesApiService();
export type { FreeSummariesApiService };
