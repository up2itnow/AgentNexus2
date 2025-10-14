/**
 * AgentGrid - Main Marketplace Grid Display
 * 
 * Displays agents in a responsive grid with loading and empty states
 */

'use client';

import { AgentCard } from './AgentCard';
import { Bot, Loader2 } from 'lucide-react';
import type { Agent } from '@/types/agent';

interface AgentGridProps {
  agents: Agent[];
  isLoading?: boolean;
  isError?: boolean;
}

export function AgentGrid({ agents, isLoading, isError }: AgentGridProps) {
  // Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <Bot className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Failed to Load Agents</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            There was an error loading the marketplace. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (!agents || agents.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No Agents Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
        </div>
      </div>
    );
  }

  // Grid Display
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}

