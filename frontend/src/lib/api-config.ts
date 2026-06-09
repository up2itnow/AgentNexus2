const BACKEND_URL_STORAGE_KEY = 'agentnexus_backend_url';
const LEGACY_BACKEND_URL_STORAGE_KEYS = ['backend_base_url', 'api_url'];
const DEFAULT_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

let sessionAuthToken = '';

const getBrowserStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

export const getBackendBaseUrl = () => {
  const storage = getBrowserStorage();
  if (!storage) return DEFAULT_BACKEND_URL;

  const storedUrl = storage.getItem(BACKEND_URL_STORAGE_KEY)?.trim();
  if (storedUrl) return storedUrl;

  for (const legacyKey of LEGACY_BACKEND_URL_STORAGE_KEYS) {
    const legacyUrl = storage.getItem(legacyKey)?.trim();
    if (legacyUrl) {
      storage.setItem(BACKEND_URL_STORAGE_KEY, legacyUrl);
      storage.removeItem(legacyKey);
      return legacyUrl;
    }
  }

  return DEFAULT_BACKEND_URL;
};

export const persistBackendBaseUrl = (url: string) => {
  const storage = getBrowserStorage();
  if (!storage) return;

  const trimmedUrl = url.trim();
  if (trimmedUrl) {
    storage.setItem(BACKEND_URL_STORAGE_KEY, trimmedUrl);
  } else {
    storage.removeItem(BACKEND_URL_STORAGE_KEY);
  }

  for (const legacyKey of LEGACY_BACKEND_URL_STORAGE_KEYS) {
    storage.removeItem(legacyKey);
  }
};

export const setSessionAuthToken = (token: string) => {
  const trimmedToken = token.trim();
  if (trimmedToken) {
    sessionAuthToken = trimmedToken;
  }
};

export const getSessionAuthToken = () => sessionAuthToken;

export const clearSessionAuthToken = () => {
  sessionAuthToken = '';
};

