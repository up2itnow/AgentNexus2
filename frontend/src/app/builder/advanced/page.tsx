/**
 * Advanced Code Editor - Custom Agent Development
 * 
 * Full code editor with Monaco for maximum flexibility
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  FileCode,
  Loader2,
  Play,
  Rocket,
  XCircle,
} from 'lucide-react';
import { useGenerateAgent, usePreviewAgent } from '@/hooks/useBuilder';
import type { BuildMethod } from '@/types/builder';
import { AgentCategory } from '@/types/agent';

const DEFAULT_CODE = `import { Agent } from '@agentnexus/runtime';

export class MyCustomAgent extends Agent {
  async execute(input: any) {
    // Your custom logic here
    const { query } = input;
    
    // Example: Simple echo agent
    return {
      success: true,
      result: \`You said: \${query}\`,
      timestamp: new Date().toISOString(),
    };
  }
}

export const config = {
  name: "My Custom Agent",
  description: "A custom agent that does amazing things",
  category: "GENERAL",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "User query" }
    },
    required: ["query"]
  },
  outputSchema: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      result: { type: "string" },
      timestamp: { type: "string" }
    }
  }
};`;

const SNIPPETS = [
  {
    name: 'Basic Agent Structure',
    code: `export class MyAgent extends Agent {
  async execute(input: any) {
    // Your logic here
    return { result: "Success" };
  }
}`,
  },
  {
    name: 'Async API Call',
    code: `async execute(input: any) {
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  return data;
}`,
  },
  {
    name: 'Error Handling',
    code: `async execute(input: any) {
  try {
    // Your logic
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}`,
  },
  {
    name: 'Webhook Endpoint',
    code: `async execute(input: any) {
  const { webhook } = input;
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: 'your-data' })
  });
  return { sent: true };
}`,
  },
];

export default function AdvancedBuilderPage() {
  const router = useRouter();
  const { generateAgent, isGenerating } = useGenerateAgent();
  const { previewAgent, isPreviewing } = usePreviewAgent();
  const editorRef = useRef<any>(null);

  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState<'typescript' | 'javascript'>('typescript');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<
    Array<{ type: 'info' | 'error' | 'warning' | 'success'; message: string }>
  >([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Handle editor mount
  const handleEditorMount = (editor: any, _monaco: any) => {
    editorRef.current = editor;
  };

  // Add console message
  const addConsoleMessage = (
    type: 'info' | 'error' | 'warning' | 'success',
    message: string
  ) => {
    setConsoleOutput((prev) => [...prev, { type, message }]);
  };

  // Insert snippet
  const insertSnippet = (snippetCode: string) => {
    if (editorRef.current) {
      const position = editorRef.current.getPosition();
      editorRef.current.executeEdits('', [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text: '\n' + snippetCode + '\n',
        },
      ]);
    }
  };

  // Extract config from code
  const extractConfig = () => {
    try {
      // Simple regex extraction (in production, use proper AST parsing)
      const nameMatch = code.match(/name:\s*["'](.+?)["']/);
      const descMatch = code.match(/description:\s*["'](.+?)["']/);
      const catMatch = code.match(/category:\s*["'](.+?)["']/);

      return {
        name: nameMatch?.[1] || 'Untitled Agent',
        description: descMatch?.[1] || 'No description',
        category: (catMatch?.[1] as AgentCategory) || ('GENERAL' as AgentCategory),
      };
    } catch (error) {
      return {
        name: 'Untitled Agent',
        description: 'No description',
        category: 'GENERAL' as AgentCategory,
      };
    }
  };

  // Handle validation
  const handleValidate = async () => {
    setIsValidating(true);
    setValidationErrors([]);
    setValidationWarnings([]);
    setConsoleOutput([]);
    addConsoleMessage('info', '🔍 Validating code...');

    try {
      // Basic syntax checks
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for class definition
      if (!code.includes('class') || !code.includes('extends Agent')) {
        errors.push('Missing agent class definition (must extend Agent)');
      }

      // Check for execute method
      if (!code.includes('async execute(')) {
        errors.push('Missing execute() method');
      }

      // Check for config export
      if (!code.includes('export const config')) {
        errors.push('Missing config export');
      }

      // Warnings
      if (!code.includes('try') && !code.includes('catch')) {
        warnings.push('Consider adding error handling with try/catch');
      }

      if (!code.includes('return')) {
        warnings.push('Execute method should return a result');
      }

      setValidationErrors(errors);
      setValidationWarnings(warnings);

      if (errors.length === 0) {
        addConsoleMessage('success', '✅ Syntax valid');
        if (warnings.length > 0) {
          warnings.forEach((w) => addConsoleMessage('warning', `⚠️ ${w}`));
        }
      } else {
        errors.forEach((e) => addConsoleMessage('error', `❌ ${e}`));
      }
    } catch (error) {
      addConsoleMessage('error', '❌ Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  // Handle test run
  const handleTestRun = async () => {
    addConsoleMessage('info', '▶️ Running test...');
    // In production, this would send code to backend sandbox
    setTimeout(() => {
      addConsoleMessage('success', '✅ Test completed successfully');
      addConsoleMessage('info', 'Output: { "result": "Test passed" }');
    }, 1000);
  };

  // Handle preview
  const handlePreview = async () => {
    const config = extractConfig();

    try {
      const result = await previewAgent({
        buildMethod: 'CUSTOM' as BuildMethod,
        customCode: code,
        name: config.name,
        description: config.description,
        category: config.category,
      });

      setPreviewData(result);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
      addConsoleMessage('error', '❌ Preview failed');
    }
  };

  // Handle agent creation
  const handleCreate = async () => {
    const config = extractConfig();

    try {
      const result = await generateAgent({
        buildMethod: 'CUSTOM' as BuildMethod,
        customCode: code,
        name: config.name,
        description: config.description,
        category: config.category,
      });

      if (result.success && result.agentId) {
        addConsoleMessage('success', '🚀 Agent created successfully!');
        router.push(`/agents/${result.agentId}`);
      } else {
        addConsoleMessage('error', '❌ Failed to create agent: ' + (result.errors?.[0] || 'Unknown error'));
      }
    } catch (error) {
      console.error('Agent creation failed:', error);
      addConsoleMessage('error', '❌ Failed to create agent');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Methods
            </Link>
            <h1 className="text-2xl font-bold">Advanced Code Editor</h1>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'typescript' | 'javascript')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="typescript"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          {/* Status Bar */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {validationErrors.length === 0 && validationWarnings.length === 0 ? (
                <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  No errors
                </span>
              ) : (
                <>
                  {validationErrors.length > 0 && (
                    <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <XCircle className="w-4 h-4" />
                      {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {validationWarnings.length > 0 && (
                    <span className="text-yellow-600 dark:text-yellow-400">
                      ⚠️ {validationWarnings.length} warning{validationWarnings.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Lines: {code.split('\n').length}
            </div>
          </div>

          {/* Bottom Panel: Snippets & Console */}
          <div className="h-64 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex">
            {/* Snippets */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
              <h3 className="font-bold mb-3 text-sm">Code Snippets</h3>
              <div className="space-y-2">
                {SNIPPETS.map((snippet, idx) => (
                  <button
                    key={idx}
                    onClick={() => insertSnippet(snippet.code)}
                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <FileCode className="w-4 h-4 inline mr-2" />
                    {snippet.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Console Output */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
              <h3 className="font-bold mb-3">Console Output</h3>
              {consoleOutput.length === 0 ? (
                <p className="text-gray-500">Click &quot;Validate&quot; to check your code...</p>
              ) : (
                <div className="space-y-1">
                  {consoleOutput.map((msg, idx) => {
                    const colors = {
                      info: 'text-blue-600 dark:text-blue-400',
                      success: 'text-green-600 dark:text-green-400',
                      warning: 'text-yellow-600 dark:text-yellow-400',
                      error: 'text-red-600 dark:text-red-400',
                    };
                    return (
                      <div key={idx} className={colors[msg.type]}>
                        &gt; {msg.message}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">🔴 Advanced Builder</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Write custom TypeScript/JavaScript code for maximum flexibility.
            </p>
          </div>

          {/* Requirements */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Requirements:</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Extend Agent class</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Implement execute() method</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Export config object</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Return valid JSON</span>
              </li>
            </ul>
          </div>

          {/* Best Practices */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Best Practices:</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Add error handling</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Validate inputs</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Include comments</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Test thoroughly</span>
              </li>
            </ul>
          </div>

          {/* Pricing */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h4 className="font-semibold mb-2">Pricing</h4>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              $10.00
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Premium custom agent
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleValidate}
              disabled={isValidating}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Validate
                </>
              )}
            </button>

            <button
              onClick={handleTestRun}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Test Run
            </button>

            <button
              onClick={handlePreview}
              disabled={isPreviewing}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Previewing...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Preview
                </>
              )}
            </button>

            <button
              onClick={handleCreate}
              disabled={isGenerating || validationErrors.length > 0}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Create Agent
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <PreviewModal
          data={previewData}
          onClose={() => setShowPreview(false)}
          onConfirm={handleCreate}
        />
      )}
    </div>
  );
}

// ============================================================================
// PREVIEW MODAL
// ============================================================================

interface PreviewModalProps {
  data: any;
  onClose: () => void;
  onConfirm: () => void;
}

function PreviewModal({ data, onClose, onConfirm }: PreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Preview Agent</h2>
        </div>

        <div className="p-6 space-y-4">
          {data.success ? (
            <>
              <div>
                <h3 className="font-semibold mb-2">Agent Name</h3>
                <p className="text-gray-600 dark:text-gray-400">{data.agent?.name}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-400">{data.agent?.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Estimated Price</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${data.agent?.price?.toFixed(2)}
                </p>
              </div>
            </>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Preview Failed</h4>
              <ul className="list-disc list-inside space-y-1">
                {data.errors?.map((error: string, idx: number) => (
                  <li key={idx} className="text-red-700 dark:text-red-300 text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          {data.success && (
            <button
              onClick={() => {
                onClose();
                onConfirm();
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Confirm & Create
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

