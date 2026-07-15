'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isLoggingOut, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggingOut) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login
        router.push('/admin/login');
      } else if (requireAdmin && !isAdmin) {
        // Authenticated but not admin, redirect to home or unauthorized page
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, isLoggingOut, isAdmin, requireAdmin, router]);

  // Show loading spinner while checking auth
  if (isLoading || isLoggingOut) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated || (requireAdmin && !isAdmin)) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // User is authenticated (and admin if required), show the protected content
  return <>{children}</>;
}
