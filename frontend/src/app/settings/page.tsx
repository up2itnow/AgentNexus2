'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { getBackendBaseUrl, persistBackendBaseUrl, setSessionAuthToken } from '@/lib/api-config';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [backendUrl, setBackendUrl] = useState('');
    const [mounted, setMounted] = useState(false);
    const apiKeyInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        setBackendUrl(getBackendBaseUrl());
        if (apiKeyInputRef.current) {
            apiKeyInputRef.current.value = '';
        }
    }, []);

    const handleSave = () => {
        persistBackendBaseUrl(backendUrl);
        setSessionAuthToken(apiKeyInputRef.current?.value || '');
        alert('Settings saved. API keys are kept in memory only.');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="bg-card p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">API Endpoint</label>
                            <input
                                type="text"
                                value={backendUrl}
                                onChange={(e) => setBackendUrl(e.target.value)}
                                placeholder="https://api.agentnexus.xyz"
                                className="w-full p-2 border rounded bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">API Key</label>
                            <input
                                ref={apiKeyInputRef}
                                type="password"
                                placeholder="sk-..."
                                className="w-full p-2 border rounded bg-background"
                            />
                            <p className="mt-1 text-sm text-muted-foreground">
                                Enter a token to update this tab session. API keys are kept only in memory and must be re-entered after a full page reload.
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">Appearance</h2>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setTheme('light')}
                            className={`px-4 py-2 rounded ${mounted && theme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                        >
                            Light
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={`px-4 py-2 rounded ${mounted && theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                        >
                            Dark
                        </button>
                        <button
                            onClick={() => setTheme('system')}
                            className={`px-4 py-2 rounded ${mounted && theme === 'system' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                        >
                            System
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full bg-primary text-primary-foreground py-2 rounded hover:bg-primary/90 transition-colors"
                >
                    Save Settings
                </button>
            </div>
        </div>
    );
}
