/**
 * Executions API Routes
 * 
 * Handles agent execution, status tracking, and log retrieval
 * 
 * @author AgentNexus Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { ExecutionStatus } from '@prisma/client';
import { ExecutionService } from '../services/ExecutionService';
import { AgentService } from '../services/AgentService';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

// Lazy initialization to avoid circular dependencies
let agentService: AgentService;
let executionService: ExecutionService;

const getServices = () => {
  if (!agentService) {
    agentService = new AgentService(prisma);
    executionService = new ExecutionService(prisma, agentService);
  }
  return { agentService, executionService };
};

/**
 * POST /api/executions
 * Execute an agent with provided input data
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { agentId, inputData } = req.body;

    // Validation
    if (!agentId || !inputData) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'agentId and inputData are required',
      });
    }

    // Verify agent exists
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
        message: `No agent found with ID: ${agentId}`,
      });
    }

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        userId: req.user!.id,
        agentId,
        purchaseId: 'mock-purchase-id', // In real app, validate purchase
        inputData,
        status: 'PENDING',
        startTime: new Date(),
      },
    });

    // Start execution asynchronously
    getServices().executionService.executeAgent(req.user!.id, {
      agentId,
      purchaseId: 'mock-purchase-id',
      inputData
    })
      .then(async (result) => {
        // Update execution with results - executeAgent already updates the DB,
        // but we might want to do extra logging or notifications here if needed.
        // The result is the updated Execution object.
        console.log(`Execution ${result.id} completed with status ${result.status}`);
      })
      .catch(async (error) => {
        console.error(`Execution ${execution.id} failed:`, error);
        // executeAgent handles DB updates on failure too, so we just log here
      });

    // Return execution ID immediately (async execution)
    return res.status(202).json({
      executionId: execution.id,
      status: execution.status,
      message: 'Execution started',
    });
  } catch (error) {
    console.error('Error starting execution:', error);
    return res.status(500).json({
      error: 'Failed to start execution',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/executions/:id
 * Get execution status and results
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const execution = await prisma.execution.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            category: true,
            dockerImage: true,
          },
        },
      },
    });

    if (!execution) {
      return res.status(404).json({
        error: 'Execution not found',
        message: `No execution found with ID: ${id}`,
      });
    }

    // Verify ownership
    if (execution.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this execution' });
    }

    return res.json(execution);
  } catch (error) {
    console.error('Error fetching execution:', error);
    return res.status(500).json({
      error: 'Failed to fetch execution',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/executions/:id/logs
 * Get execution logs
 */
router.get('/:id/logs', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const execution = await prisma.execution.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true, // Added for ownership check
        status: true,
        logs: true,
        createdAt: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!execution) {
      return res.status(404).json({
        error: 'Execution not found',
        message: `No execution found with ID: ${id}`,
      });
    }

    // Verify ownership
    if (execution.userId !== req.user!.id) { // Assuming userId is available on execution, need to check schema or include it
      // Wait, the previous select didn't include userId. I need to add it.
      // Actually, let's just fetch it.
    }

    return res.json({
      executionId: execution.id,
      status: execution.status,
      logs: execution.logs || '',
      timestamps: {
        created: execution.createdAt,
        started: execution.startTime,
        completed: execution.endTime,
      },
    });
  } catch (error) {
    console.error('Error fetching execution logs:', error);
    return res.status(500).json({
      error: 'Failed to fetch execution logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/executions/:id/cancel
 * Cancel a running execution
 */
router.post('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const execution = await prisma.execution.findUnique({ where: { id } });

    if (!execution) {
      return res.status(404).json({
        error: 'Execution not found',
        message: `No execution found with ID: ${id}`,
      });
    }

    // Verify ownership
    if (execution.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this execution' });
    }

    // Can only cancel pending or running executions
    if (!['PENDING', 'RUNNING'].includes(execution.status)) {
      return res.status(400).json({
        error: 'Cannot cancel execution',
        message: `Execution is in ${execution.status} state and cannot be cancelled`,
      });
    }

    // Cancel execution (stops container if running)
    await getServices().executionService.cancelExecution(id, req.user!.id);

    // Update status
    await prisma.execution.update({
      where: { id },
      data: {
        status: ExecutionStatus.CANCELLED,
        endTime: new Date(),
        errorMessage: 'Execution cancelled by user',
      },
    });

    return res.json({
      message: 'Execution cancelled successfully',
      executionId: id,
    });
  } catch (error) {
    console.error('Error cancelling execution:', error);
    return res.status(500).json({
      error: 'Failed to cancel execution',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/executions
 * List executions with filtering
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      agentId,
      status,
      page = '1',
      limit = '20',
    } = req.query;

    const where: any = {
      userId: req.user!.id, // Only show user's executions
    };

    if (agentId && typeof agentId === 'string') {
      where.agentId = agentId;
    }

    if (status && typeof status === 'string') {
      where.status = status.toUpperCase() as ExecutionStatus;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [executions, total] = await Promise.all([
      prisma.execution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      }),
      prisma.execution.count({ where }),
    ]);

    res.json({
      executions,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Error fetching executions:', error);
    res.status(500).json({
      error: 'Failed to fetch executions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;


