/**
 * AgentNexus Backend - Type Definitions
 * 
 * Comprehensive TypeScript types for the entire backend system
 * 
 * @author AgentNexus Team ()
 */

import { z } from 'zod';
import { 
  User, 
  Agent, 
  Purchase, 
  Execution, 
  Entitlement,
  KycStatus,
  AgentCategory,
  AgentStatus,
  PurchaseStatus,
  ExecutionStatus
} from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  Agent,
  Purchase,
  Execution,
  Entitlement,
  KycStatus,
  AgentCategory,
  AgentStatus,
  PurchaseStatus,
  ExecutionStatus
};

/*******************************************************************************
 * REQUEST/RESPONSE TYPES
 ******************************************************************************/

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/*******************************************************************************
 * AGENT TYPES
 ******************************************************************************/

export interface AgentFilters {
  category?: AgentCategory;
  status?: AgentStatus;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  developer?: string;
}

export interface AgentStats {
  totalExecutions: number;
  totalRevenue: string;
  averageExecutionTime?: number;
  successRate?: number;
  lastExecutionAt?: Date;
}

export interface CreateAgentDto {
  name: string;
  description: string;
  category: AgentCategory;
  developer: string;
  developerWallet: string;
  price: string;
  priceToken: string;
  version: string;
  dockerImage: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  featured?: boolean;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  category?: AgentCategory;
  price?: string;
  priceToken?: string;
  version?: string;
  dockerImage?: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  status?: AgentStatus;
  featured?: boolean;
}

/*******************************************************************************
 * PURCHASE TYPES
 ******************************************************************************/

export interface CreatePurchaseDto {
  agentId: string;
  token: string;
  userAddress: string;
}

export interface PurchaseDetails extends Purchase {
  agent?: Agent;
  user?: User;
}

/*******************************************************************************
 * EXECUTION TYPES
 ******************************************************************************/

export interface ExecuteAgentDto {
  agentId: string;
  purchaseId: string;
  inputData: Record<string, any>;
}

export interface ExecutionDetails extends Execution {
  agent?: Agent;
  user?: User;
  purchase?: Purchase;
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
}

/*******************************************************************************
 * USER TYPES
 ******************************************************************************/

export interface UserProfile extends User {
  totalPurchases?: number;
  totalExecutions?: number;
  entitlements?: Entitlement[];
}

export interface UpdateUserDto {
  email?: string;
  username?: string;
}

export interface AuthRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: Date;
}

/*******************************************************************************
 * BLOCKCHAIN TYPES
 ******************************************************************************/

export type Hex = `0x${string}`;

export interface WalletCreationResult {
  walletAddress: Hex;
  ownerAddress: Hex;
  isDeployed: boolean;
  chainId: number;
}

export interface UserOperationParams {
  target: string;
  data: Hex;
  value?: bigint;
}

export interface SmartAccountInfo {
  address: string;
  ownerAddress: string;
  isDeployed: boolean;
}

export interface TransactionResult {
  hash: string;
  blockNumber?: number;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: bigint;
}

export interface PaymentInfo {
  paymentId: string;
  user: string;
  developer: string;
  agentId: number;
  amount: bigint;
  token: string;
  status: 'escrowed' | 'released' | 'refunded' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface EntitlementInfo {
  tokenId: bigint;
  agentId: bigint;
  balance: number;
  transferrable: boolean;
  expiration: bigint;
  isExpired: boolean;
}

/*******************************************************************************
 * DOCKER TYPES
 ******************************************************************************/

export interface DockerContainerConfig {
  image: string;
  env: string[];
  memory: number; // bytes
  cpuQuota: number;
  timeout: number; // seconds
}

export interface ContainerResult {
  containerId: string;
  exitCode: number;
  output: string;
  error?: string;
  executionTime: number; // milliseconds
}

/*******************************************************************************
 * VALIDATION SCHEMAS (ZOD)
 ******************************************************************************/

export const CreateAgentSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.enum(['TRADING', 'ANALYTICS', 'DEFI', 'NFT', 'SOCIAL', 'UTILITY', 'CUSTOM']),
  developer: z.string().min(1),
  developerWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  price: z.string().regex(/^\d+(\.\d+)?$/),
  priceToken: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  dockerImage: z.string().min(1),
  inputSchema: z.record(z.any()),
  outputSchema: z.record(z.any()),
  featured: z.boolean().optional()
});

export const UpdateAgentSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(1000).optional(),
  category: z.enum(['TRADING', 'ANALYTICS', 'DEFI', 'NFT', 'SOCIAL', 'UTILITY', 'CUSTOM']).optional(),
  price: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  priceToken: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  dockerImage: z.string().min(1).optional(),
  inputSchema: z.record(z.any()).optional(),
  outputSchema: z.record(z.any()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DEPRECATED', 'UNDER_REVIEW']).optional(),
  featured: z.boolean().optional()
});

export const ExecuteAgentSchema = z.object({
  agentId: z.string().cuid(),
  purchaseId: z.string().cuid(),
  inputData: z.record(z.any())
});

export const PurchaseAgentSchema = z.object({
  agentId: z.string().cuid(),
  token: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(50).optional()
});

export const AuthRequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
  message: z.string().min(1)
});

/*******************************************************************************
 * ERROR TYPES
 ******************************************************************************/

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class BlockchainError extends AppError {
  constructor(message: string) {
    super(message, 500, 'BLOCKCHAIN_ERROR');
    this.name = 'BlockchainError';
  }
}

export class DockerError extends AppError {
  constructor(message: string) {
    super(message, 500, 'DOCKER_ERROR');
    this.name = 'DockerError';
  }
}

