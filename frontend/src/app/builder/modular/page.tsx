/**
 * Hybrid Modular Builder - Drag-and-Drop Module Builder
 * 
 * Visual interface for combining pre-built modules into custom agents
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ArrowLeft, Eye, Loader2, Plus, Rocket, Trash2, X } from 'lucide-react';
import { useModules, useGenerateAgent, usePreviewAgent } from '@/hooks/useBuilder';
import type { AgentModule, ModuleCategory, BuildMethod } from '@/types/builder';
import { AgentCategory } from '@/types/agent';

export default function ModularBuilderPage() {
  const router = useRouter();
  const { modules, isLoading } = useModules();
  const { generateAgent, isGenerating } = useGenerateAgent();
  const { previewAgent, isPreviewing } = usePreviewAgent();

  const [selectedModules, setSelectedModules] = useState<AgentModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [moduleConfigs, setModuleConfigs] = useState<Record<string, any>>({});
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [agentCategory, setAgentCategory] = useState<AgentCategory>('GENERAL' as AgentCategory);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Calculate estimated price
  const estimatedPrice = useMemo(() => {
    const basePrice = 2.0;
    const moduleCosts = selectedModules.reduce(
      (sum, mod) => sum + mod.baseCost + mod.executionCost,
      0
    );
    
    // Complexity multiplier
    let multiplier = 1.0;
    if (selectedModules.length >= 10) multiplier = 1.4;
    else if (selectedModules.length >= 5) multiplier = 1.2;

    return (basePrice + moduleCosts) * multiplier;
  }, [selectedModules]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && over.id === 'canvas-drop-zone') {
      const module = modules.find((m) => m.id === active.id);
      if (module && !selectedModules.find((m) => m.id === module.id)) {
        setSelectedModules((prev) => [...prev, module]);
        // Initialize config with defaults
        setModuleConfigs((prev) => ({
          ...prev,
          [module.id]: module.defaultConfig,
        }));
      }
    }
  };

  // Remove module
  const removeModule = (moduleId: string) => {
    setSelectedModules((prev) => prev.filter((m) => m.id !== moduleId));
    setModuleConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[moduleId];
      return newConfigs;
    });
    if (selectedModuleId === moduleId) {
      setSelectedModuleId(null);
    }
  };

  // Clear all modules
  const clearAll = () => {
    setSelectedModules([]);
    setModuleConfigs({});
    setSelectedModuleId(null);
  };

  // Handle preview
  const handlePreview = async () => {
    if (selectedModules.length === 0) {
      alert('Please add at least one module');
      return;
    }

    if (!agentName || !agentDescription) {
      alert('Please provide agent name and description');
      return;
    }

    try {
      const result = await previewAgent({
        buildMethod: 'HYBRID' as BuildMethod,
        moduleIds: selectedModules.map((m) => m.id),
        moduleConfigs,
        name: agentName,
        description: agentDescription,
        category: agentCategory,
      });

      setPreviewData(result);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Failed to generate preview');
    }
  };

  // Handle agent creation
  const handleCreate = async () => {
    if (selectedModules.length === 0) {
      alert('Please add at least one module');
      return;
    }

    if (!agentName || !agentDescription) {
      alert('Please provide agent name and description');
      return;
    }

    try {
      const result = await generateAgent({
        buildMethod: 'HYBRID' as BuildMethod,
        moduleIds: selectedModules.map((m) => m.id),
        moduleConfigs,
        name: agentName,
        description: agentDescription,
        category: agentCategory,
      });

      if (result.success && result.agentId) {
        router.push(`/agents/${result.agentId}`);
      } else {
        alert('Failed to create agent: ' + (result.errors?.[0] || 'Unknown error'));
      }
    } catch (error) {
      console.error('Agent creation failed:', error);
      alert('Failed to create agent');
    }
  };

  const selectedModule = selectedModuleId
    ? selectedModules.find((m) => m.id === selectedModuleId)
    : null;

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
            <h1 className="text-2xl font-bold">Modular Builder</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Estimated Price</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${estimatedPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Module Library */}
          <ModuleLibrary modules={modules} isLoading={isLoading} />

          {/* Center: Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Agent Info Form */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Agent Name *"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Agent Description *"
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={agentCategory}
                  onChange={(e) => setAgentCategory(e.target.value as AgentCategory)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GENERAL">General</option>
                  <option value="CRYPTO">Crypto</option>
                  <option value="TRADING">Trading</option>
                  <option value="SOCIAL">Social</option>
                  <option value="DEFI">DeFi</option>
                </select>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 p-4 overflow-auto">
              <BuilderCanvas
                modules={selectedModules}
                onSelectModule={setSelectedModuleId}
                onRemoveModule={removeModule}
                selectedModuleId={selectedModuleId}
              />
            </div>

            {/* Bottom Action Bar */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} added
                  </span>
                  {selectedModules.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handlePreview}
                    disabled={isPreviewing || selectedModules.length === 0}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
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
                    disabled={isGenerating || selectedModules.length === 0}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
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
          </div>

          {/* Right: Configuration Panel */}
          {selectedModule && (
            <ConfigPanel
              module={selectedModule}
              config={moduleConfigs[selectedModule.id] || {}}
              onConfigChange={(config) => {
                setModuleConfigs((prev) => ({
                  ...prev,
                  [selectedModule.id]: config,
                }));
              }}
              onClose={() => setSelectedModuleId(null)}
            />
          )}
        </div>

        <DragOverlay>
          {activeId ? (
            <ModuleCardDragging module={modules.find((m) => m.id === activeId)!} />
          ) : null}
        </DragOverlay>
      </DndContext>

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
// MODULE LIBRARY COMPONENT
// ============================================================================

interface ModuleLibraryProps {
  modules: AgentModule[];
  isLoading: boolean;
}

function ModuleLibrary({ modules, isLoading }: ModuleLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ModuleCategory | 'ALL'>('ALL');

  const filteredModules = useMemo(() => {
    return modules.filter((module) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !module.name.toLowerCase().includes(query) &&
          !module.displayName.toLowerCase().includes(query) &&
          !module.description.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      if (categoryFilter !== 'ALL' && module.category !== categoryFilter) {
        return false;
      }

      return module.isActive;
    });
  }, [modules, searchQuery, categoryFilter]);

  const categorizedModules = useMemo(() => {
    const categories: Record<ModuleCategory, AgentModule[]> = {
      DATA_SOURCE: [],
      ANALYSIS: [],
      TRIGGER: [],
      ACTION: [],
      UTILITY: [],
    };

    filteredModules.forEach((module) => {
      categories[module.category].push(module);
    });

    return categories;
  }, [filteredModules]);

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold mb-3">Module Library</h2>
        <input
          type="text"
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(categorizedModules).map(([category, mods]) =>
              mods.length > 0 ? (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {getCategoryIcon(category as ModuleCategory)} {category.replace('_', ' ')}
                  </h3>
                  <div className="space-y-2">
                    {mods.map((module) => (
                      <ModuleCard key={module.id} module={module} />
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MODULE CARD COMPONENTS
// ============================================================================

import { useDraggable } from '@dnd-kit/core';

interface ModuleCardProps {
  module: AgentModule;
}

function ModuleCard({ module }: ModuleCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: module.id,
    data: module,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{module.displayName}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 mt-1">
            {module.description}
          </p>
        </div>
        <span className="text-lg ml-2">{module.icon || '📦'}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">Cost</span>
        <span className="font-medium text-blue-600 dark:text-blue-400">
          ${(module.baseCost + module.executionCost).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function ModuleCardDragging({ module }: { module: AgentModule }) {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg p-3 shadow-xl w-64">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{module.icon || '📦'}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{module.displayName}</h4>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BUILDER CANVAS COMPONENT
// ============================================================================

import { useDroppable } from '@dnd-kit/core';

interface BuilderCanvasProps {
  modules: AgentModule[];
  onSelectModule: (id: string) => void;
  onRemoveModule: (id: string) => void;
  selectedModuleId: string | null;
}

function BuilderCanvas({
  modules,
  onSelectModule,
  onRemoveModule,
  selectedModuleId,
}: BuilderCanvasProps) {
  const { setNodeRef } = useDroppable({
    id: 'canvas-drop-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className="h-full bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6"
    >
      {modules.length === 0 ? (
        <div className="h-full flex items-center justify-center text-center">
          <div>
            <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-500 text-lg mb-2">
              Drag modules here to build your agent
            </p>
            <p className="text-gray-400 text-sm">Start by dragging a data source module</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {modules.map((module, index) => (
            <ModuleNode
              key={module.id}
              module={module}
              index={index}
              isSelected={selectedModuleId === module.id}
              onClick={() => onSelectModule(module.id)}
              onRemove={() => onRemoveModule(module.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MODULE NODE COMPONENT
// ============================================================================

interface ModuleNodeProps {
  module: AgentModule;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onRemove: () => void;
}

function ModuleNode({ module, index, isSelected, onClick, onRemove }: ModuleNodeProps) {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white dark:bg-gray-900 border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
        isSelected
          ? 'border-blue-500 shadow-lg'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
      }`}
    >
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 rounded-full transition-colors"
      >
        <X className="w-3 h-3 text-red-600 dark:text-red-400" />
      </button>

      {/* Module content */}
      <div className="pr-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{module.icon || '📦'}</span>
          <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
        </div>
        <h4 className="font-semibold text-sm mb-1">{module.displayName}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
          {module.description}
        </p>
      </div>

      {/* Category badge */}
      <div className="mt-3">
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full">
          {module.category}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// CONFIG PANEL COMPONENT
// ============================================================================

interface ConfigPanelProps {
  module: AgentModule;
  config: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
  onClose: () => void;
}

function ConfigPanel({ module, config, onConfigChange, onClose }: ConfigPanelProps) {
  const handleFieldChange = (field: string, value: any) => {
    onConfigChange({
      ...config,
      [field]: value,
    });
  };

  const schema = module.configSchema || {};
  const properties = schema.properties || {};

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-bold">Configure Module</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Module Info */}
        <div>
          <div className="text-3xl mb-2">{module.icon || '📦'}</div>
          <h4 className="font-bold text-lg">{module.displayName}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{module.description}</p>
        </div>

        {/* Configuration Fields */}
        {Object.entries(properties).map(([key, fieldSchema]: [string, any]) => {
          const value = config[key] ?? fieldSchema.default;

          return (
            <div key={key}>
              <label className="block text-sm font-medium mb-2">
                {fieldSchema.title || key}
              </label>
              
              {fieldSchema.type === 'string' && fieldSchema.enum ? (
                <select
                  value={value || ''}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select...</option>
                  {fieldSchema.enum.map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : fieldSchema.type === 'number' || fieldSchema.type === 'integer' ? (
                <input
                  type="number"
                  value={value || 0}
                  onChange={(e) => handleFieldChange(key, Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
                />
              ) : fieldSchema.type === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={value || false}
                  onChange={(e) => handleFieldChange(key, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              ) : (
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
                />
              )}
              
              {fieldSchema.description && (
                <p className="text-xs text-gray-500 mt-1">{fieldSchema.description}</p>
              )}
            </div>
          );
        })}

        {/* Module Dependencies */}
        {module.dependencies && module.dependencies.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <h5 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Dependencies:
            </h5>
            <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              {module.dependencies.map((dep) => (
                <li key={dep}>• {dep}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
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

// ============================================================================
// HELPERS
// ============================================================================

function getCategoryIcon(category: ModuleCategory): string {
  const icons: Record<ModuleCategory, string> = {
    DATA_SOURCE: '📡',
    ANALYSIS: '📊',
    TRIGGER: '⏰',
    ACTION: '🎯',
    UTILITY: '🔧',
  };
  return icons[category] || '📦';
}

