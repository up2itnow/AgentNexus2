/**
 * Agent Type Definitions
 * 
 * Core types for AI agents in the marketplace
 */

export type AgentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AgentCategory = 'DATA_ANALYSIS' | 'CONTENT_CREATION' | 'AUTOMATION' | 'TRADING' | 'RESEARCH' | 'OTHER';

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  status: AgentStatus;
  price: string; // BigInt as string for JSON serialization
  imageUrl?: string;
  creatorId: string;
  creatorAddress: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  
  // Computed fields
  purchaseCount?: number;
  executionCount?: number;
  rating?: number;
}

export interface AgentFilters {
  search?: string;
  category?: AgentCategory;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'popular' | 'price_asc' | 'price_desc';
}

export interface AgentListResponse {
  agents: Agent[];
  total: number;
  page: number;
  limit: number;
}

// Category labels for UI
export const CATEGORY_LABELS: Record<AgentCategory, string> = {
  DATA_ANALYSIS: 'Data Analysis',
  CONTENT_CREATION: 'Content Creation',
  AUTOMATION: 'Automation',
  TRADING: 'Trading',
  RESEARCH: 'Research',
  OTHER: 'Other',
};

// Category descriptions
export const CATEGORY_DESCRIPTIONS: Record<AgentCategory, string> = {
  DATA_ANALYSIS: 'Analyze data, generate insights, and create visualizations',
  CONTENT_CREATION: 'Generate content, write articles, and create media',
  AUTOMATION: 'Automate tasks, workflows, and processes',
  TRADING: 'Trade assets, analyze markets, and execute strategies',
  RESEARCH: 'Research topics, gather information, and synthesize knowledge',
  OTHER: 'Miscellaneous agents',
};

