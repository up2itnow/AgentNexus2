/**
 * ExecutionResults - Display Execution Output
 * 
 * Shows execution results with download functionality
 */

'use client';

import { Download, FileJson, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Execution } from '@/types/execution';

interface ExecutionResultsProps {
  execution: Execution;
}

export function ExecutionResults({ execution }: ExecutionResultsProps) {
  const hasOutput = execution.outputData && Object.keys(execution.outputData).length > 0;

  const handleDownload = () => {
    if (!execution.outputData) return;

    const dataStr = JSON.stringify(execution.outputData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `execution-${execution.id}-result.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Results downloaded!');
  };

  const handleCopy = () => {
    if (!execution.outputData) return;

    const dataStr = JSON.stringify(execution.outputData, null, 2);
    navigator.clipboard.writeText(dataStr);
    toast.success('Copied to clipboard!');
  };

  if (execution.status !== 'COMPLETED') {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <h3 className="font-semibold">Execution Results</h3>
        </div>
        
        {hasOutput && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="rounded px-3 py-1 text-sm hover:bg-accent"
            >
              Copy
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        )}
      </div>

      {/* Results Display */}
      <div className="p-4">
        {!hasOutput ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileJson className="mb-2 h-12 w-12" />
            <p>No output data available</p>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-950 p-4">
            <pre className="overflow-x-auto text-sm text-gray-300">
              {JSON.stringify(execution.outputData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="border-t bg-muted/30 px-4 py-3">
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="font-medium text-green-600 dark:text-green-400">
              {execution.status}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="font-medium">
              {execution.duration ? `${execution.duration}ms` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Started</div>
            <div className="font-medium">
              {new Date(execution.startTime).toLocaleTimeString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="font-medium">
              {execution.endTime 
                ? new Date(execution.endTime).toLocaleTimeString()
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

