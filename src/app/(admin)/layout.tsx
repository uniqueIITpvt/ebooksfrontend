'use client';

import MuiThemeProvider from '@/components/admin/MuiThemeProvider';
import AdminLayout from '@/components/admin/AdminLayout';
import { AuthProvider } from '@/contexts/AuthContext';
import './admin.css';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <MuiThemeProvider>
        <AdminLayout>
          {children}
        </AdminLayout>
      </MuiThemeProvider>
    </AuthProvider>
  );
}
