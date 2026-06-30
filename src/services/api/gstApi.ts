import { API_CONFIG } from '@/config/api';

export interface GstRecord {
  _id: string;
  percentage: number;
  label: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class GstApiService {
  private API_BASE_URL = API_CONFIG.API_BASE_URL;

  private async fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data as T;
  }

  // Get all active GST percentages
  async getAll(): Promise<ApiResponse<GstRecord[]>> {
    return this.fetchWithErrorHandling<ApiResponse<GstRecord[]>>('/books/gst');
  }

  // Create new GST percentage
  async create(percentage: number): Promise<ApiResponse<GstRecord>> {
    return this.fetchWithErrorHandling<ApiResponse<GstRecord>>('/books/gst', {
      method: 'POST',
      body: JSON.stringify({ percentage }),
    });
  }

  // Update GST percentage
  async update(id: string, data: Partial<GstRecord>): Promise<ApiResponse<GstRecord>> {
    return this.fetchWithErrorHandling<ApiResponse<GstRecord>>(`/books/gst/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete GST percentage
  async delete(id: string): Promise<ApiResponse<void>> {
    return this.fetchWithErrorHandling<ApiResponse<void>>(`/books/gst/${id}`, {
      method: 'DELETE',
    });
  }
}

export const gstApi = new GstApiService();
export default gstApi;
