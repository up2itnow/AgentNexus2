const DEFAULT_API_BASE_URL = 'http://localhost:3001';
const API_BASE_URL_STORAGE_KEY = 'api_url';
const LEGACY_API_BASE_URL_STORAGE_KEYS = ['backend_base_url', 'agentnexus_backend_url'];
const LEGACY_AUTH_TOKEN_STORAGE_KEY = 'auth_token';

let sessionAuthToken: string | null = null;

const hasBrowserStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

const normalizeValue = (value: string) => value.trim();

const migrateLegacyApiBaseUrl = () => {
  if (!hasBrowserStorage()) return '';

  for (const legacyKey of LEGACY_API_BASE_URL_STORAGE_KEYS) {
    const value = window.localStorage.getItem(legacyKey);
    if (value) {
      const normalizedValue = normalizeValue(value);
      if (normalizedValue) {
        window.localStorage.setItem(API_BASE_URL_STORAGE_KEY, normalizedValue);
      }
      LEGACY_API_BASE_URL_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      return normalizedValue;
    }
  }

  return '';
};

export const getStoredApiBaseUrl = () => {
  if (!hasBrowserStorage()) return '';

  const storedValue = window.localStorage.getItem(API_BASE_URL_STORAGE_KEY);
  if (storedValue) return normalizeValue(storedValue);

  return migrateLegacyApiBaseUrl();
};

export const getApiBaseUrl = () => (
  getStoredApiBaseUrl() || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL
);

export const saveApiBaseUrl = (value: string) => {
  if (!hasBrowserStorage()) return;

  const normalizedValue = normalizeValue(value);
  if (normalizedValue) {
    window.localStorage.setItem(API_BASE_URL_STORAGE_KEY, normalizedValue);
  } else {
    window.localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
  }

  LEGACY_API_BASE_URL_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
};

export const setSessionAuthToken = (token: string) => {
  const normalizedToken = normalizeValue(token);
  sessionAuthToken = normalizedToken || null;

  if (hasBrowserStorage()) {
    window.localStorage.removeItem(LEGACY_AUTH_TOKEN_STORAGE_KEY);
  }
};

export const getSessionAuthToken = () => sessionAuthToken;
