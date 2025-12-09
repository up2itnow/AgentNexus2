/**
 * AgentCard - Individual Agent Display Card
 * 
 * Shows agent preview with name, description, price, and stats
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bot, TrendingUp, Zap } from 'lucide-react';
import { formatEther } from 'viem';
import type { Agent } from '@/types/agent';
import { CATEGORY_LABELS } from '@/types/agent';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  // Convert price to ETH display format
  // Price from API might be in Wei (large integer) or ETH (decimal string)
  // Handle both formats gracefully
  const priceDisplay = (() => {
    const priceStr = String(agent.price);
    // If it contains a decimal or is a small number, assume it's already in ETH
    if (priceStr.includes('.') || (parseFloat(priceStr) < 1000 && parseFloat(priceStr) > 0)) {
      return parseFloat(priceStr).toFixed(3);
    }
    // Otherwise, assume it's in Wei and convert
    try {
      return formatEther(BigInt(priceStr));
    } catch {
      return priceStr; // Fallback to original string
    }
  })();

  return (
    <Link
      href={`/agents/${agent.id}`}
      data-testid="agent-card"
      className="group relative block overflow-hidden rounded-xl border border-white/10 bg-background/40 p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative z-10">
        {/* Agent Icon/Image */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all group-hover:scale-110 group-hover:bg-primary/20">
            {agent.imageUrl ? (
              <Image
                src={agent.imageUrl}
                alt={agent.name}
                width={48}
                height={48}
                className="rounded-xl object-cover"
              />
            ) : (
              <Bot className="h-6 w-6" />
            )}
          </div>

          {/* Category Badge */}
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent ring-1 ring-accent/20" data-testid="agent-category">
            {CATEGORY_LABELS[agent.category]}
          </span>
        </div>

        {/* Agent Name */}
        <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary" data-testid="agent-name">
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
              <TrendingUp className="h-3 w-3 text-accent" />
              <span>{agent.purchaseCount} purchases</span>
            </div>
          )}
          {agent.executionCount !== undefined && (
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span>{agent.executionCount} runs</span>
            </div>
          )}
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="text-lg font-bold text-foreground" data-testid="agent-price">
              {priceDisplay} ETH
            </div>
          </div>
          <span className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/40 hover:scale-105 active:scale-95">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}
