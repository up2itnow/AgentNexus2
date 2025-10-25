/**
 * ExecutionInterface - Real-Time Agent Execution Dashboard
 * 
 * This is the heart of the AgentNexus user experience - where users interact
 * with AI agents and watch them execute in real-time. It orchestrates the
 * entire execution lifecycle from input submission to results display.
 * 
 * COMPONENT ARCHITECTURE:
 * =======================
 * Composed of 4 sub-components that work together:
 * 1. ExecutionForm - Input parameters and submission
 * 2. ExecutionStatus - Real-time progress tracking (with polling)
 * 3. ExecutionLogs - Live streaming logs from Docker container
 * 4. ExecutionResults - Final output and downloadable artifacts
 * 
 * STATE MANAGEMENT:
 * =================
 * - currentExecutionId: Tracks the active execution
 * - completedExecution: Caches the final result
 * - isRunning: Derived state to control UI visibility
 * 
 * USER FLOW:
 * ==========
 * 1. User fills out ExecutionForm with agent-specific parameters
 * 2. Form submits → POST /api/executions → backend creates Docker container
 * 3. ExecutionStatus polls /api/executions/:id every 2s for status updates
 * 4. ExecutionLogs displays real-time logs from container stdout/stderr
 * 5. When status → COMPLETED/FAILED, ExecutionResults shows final output
 * 6. User can start new execution (resets state)
 * 
 * REAL-TIME UPDATES:
 * ==================
 * - SWR polling (refreshInterval: 2000ms) for status
 * - WebSocket considered but polling is simpler for MVP
 * - Stops polling when execution reaches terminal state
 * 
 * RESPONSIVE BEHAVIOR:
 * ====================
 * - Mobile: Stacked vertically
 * - Desktop: Status + Logs side-by-side
 * - Dark mode support via Tailwind CSS variables
 * 
 * SECURITY CONSIDERATIONS:
 * ========================
 * - Only shows executions for authenticated user
 * - Agent entitlement verified on backend before execution
 * - No sensitive data in logs (backend filters credentials)
 * 
 * PERFORMANCE:
 * ============
 * - Conditional rendering (only show logs/results when needed)
 * - SWR caching reduces redundant API calls
 * - No re-renders on log updates (isolated component)
 * 
 * @component
 * @example
 * ```tsx
 * <ExecutionInterface agent={myAgent} />
 * ```
 * 
 * @author AgentNexus Team ()
 */

'use client';

import { useState } from 'react';
import { ExecutionForm } from './ExecutionForm';
import { ExecutionStatus } from './ExecutionStatus';
import { ExecutionLogs } from './ExecutionLogs';
import { ExecutionResults } from './ExecutionResults';
import type { Agent } from '@/types/agent';
import type { Execution } from '@/types/execution';

interface ExecutionInterfaceProps {
  /** Agent being executed - contains schema for input validation */
  agent: Agent;
}

/**
 * Main execution interface component
 * Manages execution lifecycle state and coordinates sub-components
 */
export function ExecutionInterface({ agent }: ExecutionInterfaceProps) {
  // Track the currently running execution ID
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  
  // Cache the completed execution for results display
  const [completedExecution, setCompletedExecution] = useState<Execution | null>(null);

  /**
   * Callback when user submits execution form
   * Resets completed state to allow new execution
   */
  const handleExecutionStart = (executionId: string) => {
    setCurrentExecutionId(executionId);
    setCompletedExecution(null); // Clear previous results
  };

  /**
   * Callback when execution reaches terminal state (COMPLETED/FAILED)
   * Caches result to stop polling and display final output
   */
  const handleExecutionComplete = (execution: Execution) => {
    setCompletedExecution(execution);
  };

  /**
   * Derived state: Is an execution currently running?
   * Running = we have an executionId AND it hasn't completed yet
   * This controls visibility of status/logs components
   */
  const isRunning = !!(currentExecutionId && 
    completedExecution?.id !== currentExecutionId);

  return (
    <div className="space-y-6">
      {/* Execution Form */}
      <ExecutionForm 
        agent={agent} 
        onExecutionStart={handleExecutionStart}
      />

      {/* Status, Logs, Results */}
      {currentExecutionId && (
        <>
          {/* Status */}
          <ExecutionStatus
            executionId={currentExecutionId}
            onComplete={handleExecutionComplete}
          />

          {/* Logs */}
          <ExecutionLogs
            executionId={currentExecutionId}
            isRunning={isRunning}
          />

          {/* Results */}
          {completedExecution && (
            <ExecutionResults execution={completedExecution} />
          )}
        </>
      )}

      {/* Empty State */}
      {!currentExecutionId && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <p className="text-muted-foreground">
            Enter your input data above and click &quot;Execute Agent&quot; to begin
          </p>
        </div>
      )}
    </div>
  );
}

