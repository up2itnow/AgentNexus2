/**
 * AgentCard - Individual Agent Display Card
 * 
 * Shows agent preview with name, description, price, and stats
 */

'use client';

import Link from 'next/link';
import { Bot, TrendingUp, Zap } from 'lucide-react';
import type { Agent } from '@/types/agent';
import { CATEGORY_LABELS } from '@/types/agent';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  // Convert price to ETH display format
  // Price from API is a number/string in USD, not wei
  const priceDisplay = typeof agent.price === 'number' 
    ? agent.price.toFixed(2)
    : parseFloat(agent.price).toFixed(2);

  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group block rounded-lg border bg-card p-6 transition-all hover:border-blue-500 hover:shadow-lg"
    >
      {/* Agent Icon/Image */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
          {agent.imageUrl ? (
            <img
              src={agent.imageUrl}
              alt={agent.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        
        {/* Category Badge */}
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {CATEGORY_LABELS[agent.category]}
        </span>
      </div>

      {/* Agent Name */}
      <h3 className="mb-2 text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {agent.name}
      </h3>

      {/* Description */}
      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
        {agent.description}
      </p>

      {/* Stats Row */}
      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
        {agent.purchaseCount !== undefined && (
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>{agent.purchaseCount} purchases</span>
          </div>
        )}
        {agent.executionCount !== undefined && (
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>{agent.executionCount} runs</span>
          </div>
        )}
      </div>

      {/* Price and CTA */}
      <div className="flex items-center justify-between border-t pt-4">
        <div>
          <div className="text-xs text-muted-foreground">Price</div>
          <div className="text-lg font-bold">
            ${priceDisplay}
          </div>
        </div>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
          View Details
        </button>
      </div>
    </Link>
  );
}

