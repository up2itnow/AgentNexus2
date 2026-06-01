import {
  getBackendBaseUrl,
  getSessionAuthToken,
  persistBackendBaseUrl,
  persistSessionAuthToken,
} from './settings-storage';

describe('settings storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('reads the canonical backend URL before environment fallback', () => {
    window.localStorage.setItem('backend_base_url', 'https://api.example.test');

    expect(getBackendBaseUrl('http://localhost:3001')).toBe('https://api.example.test');
  });

  it('falls back to legacy backend URL keys during migration', () => {
    window.localStorage.setItem('agentnexus_backend_url', 'https://legacy.example.test');

    expect(getBackendBaseUrl('http://localhost:3001')).toBe('https://legacy.example.test');
  });

  it('persists backend URLs to the key used by the API client', () => {
    window.localStorage.setItem('api_url', 'https://old.example.test');
    window.localStorage.setItem('agentnexus_backend_url', 'https://old-page.example.test');

    persistBackendBaseUrl(' https://new.example.test ');

    expect(window.localStorage.getItem('backend_base_url')).toBe('https://new.example.test');
    expect(window.localStorage.getItem('api_url')).toBeNull();
    expect(window.localStorage.getItem('agentnexus_backend_url')).toBeNull();
  });

  it('stores auth tokens in session storage for API requests', () => {
    persistSessionAuthToken(' token-123 ');

    expect(getSessionAuthToken()).toBe('token-123');
    expect(window.localStorage.getItem('auth_token')).toBeNull();
  });

  it('keeps the current session token when the token field is left blank', () => {
    persistSessionAuthToken('token-123');
    persistSessionAuthToken('');

    expect(getSessionAuthToken()).toBe('token-123');
  });
});
