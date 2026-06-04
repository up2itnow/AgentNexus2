/// <reference types="jest" />

import { fireEvent, render, screen } from '@testing-library/react';
import { getSessionAuthToken, setSessionAuthToken } from '@/lib/apiSettings';
import { SettingsModal } from './SettingsModal';

describe('SettingsModal', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setSessionAuthToken('');
  });

  it('saves the backend URL where the API client reads it and keeps auth in memory', () => {
    let closed = false;

    render(<SettingsModal isOpen onClose={() => { closed = true; }} />);

    fireEvent.change(screen.getByLabelText('API Endpoint URL'), {
      target: { value: 'https://agentnexus.example.test' },
    });
    fireEvent.change(screen.getByLabelText('API Key / Auth Token'), {
      target: { value: 'session-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(window.localStorage.getItem('api_url')).toBe('https://agentnexus.example.test');
    expect(window.localStorage.getItem('backend_base_url')).toBeNull();
    expect(window.localStorage.getItem('agentnexus_backend_url')).toBeNull();
    expect(window.localStorage.getItem('auth_token')).toBeNull();
    expect(getSessionAuthToken()).toBe('session-token');
    expect(closed).toBe(false);
  });
});
