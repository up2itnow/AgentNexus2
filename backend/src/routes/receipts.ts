/**
 * Receipts API Routes
 * Sprint 2: Observability + Receipts
 * 
 * Endpoints for fetching execution receipts.
 * Essential for grant applications and audit trails.
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReceiptService } from '../services/ReceiptService';

const router = Router();
const prisma = new PrismaClient();
const receiptService = new ReceiptService(prisma);

/**
 * GET /api/receipts/:executionId
 * Get full receipt for a specific execution
 */
router.get('/:executionId', async (req: Request, res: Response) => {
    try {
        const { executionId } = req.params;

        const receipt = await receiptService.generateReceipt(executionId);

        return res.json({
            success: true,
            data: receipt
        });
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: 'Execution not found'
            });
        }

        if (error.message.includes('in progress')) {
            return res.status(400).json({
                success: false,
                error: 'Execution still in progress'
            });
        }

        console.error('Error fetching receipt:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate receipt'
        });
    }
});

/**
 * GET /api/receipts/:executionId/summary
 * Get simplified receipt summary
 */
router.get('/:executionId/summary', async (req: Request, res: Response) => {
    try {
        const { executionId } = req.params;

        const summary = await receiptService.getReceiptSummary(executionId);

        res.json({
            success: true,
            data: summary
        });
    } catch (error: any) {
        console.error('Error fetching receipt summary:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate receipt summary'
        });
    }
});

/**
 * GET /api/receipts
 * List receipts with optional filtering
 * 
 * Query params:
 * - userId: Filter by user
 * - agentId: Filter by agent
 * - status: Filter by status (SUCCESS, FAILED, TIMEOUT, CANCELLED)
 * - limit: Max results (default 50)
 * - offset: Pagination offset
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { userId, agentId, status, limit, offset } = req.query;

        const receipts = await receiptService.listReceipts({
            userId: userId as string,
            agentId: agentId as string,
            status: status as any,
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined
        });

        return res.json({
            success: true,
            data: receipts,
            count: receipts.length
        });
    } catch (error: any) {
        console.error('Error listing receipts:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to list receipts'
        });
    }
});

export default router;
