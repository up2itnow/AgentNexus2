/**
 * Execution Receipt Types
 * Sprint 2: Observability + Receipts
 * 
 * Captures all essential execution data for:
 * - Grant deck screenshots
 * - Audit trails
 * - Payment verification
 */

/**
 * Execution receipt - the minimum viable proof of agent execution
 */
export interface ExecutionReceipt {
    // Core identifiers
    receiptId: string;          // Unique receipt ID
    executionId: string;        // Execution record ID

    // Timing
    timestamp: string;          // ISO 8601 start time
    completedAt: string;        // ISO 8601 end time
    durationMs: number;         // Execution duration in milliseconds

    // Agent info
    agentId: string;            // Agent that was executed
    agentName: string;          // Human-readable agent name
    agentVersion: string;       // Agent version (from config)

    // User info
    userId: string;             // User who initiated execution
    walletAddress?: string;     // User's wallet (if available)

    // Payment info
    paymentId?: string;         // Escrow payment ID
    amount?: string;            // Payment amount (in token units)
    token?: string;             // Payment token address
    platformFee?: string;       // Platform fee deducted

    // Execution result
    status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
    errorCode?: string;         // Error code if failed
    errorMessage?: string;      // Sanitized error message

    // Resource usage
    resourceUsage: {
        cpuTimeMs?: number;       // CPU time consumed
        memoryPeakMb?: number;    // Peak memory usage
        containerId?: string;     // Docker container ID (truncated)
    };

    // Verification
    signature?: string;         // Optional cryptographic signature
    blockNumber?: number;       // Block number (if on-chain)
    txHash?: string;            // Transaction hash (if on-chain)
}

/**
 * Simplified receipt for grant decks and quick display
 */
export interface ReceiptSummary {
    receiptId: string;
    executionId: string;
    timestamp: string;
    agentId: string;
    agentName: string;
    amount?: string;
    status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
    durationMs: number;
}

/**
 * Receipt query options
 */
export interface ReceiptQueryOptions {
    userId?: string;
    agentId?: string;
    status?: ExecutionReceipt['status'];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
