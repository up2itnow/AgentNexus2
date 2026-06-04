/// <reference types="jest" />

import {
  getApiBaseUrl,
  getSessionAuthToken,
  getStoredApiBaseUrl,
  saveApiBaseUrl,
  setSessionAuthToken,
} from './apiSettings';

describe('apiSettings', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    window.localStorage.clear();
    setSessionAuthToken('');
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterAll(() => {
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it('uses the saved API URL key read by the request client', () => {
    saveApiBaseUrl(' https://api.example.test ');

    expect(window.localStorage.getItem('api_url')).toBe('https://api.example.test');
    expect(getStoredApiBaseUrl()).toBe('https://api.example.test');
    expect(getApiBaseUrl()).toBe('https://api.example.test');
  });

  it('migrates legacy settings keys into the active API URL key', () => {
    window.localStorage.setItem('backend_base_url', 'https://legacy.example.test');

    expect(getApiBaseUrl()).toBe('https://legacy.example.test');
    expect(window.localStorage.getItem('api_url')).toBe('https://legacy.example.test');
    expect(window.localStorage.getItem('backend_base_url')).toBeNull();
    expect(window.localStorage.getItem('agentnexus_backend_url')).toBeNull();
  });

  it('keeps auth tokens in memory only', () => {
    setSessionAuthToken(' user-session-token ');

    expect(getSessionAuthToken()).toBe('user-session-token');
    expect(window.localStorage.getItem('auth_token')).toBeNull();
  });
});
