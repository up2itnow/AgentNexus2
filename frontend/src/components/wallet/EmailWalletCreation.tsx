'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface EmailWalletCreationProps {
  onWalletCreated?: (walletAddress: string) => void;
  className?: string;
}

export default function EmailWalletCreation({ onWalletCreated, className = '' }: EmailWalletCreationProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate deterministic salt from email
      const salt = generateSaltFromEmail(email);

      // Call wallet creation API (this would integrate with the deployed account factory)
      const response = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          salt,
          chainId: 8453, // Base mainnet
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create wallet');
      }

      const data = await response.json();

      setWalletAddress(data.walletAddress);
      setSuccess(true);

      // Call the callback if provided
      if (onWalletCreated) {
        onWalletCreated(data.walletAddress);
      }

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Wallet creation error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSaltFromEmail = (email: string): string => {
    // Create a deterministic salt from email for reproducible wallet addresses
    // In production, this would be done server-side for security
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  };

  const resetForm = () => {
    setEmail('');
    setError(null);
    setSuccess(false);
    setWalletAddress(null);
  };

  if (success && walletAddress) {
    return (
      <div className={`max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg border ${className}`}>
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Created Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your smart wallet has been created and funded for gas-free transactions.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-500 mb-2">Wallet Address:</p>
            <p className="font-mono text-sm text-gray-800 break-all">{walletAddress}</p>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Redirecting to dashboard...
          </p>

          <button
            onClick={resetForm}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Create Another Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg border ${className}`}>
      <div className="text-center mb-8">
        <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Smart Wallet</h2>
        <p className="text-gray-600">
          Enter your email to create a gas-free smart wallet. No seed phrases or private keys needed!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating Wallet...
            </>
          ) : (
            <>
              Create Smart Wallet
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
          <div className="flex flex-col items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mb-1" />
            <span>Gas-Free</span>
          </div>
          <div className="flex flex-col items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mb-1" />
            <span>No Seed Phrases</span>
          </div>
          <div className="flex flex-col items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mb-1" />
            <span>Multi-Device</span>
          </div>
        </div>
      </div>
    </div>
  );
}
