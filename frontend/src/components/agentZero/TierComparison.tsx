'use client';

/**
 * Agent Zero Tier Comparison Component
 * Displays feature comparison between Basic and Pro tiers
 */

import React from 'react';
import { Check, X, Sparkles, Zap } from 'lucide-react';

interface TierComparisonProps {
  onSelectBasic?: () => void;
  onSelectPro?: () => void;
  currentTier?: 'BASIC' | 'PRO';
}

const TierComparison: React.FC<TierComparisonProps> = ({
  onSelectBasic,
  onSelectPro,
  currentTier,
}) => {
  const basicFeatures = [
    { name: 'Quick executions', included: true },
    { name: '10 executions per day', included: true },
    { name: '5-minute timeout', included: true },
    { name: 'Basic tools only', included: true },
    { name: 'Persistent memory', included: false },
    { name: 'Full Agent Zero WebUI', included: false },
    { name: 'Subordinate agents', included: false },
    { name: 'MCP server integrations', included: false },
    { name: 'Unlimited executions', included: false },
    { name: 'Priority support', included: false },
  ];

  const proFeatures = [
    { name: 'Dedicated Agent Zero instance', included: true },
    { name: 'Unlimited executions', included: true },
    { name: '30-minute timeout', included: true },
    { name: 'All tools & capabilities', included: true },
    { name: 'Persistent memory & sessions', included: true },
    { name: 'Full Agent Zero WebUI', included: true },
    { name: 'Subordinate agents', included: true },
    { name: 'MCP server integrations', included: true },
    { name: 'Advanced features', included: true },
    { name: 'Priority support', included: true },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Agent Zero Tier
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Start free with Basic, upgrade to Pro for unlimited power
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Basic Tier */}
        <div
          className={`relative rounded-2xl border-2 p-8 transition-all ${
            currentTier === 'BASIC'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          {currentTier === 'BASIC' && (
            <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              CURRENT
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-blue-500" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Basic
            </h3>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">
                Free
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Perfect for trying out Agent Zero
            </p>
          </div>

          <ul className="space-y-4 mb-8">
            {basicFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                {feature.included ? (
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                )}
                <span
                  className={`text-sm ${
                    feature.included
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>

          {onSelectBasic && currentTier !== 'BASIC' && (
            <button
              onClick={onSelectBasic}
              className="w-full py-3 px-6 rounded-lg font-semibold transition-colors
                       bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                       text-gray-900 dark:text-white"
            >
              Try Free
            </button>
          )}

          {currentTier === 'BASIC' && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-3">
              You're on this plan
            </div>
          )}
        </div>

        {/* Pro Tier */}
        <div
          className={`relative rounded-2xl border-2 p-8 transition-all ${
            currentTier === 'PRO'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:border-purple-400 dark:hover:border-purple-600'
          }`}
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
              RECOMMENDED
            </span>
          </div>

          {currentTier === 'PRO' && (
            <div className="absolute top-4 right-4 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              CURRENT
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pro
            </h3>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">
                $50
              </span>
              <span className="text-gray-600 dark:text-gray-400">/month</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Unlimited power for serious users
            </p>
          </div>

          <ul className="space-y-4 mb-8">
            {proFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-900 dark:text-white font-medium">
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>

          {onSelectPro && currentTier !== 'PRO' && (
            <button
              onClick={onSelectPro}
              className="w-full py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-105
                       bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700
                       text-white shadow-lg hover:shadow-xl"
            >
              Upgrade to Pro
            </button>
          )}

          {currentTier === 'PRO' && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-3">
              You're on this plan
            </div>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          All plans include access to the AgentNexus marketplace and community
        </p>
      </div>
    </div>
  );
};

export default TierComparison;

