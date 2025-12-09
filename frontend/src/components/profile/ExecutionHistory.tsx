/**
 * ExecutionHistory - User's Execution History
 * 
 * Shows recent agent executions with status
 */

'use client';

import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Loader2, Calendar } from 'lucide-react';
import type { Execution } from '@/types/execution';
import type { Agent } from '@/types/agent';

interface ExecutionWithAgent extends Execution {
  agent: Agent;
}

interface ExecutionHistoryProps {
  executions: ExecutionWithAgent[];
}

const STATUS_CONFIG = {
  PENDING: { icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', label: 'Pending' },
  RUNNING: { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', label: 'Running' },
  COMPLETED: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', label: 'Completed' },
  FAILED: { icon: XCircle, color: 'text-red-600 dark:text-red-400', label: 'Failed' },
  CANCELLED: { icon: XCircle, color: 'text-gray-600 dark:text-gray-400', label: 'Cancelled' },
};

export function ExecutionHistory({ executions }: ExecutionHistoryProps) {
  if (executions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center" data-testid="empty-history">
        <Loader2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          No executions yet. Purchase an agent and start executing!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {executions.map((execution) => {
        const config = STATUS_CONFIG[execution.status];
        const Icon = config.icon;
        const executionDate = new Date(execution.createdAt).toLocaleString();
        const duration = execution.duration ? `${execution.duration}ms` : 'N/A';

        return (
          <div
            key={execution.id}
            className="flex items-center gap-4 rounded-lg border bg-card p-4"
          >
            {/* Status Icon */}
            <div className={`flex-shrink-0 ${config.color}`}>
              <Icon className={`h-6 w-6 ${execution.status === 'RUNNING' ? 'animate-spin' : ''}`} />
            </div>

            {/* Execution Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{execution.agent.name}</h4>
                <span className={`text-xs font-medium ${config.color}`}>
                  {config.label}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{executionDate}</span>
                </div>
                {execution.status === 'COMPLETED' && (
                  <span>Duration: {duration}</span>
                )}
              </div>
            </div>

            {/* View Button */}
            <Link
              href={`/agents/${execution.agentId}?execution=${execution.id}`}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-accent"
            >
              View
            </Link>
          </div>
        );
      })}
    </div>
  );
}

