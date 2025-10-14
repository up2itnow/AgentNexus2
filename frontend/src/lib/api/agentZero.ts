/**
 * Agent Zero API Client
 * Frontend API client for Agent Zero integration
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/agent-zero`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==============================================================================
// Types
// ==============================================================================

export enum AgentZeroTier {
  BASIC = 'BASIC',
  PRO = 'PRO',
}

export enum AgentZeroStatus {
  CREATING = 'CREATING',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
  DELETED = 'DELETED',
}

export interface AgentZeroExecuteRequest {
  userId: string;
  prompt: string;
}

export interface AgentZeroExecuteResponse {
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  response?: string;
  toolsUsed?: string[];
  tokensUsed?: number;
  executionTime?: number;
  error?: string;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetAt: string;
}

export interface InstanceStatus {
  instanceId: string;
  status: AgentZeroStatus;
  tunnelUrl?: string;
  tier: AgentZeroTier;
  totalExecutions: number;
  lastAccessedAt: string;
  expiresAt?: string;
  resourceUsage: {
    cpu?: string;
    memory: string;
    storage: number;
  };
}

export interface TierInfo {
  tier: AgentZeroTier;
  limits: {
    tier: AgentZeroTier;
    executionsPerDay: number;
    timeout: number;
    features: {
      persistentMemory: boolean;
      subordinateAgents: boolean;
      allTools: boolean;
      webUI: boolean;
      mcpServers: boolean;
    };
    resources: {
      memory: string;
      cpu: string;
    };
  };
}

export interface UpgradeInfo {
  currentTier: AgentZeroTier;
  upgradeTo: AgentZeroTier;
  price: string;
  priceToken: string;
  benefits: string[];
}

export interface TokenIds {
  basic: string;
  pro: string;
}

// ==============================================================================
// Quick Execution API (Basic Tier)
// ==============================================================================

/**
 * Execute Agent Zero task (Basic tier)
 */
export async function executeAgentZero(
  request: AgentZeroExecuteRequest
): Promise<AgentZeroExecuteResponse> {
  const response = await apiClient.post('/execute', request);
  return response.data;
}

/**
 * Check rate limit for user
 */
export async function checkRateLimit(userId: string): Promise<RateLimitInfo> {
  const response = await apiClient.get('/rate-limit', {
    params: { userId },
  });
  return response.data;
}

// ==============================================================================
// Instance Management API (Pro Tier)
// ==============================================================================

/**
 * Create persistent Agent Zero instance
 */
export async function createInstance(userId: string): Promise<{
  instanceId: string;
  containerId: string;
  status: AgentZeroStatus;
  tunnelUrl?: string;
}> {
  const response = await apiClient.post('/instance/create', { userId });
  return response.data;
}

/**
 * Get instance status
 */
export async function getInstanceStatus(userId: string): Promise<InstanceStatus> {
  const response = await apiClient.get('/instance/status', {
    params: { userId },
  });
  return response.data;
}

/**
 * Stop instance
 */
export async function stopInstance(userId: string): Promise<void> {
  await apiClient.post('/instance/stop', { userId });
}

/**
 * Start instance
 */
export async function startInstance(userId: string): Promise<void> {
  await apiClient.post('/instance/start', { userId });
}

/**
 * Delete instance
 */
export async function deleteInstance(userId: string): Promise<void> {
  await apiClient.delete('/instance', { data: { userId } });
}

// ==============================================================================
// Tier & Upgrade API
// ==============================================================================

/**
 * Get user's current tier and limits
 */
export async function getUserTier(userId: string): Promise<TierInfo> {
  const response = await apiClient.get('/tier', {
    params: { userId },
  });
  return response.data;
}

/**
 * Get upgrade information
 */
export async function getUpgradeInfo(): Promise<UpgradeInfo> {
  const response = await apiClient.get('/upgrade-info');
  return response.data;
}

/**
 * Get token IDs for Agent Zero tiers
 */
export async function getTokenIds(): Promise<TokenIds> {
  const response = await apiClient.get('/token-ids');
  return response.data;
}

// ==============================================================================
// Hooks for React Query (optional, can be added later)
// ==============================================================================

export const agentZeroAPI = {
  execute: executeAgentZero,
  checkRateLimit,
  createInstance,
  getInstanceStatus,
  stopInstance,
  startInstance,
  deleteInstance,
  getUserTier,
  getUpgradeInfo,
  getTokenIds,
};

export default agentZeroAPI;

