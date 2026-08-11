let accessToken: string | null = null;
const STORAGE_KEY = 'session_accessToken';

const getStoredAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEY);
};

export const tokenStore = {
  getAccessToken() {
    accessToken = accessToken || getStoredAccessToken();
    return accessToken;
  },

  setAccessToken(token: string | null) {
    accessToken = token;
    if (typeof window === 'undefined') return;

    if (token) {
      sessionStorage.setItem(STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  },

  clearAccessToken() {
    accessToken = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  },

  getAuthHeaders(): HeadersInit {
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  },
};
