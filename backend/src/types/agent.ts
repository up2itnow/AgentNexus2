/**
 * Agent Adapter Interface
 * 
 * Standard interface for all agent implementations to ensure consistent
 * execution handling across different agent types (Agent Zero, Custom, etc.)
 */

export interface AgentExecutionRequest {
    userId: string;
    agentId: string;
    prompt: string;
    inputData?: Record<string, any>;
    tier?: string;
}

export interface AgentExecutionResponse {
    executionId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    response?: string;
    toolsUsed?: string[];
    tokensUsed?: number;
    executionTime?: number;
    error?: string;
}

export interface AgentAdapter {
    /**
     * Execute an agent with the given request
     */
    execute(request: AgentExecutionRequest): Promise<AgentExecutionResponse>;

    /**
     * Get the status of an execution
     */
    getStatus(executionId: string): Promise<AgentExecutionResponse>;

    /**
     * Cancel a running execution
     */
    cancel(executionId: string): Promise<boolean>;
}
