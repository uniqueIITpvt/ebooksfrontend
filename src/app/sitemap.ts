import type { MetadataRoute } from 'next';
import {
  getBlogListingData,
  getBooksPageData,
  getFreeSummariesPageData,
  getPremiumSummariesPageData,
  getTrendingBooksPageData,
} from '@/lib/server/public-data';
import { siteUrl } from '@/config/site.config';
import type { PublicBookListItem } from '@/types/publicBook';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [booksData, blogsData, trendingBooks, freeSummaries, premiumSummaries] =
    await Promise.all([
      getBooksPageData(),
      getBlogListingData(),
      getTrendingBooksPageData(),
      getFreeSummariesPageData(),
      getPremiumSummariesPageData(),
    ]);

  const productRoutes = booksData.allBooks.flatMap((item) => {
    const slug = itemSlug(item);

    if (!slug) {
      return [];
    }

    const basePath = item.type === 'Audiobook' ? '/audiobooks' : '/books';
    return [route(`${basePath}/${slug}`, 'weekly', 0.8)];
  });

  const blogRoutes = blogsData.blogs.flatMap((blog) =>
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
