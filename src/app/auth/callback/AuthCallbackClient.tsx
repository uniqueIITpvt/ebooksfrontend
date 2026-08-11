'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi, type User } from '@/services/api/authApi';
import { hasActiveSubscription } from '@/lib/subscription';

const parseUser = (value: string | null): User | null => {
  if (!value) return null;

  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(window.atob(padded)) as User;
  } catch {
    return null;
  }
};

const getPostLoginReturnUrl = (returnUrl: string, user: User) => {
  const hasUniquePlus = hasActiveSubscription(user);

  if (!hasUniquePlus || !returnUrl.startsWith('/subscription')) {
    return returnUrl.startsWith('/') ? returnUrl : '/';
  }

  const returnTo = new URLSearchParams(returnUrl.split('?')[1] || '').get('returnTo');
  return returnTo && returnTo.startsWith('/') ? returnTo : '/';
};

export const AuthCallbackLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
    Signing you in...
  </div>
);

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    const finishGoogleLogin = async () => {
      const user = parseUser(searchParams?.get('user') || null);
      const token = searchParams?.get('token') || null;
      const returnUrl = searchParams?.get('returnUrl') || '/';

      if (!user) {
        router.replace('/user/auth?mode=signin');
        return;
      }

      if (token) {
        authApi.setToken(token, user);
      }
      authApi.setUser(user);

      const refreshResponse = token ? null : await authApi.refreshToken();
      const activeUser = refreshResponse?.success && refreshResponse.data?.user
        ? refreshResponse.data.user
        : user;

      if (!cancelled) {
        window.location.replace(getPostLoginReturnUrl(returnUrl, activeUser));
      }
    };

    void finishGoogleLogin();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return <AuthCallbackLoading />;
}
