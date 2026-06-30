import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export interface BookHub {
  _id: string;
  name: string;
  value: 'none' | 'free-summaries' | 'trending-books' | 'premium-summaries';
  description?: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookHubPayload {
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

class BookHubsApiService {
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
      console.error('Book Hubs API Error:', error);
      throw error;
    }
  }

  async getAll(includeInactive = false): Promise<ApiResponse<BookHub[]>> {
    const query = includeInactive ? '?includeInactive=true' : '';
    return this.fetchWithErrorHandling<ApiResponse<BookHub[]>>(`/books/hubs${query}`);
  }

  async getActive(): Promise<ApiResponse<BookHub[]>> {
    return this.getAll(false);
  }

  async create(data: BookHubPayload): Promise<ApiResponse<BookHub>> {
    return this.fetchWithErrorHandling<ApiResponse<BookHub>>('/books/hubs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: Partial<BookHubPayload>): Promise<ApiResponse<BookHub>> {
    return this.fetchWithErrorHandling<ApiResponse<BookHub>>(`/books/hubs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithErrorHandling<ApiResponse<{ message: string }>>(`/books/hubs/${id}`, {
      method: 'DELETE',
    });
  }

  async getForSelect(): Promise<{ value: string; label: string; color?: string }[]> {
    try {
      const response = await this.getActive();
      return response.data.map(hub => ({
        value: hub.value,
        label: hub.name,
        color: hub.color,
      }));
    } catch (error) {
      console.error('Error fetching book hubs for select:', error);
      return [];
    }
  }
}

export const bookHubsApi = new BookHubsApiService();
export default bookHubsApi;
