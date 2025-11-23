/**
 * ProfileDashboard - Main Profile Page
 * 
 * Complete user dashboard with stats, purchases, and executions
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { User, ShoppingBag, History, Loader2, Hammer } from 'lucide-react';
import { profileAPI, builderAPI, swrKeys } from '@/lib/api';
import { ProfileStats } from './ProfileStats';
import { PurchasesList } from './PurchasesList';
import { ExecutionHistory } from './ExecutionHistory';
import { AgentGrid } from '@/components/agents/AgentGrid';

interface ProfileDashboardProps {
  address: string;
}

type Tab = 'purchases' | 'executions' | 'created';

export function ProfileDashboard({ address }: ProfileDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('purchases');

  // Fetch user data (using address as userId for now)
  const userId = address.toLowerCase();

  const { data: stats, isLoading: statsLoading } = useSWR(
    swrKeys.userStats(userId),
    () => profileAPI.getStats(userId)
  );

  const { data: purchases, isLoading: purchasesLoading } = useSWR(
    swrKeys.userPurchases(userId),
    () => profileAPI.getPurchases(userId)
  );

  const { data: executions, isLoading: executionsLoading } = useSWR(
    swrKeys.userExecutions(userId),
    () => profileAPI.getExecutions(userId)
  );

  const { data: createdAgents, isLoading: createdLoading } = useSWR(
    swrKeys.myCustomAgents(userId),
    () => builderAPI.getMyAgents(userId)
  );

  const isLoading = statsLoading || purchasesLoading || executionsLoading || createdLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="font-mono text-sm text-muted-foreground">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="mb-8 flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : stats ? (
        <div className="mb-8">
          <ProfileStats stats={stats} />
        </div>
      ) : null}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'purchases'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Purchased ({purchases?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('executions')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'executions'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <History className="h-4 w-4" />
          History ({executions?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('created')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'created'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Hammer className="h-4 w-4" />
          Created ({createdAgents?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'purchases' && (
          purchasesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <PurchasesList purchases={purchases || []} />
          )
        )}

        {activeTab === 'executions' && (
          executionsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <ExecutionHistory executions={executions || []} />
          )
        )}

        {activeTab === 'created' && (
          createdLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <AgentGrid agents={createdAgents || []} />
          )
        )}
      </div>
    </div>
  );
}

