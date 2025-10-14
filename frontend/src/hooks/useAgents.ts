/**
 * useAgents Hook - SWR-based data fetching for agents
 * 
 * Provides reactive, cached agent data with automatic revalidation
 */

'use client';

import useSWR from 'swr';
import { agentsAPI, swrKeys } from '@/lib/api';
import type { AgentFilters } from '@/types/agent';

/**
 * Fetch and cache agent list with filters
 */
export function useAgents(filters?: AgentFilters) {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.agents(filters),
    () => agentsAPI.list(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
    }
  );

  return {
    agents: data?.agents ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate, // For manual revalidation
  };
}

/**
 * Fetch and cache single agent by ID
 */
export function useAgent(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? swrKeys.agent(id) : null,
    () => agentsAPI.get(id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    agent: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

