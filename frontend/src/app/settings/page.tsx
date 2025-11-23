'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [apiKey, setApiKey] = useState('');
    const [apiEndpoint, setApiEndpoint] = useState('');

    useEffect(() => {
        const storedKey = localStorage.getItem('agentnexus_api_key');
        const storedEndpoint = localStorage.getItem('agentnexus_api_endpoint');
        if (storedKey) setApiKey(storedKey);
        if (storedEndpoint) setApiEndpoint(storedEndpoint);
    }, []);

    const handleSave = () => {
        localStorage.setItem('agentnexus_api_key', apiKey);
        localStorage.setItem('agentnexus_api_endpoint', apiEndpoint);
        alert('Settings saved!');
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
                                value={apiEndpoint}
                                onChange={(e) => setApiEndpoint(e.target.value)}
                                placeholder="https://api.agentnexus.xyz"
                                className="w-full p-2 border rounded bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">API Key</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full p-2 border rounded bg-background"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">Appearance</h2>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setTheme('light')}
                            className={`px-4 py-2 rounded ${theme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                        >
                            Light
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={`px-4 py-2 rounded ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                        >
                            Dark
                        </button>
                        <button
                            onClick={() => setTheme('system')}
                            className={`px-4 py-2 rounded ${theme === 'system' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
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
