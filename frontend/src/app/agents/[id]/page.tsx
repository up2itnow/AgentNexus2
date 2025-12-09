/**
 * Agent Detail Page
 * 
 * Displays full agent information with purchase flow
 */

'use client';

import { useParams } from 'next/navigation';
import { useAgent } from '@/hooks/useAgents';
import { AgentDetail } from '@/components/agents/AgentDetail';
import { Loader2 } from 'lucide-react';

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params?.id as string;

  const { agent, isLoading, isError } = useAgent(agentId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="agent-detail-loading">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-muted-foreground">Loading agent...</p>
        </div>
      </div>
    );
  }

  if (isError || !agent) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="agent-detail-error">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Agent Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The agent you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <a
            href="/"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to Marketplace
          </a>
        </div>
      </div>
    );
  }

  return <AgentDetail agent={agent} />;
}

