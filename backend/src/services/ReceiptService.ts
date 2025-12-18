/**
 * ReceiptService - Execution Receipt Generation
 * Sprint 2: Observability + Receipts
 * 
 * Generates verifiable receipts for all agent executions.
 * These receipts are essential for:
 * - Grant applications ("Execution receipts available")
 * - User-facing execution history
 * - Payment verification
 * - Audit trails
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import type {
    ExecutionReceipt,
    ReceiptSummary,
    ReceiptQueryOptions
} from '../types/ExecutionReceipt.js';

export class ReceiptService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Generate a receipt for a completed execution
     */
    async generateReceipt(executionId: string): Promise<ExecutionReceipt> {
        const execution = await this.prisma.execution.findUnique({
            where: { id: executionId },
            include: {
                agent: true,
                user: true,
                purchase: true
            }
        });

        if (!execution) {
            throw new Error(`Execution not found: ${executionId}`);
        }

        // Ensure execution is complete
        if (execution.status === 'PENDING' || execution.status === 'RUNNING') {
            throw new Error(`Execution still in progress: ${execution.status}`);
        }

        const receipt: ExecutionReceipt = {
            // Core identifiers
            receiptId: this.generateReceiptId(execution),
            executionId: execution.id,

            // Timing
            timestamp: execution.startTime.toISOString(),
            completedAt: (execution.endTime || new Date()).toISOString(),
            durationMs: execution.duration || 0,

            // Agent info
            agentId: execution.agent.id,
            agentName: execution.agent.name,
            agentVersion: (execution.agent as any).version || '1.0.0',

            // User info
            userId: execution.userId,
            walletAddress: execution.user?.walletAddress || undefined,

            // Payment info (from purchase if available)
            paymentId: (execution.purchase as any)?.paymentId || undefined,
            amount: execution.purchase?.amount?.toString() || undefined,
            token: (execution.purchase as any)?.tokenAddress || undefined,
            platformFee: (execution.purchase as any)?.platformFee?.toString() || undefined,

            // Execution result
            status: this.mapStatus(execution.status),
            errorMessage: execution.errorMessage || undefined,

            // Resource usage
            resourceUsage: {
                containerId: (execution as any).containerId?.substring(0, 12),
                memoryPeakMb: (execution as any).memoryPeakMb,
                cpuTimeMs: (execution as any).cpuTimeMs
            }
        };

        return receipt;
    }

    /**
     * Get receipt summary (for quick display)
     */
    async getReceiptSummary(executionId: string): Promise<ReceiptSummary> {
        const receipt = await this.generateReceipt(executionId);

        return {
            receiptId: receipt.receiptId,
            executionId: receipt.executionId,
            timestamp: receipt.timestamp,
            agentId: receipt.agentId,
            agentName: receipt.agentName,
            amount: receipt.amount,
            status: receipt.status,
            durationMs: receipt.durationMs
        };
    }

    /**
     * List receipts with filtering
     */
    async listReceipts(options: ReceiptQueryOptions): Promise<ReceiptSummary[]> {
        const where: any = {};

        if (options.userId) where.userId = options.userId;
        if (options.agentId) where.agentId = options.agentId;
        if (options.status) where.status = this.unmapStatus(options.status);
        if (options.startDate || options.endDate) {
            where.startTime = {};
            if (options.startDate) where.startTime.gte = options.startDate;
            if (options.endDate) where.startTime.lte = options.endDate;
        }

        const executions = await this.prisma.execution.findMany({
            where: {
                ...where,
                status: { notIn: ['PENDING', 'RUNNING'] }
            },
            include: {
                agent: { select: { id: true, name: true } }
            },
            orderBy: { startTime: 'desc' },
            take: options.limit || 50,
            skip: options.offset || 0
        });

        return executions.map(exec => ({
            receiptId: this.generateReceiptId(exec),
            executionId: exec.id,
            timestamp: exec.startTime.toISOString(),
            agentId: exec.agent.id,
            agentName: exec.agent.name,
            status: this.mapStatus(exec.status),
            durationMs: exec.duration || 0
        }));
    }

    /**
     * Generate deterministic receipt ID from execution
     */
    private generateReceiptId(execution: { id: string; startTime: Date }): string {
        const data = `${execution.id}:${execution.startTime.getTime()}`;
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        return `rcpt_${hash.substring(0, 16)}`;
    }

    /**
     * Map Prisma status to receipt status
     */
    private mapStatus(status: string): ExecutionReceipt['status'] {
        switch (status) {
            case 'COMPLETED': return 'SUCCESS';
            case 'FAILED': return 'FAILED';
            case 'CANCELLED': return 'CANCELLED';
            default: return 'FAILED';
        }
    }

    /**
     * Unmap receipt status to Prisma status
     */
    private unmapStatus(status: ExecutionReceipt['status']): string {
        switch (status) {
            case 'SUCCESS': return 'COMPLETED';
            case 'FAILED': return 'FAILED';
            case 'TIMEOUT': return 'FAILED';
            case 'CANCELLED': return 'CANCELLED';
        }
    }
}
