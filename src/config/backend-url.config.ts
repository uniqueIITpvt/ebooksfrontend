/**
 * Backend URL fallback helper.
 * `API_CONFIG` should be used by the app. This file only provides a safe
 * fallback when NEXT_PUBLIC_API_URL is not explicitly injected.
 */

const DEPLOYED_BACKEND_URL = 'https://ebooksbackend-production.up.railway.app';

export const USE_LOCAL_BACKEND = false;

export const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  DEPLOYED_BACKEND_URL
).replace(/\/+$/, '');
