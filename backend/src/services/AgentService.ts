/**
 * AgentService - Agent Marketplace Business Logic Layer
 * 
 * This service handles all agent-related operations for the AgentNexus marketplace.
 * It abstracts database operations and provides a clean API for controllers.
 * 
 * RESPONSIBILITIES:
 * =================
 * - Agent CRUD (Create, Read, Update, Delete)
 * - Marketplace filtering and search
 * - Agent statistics aggregation
 * - Developer validation
 * - Status management (ACTIVE, PAUSED, DEPRECATED)
 * 
 * ARCHITECTURE PATTERN:
 * =====================
 * Service Layer Pattern - Separates business logic from data access and controllers
 * - Controllers handle HTTP requests/responses
 * - Services implement business logic and validation
 * - Prisma ORM handles database queries
 * 
 * DATA MODEL:
 * ===========
 * Agent {
 *   id: string (UUID)
 *   name: string
 *   description: string
 *   category: string (e.g., "trading", "analytics")
 *   price: BigInt (in wei)
 *   dockerImage: string (e.g., "ghcr.io/user/agent:v1.0")
 *   inputSchema: JSON (defines expected parameters)
 *   developer: string (user ID)
 *   status: ACTIVE | PAUSED | DEPRECATED
 *   featured: boolean (shown first in marketplace)
 *   totalExecutions: number
 *   successRate: number (0-100)
 * }
 * 
 * BUSINESS RULES:
 * ===============
 * 1. Only ACTIVE agents shown by default in marketplace
 * 2. Featured agents appear first in listings
 * 3. Developer can pause/unpause their own agents
 * 4. Admin can mark agents as deprecated
 * 5. Stats are denormalized for performance (updated on each execution)
 * 
 * PERFORMANCE CONSIDERATIONS:
 * ===========================
 * - Pagination (20 agents per page by default)
 * - Index on: status, category, developer, featured
 * - Denormalized stats (avoid COUNT queries on every request)
 * - Search uses Prisma's insensitive mode (case-insensitive)
 * 
 * FUTURE ENHANCEMENTS:
 * ====================
 * - Full-text search (Postgres FTS or Algolia)
 * - Caching layer (Redis) for frequently accessed agents
 * - Rating/review system
 * - Agent versioning
 * 
 * @author AgentNexus Team ()
 */

import { PrismaClient, Agent, AgentStatus } from '@prisma/client';
import {
  AgentFilters,
  AgentStats,
  CreateAgentDto,
  UpdateAgentDto,
  NotFoundError,
  ValidationError,
  ConflictError
} from '../types';

/**
 * Service for managing AI agents in the marketplace
 * All methods are async and return Promises
 */
export class AgentService {
  /**
   * Initialize service with Prisma database client
   * @param prisma - Prisma client for database operations
   */
  constructor(private prisma: PrismaClient) {}

  /**
   * List agents with filtering, search, and pagination
   * 
   * This is the primary endpoint for the marketplace homepage.
   * Supports flexible filtering by category, status, price range, developer, etc.
   * 
   * FILTERING LOGIC:
   * - Default: Only ACTIVE agents (hides paused/deprecated)
   * - Featured agents always appear first
   * - Then sort by popularity (totalExecutions)
   * - Finally sort by creation date (newest first)
   * 
   * SEARCH:
   * - Case-insensitive search on name and description
   * - Uses Prisma's `contains` mode
   * - Consider full-text search for production (Postgres FTS)
   * 
   * PAGINATION:
   * - Default 20 agents per page
   * - Returns total count for pagination UI
   * - Frontend uses this to calculate total pages
   * 
   * @param filters - Optional filters (category, price range, featured, etc.)
   * @param page - Page number (1-indexed)
   * @param limit - Agents per page (default: 20)
   * @returns Object with agents array and total count
   * 
   * @example
   * ```typescript
   * const result = await agentService.listAgents(
   *   { category: 'trading', featured: true },
   *   1,
   *   10
   * );
   * console.log(result.agents); // Array of 10 agents
   * console.log(result.total); // Total matching agents
   * ```
   */
  async listAgents(
    filters: AgentFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ agents: Agent[]; total: number }> {
    const where: any = {};

    // Apply filters
    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.status) {
      where.status = filters.status;
    } else {
      // Default to only active agents
      where.status = 'ACTIVE';
    }

    if (filters.featured !== undefined) {
      where.featured = filters.featured;
    }

    if (filters.developer) {
      where.developer = filters.developer;
    }

    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) {
        where.price.gte = filters.minPrice.toString();
      }
      if (filters.maxPrice) {
        where.price.lte = filters.maxPrice.toString();
      }
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [agents, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { featured: 'desc' },
          { totalExecutions: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      this.prisma.agent.count({ where })
    ]);

    return { agents, total };
  }

  /**
   * Get agent by ID
   */
  async getAgentById(id: string): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({
      where: { id }
    });

    if (!agent) {
      throw new NotFoundError('Agent');
    }

    return agent;
  }

  /**
   * Create new agent
   */
  async createAgent(data: CreateAgentDto): Promise<Agent> {
    // Validate docker image format
    if (!data.dockerImage.includes(':')) {
      throw new ValidationError('Docker image must include a tag (e.g., image:latest)');
    }

    // Check for duplicate name by same developer
    const existing = await this.prisma.agent.findFirst({
      where: {
        name: data.name,
        developer: data.developer
      }
    });

    if (existing) {
      throw new ConflictError('Agent with this name already exists for this developer');
    }

    const agent = await this.prisma.agent.create({
      data: {
        ...data,
        status: 'ACTIVE',
        featured: data.featured || false,
        totalExecutions: 0,
        totalRevenue: '0'
      }
    });

    return agent;
  }

  /**
   * Update existing agent
   */
  async updateAgent(id: string, data: UpdateAgentDto): Promise<Agent> {
    // Verify agent exists
    await this.getAgentById(id);

    // Validate docker image if provided
    if (data.dockerImage && !data.dockerImage.includes(':')) {
      throw new ValidationError('Docker image must include a tag');
    }

    const agent = await this.prisma.agent.update({
      where: { id },
      data
    });

    return agent;
  }

  /**
   * Delete agent (soft delete by setting status to INACTIVE)
   */
  async deleteAgent(id: string): Promise<void> {
    await this.prisma.agent.update({
      where: { id },
      data: { status: 'INACTIVE' as AgentStatus }
    });
  }

  /**
   * Get agent execution statistics
   */
  async getAgentStats(id: string): Promise<AgentStats> {
    const agent = await this.getAgentById(id);

    // Get execution statistics
    const executions = await this.prisma.execution.findMany({
      where: { agentId: id },
      select: {
        status: true,
        duration: true,
        createdAt: true
      }
    });

    const successfulExecutions = executions.filter((e: any) => e.status === 'COMPLETED');
    const totalExecutions = executions.length;
    const successRate = totalExecutions > 0
      ? (successfulExecutions.length / totalExecutions) * 100
      : 0;

    const avgExecutionTime = successfulExecutions.length > 0
      ? successfulExecutions.reduce((sum: number, e: any) => sum + (e.duration || 0), 0) / successfulExecutions.length
      : undefined;

    const lastExecution = executions.length > 0
      ? executions.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())[0]
      : undefined;

    return {
      totalExecutions: agent.totalExecutions,
      totalRevenue: agent.totalRevenue.toString(),
      averageExecutionTime: avgExecutionTime,
      successRate,
      lastExecutionAt: lastExecution?.createdAt
    };
  }

  /**
   * Increment execution count
   */
  async incrementExecutions(id: string, revenue: string): Promise<void> {
    await this.prisma.agent.update({
      where: { id },
      data: {
        totalExecutions: { increment: 1 },
        totalRevenue: { increment: revenue }
      }
    });
  }

  /**
   * Get featured agents
   */
  async getFeaturedAgents(limit: number = 10): Promise<Agent[]> {
    return this.prisma.agent.findMany({
      where: {
        featured: true,
        status: 'ACTIVE'
      },
      take: limit,
      orderBy: { totalExecutions: 'desc' }
    });
  }

  /**
   * Get agents by category
   */
  async getAgentsByCategory(category: string, limit: number = 20): Promise<Agent[]> {
    return this.prisma.agent.findMany({
      where: {
        category: category as any,
        status: 'ACTIVE'
      },
      take: limit,
      orderBy: { totalExecutions: 'desc' }
    });
  }
}

