/**
 * AgentNexus SDK Type Definitions
 * 
 * Core types for the AgentNexus AI Agent Marketplace.
 * 
 * @packageDocumentation
 */

// ============ Agent Types ============

export interface Agent {
    id: string;
    name: string;
    description: string;
    developer: string;
    price: bigint;
    tokenId: number;
    imageUrl?: string;
    tier: 'basic' | 'pro' | 'enterprise';
    capabilities: string[];
    createdAt: Date;
}

export interface AgentExecution {
    id: string;
    agentId: string;
    userId: string;
    status: ExecutionStatus;
    input: string;
    output?: string;
    startedAt: Date;
    completedAt?: Date;
    gasUsed?: bigint;
    error?: string;
}

export type ExecutionStatus =
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled';

// ============ Payment Types ============

export interface Payment {
    id: string;
    pipelineId?: string;
    user: string;
    amount: bigint;
    token: string;
    status: PaymentStatus;
    createdAt: Date;
    expiresAt: Date;
}

export type PaymentStatus =
    | 'escrowed'
    | 'released'
    | 'refunded'
    | 'expired';

// ============ Pipeline Types (A2A Protocol) ============

export interface Pipeline {
    id: string;
    creator: string;
    steps: PipelineStep[];
    status: PipelineStatus;
    paymentToken: string;
    totalAmount: bigint;
    currentStage: number;
    createdAt: Date;
}

export interface PipelineStep {
    agentId: string;
    developer: string;
    paymentBps: number;
    stageIndex: number;
    maxRetries: number;
    status: StepStatus;
    conditionHash?: string;
}

export type PipelineStatus =
    | 'created'
    | 'funded'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'failed';

export type StepStatus =
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'skipped';

// ============ Entitlement Types ============

export interface Entitlement {
    tokenId: number;
    agentId: string;
    user: string;
    balance: bigint;
    expiration?: Date;
}

// ============ Chain & Contract Types ============

export interface ChainConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    contracts: ContractAddresses;
}

export interface ContractAddresses {
    escrow: string;
    entitlements: string;
    a2aProtocol?: string;
}

// ============ SDK Configuration ============

export interface AgentNexusConfig {
    chainId: number;
    rpcUrl: string;
    apiUrl?: string;
    contracts: ContractAddresses;
    apiKey?: string;
}

// ============ API Response Types ============

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
