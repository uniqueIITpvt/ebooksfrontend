'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, LoginCredentials, RegisterData } from '@/services/api/authApi';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string; user?: User }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isUser: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const router = useRouter();

  // Initialize auth state from localStorage (checks both user and admin tokens)
  useEffect(() => {
    const initAuth = async () => {
      
      try {
        localStorage.removeItem('user_accessToken');
        localStorage.removeItem('admin_accessToken');
        localStorage.removeItem('accessToken');

        const storedUser = authApi.getUser();
        if (!storedUser) {
          setUser(null);
          return;
        }

        const refreshResponse = await authApi.refreshToken();
        if (refreshResponse.success) {
          const response = await authApi.getProfile();
          setUser(response.success && response.data ? response.data : refreshResponse.data?.user || null);
        } else {
          localStorage.removeItem('user_user');
          localStorage.removeItem('admin_user');
          setUser(null);
        }
      } catch (error) {
        localStorage.removeItem('user_user');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('user_accessToken');
        localStorage.removeItem('admin_accessToken');
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const refreshAccessToken = async () => {
      const response = await authApi.refreshToken();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        authApi.removeUser();
        setUser(null);
      }
    };

    const intervalId = window.setInterval(refreshAccessToken, 13 * 60 * 1000);
    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshAccessToken();
      }
    };

    window.addEventListener('focus', refreshAccessToken);
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshAccessToken);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [user]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authApi.login(credentials);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true, message: 'Login successful', user: response.data.user };
      }
      
      return { success: false, message: response.message || 'Too many requests from this IP, please try again after 15 minutes' };
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await authApi.register(userData);
      
      if (response.success) {
        return { success: true, message: 'Registration successful' };
      }
      
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
    } finally {
      // Clear both session types so admin and user access cannot leak between logins.
      localStorage.removeItem('user_user');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('user_accessToken');
      localStorage.removeItem('admin_accessToken');
      localStorage.removeItem('accessToken');
      setUser(null);
      router.push('/');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isSuperAdmin: user?.role === 'superadmin',
    isUser: user?.role === 'user',
    isLoginModalOpen,
    setIsLoginModalOpen,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
