/**
 * ExecutionLogs - Real-time Log Display
 * 
 * Shows live execution logs with auto-scroll
 */

'use client';

import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import { Terminal, Info, AlertTriangle, XCircle } from 'lucide-react';
import { executionsAPI, swrKeys } from '@/lib/api';
import type { ExecutionLog } from '@/types/execution';

interface ExecutionLogsProps {
  executionId: string;
  isRunning?: boolean;
}

const LEVEL_CONFIG = {
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
};

export function ExecutionLogs({ executionId, isRunning }: ExecutionLogsProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch logs with polling if running
  const { data: logsData, error } = useSWR(
    swrKeys.executionLogs(executionId),
    () => executionsAPI.getLogs(executionId),
    {
      refreshInterval: isRunning ? 2000 : 0,
      revalidateOnFocus: false,
    }
  );

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logsData]);

  // Parse logs (in production, logs would be structured)
  const logs: ExecutionLog[] = logsData?.logs || [];

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
        <Terminal className="h-4 w-4" />
        <h3 className="font-semibold">Execution Logs</h3>
        {isRunning && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
            Live
          </span>
        )}
      </div>

      {/* Logs Container */}
      <div className="max-h-96 overflow-y-auto bg-gray-950 p-4 font-mono text-sm">
        {error ? (
          <div className="text-red-400">
            Failed to load logs
          </div>
        ) : logs.length === 0 ? (
          <div className="text-gray-500">
            No logs yet... Waiting for execution to start.
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => {
              const config = LEVEL_CONFIG[log.level];
              const Icon = config.icon;
              const timestamp = new Date(log.timestamp).toLocaleTimeString();

              return (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded px-2 py-1 hover:bg-gray-900"
                >
                  <span className="text-gray-500">{timestamp}</span>
                  <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${config.color}`} />
                  <span className={log.level === 'error' ? 'text-red-400' : 'text-gray-300'}>
                    {log.message}
                  </span>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

