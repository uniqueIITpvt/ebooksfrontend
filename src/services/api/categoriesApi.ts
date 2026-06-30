import { API_CONFIG } from '@/config/api';

// API base URL - adjust based on your backend configuration
const API_BASE_URL = API_CONFIG.API_BASE_URL;

// Category interfaces
export interface Category {
  _id: string;
  id: string;
  name: string;
  description?: string;
  slug: string;
  color: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  bookCount: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryPayload {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CategoryStats {
  categories: Array<Category & {
    totalBooks: number;
    publishedBooks: number;
  }>;
  summary: {
    totalCategories: number;
    activeCategories: number;
    totalBooks: number;
    publishedBooks: number;
  };
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  count?: number;
}

class CategoriesApiService {
  private async fetchWithErrorHandling<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
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
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Categories API Error:', error);
      throw error;
    }
  }

  // Get all categories
  async getAll(params?: {
    includeInactive?: boolean;
    sortBy?: string;
    withBookCount?: boolean;
  }): Promise<ApiResponse<Category[]>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/categories?${queryString}` : '/categories';
    
    return this.fetchWithErrorHandling<ApiResponse<Category[]>>(url);
  }

  // Get active categories (most common use case)
  async getActive(): Promise<ApiResponse<Category[]>> {
    return this.getAll({ includeInactive: false, sortBy: 'sortOrder' });
  }

  // Get single category by ID or slug
  async getById(id: string): Promise<ApiResponse<Category>> {
    return this.fetchWithErrorHandling<ApiResponse<Category>>(`/categories/${id}`);
  }

  // Get category statistics
  async getStats(): Promise<ApiResponse<CategoryStats>> {
    return this.fetchWithErrorHandling<ApiResponse<CategoryStats>>('/categories/stats');
  }

  // Create new category
  async create(categoryData: CategoryPayload): Promise<ApiResponse<Category>> {
    return this.fetchWithErrorHandling<ApiResponse<Category>>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  // Update existing category
  async update(id: string, categoryData: Partial<CategoryPayload>): Promise<ApiResponse<Category>> {
    return this.fetchWithErrorHandling<ApiResponse<Category>>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  // Delete category
  async delete(id: string, moveToCategory?: string): Promise<ApiResponse<{ message: string }>> {
    const body = moveToCategory ? JSON.stringify({ moveToCategory }) : undefined;
    
    return this.fetchWithErrorHandling<ApiResponse<{ message: string }>>(`/categories/${id}`, {
      method: 'DELETE',
      body,
    });
  }

  // Reorder categories
  async reorder(categoryIds: string[]): Promise<ApiResponse<Category[]>> {
    return this.fetchWithErrorHandling<ApiResponse<Category[]>>('/categories/reorder', {
      method: 'PUT',
      body: JSON.stringify({ categoryIds }),
    });
  }

  // Toggle category active status
  async toggleActive(id: string): Promise<ApiResponse<Category>> {
    const category = await this.getById(id);
    return this.update(id, { isActive: !category.data.isActive });
  }

  // Get categories for dropdown/select components
  async getForSelect(): Promise<{ value: string; label: string; color?: string }[]> {
    try {
      const response = await this.getActive();
      return response.data.map(category => ({
        value: category.name,
        label: category.name,
        color: category.color
      }));
    } catch (error) {
      console.error('Error fetching categories for select:', error);
      // Return empty array - no fallback
      return [];
    }
  }
}

// Export singleton instance
export const categoriesApi = new CategoriesApiService();
export default categoriesApi;
