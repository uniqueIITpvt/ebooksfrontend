/**
 * Backend URL fallback helper.
 * `API_CONFIG` should be used by the app. This file only provides a safe
 * fallback when NEXT_PUBLIC_API_URL is not explicitly injected.
 */

const LOCAL_BACKEND_URL = 'http://localhost:5000';
const DEPLOYED_BACKEND_URL = 'https://ebookbackend-chi.vercel.app';

export const USE_LOCAL_BACKEND = process.env.NODE_ENV === 'development';

export const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (USE_LOCAL_BACKEND ? LOCAL_BACKEND_URL : DEPLOYED_BACKEND_URL)
).replace(/\/+$/, '');

