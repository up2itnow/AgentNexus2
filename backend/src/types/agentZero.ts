/**
 * Agent Zero Integration Types
 * Types and interfaces for Agent Zero hybrid integration
 */

import { AgentZeroTier, AgentZeroStatus } from '@prisma/client';

// ==============================================================================
// Configuration
// ==============================================================================

export interface AgentZeroConfig {
  // Token IDs for entitlement verification
  basicTokenId: string;
  proTokenId: string;
  
  // Pricing
  proPrice: bigint; // in wei/smallest unit
  proPriceToken: string; // e.g., "USDC"
  
  // Docker images
  quickImage: string; // Stripped-down image for Basic tier
  fullImage: string;  // Full image for Pro tier
  
  // Rate limits (Basic tier)
  basicRateLimit: number; // executions per day
  basicTimeout: number;   // milliseconds
  
  // Pro tier limits
  proTimeout: number;     // milliseconds
  proMaxMemory: string;   // e.g., "4GB"
  proCpuLimit: string;    // e.g., "2.0"
}

// ==============================================================================
// Execution Requests/Responses
// ==============================================================================

export interface AgentZeroExecuteRequest {
  userId: string;
  prompt: string;
  tier?: AgentZeroTier;
  streaming?: boolean;
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

// ==============================================================================
// Instance Management
// ==============================================================================

export interface CreateInstanceRequest {
  userId: string;
  tier: AgentZeroTier;
}

export interface CreateInstanceResponse {
  instanceId: string;
  containerId: string;
  status: AgentZeroStatus;
  tunnelUrl?: string;
}

export interface InstanceStatusResponse {
  instanceId: string;
  status: AgentZeroStatus;
  tunnelUrl?: string;
  tier: AgentZeroTier;
  totalExecutions: number;
  lastAccessedAt: Date;
  expiresAt?: Date;
  resourceUsage: {
    cpu?: string;
    memory: string;
    storage: number;
  };
}

// ==============================================================================
// Docker Container Management
// ==============================================================================

export interface AgentZeroContainerConfig {
  userId: string;
  tier: AgentZeroTier;
  image: string;
  cpuLimit?: string;
  memoryLimit: string;
  volumePath?: string; // For persistent memory
  environment: Record<string, string>;
}

export interface ContainerInfo {
  containerId: string;
  status: 'creating' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  internalPort: number;
  tunnelUrl?: string;
  memoryPath?: string;
}

// ==============================================================================
// Agent Zero API Protocol
// ==============================================================================

// Agent Zero's WebUI API format (for communication with containers)
export interface AgentZeroMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentZeroRequest {
  messages: AgentZeroMessage[];
  settings?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  };
}

export interface AgentZeroStreamChunk {
  type: 'start' | 'content' | 'tool' | 'end' | 'error';
  content?: string;
  tool?: string;
  error?: string;
}

// ==============================================================================
// Tier Verification
// ==============================================================================

export interface TierVerificationResult {
  tier: AgentZeroTier;
  hasAccess: boolean;
  reason?: string;
  rateLimit?: {
    remaining: number;
    resetAt: Date;
  };
}

// ==============================================================================
// Rate Limiting
// ==============================================================================

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetAt: Date;
}

// ==============================================================================
// Statistics
// ==============================================================================

export interface AgentZeroStats {
  userId: string;
  tier: AgentZeroTier;
  totalExecutions: number;
  totalTokens: number;
  avgExecutionTime: number;
  mostUsedTools: string[];
}

