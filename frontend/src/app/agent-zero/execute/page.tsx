'use client';

/**
 * Agent Zero Quick Execution Page
 * Interface for Basic tier quick executions
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Clock,
  Zap,
  ArrowRight
} from 'lucide-react';
import { agentZeroAPI, RateLimitInfo } from '@/lib/api/agentZero';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function AgentZeroExecutePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);

  // Get user ID from wallet connection
  const { address: userId } = useAccount();

  useEffect(() => {
    if (userId) {
      loadRateLimit();
    }
  }, [userId]);

  async function loadRateLimit() {
    try {
      if (!userId) return;
      const limit = await agentZeroAPI.checkRateLimit(userId);
      setRateLimit(limit);
    } catch (error) {
      console.error('Error loading rate limit:', error);
    }
  }

  async function handleExecute(e: React.FormEvent) {
    e.preventDefault();

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (rateLimit && rateLimit.remaining <= 0) {
      setError('Daily rate limit exceeded. Upgrade to Pro for unlimited executions.');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');
    setExecutionTime(null);

    try {
      if (!userId) throw new Error('User not connected');

      const result = await agentZeroAPI.execute({
        userId,
        prompt: prompt.trim(),
      });

      setResponse(result.response || 'No response received');
      setExecutionTime(result.executionTime || null);

      // Refresh rate limit
      await loadRateLimit();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute Agent Zero');
    } finally {
      setLoading(false);
    }
  }

  function handleUpgrade() {
    router.push('/agent-zero/upgrade');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Agent Zero Quick Execute
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Basic Tier - Try Agent Zero with simple tasks
          </p>
        </div>

        {/* Wallet Connection Check */}
        {!userId ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
              Please connect your wallet to access Agent Zero&apos;s quick execution features.
            </p>
            <ConnectButton />
          </div>
        ) : (
          <>
            {/* Rate Limit Banner */}
            {rateLimit && (
              <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${rateLimit.remaining > 3
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                }`}>
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 ${rateLimit.remaining > 3 ? 'text-blue-600' : 'text-orange-600'
                    }`} />
                  <div>
                    <p className={`font-semibold ${rateLimit.remaining > 3 ? 'text-blue-900 dark:text-blue-100' : 'text-orange-900 dark:text-orange-100'
                      }`}>
                      {rateLimit.remaining} / {rateLimit.limit} executions remaining today
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Resets {new Date(rateLimit.resetAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleUpgrade}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade to Pro
                </button>
              </div>
            )}

            {/* Upgrade Upsell (when rate limit low) */}
            {rateLimit && rateLimit.remaining === 0 && (
              <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-4">
                  <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Out of executions? Upgrade to Pro!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Get unlimited executions, persistent memory, full WebUI, and more for just $50/month.
                    </p>
                    <button
                      onClick={handleUpgrade}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                    >
                      View Pro Features
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Execution Interface */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Prompt Input */}
              <form onSubmit={handleExecute} className="p-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  What would you like Agent Zero to do?
                </label>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Research the top 3 AI developments this week and summarize them..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                  disabled={loading || (rateLimit?.remaining === 0)}
                />

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Timeout: 5 minutes | Tools: Basic only
                  </p>

                  <button
                    type="submit"
                    disabled={loading || !prompt.trim() || (rateLimit?.remaining === 0)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Execute
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Results Section */}
              {(response || error) && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
                  {error && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900 dark:text-red-100">Error</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                      </div>
                    </div>
                  )}

                  {response && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">Response</h3>
                        {executionTime && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ({(executionTime / 1000).toFixed(2)}s)
                          </span>
                        )}
                      </div>

                      <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white font-mono">
                          {response}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="mt-8 p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">💡 Tips for Better Results</h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>• Be specific about what you want Agent Zero to accomplish</li>
                <li>• Break complex tasks into smaller steps</li>
                <li>• Provide context when asking for research or analysis</li>
                <li>• Upgrade to Pro for longer tasks and persistent conversations</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
