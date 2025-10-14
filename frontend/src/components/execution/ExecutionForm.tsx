/**
 * ExecutionForm - Agent Execution Input Form
 * 
 * Collects input parameters and initiates agent execution
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { executionsAPI } from '@/lib/api';
import type { Agent } from '@/types/agent';

interface ExecutionFormProps {
  agent: Agent;
  onExecutionStart: (executionId: string) => void;
}

interface FormData {
  [key: string]: string;
}

export function ExecutionForm({ agent, onExecutionStart }: ExecutionFormProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsExecuting(true);
    
    try {
      // Convert form data to proper types (in production, this would be based on agent schema)
      const inputData: Record<string, any> = {};
      Object.entries(data).forEach(([key, value]) => {
        // Try to parse as JSON for complex inputs
        try {
          inputData[key] = JSON.parse(value);
        } catch {
          // Keep as string if not valid JSON
          inputData[key] = value;
        }
      });

      const result = await executionsAPI.execute(agent.id, inputData);
      
      toast.success('Execution started!');
      onExecutionStart(result.id);
    } catch (error) {
      console.error('Execution error:', error);
      toast.error('Failed to start execution');
    } finally {
      setIsExecuting(false);
    }
  };

  // For MVP, we'll use a simple text input for parameters
  // In production, this would be dynamic based on agent schema
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Execute Agent</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Input Parameters */}
        <div>
          <label htmlFor="input" className="mb-2 block text-sm font-medium">
            Input Data
          </label>
          <textarea
            id="input"
            {...register('input', { required: 'Input data is required' })}
            rows={6}
            placeholder='{"key": "value", "param": 123}'
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.input && (
            <p className="mt-1 text-xs text-red-600">{errors.input.message}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Enter input data as JSON. Example: {`{"query": "analyze market trends"}`}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isExecuting}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExecuting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Starting Execution...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Play className="h-5 w-5" />
              Execute Agent
            </span>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> Execution will run in an isolated Docker container. 
          You can monitor progress and view logs in real-time below.
        </p>
      </div>
    </div>
  );
}

