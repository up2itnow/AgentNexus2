/**
 * CCTP Payments API
 * 
 * Endpoints for managing Cross-Chain Transfer Protocol (CCTP) payments.
 * Handled by the permissionless relayer service.
 */

import { Router, Request, Response } from 'express';
import { CctpRelayerService } from '../services/CctpRelayerService';

const router = Router();
const relayerService = new CctpRelayerService();

/**
 * POST /api/payments/cctp/submit
 * 
 * Submit a CCTP burn transaction to be relayed to Base.
 * 
 * Body:
 * - burnTxHash: string (Source chain burn tx hash)
 * - sourceChain: string (CAIP-2 ID of source chain)
 * - referenceId: string (x402 payment reference ID)
 * - beneficiary: string (Address of the user/agent)
 * - amount: string (Amount burned in smallest unit)
 */
router.post('/submit', async (req: Request, res: Response) => {
    try {
        const { burnTxHash, sourceChain, referenceId, beneficiary, amount } = req.body;

        if (!burnTxHash || !sourceChain || !referenceId || !beneficiary || !amount) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Trigger relay in background (or await if blocking needed, assuming async for now)
        // For better UX, we can start it and return 202, but for simplicity here we await to catch initial errors
        // Ideally: Queue it. Here: Await it.

        try {
            const result = await relayerService.relayTransfer(
                burnTxHash,
                sourceChain,
                referenceId,
                beneficiary,
                amount
            );

            res.status(200).json({
                success: true,
                status: result.status,
                mintTx: result.mintTx,
                creditTx: result.creditTx
            });
        } catch (error: any) {
            console.error('Relay failed:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Relay failed'
            });
        }

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/payments/cctp/status/:referenceId
 * 
 * Check status of a payment relay.
 * (Placeholder logic using idempotency check in future)
 */
router.get('/status/:referenceId', async (_req: Request, res: Response) => {
    // TODO: Implement status check against database or contract events
    res.status(501).json({ error: 'Not implemented' });
});

export default router;
