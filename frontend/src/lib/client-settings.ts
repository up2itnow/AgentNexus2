const BACKEND_URL_KEYS = [
  'backend_base_url',
  'agentnexus_backend_url',
  'api_url',
  'agentnexus_api_endpoint',
];

const DEFAULT_BACKEND_URL = 'http://localhost:3001';

let authToken = '';

function envBackendUrl() {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_BACKEND_URL;
}

export function getBackendBaseUrl() {
  if (typeof window === 'undefined') {
    return envBackendUrl();
  }

  for (const key of BACKEND_URL_KEYS) {
    const value = window.localStorage.getItem(key)?.trim();
    if (value) return value;
  }

  return envBackendUrl();
}

export function persistBackendBaseUrl(url: string) {
  if (typeof window === 'undefined') return;

  const normalizedUrl = url.trim();
  for (const key of BACKEND_URL_KEYS) {
    if (normalizedUrl) {
      window.localStorage.setItem(key, normalizedUrl);
    } else {
      window.localStorage.removeItem(key);
    }
  }
}

export function setAuthTokenForSession(token: string) {
  authToken = token.trim();
}

export function getAuthTokenForSession() {
  return authToken;
}

