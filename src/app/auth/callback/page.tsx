'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi, type User } from '@/services/api/authApi';

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

const AuthCallbackLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
    Signing you in...
  </div>
);

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const user = parseUser(searchParams?.get('user') || null);
    const returnUrl = searchParams?.get('returnUrl') || '/';

    if (user) {
      authApi.setUser(user);
      router.replace(returnUrl.startsWith('/') ? returnUrl : '/');
      return;
    }

    router.replace('signin');
  }, [router, searchParams]);

  return <AuthCallbackLoading />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
