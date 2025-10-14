/**
 * Executions API Routes
 * 
 * Handles agent execution, status tracking, and log retrieval
 * 
 * @author AgentNexus Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { ExecutionStatus } from '@prisma/client';
import { ExecutionService } from '../services/ExecutionService';

const router = Router();
const executionService = new ExecutionService();

/**
 * POST /api/executions
 * Execute an agent with provided input data
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { agentId, purchaseId, inputData } = req.body;

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

    // TODO: Verify purchase/entitlement if required
    // if (!purchaseId) {
    //   return res.status(402).json({
    //     error: 'Payment required',
    //     message: 'Purchase ID required for agent execution',
    //   });
    // }

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        agentId,
        purchaseId: purchaseId || 'free-tier', // Default for testing
        inputData,
        status: ExecutionStatus.PENDING,
        startedAt: new Date(),
      },
    });

    // Start execution asynchronously
    executionService.executeAgent(execution.id, agent.id, inputData)
      .then(async (result) => {
        // Update execution with results
        await prisma.execution.update({
          where: { id: execution.id },
          data: {
            status: ExecutionStatus.COMPLETED,
            outputData: result.output,
            logs: result.logs,
            completedAt: new Date(),
          },
        });

        // Update agent statistics
        await prisma.agent.update({
          where: { id: agent.id },
          data: {
            totalExecutions: { increment: 1 },
            totalRevenue: { increment: agent.price },
          },
        });
      })
      .catch(async (error) => {
        // Update execution with error
        await prisma.execution.update({
          where: { id: execution.id },
          data: {
            status: ExecutionStatus.FAILED,
            errorMessage: error.message,
            completedAt: new Date(),
          },
        });
      });

    // Return execution ID immediately (async execution)
    res.status(202).json({
      executionId: execution.id,
      status: execution.status,
      message: 'Execution started',
    });
  } catch (error) {
    console.error('Error starting execution:', error);
    res.status(500).json({
      error: 'Failed to start execution',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/executions/:id
 * Get execution status and results
 */
router.get('/:id', async (req: Request, res: Response) => {
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

    res.json(execution);
  } catch (error) {
    console.error('Error fetching execution:', error);
    res.status(500).json({
      error: 'Failed to fetch execution',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/executions/:id/logs
 * Get execution logs
 */
router.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const execution = await prisma.execution.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        logs: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
      },
    });

    if (!execution) {
      return res.status(404).json({
        error: 'Execution not found',
        message: `No execution found with ID: ${id}`,
      });
    }

    res.json({
      executionId: execution.id,
      status: execution.status,
      logs: execution.logs || '',
      timestamps: {
        created: execution.createdAt,
        started: execution.startedAt,
        completed: execution.completedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching execution logs:', error);
    res.status(500).json({
      error: 'Failed to fetch execution logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/executions/:id/cancel
 * Cancel a running execution
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const execution = await prisma.execution.findUnique({ where: { id } });

    if (!execution) {
      return res.status(404).json({
        error: 'Execution not found',
        message: `No execution found with ID: ${id}`,
      });
    }

    // Can only cancel pending or running executions
    if (![ExecutionStatus.PENDING, ExecutionStatus.RUNNING].includes(execution.status)) {
      return res.status(400).json({
        error: 'Cannot cancel execution',
        message: `Execution is in ${execution.status} state and cannot be cancelled`,
      });
    }

    // TODO: Implement actual container cancellation
    // await executionService.cancelExecution(id);

    // Update status
    await prisma.execution.update({
      where: { id },
      data: {
        status: ExecutionStatus.CANCELLED,
        completedAt: new Date(),
        errorMessage: 'Execution cancelled by user',
      },
    });

    res.json({
      message: 'Execution cancelled successfully',
      executionId: id,
    });
  } catch (error) {
    console.error('Error cancelling execution:', error);
    res.status(500).json({
      error: 'Failed to cancel execution',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/executions
 * List executions with filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      agentId,
      status,
      page = '1',
      limit = '20',
    } = req.query;

    const where: any = {};

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


