/**
 * My Custom Agents - Dashboard
 * 
 * View and manage user's custom agents
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useMyCustomAgents } from '@/hooks/useBuilder';
import type { CustomAgent, BuildMethod } from '@/types/builder';
import DeployAgentModal from '@/components/builder/DeployAgentModal';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function MyAgentsPage() {
  // const router = useRouter();
  const { address: userId } = useAccount();
  const { customAgents, isLoading, mutate } = useMyCustomAgents(userId || null);

  const [searchQuery, setSearchQuery] = useState('');
  const [buildMethodFilter, setBuildMethodFilter] = useState<BuildMethod | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DEPLOYED' | 'DRAFT'>('ALL');
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [selectedAgentForDeploy, setSelectedAgentForDeploy] = useState<CustomAgent | null>(null);

  // Filter agents
  const filteredAgents = useMemo(() => {
    return customAgents.filter((agent) => {
      // Search filter
      if (searchQuery) {
        // We need to look up agent details - simplified for now
        return true;
      }

      // Build method filter
      if (buildMethodFilter !== 'ALL' && agent.buildMethod !== buildMethodFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'DEPLOYED' && !agent.isDeployed) return false;
      if (statusFilter === 'DRAFT' && agent.isDeployed) return false;

      return true;
    });
  }, [customAgents, searchQuery, buildMethodFilter, statusFilter]);

  // Handle delete
  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) {
      return;
    }

    try {
      const response = await fetch(`/api/builder/agents/${agentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        mutate(); // Refresh list
      } else {
        alert('Failed to delete agent');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete agent');
    }
  };

  // Handle deploy
  const handleDeploy = (agent: CustomAgent) => {
    setSelectedAgentForDeploy(agent);
    setDeployModalOpen(true);
  };

  const handleDeploySuccess = () => {
    mutate(); // Refresh list
    setDeployModalOpen(false);
    setSelectedAgentForDeploy(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Builder
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Custom Agents</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your {customAgents.length} custom agent{customAgents.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link
              href="/builder"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Agent
            </Link>
          </div>
        </div>

        {/* Wallet Connection Check */}
        {!userId ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please connect your wallet to view your custom agents
            </p>
            <ConnectButton />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'DEPLOYED' | 'DRAFT')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="DEPLOYED">Deployed</option>
                  <option value="DRAFT">Draft</option>
                </select>

                {/* Build Method Filter */}
                <select
                  value={buildMethodFilter}
                  onChange={(e) => setBuildMethodFilter(e.target.value as BuildMethod | 'ALL')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Methods</option>
                  <option value="TEMPLATE">Template</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading your agents...</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredAgents.length === 0 && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-bold mb-2">No custom agents yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first custom agent to get started
                </p>
                <Link
                  href="/builder"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Agent
                </Link>
              </div>
            )}

            {/* Agents List */}
            {!isLoading && filteredAgents.length > 0 && (
              <div className="space-y-4">
                {filteredAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onDelete={handleDelete}
                    onDeploy={() => handleDeploy(agent)}
                  />
                ))}
              </div>
            )}

            {/* Deploy Modal */}
            {selectedAgentForDeploy && (
              <DeployAgentModal
                isOpen={deployModalOpen}
                onClose={() => {
                  setDeployModalOpen(false);
                  setSelectedAgentForDeploy(null);
                }}
                agentId={selectedAgentForDeploy.id}
                agentName={`Custom Agent #${selectedAgentForDeploy.id.slice(0, 8)}`}
                agentPrice={10.0} // You can calculate this based on build method
                onSuccess={handleDeploySuccess}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// AGENT CARD COMPONENT
// ============================================================================

interface AgentCardProps {
  agent: CustomAgent;
  onDelete: (id: string) => void;
  onDeploy: () => void;
}

function AgentCard({ agent, onDelete, onDeploy }: AgentCardProps) {
  const router = useRouter();

  const methodColors = {
    TEMPLATE: { bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100', icon: '🟢' },
    HYBRID: { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100', icon: '🟡' },
    CUSTOM: { bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100', icon: '🔴' },
  };

  const colors = methodColors[agent.buildMethod];
  const createdDate = new Date(agent.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Handle edit - navigate to appropriate builder
  const handleEdit = () => {
    switch (agent.buildMethod) {
      case 'TEMPLATE':
        if (agent.templateId) {
          router.push(`/builder/template/${agent.templateId}`);
        }
        break;
      case 'HYBRID':
        router.push('/builder/modular');
        break;
      case 'CUSTOM':
        router.push('/builder/advanced');
        break;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Left: Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{colors.icon}</span>
            <div>
              <Link
                href={`/agents/${agent.agentId}`}
                className="text-xl font-bold hover:text-blue-600 dark:hover:text-blue-400"
              >
                Agent #{agent.id.slice(0, 8)}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors.bg}`}>
                  {agent.buildMethod}
                </span>
                {agent.isDeployed ? (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    ✅ Deployed
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    ⏳ Draft
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-3">
            <p>Created: {createdDate}</p>
            {agent.isDeployed && agent.deployedAt && (
              <p>Deployed: {new Date(agent.deployedAt).toLocaleDateString()}</p>
            )}
            {agent.isPublic && <p>Visibility: Public</p>}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex gap-2 ml-4">
          <button
            onClick={handleEdit}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Edit agent"
          >
            <Edit className="w-4 h-4" />
          </button>

          {!agent.isDeployed && (
            <button
              onClick={onDeploy}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors text-sm"
            >
              Deploy
            </button>
          )}

          <button
            onClick={() => onDelete(agent.id)}
            className="p-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete agent"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
