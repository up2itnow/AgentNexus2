import {
  clearSessionAuthToken,
  getBackendBaseUrl,
  getSessionAuthToken,
  persistBackendBaseUrl,
  setSessionAuthToken,
} from '../api-config';

describe('api-config', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSessionAuthToken();
  });

  it('falls back to the backend development URL when no URL is configured', () => {
    expect(getBackendBaseUrl()).toBe('http://localhost:8200');
  });

  it('migrates the navbar settings legacy backend URL key', () => {
    localStorage.setItem('backend_base_url', 'https://api.example.com');

    expect(getBackendBaseUrl()).toBe('https://api.example.com');
    expect(localStorage.getItem('agentnexus_backend_url')).toBe('https://api.example.com');
    expect(localStorage.getItem('backend_base_url')).toBeNull();
  });

  it('migrates the API client legacy backend URL key', () => {
    localStorage.setItem('api_url', 'https://legacy.example.com');

    expect(getBackendBaseUrl()).toBe('https://legacy.example.com');
    expect(localStorage.getItem('agentnexus_backend_url')).toBe('https://legacy.example.com');
    expect(localStorage.getItem('api_url')).toBeNull();
  });

  it('persists only the canonical backend URL key', () => {
    localStorage.setItem('backend_base_url', 'https://old.example.com');
    localStorage.setItem('api_url', 'https://older.example.com');

    persistBackendBaseUrl(' https://new.example.com ');

    expect(localStorage.getItem('agentnexus_backend_url')).toBe('https://new.example.com');
    expect(localStorage.getItem('backend_base_url')).toBeNull();
    expect(localStorage.getItem('api_url')).toBeNull();
  });

  it('keeps auth tokens in memory instead of localStorage', () => {
    setSessionAuthToken(' bearer-token ');

    expect(getSessionAuthToken()).toBe('bearer-token');
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});

