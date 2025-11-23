/**
 * AgentDetail - Full Agent Information Display
 * 
 * Shows complete agent details with purchase flow
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  User,
  Calendar,
  TrendingUp,
  Zap,
  FileText,
  Shield,
  CheckCircle,
  Info,
  Play
} from 'lucide-react';
import Image from 'next/image';
import type { Agent } from '@/types/agent';
import { CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from '@/types/agent';
import { PurchaseButton } from './PurchaseButton';
import { ExecutionInterface } from '../execution/ExecutionInterface';

interface AgentDetailProps {
  agent: Agent;
}

type Tab = 'overview' | 'execute';

export function AgentDetail({ agent }: AgentDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const createdDate = new Date(agent.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2">
          {/* Agent Header */}
          <div className="mb-6 flex items-start gap-6">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900">
              {agent.imageUrl ? (
                <Image
                  src={agent.imageUrl}
                  alt={agent.name}
                  width={80}
                  height={80}
                  className="rounded-xl object-cover"
                />
              ) : (
                <Bot className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-3xl font-bold">{agent.name}</h1>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {CATEGORY_LABELS[agent.category]}
                </span>
              </div>
              <p className="text-lg text-muted-foreground">
                {agent.description}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Purchases</span>
              </div>
              <div className="mt-1 text-2xl font-bold">
                {agent.purchaseCount || 0}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span className="text-xs">Executions</span>
              </div>
              <div className="mt-1 text-2xl font-bold">
                {agent.executionCount || 0}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Version</span>
              </div>
              <div className="mt-1 text-2xl font-bold">
                {agent.version}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="text-xs">Status</span>
              </div>
              <div className="mt-1 text-sm font-bold text-green-600 dark:text-green-400">
                {agent.status}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Info className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('execute')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${activeTab === 'execute'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Play className="h-4 w-4" />
              Execute
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' ? (
            <>
              {/* About Section */}
              <div className="mb-8 rounded-lg border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <FileText className="h-5 w-5" />
                  About This Agent
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>{agent.description}</p>
                  <div className="rounded-lg bg-secondary p-4">
                    <h3 className="mb-2 font-semibold text-foreground">
                      Category: {CATEGORY_LABELS[agent.category]}
                    </h3>
                    <p className="text-sm">
                      {CATEGORY_DESCRIPTIONS[agent.category]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="mb-8 rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-xl font-bold">Features</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-medium">Unlimited Executions</h3>
                      <p className="text-sm text-muted-foreground">
                        Run as many times as you need
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-medium">Isolated Execution</h3>
                      <p className="text-sm text-muted-foreground">
                        Runs in secure Docker containers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-medium">Smart Contract Escrow</h3>
                      <p className="text-sm text-muted-foreground">
                        Your funds are protected on Base L2
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-medium">ERC-1155 Access Token</h3>
                      <p className="text-sm text-muted-foreground">
                        Permanent access via NFT
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Creator Info */}
              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <User className="h-5 w-5" />
                  Creator
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-mono text-sm text-muted-foreground">
                      {agent.creatorAddress.slice(0, 6)}...{agent.creatorAddress.slice(-4)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Published on {createdDate}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Execute Tab */
            <ExecutionInterface agent={agent} />
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <PurchaseButton agent={agent} />
          </div>
        </div>
      </div>
    </div>
  );
}

