'use client';

/**
 * Agent Zero Marketplace Page
 * Marketing and onboarding page for Agent Zero integration
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TierComparison from '@/components/agentZero/TierComparison';
import {
  Bot,
  Zap,
  Shield,
  Code,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2
} from 'lucide-react';
import { agentZeroAPI, AgentZeroTier } from '@/lib/api/agentZero';
import { useAccount } from 'wagmi';

export default function AgentZeroMarketplacePage() {
  const router = useRouter();
  const [currentTier, setCurrentTier] = useState<AgentZeroTier | null>(null);
  const [loading, setLoading] = useState(true);

  // Get user ID from wallet connection
  const { address: userId } = useAccount();

  useEffect(() => {
    if (userId) {
      loadUserTier();
    } else {
      setLoading(false);
    }
  }, [userId]);

  async function loadUserTier() {
    try {
      if (!userId) return;
      const tierInfo = await agentZeroAPI.getUserTier(userId);
      setCurrentTier(tierInfo.tier);
    } catch (error) {
      console.error('Error loading tier:', error);
      // Default to no tier (new user)
      setCurrentTier(null);
    } finally {
      setLoading(false);
    }
  }

  function handleTryBasic() {
    router.push('/agent-zero/execute');
  }

  function handleUpgradePro() {
    router.push('/agent-zero/upgrade');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Premium AI Agent Integration
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Meet{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                Agent Zero
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              The most powerful autonomous AI agent, now available on AgentNexus.
              Deploy tasks, get results, and let Agent Zero handle the complexity.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleTryBasic}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Try Free Now
              </button>

              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                Learn More
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
              <div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">12k+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">GitHub Stars</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">100%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Open Source</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Autonomous</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Agent Zero?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              The most advanced autonomous agent with real-world capabilities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Bot className="w-8 h-8" />}
              title="Truly Autonomous"
              description="Agent Zero can plan, execute, and iterate on complex tasks without constant supervision."
            />

            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Tool Integration"
              description="Access to terminal, code execution, web browsing, and file operations out of the box."
            />

            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" />}
              title="Conversational Interface"
              description="Natural language interaction with context-aware responses and memory."
            />

            <FeatureCard
              icon={<Code className="w-8 h-8" />}
              title="Code Generation"
              description="Generate, execute, and debug code in multiple programming languages."
            />

            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Secure Execution"
              description="Sandboxed Docker containers ensure security and isolation."
            />

            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Subordinate Agents"
              description="Pro tier: Deploy multiple specialized agents working together."
            />
          </div>
        </div>
      </section>

      {/* Tier Comparison Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <TierComparison
          onSelectBasic={handleTryBasic}
          onSelectPro={handleUpgradePro}
          currentTier={currentTier || undefined}
        />
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Can Agent Zero Do?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              From simple tasks to complex workflows
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <UseCaseCard
              title="Research & Analysis"
              description="Gather information, analyze data, and summarize recent AI papers about CoT prompting"
              example="Gather and summarize five recent AI papers about CoT prompting"
            />

            <UseCaseCard
              title="Code Development"
              description="Create full applications, debug issues, and optimize performance"
              example="Create a web server monitoring system with alerts"
            />

            <UseCaseCard
              title="Data Processing"
              description="Clean, transform, and analyze large datasets automatically"
              example="Process sales data and generate quarterly reports"
            />

            <UseCaseCard
              title="System Administration"
              description="Automate DevOps tasks, manage servers, and handle deployments"
              example="Deploy application to production and configure monitoring"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Try Agent Zero free today, no credit card required
          </p>

          <button
            onClick={handleTryBasic}
            className="px-8 py-4 bg-white text-purple-600 hover:bg-gray-100 rounded-lg font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all inline-flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Free Trial
          </button>
        </div>
      </section>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="text-purple-600 dark:text-purple-400 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

// Use Case Card Component
function UseCaseCard({ title, description, example }: { title: string; description: string; example: string }) {
  return (
    <div className="p-8 rounded-xl bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
      <div className="flex items-start gap-3 mb-4">
        <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-mono text-purple-600 dark:text-purple-400">&quot;{example}&quot;</p>
          </div>
        </div>
      </div>
    </div>
  );
}

