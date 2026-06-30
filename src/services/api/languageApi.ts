import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export interface LanguageRecord {
  _id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

class LanguageApiService {
  private async fetchWithErrorHandling<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
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
      console.error('API Error:', error);
      throw error;
    }
  }

  async getAllLanguages(): Promise<{ success: boolean; data: LanguageRecord[] }> {
    return this.fetchWithErrorHandling('/books/languages');
  }

  async createLanguage(data: Partial<LanguageRecord>): Promise<{ success: boolean; data: LanguageRecord }> {
    return this.fetchWithErrorHandling('/books/languages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLanguage(id: string, data: Partial<LanguageRecord>): Promise<{ success: boolean; data: LanguageRecord }> {
    return this.fetchWithErrorHandling(`/books/languages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLanguage(id: string): Promise<{ success: boolean; message: string }> {
    return this.fetchWithErrorHandling(`/books/languages/${id}`, {
      method: 'DELETE',
    });
  }
}

export const languageApi = new LanguageApiService();
export default languageApi;
