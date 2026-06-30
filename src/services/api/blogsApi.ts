/**
 * Blogs API Service
 * Handles all blog-related API operations for admin panel with file upload support
 */

import { API_CONFIG } from '@/config/api';
import { tokenStore } from './tokenStore';

// API base URL - adjust based on your backend configuration
const API_BASE_URL = API_CONFIG.API_BASE_URL;

// File information interface
export interface BlogFile {
  url: string;
  publicId: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
}

// Blog interface matching backend response
export interface Blog {
  _id: string;
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorBio?: string;
  authorAvatar?: string;
  category: string;
  tags: string[];
  image?: string;
  imageCloudinary?: {
    publicId: string;
    url: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    width: number;
    height: number;
  };
  readTime: string;
  publishDate: string;
  featured: boolean;
  isActive?: boolean;
  isPublished?: boolean;
  status: 'draft' | 'published' | 'archived';
  slug?: string;
  views?: number;
  likes?: number;
  commentsCount?: number;
  shares?: {
    facebook: number;
    twitter: number;
    linkedin: number;
    email: number;
  };
  createdAt: string;
  updatedAt: string;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalBlogs: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
  message?: string;
  timestamp?: string;
}

// Blog creation/update payload
export interface BlogPayload {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  readTime: string;
  publishDate: string;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
}

class BlogsApiService {
  private getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') {
      return {};
    }

    const token = tokenStore.getAccessToken();

    return token ? { Authorization: `Bearer ${token}` } : {};
  }

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
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: `${API_BASE_URL}${url}`
        });
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Get all blogs with pagination and filters
  async getAllBlogs(params: {
    page?: number;
    limit?: number;
    category?: string;
    featured?: boolean;
    search?: string;
    sortBy?: string;
    status?: string;
    adminView?: boolean;
  } = {}): Promise<PaginatedResponse<Blog>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const url = `/blogs${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchWithErrorHandling<PaginatedResponse<Blog>>(url);
  }

  // Get single blog by ID
  async getBlogById(id: string): Promise<ApiResponse<Blog>> {
    return this.fetchWithErrorHandling<ApiResponse<Blog>>(`/blogs/${id}`);
  }

  // Create new blog
  async createBlog(blogData: BlogPayload): Promise<ApiResponse<Blog>> {
    return this.fetchWithErrorHandling<ApiResponse<Blog>>('/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData),
    });
  }

  // Create new blog with file uploads
  async createBlogWithFiles(blogData: BlogPayload, imageFile?: File): Promise<ApiResponse<Blog>> {
    const formData = new FormData();
    
    // Add blog data fields
    Object.entries(blogData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // For arrays like tags, send as JSON string
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    // Add image file if provided
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    return this.fetchWithErrorHandling<ApiResponse<Blog>>('/blogs', {
      method: 'POST',
      body: formData,
    });
  }

  // Update existing blog
  async updateBlog(id: string, blogData: Partial<BlogPayload>): Promise<ApiResponse<Blog>> {
    return this.fetchWithErrorHandling<ApiResponse<Blog>>(`/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(blogData),
    });
  }

  // Update existing blog with file uploads
  async updateBlogWithFiles(id: string, blogData: Partial<BlogPayload>, imageFile?: File): Promise<ApiResponse<Blog>> {
    const formData = new FormData();
    
    // Add blog data fields
    Object.entries(blogData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // For arrays like tags, send as JSON string
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    // Add image file if provided
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    return this.fetchWithErrorHandling<ApiResponse<Blog>>('/blogs/' + id, {
      method: 'PUT',
      body: formData,
    });
  }

  // Delete blog
  async deleteBlog(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithErrorHandling<ApiResponse<{ message: string }>>(`/blogs/${id}`, {
      method: 'DELETE',
    });
  }

  // Search blogs
  async searchBlogs(params: {
    q: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Blog>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.fetchWithErrorHandling<PaginatedResponse<Blog>>(`/blogs/search?${searchParams.toString()}`);
  }

  // Get featured blogs
  async getFeaturedBlogs(limit: number = 5): Promise<PaginatedResponse<Blog>> {
    return this.fetchWithErrorHandling<PaginatedResponse<Blog>>(`/blogs?featured=true&limit=${limit}`);
  }

  async getUserState(identifier: string): Promise<ApiResponse<{ saved: boolean; liked: boolean; likes: number }>> {
    return this.fetchWithErrorHandling<ApiResponse<{ saved: boolean; liked: boolean; likes: number }>>(
      `/blogs/${encodeURIComponent(identifier)}/user-state`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  async toggleSave(identifier: string): Promise<ApiResponse<{ saved: boolean }>> {
    return this.fetchWithErrorHandling<ApiResponse<{ saved: boolean }>>(
      `/blogs/${encodeURIComponent(identifier)}/save`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      }
    );
  }

  async toggleLike(identifier: string): Promise<ApiResponse<{ liked: boolean; likes: number }>> {
    return this.fetchWithErrorHandling<ApiResponse<{ liked: boolean; likes: number }>>(
      `/blogs/${encodeURIComponent(identifier)}/like`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Get categories from API
  async getCategories(): Promise<{ success: boolean; data: Array<{ category: string; count: number }> }> {
    try {
      return await this.fetchWithErrorHandling<{ success: boolean; data: Array<{ category: string; count: number }> }>('/blogs/categories');
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      // Return empty array - no fallback
      return {
        success: true,
        data: []
      };
    }
  }

  // Get statistics from API
  async getStats(): Promise<{ 
    success: boolean; 
    data: { 
      totalBlogs: number; 
      featuredBlogs: number; 
      totalViews: number;
      totalLikes: number;
      categoriesCount: number;
      authorsCount: number;
    } 
  }> {
    try {
      return await this.fetchWithErrorHandling<{ 
        success: boolean; 
        data: { 
          totalBlogs: number; 
          featuredBlogs: number; 
          totalViews: number;
          totalLikes: number;
          categoriesCount: number;
          authorsCount: number;
        } 
      }>('/blogs/stats');
    } catch (error) {
      return {
        success: false,
        data: {
          totalBlogs: 0,
          featuredBlogs: 0,
          totalViews: 0,
          totalLikes: 0,
          categoriesCount: 0,
          authorsCount: 0
        }
      };
    }
  }

  // Utility function to convert API blog to admin form data
  convertApiBlogToFormData(blog: Blog): BlogPayload & { id: string } {
    return {
      id: blog._id || blog.id || '',
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      author: blog.author,
      category: blog.category,
      tags: blog.tags,
      image: blog.image,
      readTime: blog.readTime,
      publishDate: blog.publishDate,
      featured: blog.featured,
      status: blog.status,
    };
  }
}

// Export singleton instance
export const blogsApi = new BlogsApiService();
export default blogsApi;
