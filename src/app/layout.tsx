import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import AuthModal from '@/components/ui/auth/AuthModal';
import { getSiteLogo } from '@/lib/server/public-data';
import ConditionalLayout from '@/components/ui/layout/ConditionalLayout';
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_URL, siteUrl } from '@/config/site.config';

const fontVariables = {
  '--font-syne': '"Trebuchet MS", "Arial Narrow", Arial, sans-serif',
  '--font-dm-sans': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  '--font-devanagari': '"Nirmala UI", "Mangal", "Kokila", sans-serif',
} as React.CSSProperties;

export async function generateMetadata(): Promise<Metadata> {
  const siteLogo = await getSiteLogo();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: 'TechUniqueIIT' }],
    creator: 'TechUniqueIIT',
    publisher: 'TechUniqueIIT',
    alternates: {
      canonical: siteUrl('/'),
    },
    openGraph: {
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: siteUrl('/'),
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_IN',
      ...(siteLogo
        ? {
            images: [
              {
                url: siteLogo,
                alt: SITE_NAME,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      ...(siteLogo ? { images: [siteLogo] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    ...(siteLogo
      ? {
          icons: {
            icon: siteLogo,
            shortcut: siteLogo,
            apple: siteLogo,
          },
        }
      : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteLogo = await getSiteLogo();

  return (
    <html suppressHydrationWarning lang='en' style={fontVariables}>
      <body suppressHydrationWarning className="font-dm-sans">
        <AuthProvider>
          <CartProvider>
            <ConditionalLayout siteLogo={siteLogo}>
              {children}
            </ConditionalLayout>
            <AuthModal />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
