'use client';

/**
 * Agent Zero Instance Dashboard
 * Management interface for Pro tier persistent instances
 */

import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import {
  Play,
  Square,
  Trash2,
  ExternalLink,
  Activity,
  HardDrive,
  Cpu,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { agentZeroAPI, InstanceStatus, AgentZeroStatus } from '@/lib/api/agentZero';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function AgentZeroInstancePage() {
  // const router = useRouter();
  const [instance, setInstance] = useState<InstanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Get user ID from wallet connection
  const { address: userId } = useAccount();

  useEffect(() => {
    if (userId) {
      loadInstanceStatus();
      // Refresh every 30 seconds
      const interval = setInterval(loadInstanceStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  async function loadInstanceStatus() {
    try {
      if (!userId) return;
      const status = await agentZeroAPI.getInstanceStatus(userId);
      setInstance(status);
      setError('');
    } catch (err) {
      // No instance found
      setInstance(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateInstance() {
    setActionLoading(true);
    setError('');

    try {
      if (!userId) throw new Error('User not connected');
      await agentZeroAPI.createInstance(userId);
      await loadInstanceStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create instance');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStartInstance() {
    setActionLoading(true);
    setError('');

    try {
      if (!userId) throw new Error('User not connected');
      await agentZeroAPI.startInstance(userId);
      await loadInstanceStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start instance');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStopInstance() {
    setActionLoading(true);
    setError('');

    try {
      if (!userId) throw new Error('User not connected');
      await agentZeroAPI.stopInstance(userId);
      await loadInstanceStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop instance');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteInstance() {
    if (!confirm('Are you sure you want to delete your instance? All data will be lost.')) {
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      if (!userId) throw new Error('User not connected');
      await agentZeroAPI.deleteInstance(userId);
      setInstance(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete instance');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading instance...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-6 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-full">
            <Sparkles className="w-12 h-12 text-purple-500" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connect Your Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Please connect your wallet to manage your Agent Zero instance.
            </p>
          </div>
          <ConnectButton />
        </div>
      </div>
    );
  }

  // No instance exists
  if (!instance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              No Agent Zero Instance
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Create your first persistent Agent Zero instance to get started
            </p>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-900 dark:text-red-100">{error}</p>
              </div>
            )}

            <button
              onClick={handleCreateInstance}
              disabled={actionLoading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all inline-flex items-center gap-2"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Instance...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Create Instance
                </>
              )}
            </button>

            <div className="mt-12 p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                What you&apos;ll get:
              </h3>
              <ul className="text-left space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Dedicated Agent Zero container with full WebUI
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Persistent memory and conversation history
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Unlimited executions and 30-minute timeout
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    All tools, subordinate agents, and MCP servers
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Instance exists
  const isRunning = instance.status === AgentZeroStatus.RUNNING;
  const isStopped = instance.status === AgentZeroStatus.STOPPED;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-purple-500" />
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Agent Zero Instance
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Pro Tier - Persistent Instance
              </p>
            </div>

            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 ${isRunning
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
              <Activity className={`w-4 h-4 ${isRunning ? 'animate-pulse' : ''}`} />
              {instance.status}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-900 dark:text-red-100">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* WebUI Access Card */}
            {isRunning && instance.tunnelUrl && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Access Your Agent Zero
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your instance is running! Click below to open the full Agent Zero WebUI.
                </p>
                <a
                  href={instance.tunnelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open Agent Zero WebUI
                </a>
              </div>
            )}

            {/* Control Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Instance Controls
              </h2>

              <div className="flex flex-wrap gap-4">
                {isStopped && (
                  <button
                    onClick={handleStartInstance}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                    Start
                  </button>
                )}

                {isRunning && (
                  <button
                    onClick={handleStopInstance}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    Stop
                  </button>
                )}

                <button
                  onClick={handleDeleteInstance}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  Delete
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Usage Statistics
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Executions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {instance.totalExecutions}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Accessed</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(instance.lastAccessedAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(instance.lastAccessedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resource Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Resource Usage
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        CPU
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {instance.resourceUsage.cpu || 'N/A'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Memory
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {instance.resourceUsage.memory}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Storage
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {(instance.resourceUsage.storage / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instance Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Instance Info
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Instance ID</p>
                  <p className="font-mono text-gray-900 dark:text-white text-xs">
                    {instance.instanceId}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 dark:text-gray-400">Tier</p>
                  <p className="font-semibold text-purple-600 dark:text-purple-400">
                    {instance.tier}
                  </p>
                </div>

                {instance.expiresAt && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Expires</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(instance.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

