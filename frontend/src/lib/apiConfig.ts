const DEFAULT_API_BASE_URL = 'http://localhost:3001';
const API_BASE_URL_KEYS = ['api_url', 'backend_base_url', 'agentnexus_backend_url'] as const;
const AUTH_TOKEN_KEY = 'auth_token';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    for (const key of API_BASE_URL_KEYS) {
      const value = window.localStorage.getItem(key)?.trim();
      if (value) return value;
    }
  }

  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL;
}

export function persistApiBaseUrl(url: string): void {
  if (typeof window === 'undefined') return;

  const value = url.trim();
  for (const key of API_BASE_URL_KEYS) {
    if (value) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  return (
    window.sessionStorage.getItem(AUTH_TOKEN_KEY) ||
    window.localStorage.getItem(AUTH_TOKEN_KEY)
  );
}

export function persistSessionAuthToken(token: string): void {
  if (typeof window === 'undefined') return;

  const value = token.trim();
  if (value) {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, value);
  }
}
