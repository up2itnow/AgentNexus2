const BACKEND_BASE_URL_KEY = 'backend_base_url';
const LEGACY_BACKEND_BASE_URL_KEYS = ['api_url', 'agentnexus_backend_url'];
const AUTH_TOKEN_KEY = 'auth_token';

function browserLocalStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

function browserSessionStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.sessionStorage;
}

export function getBackendBaseUrl(fallback: string): string {
  const storage = browserLocalStorage();
  if (!storage) return fallback;

  const configuredUrl = [BACKEND_BASE_URL_KEY, ...LEGACY_BACKEND_BASE_URL_KEYS]
    .map((key) => storage.getItem(key)?.trim())
    .find((value): value is string => Boolean(value));

  return configuredUrl ?? fallback;
}

export function persistBackendBaseUrl(url: string): void {
  const storage = browserLocalStorage();
  if (!storage) return;

  const normalizedUrl = url.trim();
  storage.setItem(BACKEND_BASE_URL_KEY, normalizedUrl);
  for (const legacyKey of LEGACY_BACKEND_BASE_URL_KEYS) {
    storage.removeItem(legacyKey);
  }
}

export function getSessionAuthToken(): string | null {
  const token = browserSessionStorage()?.getItem(AUTH_TOKEN_KEY)?.trim();
  return token || null;
}

export function persistSessionAuthToken(token: string): void {
  const normalizedToken = token.trim();
  if (!normalizedToken) return;

  browserSessionStorage()?.setItem(AUTH_TOKEN_KEY, normalizedToken);
}
