import { API_CONFIG } from '@/config/api';
import { tokenStore } from './tokenStore';
import type {
  ApiResponse,
  PaginatedResponse,
} from './booksApi';

// Audiobook-specific types
export interface AudiobookTranscript {
  languages: Array<{
    code: string;
    name: string;
    segments: Array<{
      start: number;
      end: number;
      text: string;
      words?: Array<{
        startTime: number;
        endTime: number;
        text: string;
      }>;
    }>;
  }>;
}

export interface AudiobookReaderPage {
  pageNumber: number;
  content: string;
  language?: string;
}

export interface AudiobookAccessState {
  owned: boolean;
  canListen: boolean;
  requiresCheckout: boolean;
  action: 'buy' | 'claim' | 'listen';
  accessMode?: 'claim' | 'purchase' | null;
  status?: 'active' | 'refunded' | 'revoked' | null;
  isFree: boolean;
  checkoutMode?: 'buy' | 'claim' | null;
  redirectTarget?: string;
}

export interface Audiobook {
  id: string;
  _id?: string;
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  category: string;
  type: 'Audiobook';
  price: string;
  originalPrice?: string;
  rating: number;
  reviews: number;
  pages?: number;
  duration?: string;
  narrator?: string;
  narratorName?: string;
  publishDate: string;
  isbn?: string;
  format: string[];
  image?: string;
  featured: boolean;
  bestseller: boolean;
  tags: string[];
  status: 'draft' | 'review' | 'published' | 'archived';
  isActive?: boolean;
  isPublished?: boolean;
  language?: string;
  slug?: string;
  views?: number;
  downloads?: number;
  sales?: number;
  accessLevel?: 'free' | 'premium';
  // Audiobook-specific fields
  transcript?: AudiobookTranscript;
  readerPages?: AudiobookReaderPage[];
  scripts?: any;
  wordSync?: any;
  voice?: any;
  generatedAudio?: any;
  bookPages?: any;
  generation?: any;
  audioProcessing?: {
    status?: 'queued' | 'uploading' | 'processing' | 'ready' | 'failed';
    jobId?: string | null;
    errorMessage?: string | null;
    startedAt?: string;
    completedAt?: string;
  };
  jobId?: string | null;
  errorMessage?: string | null;
  access?: AudiobookAccessState;
  createdAt: string;
  updatedAt: string;
  files?: {
    coverImage?: any;
    ebook?: any;
    audiobook?: any;
  };
}

export interface AudiobookPayload {
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  category: string;
  type: 'Audiobook';
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  pages?: number;
  duration?: string;
  narrator?: string;
  narratorName?: string;
  publishDate: string;
  isbn?: string;
  language?: string;
  isActive?: boolean;
  isPublished?: boolean;
  accessLevel?: 'free' | 'premium';
  format: string[];
  image?: string;
  imageCloudinary?: {
    publicId?: string | null;
    url?: string | null;
    originalName?: string | null;
  } | null;
  featured: boolean;
  bestseller: boolean;
  tags: string[];
  status: 'draft' | 'review' | 'published' | 'archived';
  files?: {
    ebook?: any | null;
    audiobook?: any | null;
  };
  // Audiobook-specific fields
  transcript?: AudiobookTranscript;
  readerPages?: AudiobookReaderPage[];
  scripts?: any;
  wordSync?: any;
  voice?: any;
  generatedAudio?: any;
  bookPages?: any;
  generation?: any;
  selectedVoice?: string;
}

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export interface SignedUploadResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  resourceType: 'image' | 'raw' | 'video';
  transformation?: string;
  uploadUrl: string;
}

type UploadKind = 'coverImage' | 'ebookFile' | 'audiobookFile';
type UploadProgressHandler = (progress: {
  loaded: number;
  total: number;
  percent: number;
}) => void;

class AudiobooksApiService {
  private getToken(): string | null {
    return tokenStore.getAccessToken();
  }

  private getAuthHeaders(includeContentType = true): HeadersInit {
    const token = this.getToken();
    return {
      ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async fetchWithErrorHandling<T>(url: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.body instanceof FormData ? 180000 : 30000
    );
    const defaultHeaders: Record<string, string> =
      options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' };

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
          errorData.error?.message ||
          `HTTP error! status: ${response.status}`
        );
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond');
      }
      throw error;
    }
  }

  async getAll(params: {
    page?: number;
    limit?: number;
    category?: string;
    featured?: boolean;
    bestseller?: boolean;
    search?: string;
    sortBy?: string;
    status?: string;
    adminView?: boolean;
    _t?: number; // Cache-busting timestamp
  } = {}): Promise<PaginatedResponse<Audiobook>> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const url = `/audiobooks${queryString ? `?${queryString}` : ''}`;

    return this.fetchWithErrorHandling<PaginatedResponse<Audiobook>>(url);
  }

  async getById(identifier: string): Promise<ApiResponse<Audiobook>> {
    return this.fetchWithErrorHandling<ApiResponse<Audiobook>>(`/audiobooks/${identifier}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async getAccess(identifier: string): Promise<ApiResponse<AudiobookAccessState>> {
    return this.fetchWithErrorHandling<ApiResponse<AudiobookAccessState>>(
      `/audiobooks/${identifier}/access`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  async getListenPayload(identifier: string): Promise<ApiResponse<Audiobook>> {
    return this.fetchWithErrorHandling<ApiResponse<Audiobook>>(
      `/audiobooks/${identifier}/listen`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  async claim(identifier: string): Promise<ApiResponse<{ access: AudiobookAccessState; redirectTarget: string }>> {
    return this.fetchWithErrorHandling<
      ApiResponse<{ access: AudiobookAccessState; redirectTarget: string }>
    >(`/audiobooks/${identifier}/claim`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
  }

  async signUpload(kind: UploadKind, title: string, filename: string): Promise<ApiResponse<SignedUploadResponse>> {
    return this.fetchWithErrorHandling<ApiResponse<SignedUploadResponse>>(
      '/audiobooks/uploads/sign',
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ kind, title, filename }),
      }
    );
  }

  async uploadFileDirect(file: File, kind: UploadKind, title: string) {
    const signatureResponse = await this.signUpload(kind, title, file.name);
    if (!signatureResponse.success) {
      throw new Error('Unable to initialize upload');
    }

    const signed = signatureResponse.data;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signed.apiKey);
    formData.append('timestamp', String(signed.timestamp));
    formData.append('signature', signed.signature);
    formData.append('folder', signed.folder);
    formData.append('public_id', signed.publicId);
    if (signed.transformation) {
      formData.append('transformation', signed.transformation);
    }

    const uploadResponse = await fetch(signed.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok) {
      throw new Error(uploadData?.error?.message || 'Cloudinary upload failed');
    }

    return {
      url: uploadData.secure_url as string,
      publicId: uploadData.public_id as string,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      duration:
        typeof uploadData.duration === 'number'
          ? String(uploadData.duration)
          : undefined,
      uploadedAt: new Date().toISOString(),
    };
  }

  async create(payload: AudiobookPayload): Promise<ApiResponse<Audiobook>> {
    return this.fetchWithErrorHandling<ApiResponse<Audiobook>>('/audiobooks', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  }

  private buildMultipartPayload(
    payload: Partial<AudiobookPayload>,
    files: { coverImage?: File | null; audiobookFile?: File | null; ebookFile?: File | null } = {}
  ) {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
        return;
      }
      formData.append(key, String(value));
    });

    if (files.coverImage) formData.append('coverImage', files.coverImage);
    if (files.audiobookFile) formData.append('audiobookFile', files.audiobookFile);
    if (files.ebookFile) formData.append('ebookFile', files.ebookFile);

    return formData;
  }

  private requestWithUploadProgress<T>(
    url: string,
    method: 'POST' | 'PUT',
    body: FormData,
    onUploadProgress?: UploadProgressHandler
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, `${API_BASE_URL}${url}`);

      const token = this.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || !onUploadProgress) return;
        onUploadProgress({
          loaded: event.loaded,
          total: event.total,
          percent: Math.min(100, Math.round((event.loaded / event.total) * 100)),
        });
      };

      xhr.onload = () => {
        let data: any = {};
        try {
          data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
        } catch {
          data = { message: xhr.responseText || `HTTP error! status: ${xhr.status}` };
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
          return;
        }

        reject(
          new Error(
            data.message ||
            data.error?.message ||
            `HTTP error! status: ${xhr.status}`
          )
        );
      };

      xhr.onerror = () => reject(new Error('Network error while uploading files'));
      xhr.ontimeout = () => reject(new Error('Request timeout - server took too long to respond'));
      xhr.timeout = 180000;
      xhr.send(body);
    });
  }

  async createWithFiles(
    payload: AudiobookPayload,
    files: { coverImage?: File | null; audiobookFile?: File | null; ebookFile?: File | null } = {},
    onUploadProgress?: UploadProgressHandler
  ): Promise<ApiResponse<Audiobook>> {
    return this.requestWithUploadProgress<ApiResponse<Audiobook>>(
      '/audiobooks',
      'POST',
      this.buildMultipartPayload(payload, files),
      onUploadProgress
    );
  }

  async update(id: string, payload: Partial<AudiobookPayload>): Promise<ApiResponse<Audiobook>> {
    return this.fetchWithErrorHandling<ApiResponse<Audiobook>>(`/audiobooks/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  }

  async updateWithFiles(
    id: string,
    payload: Partial<AudiobookPayload>,
    files: { coverImage?: File | null; audiobookFile?: File | null; ebookFile?: File | null } = {},
    onUploadProgress?: UploadProgressHandler
  ): Promise<ApiResponse<Audiobook>> {
    return this.requestWithUploadProgress<ApiResponse<Audiobook>>(
      `/audiobooks/${id}`,
      'PUT',
      this.buildMultipartPayload(payload, files),
      onUploadProgress
    );
  }

  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithErrorHandling<ApiResponse<{ message: string }>>(`/audiobooks/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  // ═══════════════════════════════════════════
  // NEW: Word Sync APIs
  // ═══════════════════════════════════════════
  async getProcessingStatus(id: string): Promise<ApiResponse<{
    id: string;
    title: string;
    status: 'queued' | 'uploading' | 'processing' | 'ready' | 'failed';
    publicationStatus: Audiobook['status'];
    jobId?: string | null;
    errorMessage?: string | null;
    hasTranscript: boolean;
    generation?: any;
  }>> {
    return this.fetchWithErrorHandling<ApiResponse<any>>(`/audiobooks/${id}/status`, {
      headers: this.getAuthHeaders(),
    });
  }

  async retryProcessing(id: string): Promise<ApiResponse<{ jobId?: string | null; status: string }>> {
    return this.fetchWithErrorHandling<ApiResponse<{ jobId?: string | null; status: string }>>(
      `/audiobooks/${id}/retry`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      }
    );
  }

  async getWordSync(id: string, params?: { charIndex?: number; pageIndex?: number; language?: string }): Promise<ApiResponse<any>> {
    const searchParams = new URLSearchParams();
    if (params?.charIndex !== undefined) searchParams.append('charIndex', params.charIndex.toString());
    if (params?.pageIndex !== undefined) searchParams.append('pageIndex', params.pageIndex.toString());
    if (params?.language) searchParams.append('language', params.language);
    const query = searchParams.toString();
    return this.fetchWithErrorHandling<ApiResponse<any>>(`/audiobooks/${id}/word-sync${query ? `?${query}` : ''}`);
  }

  async updateWordSync(id: string, data: { words?: any[]; language?: string; enabled?: boolean }): Promise<ApiResponse<Audiobook>> {
    return this.fetchWithErrorHandling<ApiResponse<Audiobook>>(`/audiobooks/${id}/word-sync`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ═══════════════════════════════════════════
  // NEW: Voice Settings API
  // ═══════════════════════════════════════════
  async updateVoice(id: string, voice: { id?: string; name?: string; gender?: string; language?: string; speed?: number; pitch?: number }): Promise<ApiResponse<Audiobook>> {
    return this.fetchWithErrorHandling<ApiResponse<Audiobook>>(`/audiobooks/${id}/voice`, {
      method: 'PUT',
      body: JSON.stringify(voice),
    });
  }

  // ═══════════════════════════════════════════
  // NEW: Generation APIs
  // ═══════════════════════════════════════════
  async triggerGeneration(id: string, language: string = 'English'): Promise<ApiResponse<any>> {
    return this.fetchWithErrorHandling<ApiResponse<any>>(`/audiobooks/${id}/generate`, {
      method: 'POST',
      body: JSON.stringify({ language }),
    });
  }

  async updateGenerationStatus(id: string, data: { status?: string; progress?: number; error?: string; audioUrl?: string; audioPublicId?: string; duration?: number; wordCount?: number }): Promise<ApiResponse<Audiobook>> {
    return this.fetchWithErrorHandling<ApiResponse<Audiobook>>(`/audiobooks/${id}/generation`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ═══════════════════════════════════════════
  // NEW: Book Pages API
  // ═══════════════════════════════════════════
  async getBookPage(id: string, page: number = 0, language: string = 'English'): Promise<ApiResponse<any>> {
    return this.fetchWithErrorHandling<ApiResponse<any>>(`/audiobooks/${id}/pages?page=${page}&language=${language}`);
  }
}

export const audiobooksApi = new AudiobooksApiService();
