/**
 * API Client for AgentNexus Backend
 * 
 * Centralized API client with SWR integration
 */

import axios, { AxiosError } from 'axios';
import type { Agent, AgentFilters, AgentListResponse } from '@/types/agent';

// Create axios instance
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('api_url') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';
};

const api = axios.create({
  baseURL: `${getBaseUrl()}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update baseURL before each request to ensure it captures any changes
api.interceptors.request.use((config) => {
  config.baseURL = `${getBaseUrl()}/api`;
  return config;
});

// Request interceptor for auth tokens
api.interceptors.request.use((config) => {
  // Add auth token from localStorage if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Agents API
 */
export const agentsAPI = {
  /**
   * Fetch all agents with optional filters
   */
  async list(filters?: AgentFilters): Promise<AgentListResponse> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    const { data } = await api.get<AgentListResponse>(`/agents?${params.toString()}`);
    return data;
  },

  /**
   * Fetch single agent by ID
   */
  async get(id: string): Promise<Agent> {
    const { data } = await api.get<Agent>(`/agents/${id}`);
    return data;
  },

  /**
   * Search agents (alias for list with search)
   */
  async search(query: string): Promise<Agent[]> {
    const result = await this.list({ search: query });
    return result.agents;
  },
};

/**
 * Executions API
 */
export const executionsAPI = {
  /**
   * Execute an agent
   */
  async execute(agentId: string, inputData: Record<string, any>, purchaseId?: string) {
    const { data } = await api.post('/executions', {
      agentId,
      purchaseId,
      inputData,
    });
    return data;
  },

  /**
   * Get execution by ID
   */
  async get(executionId: string) {
    const { data } = await api.get(`/executions/${executionId}`);
    return data;
  },

  /**
   * Get execution logs (streaming simulation)
   */
  async getLogs(executionId: string) {
    const { data } = await api.get(`/executions/${executionId}/logs`);
    return data;
  },

  /**
   * Cancel execution
   */
  async cancel(executionId: string) {
    const { data } = await api.post(`/executions/${executionId}/cancel`);
    return data;
  },
};

/**
 * Profile API
 */
export const profileAPI = {
  /**
   * Get user purchases
   */
  async getPurchases(userId: string) {
    const { data } = await api.get(`/users/${userId}/purchases`);
    return data;
  },

  /**
   * Get user executions
   */
  async getExecutions(userId: string) {
    const { data } = await api.get(`/users/${userId}/executions`);
    return data;
  },

  /**
   * Get user stats
   */
  async getStats(userId: string) {
    const { data } = await api.get(`/users/${userId}/stats`);
    return data;
  },
};

/**
 * Builder API
 */
export const builderAPI = {
  /**
   * Fetch all agent templates
   */
  async getTemplates() {
    const { data } = await api.get('/builder/templates');
    return data;
  },

  /**
   * Fetch single template by ID
   */
  async getTemplate(id: string) {
    const { data } = await api.get(`/builder/templates/${id}`);
    return data;
  },

  /**
   * Fetch all agent modules
   */
  async getModules() {
    const { data } = await api.get('/builder/modules');
    return data;
  },

  /**
   * Generate/create a custom agent
   */
  async generateAgent(payload: {
    name: string;
    description: string;
    category: string;
    buildMethod: 'TEMPLATE' | 'HYBRID' | 'CUSTOM';
    templateId?: string;
    templateConfig?: Record<string, any>;
    moduleIds?: string[];
    moduleConfigs?: Record<string, Record<string, any>>;
    customCode?: string;
  }) {
    const { data } = await api.post('/builder/generate', payload);
    return data;
  },

  /**
   * Preview agent without creating it
   */
  async previewAgent(payload: {
    buildMethod: 'TEMPLATE' | 'HYBRID' | 'CUSTOM';
    name: string;
    description: string;
    category: string;
    templateId?: string;
    templateConfig?: Record<string, any>;
    moduleIds?: string[];
    moduleConfigs?: Record<string, Record<string, any>>;
    customCode?: string;
  }) {
    const { data } = await api.post('/builder/preview', payload);
    return data;
  },

  /**
   * Get user's custom agents
   */
  async getMyAgents(userId: string) {
    const { data } = await api.get(`/builder/my-agents/${userId}`);
    return data;
  },

  /**
   * Update a custom agent
   */
  async updateAgent(agentId: string, updates: Record<string, any>) {
    const { data } = await api.patch(`/builder/agents/${agentId}`, updates);
    return data;
  },

  /**
   * Deploy agent to marketplace
   */
  async deployAgent(agentId: string) {
    const { data } = await api.post(`/builder/agents/${agentId}/deploy`);
    return data;
  },
};

/**
 * SWR Keys for cache management
 */
export const swrKeys = {
  agents: (filters?: AgentFilters) => ['agents', filters],
  agent: (id: string) => ['agent', id],
  execution: (id: string) => ['execution', id],
  executionLogs: (id: string) => ['execution-logs', id],
  userPurchases: (userId: string) => ['user-purchases', userId],
  userExecutions: (userId: string) => ['user-executions', userId],
  userStats: (userId: string) => ['user-stats', userId],
  templates: ['builder-templates'],
  template: (id: string) => ['builder-template', id],
  modules: ['builder-modules'],
  myCustomAgents: (userId: string) => ['my-custom-agents', userId],
};

export default api;

