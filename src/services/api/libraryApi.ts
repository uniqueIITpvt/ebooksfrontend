import { API_CONFIG } from '@/config/api';
import { tokenStore } from './tokenStore';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export interface LibraryItem {
  id: string;
  itemId: string;
  itemType: 'ebook' | 'audiobook';
  format?: string | null;
  accessMode: 'claim' | 'purchase';
  status: 'active' | 'refunded' | 'revoked';
  slug?: string;
  title: string;
  author?: string;
  category?: string;
  image?: string | null;
  price?: string;
  createdAt?: string;
  redirectTarget: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export interface ClaimLibraryResponse {
  success: boolean;
  libraryId: string;
  bookSlug: string;
  alreadyClaimed: boolean;
  redirectTarget: string;
}

class LibraryApiService {
  private getToken(): string | null {
    return tokenStore.getAccessToken();
  }

  async getMyLibrary(): Promise<ApiResponse<LibraryItem[]>> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/library/my`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async claim(bookId: string): Promise<ClaimLibraryResponse> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/library/claim/${encodeURIComponent(bookId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }
}

export const libraryApi = new LibraryApiService();
export default libraryApi;
