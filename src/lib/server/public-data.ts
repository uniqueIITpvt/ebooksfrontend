import 'server-only';

import { cache } from 'react';

import type { Book } from '@/services/api/booksApi';
import type { Audiobook } from '@/services/api/audiobooksApi';
import type { Category } from '@/services/api/categoriesApi';
import type { LanguageRecord } from '@/services/api/languageApi';
import type { FreeSummary } from '@/services/api/freeSummariesApi';
import type { PremiumSummary } from '@/services/api/premiumSummariesApi';
import type { TrendingBook } from '@/services/api/trendingBooksApi';
import type { PublicBookListItem } from '@/types/publicBook';
import type { FaqItem } from '@/types/faq';

const DEFAULT_API_ORIGIN =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://ebookbackend-chi.vercel.app';
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_ORIGIN;
const API_ORIGIN = RAW_API_URL.replace(/\/+$/, '').replace(/\/api\/v\d+$/, '');
const API_BASE_URL = `${API_ORIGIN}/api/v1`;

export const SHELL_REVALIDATE_SECONDS = 60;
export const CONTENT_REVALIDATE_SECONDS = 300;

type QueryValue = string | number | boolean | null | undefined;

interface FetchApiOptions {
  query?: Record<string, QueryValue>;
  revalidate?: number;
  init?: RequestInit;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  value?: string;
}

export interface PublicSettings {
  site_logo?: string;
  banner_visual?: boolean | number | string;
  blog_title?: string;
  blog_subtitle?: string;
  [key: string]: unknown;
}

export interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  isActive: boolean;
  order: number;
  position: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorBio?: string;
  authorAvatar?: string;
  category: string;
  image?: string;
  publishDate: string;
  readTime: string;
  slug: string;
  tags?: string[] | string;
  featured?: boolean;
  views?: number;
  likes?: number;
}

export interface SiteShellData {
  settings: PublicSettings;
  siteLogo: string | null;
}

export interface PublicHomeData extends SiteShellData {
  bannerEnabled: boolean;
  banners: Banner[];
  newReleaseBooks: PublicBookListItem[];
  newReleaseAudiobooks: PublicBookListItem[];
  freeSummaries: PublicBookListItem[];
  trendingBooks: PublicBookListItem[];
  premiumSummaries: PublicBookListItem[];
  categories: Category[];
}

export interface BlogListingData {
  blogs: BlogPost[];
  categories: { name: string; value: string }[];
  blogSettings: {
    title: string;
    subtitle: string;
  };
}

export interface FaqPageData {
  faqs: FaqItem[];
  categories: string[];
}

export interface BooksPageData {
  allBooks: PublicBookListItem[];
  categories: Category[];
  languages: LanguageRecord[];
}

const toSearchParams = (query?: Record<string, QueryValue>) => {
  const params = new URLSearchParams();

  if (!query) {
    return '';
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const fetchApiJson = async <T>(
  path: string,
  { query, revalidate = CONTENT_REVALIDATE_SECONDS, init }: FetchApiOptions = {}
): Promise<T | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}${toSearchParams(query)}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
      next: {
        revalidate,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const fetchApiData = async <T>(
  path: string,
  options?: FetchApiOptions
): Promise<T | null> => {
  const response = await fetchApiJson<ApiEnvelope<T>>(path, options);

  if (!response || response.success === false) {
    return null;
  }

  return response.data ?? null;
};

export const isFeatureEnabled = (value: unknown) => {
  return value === true || value === 1 || value === '1' || value === 'true';
};

export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  return (await fetchApiData<PublicSettings>('/settings/public', {
    revalidate: SHELL_REVALIDATE_SECONDS,
  })) ?? {};
});

export const getSiteLogo = cache(async (): Promise<string | null> => {
  const settings = await getPublicSettings();

  if (typeof settings.site_logo === 'string' && settings.site_logo) {
    return settings.site_logo;
  }

  const fallback = await fetchApiJson<ApiEnvelope<never>>('/settings/value/site_logo', {
    revalidate: SHELL_REVALIDATE_SECONDS,
  });

  if (typeof fallback?.value === 'string' && fallback.value) {
    return fallback.value;
  }

  return null;
});

export const getPublicShellData = cache(async (): Promise<SiteShellData> => {
  const [settings, siteLogo] = await Promise.all([getPublicSettings(), getSiteLogo()]);

  return {
    settings,
    siteLogo,
  };
});

export const getBooksHeroBanners = cache(async (): Promise<Banner[]> => {
  return (await fetchApiData<Banner[]>('/banners/position/any', {
    revalidate: SHELL_REVALIDATE_SECONDS,
  })) ?? [];
});

export const getHomePageData = cache(async (): Promise<PublicHomeData> => {
  const shell = await getPublicShellData();
  const bannerEnabled = isFeatureEnabled(shell.settings.banner_visual);

  const [
    banners,
    newReleaseBooks,
    newReleaseAudiobooks,
    freeSummaries,
    trendingBooks,
    premiumSummaries,
    categories,
  ] = await Promise.all([
    bannerEnabled
      ? fetchApiData<Banner[]>('/banners', {
          revalidate: SHELL_REVALIDATE_SECONDS,
        })
      : Promise.resolve([]),
    fetchApiData<PublicBookListItem[]>('/books', {
      query: { view: 'listing', type: 'Books', limit: 5 },
      revalidate: 0,
    }),
    fetchApiData<PublicBookListItem[]>('/audiobooks', {
      query: { view: 'listing', limit: 5 },
    }),
    fetchApiData<PublicBookListItem[]>('/books', {
      query: { view: 'listing', componentType: 'free-summaries', limit: 5 },
    }),
    fetchApiData<PublicBookListItem[]>('/books', {
      query: { view: 'listing', componentType: 'trending-books', limit: 5 },
      revalidate: 0,
    }),
    fetchApiData<PublicBookListItem[]>('/books', {
      query: { view: 'listing', componentType: 'premium-summaries', limit: 5 },
    }),
    fetchApiData<Category[]>('/categories', {
      query: { includeInactive: false, sortBy: 'sortOrder' },
    }),
  ]);

  return {
    ...shell,
    bannerEnabled,
    banners: banners ?? [],
    newReleaseBooks: newReleaseBooks ?? [],
    newReleaseAudiobooks: newReleaseAudiobooks ?? [],
    freeSummaries: freeSummaries ?? [],
    trendingBooks: trendingBooks ?? [],
    premiumSummaries: premiumSummaries ?? [],
    categories: categories ?? [],
  };
});

export const getBlogListingData = cache(async (): Promise<BlogListingData> => {
  const [settings, blogs, categoryRows] = await Promise.all([
    getPublicSettings(),
    fetchApiData<BlogPost[]>('/blogs', {
      query: { limit: 100 },
    }),
    fetchApiData<Array<{ category: string }>>('/blogs/categories'),
  ]);

  return {
    blogs: blogs ?? [],
    categories: [
      { name: 'All', value: 'all' },
      ...((categoryRows ?? []).map((category) => ({
        name: category.category,
        value: category.category,
      }))),
    ],
    blogSettings: {
      title: typeof settings.blog_title === 'string' && settings.blog_title
        ? settings.blog_title
        : 'Books Insights & Research',
      subtitle: typeof settings.blog_subtitle === 'string' ? settings.blog_subtitle : '',
    },
  };
});

export const getFaqPageData = cache(async (): Promise<FaqPageData> => {
  const [faqs, categories] = await Promise.all([
    fetchApiData<FaqItem[]>('/faqs'),
    fetchApiData<string[]>('/faqs/categories'),
  ]);

  return {
    faqs: faqs ?? [],
    categories: ['All', ...(categories ?? [])],
  };
});

export const getBooksPageData = cache(async (): Promise<BooksPageData> => {
  const [books, audiobooks, categories, languages] = await Promise.all([
    fetchApiData<PublicBookListItem[]>('/books', {
      query: { view: 'listing' },
    }),
    fetchApiData<PublicBookListItem[]>('/audiobooks', {
      query: { view: 'listing' },
    }),
    fetchApiData<Category[]>('/categories', {
      query: { includeInactive: false, sortBy: 'sortOrder' },
    }),
    fetchApiData<LanguageRecord[]>('/books/languages'),
  ]);

  return {
    allBooks: [...(books ?? []), ...(audiobooks ?? [])],
    categories: categories ?? [],
    languages: languages ?? [],
  };
});

export const getTrendingBooksPageData = cache(async (): Promise<TrendingBook[]> => {
  return (await fetchApiData<TrendingBook[]>('/trending-books', {
    query: { limit: 100 },
  })) ?? [];
});

export const getFreeSummariesPageData = cache(async (): Promise<FreeSummary[]> => {
  return (await fetchApiData<FreeSummary[]>('/free-summaries', {
    query: { limit: 100 },
  })) ?? [];
});

export const getPremiumSummariesPageData = cache(async (): Promise<PremiumSummary[]> => {
  return (await fetchApiData<PremiumSummary[]>('/premium-summaries', {
    query: { limit: 100 },
  })) ?? [];
});

export const getBlogPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  return fetchApiData<BlogPost>(`/blogs/${encodeURIComponent(slug)}`);
});

export const getBookBySlug = cache(async (slug: string): Promise<Book | null> => {
  return fetchApiData<Book>(`/books/${encodeURIComponent(slug)}`, { revalidate: 0 });
});

export const getAudiobookBySlug = cache(async (slug: string): Promise<Audiobook | null> => {
  return fetchApiData<Audiobook>(`/audiobooks/${encodeURIComponent(slug)}`, { revalidate: 0 });
});

export const getTrendingBookBySlug = cache(async (slug: string): Promise<TrendingBook | null> => {
  return fetchApiData<TrendingBook>(`/trending-books/${encodeURIComponent(slug)}`);
});

export const getFreeSummaryBySlug = cache(async (slug: string): Promise<FreeSummary | null> => {
  return fetchApiData<FreeSummary>(`/free-summaries/${encodeURIComponent(slug)}`);
});

export const getPremiumSummaryBySlug = cache(async (slug: string): Promise<PremiumSummary | null> => {
  return fetchApiData<PremiumSummary>(`/premium-summaries/${encodeURIComponent(slug)}`);
});

export const getRelatedBooks = async (book: Book): Promise<PublicBookListItem[]> => {
  const related = await fetchApiData<PublicBookListItem[]>('/books', {
    query: {
      view: 'listing',
      category: book.category,
      limit: 8,
    },
    revalidate: 60,
  });

  return (related ?? []).filter((candidate) => candidate.id !== book.id).slice(0, 4);
};
