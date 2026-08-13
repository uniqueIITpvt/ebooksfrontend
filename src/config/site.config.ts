export const SITE_NAME = 'Unique Books Plus Ebook Store';

export const SITE_DESCRIPTION =
  'Discover ebooks, audiobooks, free book summaries, premium summaries and learning resources at Unique Books Plus.';

export const SITE_KEYWORDS = [
  'Unique Books Plus',
  'UniqueIIT ebook store',
  'Unique Books Plus ebook store',
  'ebooks',
  'audiobooks',
  'book summaries',
  'free book summaries',
  'premium book summaries',
  'online ebook store India',
  'learning resources',
  'digital books',
];

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  'https://uniquebooksplus.com'
).replace(/^([^h])/, 'https://$1').replace(/\/+$/, '');

export const SITE_ALTERNATE_URLS = ['https://uniquebooksplus.in'];

export const siteUrl = (path = '/') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, `${SITE_URL}/`).toString();
};
