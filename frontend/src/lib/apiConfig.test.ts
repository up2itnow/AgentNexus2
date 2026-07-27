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

  it('migrates a legacy localStorage token into memory and evicts the stored copy', () => {
    window.localStorage.setItem('auth_token', ' legacy-token ');

    expect(getAuthToken()).toBe('legacy-token');
    expect(window.localStorage.getItem('auth_token')).toBeNull();
    expect(getAuthToken()).toBe('legacy-token');
  });

  it('keeps a new auth token in memory and evicts any legacy stored token', () => {
    window.localStorage.setItem('auth_token', 'stale-token');

    persistSessionAuthToken(' session-token ');

    expect(getAuthToken()).toBe('session-token');
    expect(window.localStorage.getItem('auth_token')).toBeNull();
  });

  it('does not clear an existing session token when the token input is blank', () => {
    persistSessionAuthToken('existing-token');
    persistSessionAuthToken('');

    expect(getAuthToken()).toBe('existing-token');
  });

  it('clears both the in-memory token and any legacy stored token', () => {
    persistSessionAuthToken('session-token');
    window.localStorage.setItem('auth_token', 'legacy-token');

    clearSessionAuthToken();

    expect(getAuthToken()).toBeNull();
    expect(window.localStorage.getItem('auth_token')).toBeNull();
  });
});
