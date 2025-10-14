/**
 * Template Builder - Template Configuration Page
 * 
 * Configure a selected template with dynamic form based on JSON Schema
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, Loader2, Rocket } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTemplate, useGenerateAgent, usePreviewAgent } from '@/hooks/useBuilder';
import type { BuildMethod } from '@/types/builder';

interface PageProps {
  params: {
    id: string;
  };
}

export default function TemplateConfigPage({ params }: PageProps) {
  const router = useRouter();
  const { template, isLoading: loadingTemplate, isError } = useTemplate(params.id);
  const { generateAgent, isGenerating } = useGenerateAgent();
  const { previewAgent, isPreviewing } = usePreviewAgent();

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Initialize form with default config
  const form = useForm({
    defaultValues: template?.defaultConfig || {},
  });

  const { register, handleSubmit, watch, formState: { errors } } = form;
  const formValues = watch();

  // Calculate estimated price
  const estimatedPrice = useMemo(() => {
    if (!template) return 0;
    // Base price from template
    return template.basePrice;
  }, [template]);

  // Handle preview
  const onPreview = async (data: any) => {
    if (!template) return;

    try {
      const result = await previewAgent({
        buildMethod: 'TEMPLATE' as BuildMethod,
        templateId: template.id,
        templateConfig: data,
        name: data.name || template.name,
        description: data.description || template.description,
        category: template.category,
      });

      setPreviewData(result);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Failed to generate preview. Please check your configuration.');
    }
  };

  // Handle agent creation
  const onSubmit = async (data: any) => {
    if (!template) return;

    try {
      const result = await generateAgent({
        buildMethod: 'TEMPLATE' as BuildMethod,
        templateId: template.id,
        templateConfig: data,
        name: data.name || template.name,
        description: data.description || template.description,
        category: template.category,
      });

      if (result.success && result.agentId) {
        // Redirect to agent detail page
        router.push(`/agents/${result.agentId}`);
      } else {
        alert('Failed to create agent: ' + (result.errors?.[0] || 'Unknown error'));
      }
    } catch (error) {
      console.error('Agent creation failed:', error);
      alert('Failed to create agent. Please try again.');
    }
  };

  // Loading state
  if (loadingTemplate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading template...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 mb-4">Template not found</p>
          <Link href="/builder/template" className="text-blue-600 hover:underline">
            ← Back to templates
          </Link>
        </div>
      </div>
    );
  }

  const difficultyColors = {
    BEGINNER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    ADVANCED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    EXPERT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/builder/template"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </Link>
          <h1 className="text-4xl font-bold mb-2">Configure Template</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your agent settings
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Template Info */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 sticky top-4">
              {/* Icon & Name */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">{template.icon || '🤖'}</div>
                <h2 className="text-2xl font-bold mb-2">{template.name}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[template.difficulty]}`}>
                  {template.difficulty}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                {template.description}
              </p>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Features:</h3>
                <div className="space-y-2">
                  {template.modules.slice(0, 5).map((moduleId, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-blue-500">•</span>
                      <span>{moduleId.replace('module_', '').replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Complexity</span>
                  <span className="font-medium">{'⭐'.repeat(template.complexity)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Times Used</span>
                  <span className="font-medium">{template.usageCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium">{template.category}</span>
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    ${estimatedPrice.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">Estimated Price</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Configuration Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info Card */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Basic Information</h3>
                
                {/* Agent Name */}
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Agent Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register('name', { required: 'Name is required' })}
                    placeholder="My Awesome Agent"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>
                  )}
                </div>

                {/* Agent Description */}
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    {...register('description', { required: 'Description is required' })}
                    placeholder="Describe what your agent does..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description.message as string}</p>
                  )}
                </div>
              </div>

              {/* Dynamic Configuration Card */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Configuration</h3>
                
                {/* Render dynamic fields based on configSchema */}
                <DynamicFormFields
                  schema={template.configSchema}
                  register={register}
                  errors={errors}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleSubmit(onPreview)}
                  disabled={isPreviewing}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
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
                  type="submit"
                  disabled={isGenerating}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
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
            </form>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && previewData && (
          <PreviewModal
            data={previewData}
            onClose={() => setShowPreview(false)}
            onConfirm={handleSubmit(onSubmit)}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DYNAMIC FORM FIELDS COMPONENT
// ============================================================================

interface DynamicFormFieldsProps {
  schema: Record<string, any>;
  register: any;
  errors: any;
}

function DynamicFormFields({ schema, register, errors }: DynamicFormFieldsProps) {
  // Parse JSON Schema properties
  const properties = schema.properties || {};

  return (
    <div className="space-y-4">
      {Object.entries(properties).map(([key, fieldSchema]: [string, any]) => {
        // Skip name and description (already rendered)
        if (key === 'name' || key === 'description') return null;

        const isRequired = schema.required?.includes(key);

        // Render based on field type
        switch (fieldSchema.type) {
          case 'string':
            if (fieldSchema.enum) {
              // Enum: Select dropdown
              return (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium mb-2">
                    {fieldSchema.title || key} {isRequired && '*'}
                  </label>
                  <select
                    id={key}
                    {...register(key, { required: isRequired })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    {fieldSchema.enum.map((value: string) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  {errors[key] && (
                    <p className="text-red-500 text-sm mt-1">This field is required</p>
                  )}
                </div>
              );
            } else {
              // String: Text input
              return (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium mb-2">
                    {fieldSchema.title || key} {isRequired && '*'}
                  </label>
                  <input
                    id={key}
                    type="text"
                    {...register(key, { required: isRequired })}
                    placeholder={fieldSchema.description || ''}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                  {fieldSchema.description && (
                    <p className="text-gray-500 text-xs mt-1">{fieldSchema.description}</p>
                  )}
                  {errors[key] && (
                    <p className="text-red-500 text-sm mt-1">This field is required</p>
                  )}
                </div>
              );
            }

          case 'number':
          case 'integer':
            return (
              <div key={key}>
                <label htmlFor={key} className="block text-sm font-medium mb-2">
                  {fieldSchema.title || key} {isRequired && '*'}
                </label>
                <input
                  id={key}
                  type="number"
                  step={fieldSchema.type === 'number' ? '0.01' : '1'}
                  {...register(key, { 
                    required: isRequired,
                    valueAsNumber: true,
                    min: fieldSchema.minimum,
                    max: fieldSchema.maximum,
                  })}
                  placeholder={fieldSchema.description || ''}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
                {fieldSchema.description && (
                  <p className="text-gray-500 text-xs mt-1">{fieldSchema.description}</p>
                )}
                {errors[key] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors[key].message || 'This field is required'}
                  </p>
                )}
              </div>
            );

          case 'boolean':
            return (
              <div key={key} className="flex items-center gap-3">
                <input
                  id={key}
                  type="checkbox"
                  {...register(key)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={key} className="text-sm font-medium">
                  {fieldSchema.title || key}
                </label>
                {fieldSchema.description && (
                  <span className="text-gray-500 text-xs">({fieldSchema.description})</span>
                )}
              </div>
            );

          case 'array':
            return (
              <div key={key}>
                <label htmlFor={key} className="block text-sm font-medium mb-2">
                  {fieldSchema.title || key} {isRequired && '*'}
                </label>
                <input
                  id={key}
                  type="text"
                  {...register(key, { required: isRequired })}
                  placeholder="Comma-separated values"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
                {fieldSchema.description && (
                  <p className="text-gray-500 text-xs mt-1">{fieldSchema.description}</p>
                )}
                {errors[key] && (
                  <p className="text-red-500 text-sm mt-1">This field is required</p>
                )}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

// ============================================================================
// PREVIEW MODAL COMPONENT
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
                <h3 className="font-semibold mb-2">Category</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full text-sm">
                  {data.agent?.category}
                </span>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Estimated Price</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${data.agent?.price?.toFixed(2)}
                </p>
              </div>

              {data.warnings && data.warnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Warnings:
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {data.warnings.map((warning: string, idx: number) => (
                      <li key={idx} className="text-yellow-700 dark:text-yellow-300 text-sm">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                Preview Failed
              </h4>
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

