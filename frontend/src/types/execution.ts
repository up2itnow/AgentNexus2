/**
 * Execution Type Definitions
 * 
 * Types for agent execution requests and results
 */

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface Execution {
  id: string;
  userId: string;
  agentId: string;
  purchaseId?: string;
  status: ExecutionStatus;
  inputData: Record<string, any>;
  outputData?: Record<string, any>;
  logs?: string;
  errorMessage?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExecuteAgentRequest {
  agentId: string;
  purchaseId?: string;
  inputData: Record<string, any>;
}

export interface ExecutionResult {
  execution: Execution;
  logs: ExecutionLog[];
  output?: any;
}

