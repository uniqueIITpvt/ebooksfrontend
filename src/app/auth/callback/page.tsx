import { Suspense } from 'react';
import AuthCallbackClient, { AuthCallbackLoading } from './AuthCallbackClient';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackClient />
    </Suspense>
  );
}
