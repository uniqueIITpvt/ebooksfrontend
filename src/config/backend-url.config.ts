/**
 * Backend URL fallback helper.
 * `API_CONFIG` should be used by the app. This file only provides a safe
 * fallback when NEXT_PUBLIC_API_URL is not explicitly injected.
 */

const DEPLOYED_BACKEND_URL = 'https://ebooksbackend-production.up.railway.app';
const getLocalBackendUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000';

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5000`;
};

export const USE_LOCAL_BACKEND = process.env.NODE_ENV !== 'production';
const EXPLICIT_LOCAL_BACKEND = process.env.NEXT_PUBLIC_USE_LOCAL_BACKEND === 'true';

export const BACKEND_URL = (
  EXPLICIT_LOCAL_BACKEND
    ? process.env.NEXT_PUBLIC_API_URL || getLocalBackendUrl()
    : process.env.NEXT_PUBLIC_API_URL || DEPLOYED_BACKEND_URL
).replace(/\/+$/, '');
