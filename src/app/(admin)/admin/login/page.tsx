'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified login page with returnUrl to come back to admin
    router.push('/user/auth?mode=signin');
  }, [router]);

  return null;
}
