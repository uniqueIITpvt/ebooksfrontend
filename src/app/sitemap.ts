import type { MetadataRoute } from 'next';
import { siteUrl } from '@/config/site.config';

export const revalidate = 3600;

const staticRoutes = [
  '/',
  '/about',
  '/about/contact',
  '/audiobooks',
  '/blog',
  '/books',
  '/contact',
  '/faq',
  '/free-summaries',
  '/lending',
  '/premium-summaries',
  '/subscription',
  '/trending-books',
];

const route = (
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'weekly',
  priority = 0.7
) => ({
  url: siteUrl(path),
  lastModified: new Date(),
  changeFrequency,
  priority,
});

export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map((path) =>
    route(path, path === '/' ? 'daily' : 'weekly', path === '/' ? 1 : 0.75)
  );
}
