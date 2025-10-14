/**
 * useBuilder Hooks - SWR-based data fetching for agent builder
 * 
 * Provides reactive, cached builder data with automatic revalidation
 */

'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { builderAPI, swrKeys } from '@/lib/api';
import type { 
  AgentTemplate, 
  AgentModule, 
  CustomAgent,
  GenerateAgentPayload,
  PreviewAgentPayload 
} from '@/types/builder';

/**
 * Fetch and cache all agent templates
 */
export function useTemplates() {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.templates,
    () => builderAPI.getTemplates(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Cache for 10 seconds
    }
  );

  return {
    templates: (data as AgentTemplate[]) ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Fetch single template by ID
 */
export function useTemplate(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? swrKeys.template(id) : null,
    () => builderAPI.getTemplate(id!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    template: data as AgentTemplate | undefined,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Fetch and cache all agent modules
 */
export function useModules() {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.modules,
    () => builderAPI.getModules(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
    }
  );

  return {
    modules: (data as AgentModule[]) ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Fetch user's custom agents
 */
export function useMyCustomAgents(userId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? swrKeys.myCustomAgents(userId) : null,
    () => builderAPI.getMyAgents(userId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    customAgents: (data as CustomAgent[]) ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Generate agent mutation hook
 */
export function useGenerateAgent() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateAgent = async (payload: GenerateAgentPayload) => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await builderAPI.generateAgent(payload);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateAgent,
    isGenerating,
    error,
  };
}

/**
 * Preview agent mutation hook
 */
export function usePreviewAgent() {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const previewAgent = async (payload: PreviewAgentPayload) => {
    setIsPreviewing(true);
    setError(null);
    try {
      const result = await builderAPI.previewAgent(payload);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsPreviewing(false);
    }
  };

  return {
    previewAgent,
    isPreviewing,
    error,
  };
}

/**
 * Deploy agent mutation hook
 */
export function useDeployAgent() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deployAgent = async (agentId: string) => {
    setIsDeploying(true);
    setError(null);
    try {
      const result = await builderAPI.deployAgent(agentId);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsDeploying(false);
    }
  };

  return {
    deployAgent,
    isDeploying,
    error,
  };
}

/**
 * Update agent mutation hook
 */
export function useUpdateAgent() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateAgent = async (agentId: string, updates: Record<string, any>) => {
    setIsUpdating(true);
    setError(null);
    try {
      const result = await builderAPI.updateAgent(agentId, updates);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateAgent,
    isUpdating,
    error,
  };
}
