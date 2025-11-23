/**
 * PurchasesList - User's Purchased Agents
 * 
 * Shows all agents the user has purchased
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatEther } from 'viem';
import { Bot, Calendar, ExternalLink } from 'lucide-react';
import type { Agent } from '@/types/agent';
import { CATEGORY_LABELS } from '@/types/agent';

interface Purchase {
  id: string;
  agent: Agent;
  price: string;
  purchasedAt: string;
  transactionHash: string;
}

interface PurchasesListProps {
  purchases: Purchase[];
}

export function PurchasesList({ purchases }: PurchasesListProps) {
  if (purchases.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
        <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          You haven&apos;t purchased any agents yet.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Browse Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => {
        const priceInEth = formatEther(BigInt(purchase.price));
        const purchaseDate = new Date(purchase.purchasedAt).toLocaleDateString();

        return (
          <div
            key={purchase.id}
            className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
          >
            {/* Agent Icon */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              {purchase.agent.imageUrl ? (
                <Image
                  src={purchase.agent.imageUrl}
                  alt={purchase.agent.name}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                />
              ) : (
                <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>

            {/* Agent Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{purchase.agent.name}</h3>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {CATEGORY_LABELS[purchase.agent.category]}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Purchased {purchaseDate}</span>
                </div>
                <div className="font-medium">{priceInEth} ETH</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link
                href={`/agents/${purchase.agent.id}`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Execute
              </Link>
              <a
                href={`https://basescan.org/tx/${purchase.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

