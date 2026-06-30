import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export interface BookFormat {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookFormatPayload {
  name: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class BookFormatsApiService {
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
      console.error('Book Formats API Error:', error);
      throw error;
    }
  }

  async getAll(includeInactive = false): Promise<ApiResponse<BookFormat[]>> {
    const query = includeInactive ? '?includeInactive=true' : '';
    return this.fetchWithErrorHandling<ApiResponse<BookFormat[]>>(`/books/formats${query}`);
  }

  async getActive(): Promise<ApiResponse<BookFormat[]>> {
    return this.getAll(false);
  }

  async create(data: BookFormatPayload): Promise<ApiResponse<BookFormat>> {
    return this.fetchWithErrorHandling<ApiResponse<BookFormat>>('/books/formats', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: Partial<BookFormatPayload>): Promise<ApiResponse<BookFormat>> {
    return this.fetchWithErrorHandling<ApiResponse<BookFormat>>(`/books/formats/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithErrorHandling<ApiResponse<{ message: string }>>(`/books/formats/${id}`, {
      method: 'DELETE',
    });
  }

  async getForSelect(): Promise<{ value: string; label: string }[]> {
    try {
      const response = await this.getActive();
      return response.data.map(format => ({
        value: format.name,
        label: format.name,
      }));
    } catch (error) {
      console.error('Error fetching book formats for select:', error);
      return [];
    }
  }
}

export const bookFormatsApi = new BookFormatsApiService();
export default bookFormatsApi;
