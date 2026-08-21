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
  paymentId?: string | null;
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
  private libraryCache: { data: ApiResponse<LibraryItem[]>; timestamp: number } | null = null;
  private inFlightPromise: Promise<ApiResponse<LibraryItem[]>> | null = null;
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 minute cache

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('library:changed', () => {
        this.clearCache();
      });
    }
  }

  clearCache() {
    this.libraryCache = null;
  }

  private getToken(): string | null {
    return tokenStore.getAccessToken();
  }

  async getMyLibrary(forceRefresh = false): Promise<ApiResponse<LibraryItem[]>> {
    const token = this.getToken();
    if (!token) {
      this.clearCache();
      return { success: true, data: [] };
    }

    const now = Date.now();
    if (!forceRefresh && this.libraryCache && now - this.libraryCache.timestamp < this.CACHE_TTL_MS) {
      return this.libraryCache.data;
    }

    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    this.inFlightPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/library/my`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        if (data.success) {
          this.libraryCache = { data, timestamp: Date.now() };
        }

        return data;
      } finally {
        this.inFlightPromise = null;
      }
    })();

    return this.inFlightPromise;
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

    this.clearCache();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('library:changed'));
    }

    return data;
  }
}

export const libraryApi = new LibraryApiService();
export default libraryApi;
