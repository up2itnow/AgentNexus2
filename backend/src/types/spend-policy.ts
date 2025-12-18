/**
 * Agent Spend Policy
 * 
 * Governance rules for autonomous agent spending.
 */

export interface AgentSpendPolicy {
    /** Maximum USDC allowed for a single transaction */
    maxPerRequestUSDC: number;

    /** Maximum USDC allowed per day */
    maxPerDayUSDC: number;

    /** List of allowed domains or endpoints (regex supported) */
    allowedEndpoints: string[];

    /** Whether user approval is required for manually confirming high-value txs */
    requireUserApproval: boolean;

    /** If verification fails, should the agent auto-retry? */
    autoRetry: boolean;
}

/**
 * Default conservative policy
 */
export const DEFAULT_SPEND_POLICY: AgentSpendPolicy = {
    maxPerRequestUSDC: 5.0, // $5 max per request
    maxPerDayUSDC: 50.0,    // $50 max per day
    allowedEndpoints: ['.*'], // Allow all by default (but gated by amount)
    requireUserApproval: false,
    autoRetry: false,
};
