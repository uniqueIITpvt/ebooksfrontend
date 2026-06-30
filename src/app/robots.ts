import type { MetadataRoute } from 'next';
import { SITE_URL, siteUrl } from '@/config/site.config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth',
          '/cart',
          '/checkout',
          '/login',
          '/profile',
          '/signup',
          '/sync-tool',
          '/test-editor',
          '/test-lexical',
          '/test-rich-editor',
          '/user/',
        ],
      },
    ],
    sitemap: siteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
