export const SITE_NAME = 'TechUniqueIIT Ebook Store';

export const SITE_DESCRIPTION =
  'Discover ebooks, audiobooks, free book summaries, premium summaries and learning resources at TechUniqueIIT.';

export const SITE_KEYWORDS = [
  'TechUniqueIIT',
  'UniqueIIT ebook store',
  'TechUniqueIIT ebook store',
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
  'https://techuniqueiit.com'
).replace(/^([^h])/, 'https://$1').replace(/\/+$/, '');

export const siteUrl = (path = '/') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, `${SITE_URL}/`).toString();
};
