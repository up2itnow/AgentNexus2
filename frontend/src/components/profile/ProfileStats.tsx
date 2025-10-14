/**
 * ProfileStats - User Statistics Dashboard
 * 
 * Shows purchase count, execution count, and total spent
 */

'use client';

import { ShoppingBag, Zap, DollarSign, TrendingUp } from 'lucide-react';
import { formatEther } from 'viem';

interface ProfileStatsProps {
  stats: {
    totalPurchases: number;
    totalExecutions: number;
    totalSpent: string;
    successRate: number;
  };
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const totalSpentEth = formatEther(BigInt(stats.totalSpent || '0'));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Purchases */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShoppingBag className="h-4 w-4" />
          <span className="text-xs font-medium">Agents Owned</span>
        </div>
        <div className="mt-2 text-3xl font-bold">{stats.totalPurchases}</div>
      </div>

      {/* Total Executions */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Zap className="h-4 w-4" />
          <span className="text-xs font-medium">Total Executions</span>
        </div>
        <div className="mt-2 text-3xl font-bold">{stats.totalExecutions}</div>
      </div>

      {/* Total Spent */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          <span className="text-xs font-medium">Total Spent</span>
        </div>
        <div className="mt-2 text-3xl font-bold">{totalSpentEth} ETH</div>
      </div>

      {/* Success Rate */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-medium">Success Rate</span>
        </div>
        <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
          {stats.successRate}%
        </div>
      </div>
    </div>
  );
}

