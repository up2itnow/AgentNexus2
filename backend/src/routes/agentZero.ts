/**
 * Agent Zero API Routes
 * Endpoints for Agent Zero integration (both Quick and Persistent modes)
 */

import { Router, Request, Response } from 'express';
import { PrismaClient, AgentZeroTier } from '@prisma/client';
import Docker from 'dockerode';
import { body, query, validationResult } from 'express-validator';
import { AgentZeroAdapter } from '../services/agentZero/AgentZeroAdapter';
import { AgentZeroInstanceManager } from '../services/agentZero/AgentZeroInstanceManager';
import { AgentZeroTierService } from '../services/agentZero/AgentZeroTierService';
import { WalletService } from '../services/WalletService';
import { agentZeroConfig } from '../config/agentZero';

const router: Router = Router();

// Initialize services
const prisma = new PrismaClient();
const docker = new Docker();
const walletService = new WalletService();

// Agent Zero configuration is now imported from ../config/agentZero

// Initialize Agent Zero services
const tierService = new AgentZeroTierService(prisma, walletService, agentZeroConfig);
const adapter = new AgentZeroAdapter(docker, prisma, tierService, agentZeroConfig);
const instanceManager = new AgentZeroInstanceManager(docker, prisma, tierService, agentZeroConfig);

// ==============================================================================
// Quick Execution Routes (Basic Tier)
// ==============================================================================

/**
 * POST /api/agent-zero/execute
 * Quick execution for Basic tier users
 */
router.post(
  '/execute',
  [
    body('prompt').isString().notEmpty().withMessage('Prompt is required'),
    body('userId').isString().notEmpty().withMessage('User ID is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { userId, prompt } = req.body;

      // Execute via adapter
      const result = await adapter.execute({
        userId,
        agentId: 'agent-zero',
        prompt,
        tier: AgentZeroTier.BASIC,
      });

      res.json(result);
    } catch (error) {
      console.error('Error executing Agent Zero:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to execute Agent Zero',
      });
    }
  }
);

/**
 * GET /api/agent-zero/rate-limit
 * Check rate limit status for user
 */
router.get(
  '/rate-limit',
  [query('userId').isString().notEmpty().withMessage('User ID is required')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { userId } = req.query as { userId: string };
      const rateLimit = await tierService.checkRateLimit(userId);
      res.json(rateLimit);
    } catch (error) {
      console.error('Error checking rate limit:', error);
      res.status(500).json({
        error: 'Failed to check rate limit',
      });
    }
  }
);

// ==============================================================================
// Instance Management Routes (Pro Tier)
// ==============================================================================

/**
 * POST /api/agent-zero/instance/create
 * Create persistent Agent Zero instance for Pro users
 */
router.post(
  '/instance/create',
  [body('userId').isString().notEmpty().withMessage('User ID is required')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { userId } = req.body;

      const instance = await instanceManager.createInstance({
        userId,
        tier: AgentZeroTier.PRO,
      });

      res.json(instance);
    } catch (error) {
      console.error('Error creating instance:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create instance',
      });
    }
  }
);

/**
 * GET /api/agent-zero/instance/status
 * Get instance status for user
 */
router.get(
  '/instance/status',
  [query('userId').isString().notEmpty().withMessage('User ID is required')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { userId } = req.query as { userId: string };
      const status = await instanceManager.getInstanceStatus(userId);

      if (!status) {
        res.status(404).json({ error: 'No instance found' });
        return;
      }

      res.json(status);
    } catch (error) {
      console.error('Error getting instance status:', error);
      res.status(500).json({
        error: 'Failed to get instance status',
      });
    }
  }
);

/**
 * POST /api/agent-zero/instance/stop
 * Stop instance
 */
router.post(
  '/instance/stop',
  [body('userId').isString().notEmpty().withMessage('User ID is required')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { userId } = req.body;
      await instanceManager.stopInstance(userId);
      res.json({ message: 'Instance stopped successfully' });
    } catch (error) {
      console.error('Error stopping instance:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to stop instance',
      });
    }
  }
);

/**
 * POST /api/agent-zero/instance/start
 * Start instance
 */
router.post(
  '/instance/start',
  [body('userId').isString().notEmpty().withMessage('User ID is required')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { userId } = req.body;
      await instanceManager.startInstance(userId);
      res.json({ message: 'Instance started successfully' });
    } catch (error) {
      console.error('Error starting instance:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to start instance',
      });
    }
  }
);

/**
 * DELETE /api/agent-zero/instance
 * Delete instance
 */
router.delete(
  '/instance',
  [body('userId').isString().notEmpty().withMessage('User ID is required')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { userId } = req.body;
      await instanceManager.deleteInstance(userId);
      res.json({ message: 'Instance deleted successfully' });
    } catch (error) {
      console.error('Error deleting instance:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to delete instance',
      });
    }
  }
);

// ==============================================================================
// Tier & Upgrade Routes
// ==============================================================================

/**
 * GET /api/agent-zero/tier
 * Get user's current tier
 */
router.get(
  '/tier',
  [query('userId').isString().notEmpty().withMessage('User ID is required')],
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.query as { userId: string };
      const tier = await tierService.getCurrentTier(userId);
      const limits = tierService.getTierLimits(tier);
      res.json({ tier, limits });
    } catch (error) {
      console.error('Error getting tier:', error);
      res.status(500).json({ error: 'Failed to get tier' });
    }
  }
);

/**
 * GET /api/agent-zero/upgrade-info
 * Get upgrade information for Basic users
 */
router.get('/upgrade-info', async (_req: Request, res: Response) => {
  try {
    const info = tierService.getUpgradeInfo();
    res.json(info);
  } catch (error) {
    console.error('Error getting upgrade info:', error);
    res.status(500).json({ error: 'Failed to get upgrade info' });
  }
});

/**
 * GET /api/agent-zero/token-ids
 * Get token IDs for Agent Zero tiers
 */
router.get('/token-ids', async (_req: Request, res: Response) => {
  try {
    const tokenIds = tierService.getTokenIds();
    res.json(tokenIds);
  } catch (error) {
    console.error('Error getting token IDs:', error);
    res.status(500).json({ error: 'Failed to get token IDs' });
  }
});

export default router;

