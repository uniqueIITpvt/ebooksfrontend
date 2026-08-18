import type { MetadataRoute } from 'next';
import { siteUrl } from '@/config/site.config';
import type { PublicBookListItem } from '@/types/publicBook';

export const revalidate = 3600;

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://ebooksbackend-production.up.railway.app'
)
  .replace(/\/+$/, '')
  .replace(/\/api\/v\d+$/, '');
const API_BASE_URL = `${API_ORIGIN}/api/v1`;

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

const itemSlug = (item: PublicBookListItem | { slug?: string; title?: string }) => {
  if (item.slug) {
    return item.slug;
  }

  if (!item.title) {
    return null;
  }

  return item.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const fetchSitemapItems = async <T>(
  path: string,
  query?: Record<string, string | number | boolean>
): Promise<T[]> => {
  try {
    const params = new URLSearchParams();
    Object.entries(query || {}).forEach(([key, value]) => {
      params.set(key, String(value));
    });

    const url = `${API_BASE_URL}${path}${params.size ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate },
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch {
    return [];
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [books, blogs, trendingBooks, freeSummaries, premiumSummaries] =
    await Promise.all([
      fetchSitemapItems<PublicBookListItem>('/books', {
        view: 'listing',
        type: 'Books',
        excludeComponentType: 'free-summaries',
        limit: 100,
      }),
      fetchSitemapItems<{ slug?: string }>('/blogs', { limit: 100 }),
      fetchSitemapItems<{ slug?: string }>('/trending-books', { limit: 100 }),
      fetchSitemapItems<{ slug?: string }>('/free-summaries', { limit: 100 }),
      fetchSitemapItems<{ slug?: string }>('/premium-summaries', { limit: 100 }),
    ]);

  const productRoutes = books.flatMap((item) => {
    const slug = itemSlug(item);

    if (!slug) {
      return [];
    }

    const basePath = item.type === 'Audiobook' ? '/audiobooks' : '/books';
    return [route(`${basePath}/${slug}`, 'weekly', 0.8)];
  });

  const blogRoutes = blogs.flatMap((blog) =>
    blog.slug ? [route(`/blog/${blog.slug}`, 'monthly', 0.6)] : []
  );

  const trendingRoutes = trendingBooks.flatMap((book) =>
    book.slug ? [route(`/trending-books/${book.slug}`, 'weekly', 0.7)] : []
  );

  const freeSummaryRoutes = freeSummaries.flatMap((summary) =>
    summary.slug ? [route(`/free-summaries/${summary.slug}`, 'weekly', 0.7)] : []
  );

  const premiumSummaryRoutes = premiumSummaries.flatMap((summary) =>
    summary.slug ? [route(`/premium-summaries/${summary.slug}`, 'weekly', 0.7)] : []
  );

  return [
    ...staticRoutes.map((path) => route(path, path === '/' ? 'daily' : 'weekly', path === '/' ? 1 : 0.75)),
    ...productRoutes,
    ...blogRoutes,
    ...trendingRoutes,
    ...freeSummaryRoutes,
    ...premiumSummaryRoutes,
  ];
}
