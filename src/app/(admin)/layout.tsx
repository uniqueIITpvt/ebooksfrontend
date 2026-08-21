'use client';

import MuiThemeProvider from '@/components/admin/MuiThemeProvider';
import AdminLayout from '@/components/admin/AdminLayout';
import './admin.css';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MuiThemeProvider>
      <AdminLayout>
        {children}
      </AdminLayout>
    </MuiThemeProvider>
  );
}
