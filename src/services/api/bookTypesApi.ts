import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export interface BookType {
  _id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookTypePayload {
  name: string;
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

class BookTypesApiService {
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
      console.error('Book Types API Error:', error);
      throw error;
    }
  }

  async getAll(includeInactive = false): Promise<ApiResponse<BookType[]>> {
    const query = includeInactive ? '?includeInactive=true' : '';
    return this.fetchWithErrorHandling<ApiResponse<BookType[]>>(`/books/types${query}`);
  }

  async getActive(): Promise<ApiResponse<BookType[]>> {
    return this.getAll(false);
  }

  async create(data: BookTypePayload): Promise<ApiResponse<BookType>> {
    return this.fetchWithErrorHandling<ApiResponse<BookType>>('/books/types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: Partial<BookTypePayload>): Promise<ApiResponse<BookType>> {
    return this.fetchWithErrorHandling<ApiResponse<BookType>>(`/books/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithErrorHandling<ApiResponse<{ message: string }>>(`/books/types/${id}`, {
      method: 'DELETE',
    });
  }

  async getForSelect(): Promise<{ value: string; label: string; color?: string }[]> {
    try {
      const response = await this.getActive();
      return response.data.map(type => ({
        value: type.name,
        label: type.name,
        color: type.color,
      }));
    } catch (error) {
      console.error('Error fetching book types for select:', error);
      return [];
    }
  }
}

export const bookTypesApi = new BookTypesApiService();
export default bookTypesApi;
