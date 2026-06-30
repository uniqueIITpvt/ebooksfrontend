import { API_CONFIG } from '@/config/api';
import { tokenStore } from './tokenStore';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'user' | 'admin' | 'superadmin';
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  avatar?: string;
  bio?: string;
  phone?: string;
  isPhoneVerified?: boolean;
  location?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  subscriptionStatus?: 'none' | 'active' | 'inactive' | 'expired';
  subscriptionPlan?: 'none' | 'basic' | 'premium' | 'pro';
  subscriptionEndDate?: string;
  savedBooks?: SavedBook[];
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedBook {
  id: string;
  bookId?: string | {
    _id?: string;
    id?: string;
    slug?: string;
    title?: string;
  };
  _id?: string;
  title: string;
  author?: string;
  image?: string | null;
  slug?: string;
  category?: string;
  price?: string;
  originalPrice?: string | null;
  componentType?: string;
  savedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
  };
}

export interface ProfileUpdateData {
  name?: string;
  bio?: string;
  phone?: string;
  location?: string;
  avatar?: string;
  preferences?: {
    notifications?: {
      email?: boolean;
      push?: boolean;
    };
    theme?: 'light' | 'dark' | 'auto';
  };
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */
class AuthApiService {
  private refreshPromise: Promise<{ success: boolean; data?: { accessToken: string; user: User } }> | null = null;

  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get storage key based on user role
   */
  private getStorageKey(baseKey: string, user?: User | null): string {
    // Check current stored user to determine role
    const storedUser = this.getUser();
    const role = user?.role || storedUser?.role;
    if (role === 'admin' || role === 'superadmin') {
      return `admin_${baseKey}`;
    }
    return `user_${baseKey}`;
  }

  /**
   * Get stored access token
   */
  getToken(user?: User | null): string | null {
    return tokenStore.getAccessToken();
  }

  /**
   * Store access token
   */
  setToken(token: string, user?: User | null): void {
    if (typeof window === 'undefined') return;
    tokenStore.setAccessToken(token);
    localStorage.removeItem('admin_accessToken');
    localStorage.removeItem('user_accessToken');
    localStorage.removeItem('accessToken');
  }

  /**
   * Remove access token
   */
  removeToken(user?: User | null): void {
    if (typeof window === 'undefined') return;
    tokenStore.clearAccessToken();
    localStorage.removeItem('admin_accessToken');
    localStorage.removeItem('user_accessToken');
    localStorage.removeItem('accessToken');
  }

  /**
   * Get stored user data
   */
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    // Try admin first, then user
    const adminStr = localStorage.getItem('admin_user');
    if (adminStr) return JSON.parse(adminStr);
    const userStr = localStorage.getItem('user_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Store user data
   */
  setUser(user: User): void {
    if (typeof window === 'undefined') return;
    // Clear opposite role's data
    if (user.role === 'admin' || user.role === 'superadmin') {
      localStorage.removeItem('user_user');
      localStorage.setItem('admin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('admin_user');
      localStorage.setItem('user_user', JSON.stringify(user));
    }
  }

  /**
   * Remove user data
   */
  removeUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('admin_user');
    localStorage.removeItem('user_user');
    this.removeToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!tokenStore.getAccessToken();
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include', // Include cookies
      });

      const data = await response.json();

      if (data.success && data.data) {
        this.setToken(data.data.accessToken, data.data.user);
        this.setUser(data.data.user);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      const data = await response.json();

      return data;
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async sendRegistrationPhoneOtp(phone: string): Promise<{ success: boolean; message?: string; data?: { otp?: string } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/phone/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error('Send registration phone OTP error:', error);
      return {
        success: false,
        message: 'Failed to send OTP',
      };
    }
  }

  async verifyRegistrationPhoneOtp(phone: string, otp: string): Promise<{ success: boolean; message?: string; data?: { phoneVerified?: boolean } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/phone/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error('Verify registration phone OTP error:', error);
      return {
        success: false,
        message: 'Failed to verify OTP',
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeToken();
      this.removeUser();
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<{ success: boolean; data?: User; message?: string; status?: number }> {
    try {
      const fetchProfile = () => fetch(`${API_BASE_URL}/auth/me`, {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      let response = await fetchProfile();

      // Handle token expiration (401)
      if (response.status === 401) {
        const refreshResponse = await this.refreshToken();
        if (refreshResponse.success) {
          response = await fetchProfile();
        }
      }

      if (response.status === 401) {
        this.removeToken();
        this.removeUser();
        return {
          success: false,
          message: 'Token has expired. Please login again.',
          status: 401,
        };
      }

      const data = await response.json();

      if (data.success && data.data) {
        this.setUser(data.data);
      }

      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: 'Failed to fetch profile',
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: ProfileUpdateData): Promise<{ success: boolean; data?: User; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.data) {
        this.setUser(data.data);
      }

      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile',
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(passwordData: PasswordChangeData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(passwordData),
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Failed to change password',
      };
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      return await response.json();
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Failed to process request',
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/${resetToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      return await response.json();
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Failed to reset password',
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ success: boolean; data?: { accessToken: string; user: User } }> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.refreshTokenRequest();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async refreshTokenRequest(): Promise<{ success: boolean; data?: { accessToken: string; user: User } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.data) {
        this.setToken(data.data.accessToken, data.data.user);
        this.setUser(data.data.user);
      }

      return data;
    } catch (error) {
      console.error('Refresh token error:', error);
      return { success: false };
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(plan: string, durationMonths: number = 1): Promise<{ success: boolean; data?: User; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/subscription`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ plan, durationMonths }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.data) {
        this.setUser(data.data);
      }

      return data;
    } catch (error) {
      console.error('Update subscription error:', error);
      return {
        success: false,
        message: 'Failed to update subscription',
      };
    }
  }

  /**
   * Get saved books for the authenticated user
   */
  async getSavedBooks(): Promise<{ success: boolean; data?: SavedBook[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/saved-books`, {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error('Get saved books error:', error);
      return {
        success: false,
        message: 'Failed to fetch saved books',
      };
    }
  }

  /**
   * Toggle a saved book for the authenticated user
   */
  async toggleSavedBook(identifier: string): Promise<{ success: boolean; data?: { saved: boolean; savedBooks: SavedBook[] }; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/saved-books/${encodeURIComponent(identifier)}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.data) {
        const user = this.getUser();
        if (user) {
          this.setUser({ ...user, savedBooks: data.data.savedBooks });
        }
      }

      return data;
    } catch (error) {
      console.error('Toggle saved book error:', error);
      return {
        success: false,
        message: 'Failed to update saved book',
      };
    }
  }

  async sendPhoneOtp(phone: string): Promise<{ success: boolean; message?: string; data?: { otp?: string } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/phone/send-otp`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ phone }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        const profile = await this.getProfile();
        if (profile.success && profile.data) {
          this.setUser(profile.data);
        }
      }

      return data;
    } catch (error) {
      console.error('Send phone OTP error:', error);
      return {
        success: false,
        message: 'Failed to send OTP',
      };
    }
  }

  async verifyPhoneOtp(phone: string, otp: string): Promise<{ success: boolean; message?: string; data?: User }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/phone/verify-otp`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ phone, otp }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.data) {
        this.setUser(data.data);
      }

      return data;
    } catch (error) {
      console.error('Verify phone OTP error:', error);
      return {
        success: false,
        message: 'Failed to verify OTP',
      };
    }
  }
}

export const authApi = new AuthApiService();
export default authApi;
