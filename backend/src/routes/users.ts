/**
 * Users API Routes
 * 
 * Handles user profile, purchases, executions, and statistics
 * 
 * @author AgentNexus Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { PurchaseStatus, ExecutionStatus } from '@prisma/client';

const router = Router();

/**
 * GET /api/users/:id/purchases
 * Get user's purchase history
 */
router.get('/:id/purchases', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20', status } = req.query;

    const where: any = { userId: id };

    if (status && typeof status === 'string') {
      where.status = status.toUpperCase() as PurchaseStatus;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
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
              dockerImage: true,
              price: true,
            },
          },
        },
      }),
      prisma.purchase.count({ where }),
    ]);

    res.json({
      purchases,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    res.status(500).json({
      error: 'Failed to fetch purchases',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/users/:id/executions
 * Get user's execution history
 */
router.get('/:id/executions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20', status, agentId } = req.query;

    // Find user's purchases to get their executions
    const purchases = await prisma.purchase.findMany({
      where: { userId: id },
      select: { id: true },
    });

    const purchaseIds = purchases.map(p => p.id);

    if (purchaseIds.length === 0) {
      return res.json({
        executions: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
    }

    const where: any = {
      purchaseId: { in: purchaseIds },
    };

    if (status && typeof status === 'string') {
      where.status = status.toUpperCase() as ExecutionStatus;
    }

    if (agentId && typeof agentId === 'string') {
      where.agentId = agentId;
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
              dockerImage: true,
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
    console.error('Error fetching user executions:', error);
    res.status(500).json({
      error: 'Failed to fetch executions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/users/:id/stats
 * Get user statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get user's purchases
    const purchases = await prisma.purchase.findMany({
      where: { userId: id },
      select: {
        id: true,
        amount: true,
        status: true,
      },
    });

    const purchaseIds = purchases.map(p => p.id);

    // Get executions stats
    const executions = purchaseIds.length > 0 ? await prisma.execution.findMany({
      where: { purchaseId: { in: purchaseIds } },
      select: {
        status: true,
        createdAt: true,
      },
    }) : [];

    // Calculate statistics
    const stats = {
      totalPurchases: purchases.length,
      totalSpent: purchases
        .filter(p => p.status === PurchaseStatus.CONFIRMED)
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(e => e.status === ExecutionStatus.COMPLETED).length,
      failedExecutions: executions.filter(e => e.status === ExecutionStatus.FAILED).length,
      runningExecutions: executions.filter(e => 
        e.status === ExecutionStatus.RUNNING || e.status === ExecutionStatus.PENDING
      ).length,
      lastExecutionAt: executions.length > 0 
        ? executions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
        : null,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      error: 'Failed to fetch user stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/users/:id/profile
 * Get user profile information
 */
router.get('/:id/profile', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        username: true,
        kycStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID: ${id}`,
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Failed to fetch user profile',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/users
 * Create or get user by wallet address
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { walletAddress, email, username } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'walletAddress is required',
      });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          email,
          username,
        },
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error creating/getting user:', error);
    res.status(500).json({
      error: 'Failed to create/get user',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;


