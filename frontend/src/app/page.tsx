/**
 * AgentNexus Homepage - Marketplace
 * 
 * Main marketplace page with agent browsing, search, and filtering
 */

'use client';

import { useState } from 'react';
import { CategoryNav } from '@/components/agents/CategoryNav';
import { AgentFiltersBar } from '@/components/agents/AgentFilters';
import { AgentGrid } from '@/components/agents/AgentGrid';
import { FeaturedAgents } from '@/components/agents/FeaturedAgents';
import { useAgents } from '@/hooks/useAgents';
import type { AgentFilters } from '@/types/agent';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [filters, setFilters] = useState<AgentFilters>({
    sortBy: 'newest',
  });

  const { agents, isLoading, isError, total } = useAgents(filters);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold">AI Agent Marketplace</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Discover, purchase, and execute AI agents on Base L2
        </p>
        {!isLoading && total > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            {total} agent{total !== 1 ? 's' : ''} available
          </p>
        )}
      </div>

      {/* Featured Agents */}
      <div className="mb-12">
        <FeaturedAgents />
      </div>

      {/* Category Navigation */}
      <div className="mb-6">
        <CategoryNav
          selectedCategory={filters.category}
          onCategorySelect={(category) =>
            setFilters({ ...filters, category })
          }
        />
      </div>

      {/* Filters */}
      <div className="mb-8">
        <AgentFiltersBar filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Agent Grid */}
      <AgentGrid agents={agents} isLoading={isLoading} isError={isError} />
    </main>
  );
}

