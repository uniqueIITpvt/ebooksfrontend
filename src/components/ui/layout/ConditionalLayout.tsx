'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const Navbar = dynamic(() => import('./Navbar'), {
  loading: () => <div className="h-16 bg-white border-b border-slate-200" />,
});

const Footer = dynamic(() => import('./Footer'));

const AutomaticChatEmbed = dynamic(() => import('../primitives/AutomaticChatEmbed'), {
  ssr: false,
});

const ScrollRestoration = dynamic(() => import('./ScrollRestoration'), {
  ssr: false,
});

interface ConditionalLayoutProps {
  children: React.ReactNode;
  siteLogo?: string | null;
}

export default function ConditionalLayout({
  children,
  siteLogo,
}: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthRoute = pathname?.startsWith('/user/login') || pathname?.startsWith('/user/signup') || pathname?.startsWith('/user/auth');
  const isReaderRoute =
    pathname?.startsWith('/read/') ||
    Boolean(pathname?.startsWith('/books/') && pathname?.endsWith('/read')) ||
    Boolean(pathname?.startsWith('/free-summaries/') && pathname?.endsWith('/read'));

  if (isAdminRoute || isAuthRoute || isReaderRoute) {
    // For admin and auth routes, don't show navbar, footer, or chat embed
    return <>{children}</>;
  }

  // For regular routes, show the full layout
  return (
    <>
      <ScrollRestoration />
      <Navbar siteLogo={siteLogo} />
      <main className="pt-20">{children}</main>
      <Footer siteLogo={siteLogo} />
      <AutomaticChatEmbed />
    </>
  );
}
