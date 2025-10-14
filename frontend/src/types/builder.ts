/**
 * AgentNexus Builder - Type Definitions
 * 
 * Types for the agent builder feature including templates, modules,
 * custom agents, and build configurations
 */

import type { AgentCategory } from './agent';

// ============================================================================
// ENUMS
// ============================================================================

export enum TemplateDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum BuildMethod {
  TEMPLATE = 'TEMPLATE',      // Method 1: Pre-built template
  HYBRID = 'HYBRID',          // Method 2: Modular builder
  CUSTOM = 'CUSTOM',          // Method 3: Custom code
}

export enum ModuleCategory {
  DATA_SOURCE = 'DATA_SOURCE',    // APIs, blockchain data, social media
  ANALYSIS = 'ANALYSIS',          // Sentiment, technical, fundamental
  TRIGGER = 'TRIGGER',            // Time-based, event-based, threshold
  ACTION = 'ACTION',              // Alerts, reports, trades
  UTILITY = 'UTILITY',            // Helpers, formatters, validators
}

// ============================================================================
// AGENT TEMPLATE
// ============================================================================

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  difficulty: TemplateDifficulty;
  basePrice: number;
  complexity: number; // 1-5 rating
  
  // Template configuration
  modules: string[]; // Available module IDs
  configSchema: Record<string, any>; // JSON Schema
  defaultConfig: Record<string, any>;
  exampleConfig?: Record<string, any>;
  
  // Metadata
  icon?: string;
  featured: boolean;
  isActive: boolean;
  usageCount: number;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// AGENT MODULE
// ============================================================================

export interface AgentModule {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: ModuleCategory;
  
  // Pricing
  baseCost: number;
  executionCost: number;
  
  // Configuration
  configSchema: Record<string, any>; // JSON Schema
  defaultConfig: Record<string, any>;
  dependencies: string[]; // Required module IDs
  
  // Metadata
  icon?: string;
  isActive: boolean;
  difficulty: number; // 1-5
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CUSTOM AGENT
// ============================================================================

export interface CustomAgent {
  id: string;
  agentId: string; // Links to Agent model
  templateId?: string; // Source template (null if from scratch)
  creatorId: string;
  
  // Build configuration
  buildMethod: BuildMethod;
  configuration: Record<string, any>;
  selectedModules: string[]; // Module IDs
  customCode?: string; // For advanced builder
  
  // Status
  isPublic: boolean;
  isDeployed: boolean;
  deployedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// BUILDER STATE
// ============================================================================

export interface BuilderState {
  // Current step in the build process
  step: BuildStep;
  
  // Selected build method
  buildMethod?: BuildMethod;
  
  // Template-based (Method 1)
  selectedTemplate?: AgentTemplate;
  templateConfig?: Record<string, any>;
  
  // Hybrid modular (Method 2)
  selectedModules?: AgentModule[];
  moduleConfigs?: Record<string, Record<string, any>>; // moduleId -> config
  
  // Custom code (Method 3)
  customCode?: string;
  
  // Common fields
  agentName?: string;
  agentDescription?: string;
  agentCategory?: AgentCategory;
  
  // Calculated
  estimatedPrice?: number;
  
  // Preview
  previewResult?: PreviewResult;
  
  // Validation
  errors?: Record<string, string>;
}

export enum BuildStep {
  SELECT_METHOD = 'SELECT_METHOD',
  CONFIGURE = 'CONFIGURE',
  PREVIEW = 'PREVIEW',
  DEPLOY = 'DEPLOY',
}

// ============================================================================
// PREVIEW & GENERATION
// ============================================================================

export interface PreviewResult {
  success: boolean;
  agent?: {
    name: string;
    description: string;
    category: AgentCategory;
    price: number;
    dockerImage: string;
    inputSchema: Record<string, any>;
    outputSchema: Record<string, any>;
  };
  errors?: string[];
  warnings?: string[];
}

export interface GenerateAgentRequest {
  buildMethod: BuildMethod;
  
  // Template-based
  templateId?: string;
  templateConfig?: Record<string, any>;
  
  // Hybrid
  moduleIds?: string[];
  moduleConfigs?: Record<string, Record<string, any>>;
  
  // Custom
  customCode?: string;
  
  // Common
  name: string;
  description: string;
  category: AgentCategory;
}

export interface GenerateAgentResponse {
  success: boolean;
  customAgentId?: string;
  agentId?: string;
  estimatedPrice?: number;
  errors?: string[];
}

// Payload types for API calls
export interface GenerateAgentPayload extends GenerateAgentRequest {}

export interface PreviewAgentPayload {
  buildMethod: BuildMethod;
  name: string;
  description: string;
  category: AgentCategory;
  templateId?: string;
  templateConfig?: Record<string, any>;
  moduleIds?: string[];
  moduleConfigs?: Record<string, Record<string, any>>;
  customCode?: string;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface BuilderUIState {
  // Loading states
  isLoadingTemplates: boolean;
  isLoadingModules: boolean;
  isGenerating: boolean;
  isPreviewing: boolean;
  isDeploying: boolean;
  
  // Modal states
  showTemplateModal: boolean;
  showModuleModal: boolean;
  showPreviewModal: boolean;
  showDeployModal: boolean;
  
  // Selected items
  selectedTemplateId?: string;
  selectedModuleIds: string[];
  
  // Errors
  error?: string;
}

// ============================================================================
// FILTERS
// ============================================================================

export interface TemplateFilters {
  category?: AgentCategory;
  difficulty?: TemplateDifficulty;
  search?: string;
  featured?: boolean;
}

export interface ModuleFilters {
  category?: ModuleCategory;
  search?: string;
  maxCost?: number;
}
