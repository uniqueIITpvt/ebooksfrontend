import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export interface BookStatus {
  _id: string;
  name: string;
  value: 'draft' | 'review' | 'published' | 'archived';
  description?: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookStatusPayload {
  name: string;
  value: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class BookStatusesApiService {
  private async fetchWithErrorHandling<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const defaultHeaders: Record<string, string> = {};
      
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
      console.error('Book Statuses API Error:', error);
      throw error;
    }
  }

  async getAll(includeInactive = false): Promise<ApiResponse<BookStatus[]>> {
    const query = includeInactive ? '?includeInactive=true' : '';
    return this.fetchWithErrorHandling<ApiResponse<BookStatus[]>>(`/books/statuses${query}`);
  }

  async getActive(): Promise<ApiResponse<BookStatus[]>> {
    return this.getAll(false);
  }

  async create(data: BookStatusPayload): Promise<ApiResponse<BookStatus>> {
    return this.fetchWithErrorHandling<ApiResponse<BookStatus>>('/books/statuses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: Partial<BookStatusPayload>): Promise<ApiResponse<BookStatus>> {
    return this.fetchWithErrorHandling<ApiResponse<BookStatus>>(`/books/statuses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithErrorHandling<ApiResponse<{ message: string }>>(`/books/statuses/${id}`, {
      method: 'DELETE',
    });
  }

  async getForSelect(): Promise<{ value: string; label: string; color?: string }[]> {
    try {
      const response = await this.getActive();
      return response.data.map(status => ({
        value: status.value,
        label: status.name,
        color: status.color,
      }));
    } catch (error) {
      console.error('Error fetching book statuses for select:', error);
      return [];
    }
  }
}

export const bookStatusesApi = new BookStatusesApiService();
export default bookStatusesApi;
