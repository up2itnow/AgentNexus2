import { useState, useEffect, useRef } from 'react';
import { X, Save, Settings } from 'lucide-react';
import {
  clearSessionAuthToken,
  getApiBaseUrl,
  persistApiBaseUrl,
  persistSessionAuthToken,
} from '@/lib/apiConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [backendUrl, setBackendUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setBackendUrl(getApiBaseUrl());
      if (apiKeyInputRef.current) {
        apiKeyInputRef.current.value = '';
      }
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    persistApiBaseUrl(backendUrl);
    persistSessionAuthToken(apiKeyInputRef.current?.value ?? '');

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleClearToken = () => {
    clearSessionAuthToken();
    if (apiKeyInputRef.current) {
      apiKeyInputRef.current.value = '';
    }
    setSaved(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="apiUrl" className="text-sm font-medium">
              API Endpoint URL
            </label>
            <input
              id="apiUrl"
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://localhost:3001"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              The base URL for the AgentNexus backend API.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              API Key / Auth Token
            </label>
            <input
              id="apiKey"
              ref={apiKeyInputRef}
              type="password"
              placeholder="Enter your API key"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Your authentication token is kept only for this browser session. Leave blank to keep the current session token.
            </p>
            <button
              type="button"
              onClick={handleClearToken}
              className="text-xs text-destructive hover:underline"
            >
              Clear session API key
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {saved ? (
              <>Saved!</>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
