/**
 * ExecutionStatus - Real-time Execution Status Display
 * 
 * Shows current status, progress, and execution time
 */

'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { 
  Clock, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  StopCircle 
} from 'lucide-react';
import { executionsAPI, swrKeys } from '@/lib/api';
import type { Execution, ExecutionStatus as Status } from '@/types/execution';

interface ExecutionStatusProps {
  executionId: string;
  onComplete?: (execution: Execution) => void;
}

const STATUS_CONFIG: Record<Status, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
}> = {
  PENDING: {
    icon: Clock,
    label: 'Pending',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
  },
  RUNNING: {
    icon: Loader2,
    label: 'Running',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  COMPLETED: {
    icon: CheckCircle,
    label: 'Completed',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
  },
  FAILED: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
  },
  CANCELLED: {
    icon: StopCircle,
    label: 'Cancelled',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/20',
  },
};

export function ExecutionStatus({ executionId, onComplete }: ExecutionStatusProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Poll execution status
  const { data: execution, error } = useSWR<Execution>(
    swrKeys.execution(executionId),
    () => executionsAPI.get(executionId),
    {
      refreshInterval: (data) => {
        return data?.status === 'RUNNING' || data?.status === 'PENDING' ? 2000 : 0;
      },
      revalidateOnFocus: false,
    }
  );

  // Update elapsed time
  useEffect(() => {
    if (!execution || execution.status === 'COMPLETED' || execution.status === 'FAILED') {
      return;
    }

    const startTime = new Date(execution.startTime).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [execution]);

  // Call onComplete when execution finishes
  useEffect(() => {
    if (execution && (execution.status === 'COMPLETED' || execution.status === 'FAILED')) {
      onComplete?.(execution);
    }
  }, [execution, onComplete]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Failed to load execution status</span>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading execution status...</span>
        </div>
      </div>
    );
  }

  const config = STATUS_CONFIG[execution.status as Status];
  const Icon = config.icon;
  const isRunning = execution.status === 'RUNNING';
  const duration = execution.duration || elapsedTime;

  return (
    <div className={`rounded-lg border p-6 ${config.bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`h-6 w-6 ${config.color} ${isRunning ? 'animate-spin' : ''}`} />
          <div>
            <h3 className={`text-lg font-semibold ${config.color}`}>
              {config.label}
            </h3>
            <p className="text-sm text-muted-foreground">
              Execution ID: {execution.id.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Duration */}
        <div className="text-right">
          <div className="text-2xl font-bold">
            {formatDuration(duration)}
          </div>
          <div className="text-xs text-muted-foreground">
            {execution.status === 'COMPLETED' || execution.status === 'FAILED' 
              ? 'Total time' 
              : 'Elapsed time'}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {execution.status === 'FAILED' && execution.errorMessage && (
        <div className="mt-4 rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
          <p className="text-sm text-red-900 dark:text-red-100">
            <strong>Error:</strong> {execution.errorMessage}
          </p>
        </div>
      )}

      {/* Progress Bar for Running */}
      {isRunning && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
            <div className="h-full animate-pulse bg-blue-600" style={{ width: '100%' }} />
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

