/**
 * Agents API Routes
 * 
 * Handles agent listing, retrieval, creation, and management
 * 
 * @author AgentNexus Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { AgentCategory, AgentStatus } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { x402Paywall, x402Enabled } from '../middleware/x402';

const router: Router = Router();

/**
 * GET /api/agents
 * List all agents with optional filtering and sorting
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sortBy = 'newest',
      page = '1',
      limit = '20',
    } = req.query;

    // Build where clause
    const where: any = {
      status: AgentStatus.ACTIVE,
    };

    // Search filter
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Category filter with validation
    if (category && typeof category === 'string') {
      const upperCategory = category.toUpperCase();
      const validCategories = Object.values(AgentCategory);
      if (validCategories.includes(upperCategory as AgentCategory)) {
        where.category = upperCategory as AgentCategory;
      } else {
        // Return 400 for invalid category instead of letting Prisma throw
        return res.status(400).json({
          error: 'Invalid category',
          message: `Category must be one of: ${validCategories.join(', ')}`,
        });
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' }; // Default: newest
    switch (sortBy) {
      case 'popular':
        orderBy = { totalExecutions: 'desc' };
        break;
      case 'price-low':
        orderBy = { price: 'asc' };
        break;
      case 'price-high':
        orderBy = { price: 'desc' };
        break;
      case 'revenue':
        orderBy = { totalRevenue: 'desc' };
        break;
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Fetch agents and total count
    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          price: true,
          dockerImage: true,
          developerWallet: true,
          status: true,
          totalExecutions: true,
          totalRevenue: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.agent.count({ where }),
    ]);

    // Return just the array for test compatibility
    // Pagination info available via headers if needed
    res.set('X-Total-Count', total.toString());
    res.set('X-Page', pageNum.toString());
    res.set('X-Limit', limitNum.toString());
    res.set('X-Total-Pages', Math.ceil(total / limitNum).toString());

    return res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return res.status(500).json({
      error: 'Failed to fetch agents',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/agents/:id
 * Get a single agent by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        executions: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
        message: `No agent found with ID: ${id}`,
      });
    }

    return res.json(agent);
  } catch (error) {
    console.error('Error fetching agent:', error);
    return res.status(500).json({
      error: 'Failed to fetch agent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/agents
 * Create a new agent (requires authentication)
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      category,
      price,
      developerWallet,
      dockerImage,
      inputSchema,
      outputSchema,
    } = req.body;

    // Validation
    if (!name || !description || !category || !developerWallet || !dockerImage) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name, description, category, developerWallet, and dockerImage are required',
      });
    }

    // Validate category
    if (!Object.values(AgentCategory).includes(category as AgentCategory)) {
      return res.status(400).json({
        error: 'Invalid category',
        message: `Category must be one of: ${Object.values(AgentCategory).join(', ')}`,
      });
    }

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        category: category as AgentCategory,
        price: parseFloat(price),
        developer: req.user!.id, // Pass ID directly as string
        developerWallet,
        dockerImage,
        inputSchema: inputSchema || {},
        outputSchema: outputSchema || {},
        status: 'UNDER_REVIEW',
      },
    });

    return res.status(201).json(agent);
  } catch (error) {
    console.error('Error creating agent:', error);
    return res.status(500).json({ error: 'Failed to create agent' });
  }
});

/**
 * PATCH /api/agents/:id
 * Update agent (requires authentication and ownership)
 */
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, dockerImage, inputSchema, outputSchema } = req.body;

    // Check if agent exists
    const existingAgent = await prisma.agent.findUnique({ where: { id } });
    if (!existingAgent) {
      return res.status(404).json({
        error: 'Agent not found',
        message: `No agent found with ID: ${id}`,
      });
    }

    // Verify ownership
    if (existingAgent.developer !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this agent' });
    }

    // Update agent
    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(dockerImage && { dockerImage }),
        ...(inputSchema && { inputSchema }),
        ...(outputSchema && { outputSchema }),
      },
    });

    return res.json(updatedAgent);
  } catch (error) {
    console.error('Error updating agent:', error);
    return res.status(500).json({
      error: 'Failed to update agent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/agents/:id
 * Delete/deactivate agent (requires authentication and ownership)
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if agent exists
    const existingAgent = await prisma.agent.findUnique({ where: { id } });
    if (!existingAgent) {
      return res.status(404).json({
        error: 'Agent not found',
        message: `No agent found with ID: ${id}`,
      });
    }

    // Verify ownership
    if (existingAgent.developer !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this agent' });
    }

    // Soft delete by setting status to INACTIVE
    await prisma.agent.update({
      where: { id },
      data: { status: AgentStatus.INACTIVE },
    });

    return res.json({ message: 'Agent deactivated successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return res.status(500).json({
      error: 'Failed to delete agent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// x402 Premium Endpoints (Optional, disabled by default)
// Requires ENABLE_X402=true in environment
// ============================================

/**
 * GET /api/agents/:id/premium-analytics
 * Premium analytics data for an agent - requires x402 payment when enabled
 * 
 * Price: 0.05 USDC per request
 */
router.get(
  '/:id/premium-analytics',
  x402Paywall('0.05', 'Premium agent analytics access'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const agent = await prisma.agent.findUnique({
        where: { id },
        include: {
          executions: {
            select: {
              id: true,
              status: true,
              duration: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
          purchases: {
            select: {
              id: true,
              amount: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!agent) {
        return res.status(404).json({
          error: 'Agent not found',
          message: `No agent found with ID: ${id}`,
        });
      }

      // Calculate premium analytics
      const executions = agent.executions;
      const successfulExecutions = executions.filter(e => e.status === 'COMPLETED');
      const avgDuration = successfulExecutions.length > 0
        ? successfulExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / successfulExecutions.length
        : 0;

      const analytics = {
        agentId: agent.id,
        agentName: agent.name,
        metrics: {
          totalExecutions: agent.totalExecutions,
          successRate: executions.length > 0
            ? (successfulExecutions.length / executions.length * 100).toFixed(2) + '%'
            : 'N/A',
          averageExecutionTime: Math.round(avgDuration) + 'ms',
          totalRevenue: agent.totalRevenue.toString(),
          recentExecutions: executions.length,
        },
        revenueBreakdown: {
          last7Days: agent.purchases
            .filter(p => new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            .reduce((sum, p) => sum + Number(p.amount), 0),
          last30Days: agent.purchases
            .filter(p => new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
            .reduce((sum, p) => sum + Number(p.amount), 0),
        },
        executionTrend: executions.slice(0, 10).map(e => ({
          status: e.status,
          duration: e.duration,
          date: e.createdAt,
        })),
        generatedAt: new Date().toISOString(),
      };

      return res.json(analytics);
    } catch (error) {
      console.error('Error fetching premium analytics:', error);
      return res.status(500).json({
        error: 'Failed to fetch analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/agents/:id/detailed-metrics
 * Detailed performance metrics for an agent - requires x402 payment when enabled
 * 
 * Price: 0.02 USDC per request
 */
router.get(
  '/:id/detailed-metrics',
  x402Paywall('0.02', 'Detailed agent performance metrics'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const agent = await prisma.agent.findUnique({
        where: { id },
        include: {
          executions: {
            select: {
              status: true,
              duration: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
          },
        },
      });

      if (!agent) {
        return res.status(404).json({
          error: 'Agent not found',
          message: `No agent found with ID: ${id}`,
        });
      }

      const executions = agent.executions;
      const statusCounts = executions.reduce((acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const durationBuckets = {
        '<1s': 0,
        '1-5s': 0,
        '5-30s': 0,
        '30s-2m': 0,
        '>2m': 0,
      };

      executions.forEach(e => {
        const d = e.duration || 0;
        if (d < 1000) durationBuckets['<1s']++;
        else if (d < 5000) durationBuckets['1-5s']++;
        else if (d < 30000) durationBuckets['5-30s']++;
        else if (d < 120000) durationBuckets['30s-2m']++;
        else durationBuckets['>2m']++;
      });

      const metrics = {
        agentId: agent.id,
        agentName: agent.name,
        performanceMetrics: {
          statusDistribution: statusCounts,
          durationDistribution: durationBuckets,
          totalSamples: executions.length,
        },
        categoryInsights: {
          category: agent.category,
          featured: agent.featured,
          version: agent.version,
        },
        generatedAt: new Date().toISOString(),
      };

      return res.json(metrics);
    } catch (error) {
      console.error('Error fetching detailed metrics:', error);
      return res.status(500).json({
        error: 'Failed to fetch metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/agents/x402/status
 * Check x402 payment status and configuration
 */
router.get('/x402/status', (_req: Request, res: Response) => {
  return res.json({
    enabled: x402Enabled(),
    endpoints: [
      {
        path: '/api/agents/:id/premium-analytics',
        priceUsdc: '0.05',
        description: 'Premium agent analytics access',
      },
      {
        path: '/api/agents/:id/detailed-metrics',
        priceUsdc: '0.02',
        description: 'Detailed agent performance metrics',
      },
    ],
    network: process.env.X402_NETWORK || 'base-sepolia',
  });
});

export default router;
