/// <reference types="jest" />

import {
  clearSessionAuthToken,
  getApiBaseUrl,
  getAuthToken,
  persistApiBaseUrl,
  persistSessionAuthToken,
} from './apiConfig';

describe('apiConfig', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSessionAuthToken();
  });

  it('reads backend URLs saved under legacy settings keys', () => {
    window.localStorage.setItem('backend_base_url', 'https://backend.example.com');

    expect(getApiBaseUrl()).toBe('https://backend.example.com');

    window.localStorage.clear();
    window.localStorage.setItem('agentnexus_backend_url', 'https://settings.example.com');

    expect(getApiBaseUrl()).toBe('https://settings.example.com');
  });

  it('persists the backend URL to every key the app has used', () => {
    persistApiBaseUrl(' https://api.example.com ');

    expect(window.localStorage.getItem('api_url')).toBe('https://api.example.com');
    expect(window.localStorage.getItem('backend_base_url')).toBe('https://api.example.com');
    expect(window.localStorage.getItem('agentnexus_backend_url')).toBe('https://api.example.com');
  });

  it('keeps auth tokens in memory and falls back to legacy local storage', () => {
    window.localStorage.setItem('auth_token', 'legacy-token');
    expect(getAuthToken()).toBe('legacy-token');

    persistSessionAuthToken(' session-token ');
    expect(getAuthToken()).toBe('session-token');
  });

  it('does not clear an existing session token when the token input is blank', () => {
    persistSessionAuthToken('existing-token');
    persistSessionAuthToken('');

    expect(getAuthToken()).toBe('existing-token');
  });
});
