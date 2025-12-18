/**
 * x402 Client Adapter
 * 
 * Client-side adapter for autonomous agents to handle x402 payment flows.
 * Automatically detects 402 responses, executes payments, and retries requests.
 * 
 * NodeID: X402_CLIENT
 * 
 * @module x402-client
 * @see https://docs.cdp.coinbase.com/x402/welcome
 */

import { createWalletClient, http, encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import {
    X402PaymentRequest,
    X402PaymentPayload,
    USDC_ADDRESSES,
} from '../types/x402-types';

// ERC20 transfer ABI fragment
const ERC20_TRANSFER_ABI = [
    {
        name: 'transfer',
        type: 'function',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const;

/**
 * Configuration for x402 client
 */
export interface X402ClientConfig {
    /** Private key for signing transactions (hex string with 0x prefix) */
    privateKey: string;
    /** Network to use */
    network: 'base' | 'base-sepolia';
    /** RPC URL (optional, uses public RPC if not provided) */
    rpcUrl?: string;
    /** Maximum payment amount in USDC (safety limit) */
    maxPaymentUsdc?: number;
}

/**
 * Result of a request with automatic x402 payment handling
 */
export interface X402RequestResult<T = unknown> {
    success: boolean;
    data?: T;
    paymentMade?: boolean;
    transactionHash?: string;
    error?: string;
}

/**
 * x402 Client for autonomous agents
 * 
 * Handles the full x402 payment flow:
 * 1. Make initial request
 * 2. If 402 received, parse payment requirements
 * 3. Execute USDC payment on Base
 * 4. Retry request with payment proof
 * 
 * @example
 * ```typescript
 * const client = new X402Client({
 *   privateKey: process.env.AGENT_PRIVATE_KEY!,
 *   network: 'base-sepolia',
 *   maxPaymentUsdc: 1.0,
 * });
 * 
 * const result = await client.request('https://api.example.com/premium-data');
 * if (result.success) {
 *   console.log('Data:', result.data);
 *   if (result.paymentMade) {
 *     console.log('Payment tx:', result.transactionHash);
 *   }
 * }
 * ```
 */
export class X402Client {
    private config: X402ClientConfig;
    private account: ReturnType<typeof privateKeyToAccount>;
    private chain: typeof base | typeof baseSepolia;

    constructor(config: X402ClientConfig) {
        this.config = {
            maxPaymentUsdc: 1.0, // Default safety limit
            ...config,
        };

        // Validate private key format
        const privateKey = config.privateKey.startsWith('0x')
            ? config.privateKey
            : `0x${config.privateKey}`;
        if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
            throw new Error('Invalid private key format: expected 64 hex characters with 0x prefix');
        }

        this.account = privateKeyToAccount(privateKey as `0x${string}`);
        this.chain = config.network === 'base' ? base : baseSepolia;
    }

    /**
     * Get the client's wallet address
     */
    get address(): string {
        return this.account.address;
    }

    /**
     * Make a request with automatic x402 payment handling
     * 
     * @param url - URL to request
     * @param options - Fetch options
     * @returns Request result with payment info if applicable
     */
    async request<T = unknown>(
        url: string,
        options: RequestInit = {}
    ): Promise<X402RequestResult<T>> {
        try {
            // Initial request
            const response = await fetch(url, options);

            // If not 402, return response directly
            if (response.status !== 402) {
                if (response.ok) {
                    const data = await response.json();
                    return { success: true, data: data as T };
                }
                return {
                    success: false,
                    error: `Request failed with status ${response.status}`,
                };
            }

            // Parse payment requirements from 402 response
            const paymentRequiredHeader = response.headers.get('X-Payment-Required');
            if (!paymentRequiredHeader) {
                return {
                    success: false,
                    error: 'Received 402 but no payment requirements provided',
                };
            }

            const paymentRequest = this.parsePaymentRequest(paymentRequiredHeader);
            if (!paymentRequest) {
                return {
                    success: false,
                    error: 'Failed to parse payment requirements',
                };
            }

            // Validate payment amount against safety limit (use BigInt for safe comparison)
            const amount = BigInt(paymentRequest.amount);
            const maxPayment = parseUnits(String(this.config.maxPaymentUsdc || 1.0), 6);
            if (amount > maxPayment) {
                return {
                    success: false,
                    error: `Payment amount ${formatUnits(amount, 6)} USDC exceeds limit of ${this.config.maxPaymentUsdc} USDC`,
                };
            }

            // Execute payment
            const paymentResult = await this.executePayment(paymentRequest);
            if (!paymentResult.success) {
                return {
                    success: false,
                    error: paymentResult.error,
                };
            }

            // Create payment payload
            const paymentPayload = this.createPaymentPayload(paymentRequest, paymentResult.transactionHash!);

            // Retry request with payment
            const retryResponse = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'X-Payment': Buffer.from(JSON.stringify(paymentPayload)).toString('base64'),
                },
            });

            if (retryResponse.ok) {
                const data = await retryResponse.json();
                return {
                    success: true,
                    data: data as T,
                    paymentMade: true,
                    transactionHash: paymentResult.transactionHash,
                };
            }

            return {
                success: false,
                error: `Request failed after payment: ${retryResponse.status}`,
                paymentMade: true,
                transactionHash: paymentResult.transactionHash,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Parse payment request from header
     */
    private parsePaymentRequest(header: string): X402PaymentRequest | null {
        try {
            const decoded = Buffer.from(header, 'base64').toString('utf-8');
            const parsed = JSON.parse(decoded);
            // Validate required fields
            if (!parsed.amount || !parsed.recipient || !parsed.chainId) {
                return null;
            }
            return parsed as X402PaymentRequest;
        } catch {
            return null;
        }
    }

    /**
     * Execute USDC payment on Base
     */
    private async executePayment(
        paymentRequest: X402PaymentRequest
    ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
        try {
            const walletClient = createWalletClient({
                account: this.account,
                chain: this.chain,
                transport: http(this.config.rpcUrl),
            });

            const usdcAddress = USDC_ADDRESSES[this.config.network] as `0x${string}`;

            // Encode transfer call
            const data = encodeFunctionData({
                abi: ERC20_TRANSFER_ABI,
                functionName: 'transfer',
                args: [
                    paymentRequest.recipient as `0x${string}`,
                    BigInt(paymentRequest.amount),
                ],
            });

            // Send transaction
            const hash = await walletClient.sendTransaction({
                to: usdcAddress,
                data,
                chain: this.chain,
            });

            console.log(`[X402 Client] Payment sent: ${hash}`);

            return {
                success: true,
                transactionHash: hash,
            };
        } catch (error) {
            console.error('[X402 Client] Payment error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Payment failed',
            };
        }
    }

    /**
     * Create signed payment payload
     */
    private createPaymentPayload(
        paymentRequest: X402PaymentRequest,
        transactionHash: string
    ): X402PaymentPayload {
        return {
            paymentRequest,
            transactionHash,
            signature: '', // Will be populated by facilitator verification
            payer: this.account.address,
            timestamp: Math.floor(Date.now() / 1000),
        };
    }
}

/**
 * Create a simple x402-aware fetch wrapper
 * 
 * @param config - Client configuration
 * @returns Fetch function with automatic x402 handling
 */
export const createX402Fetch = (config: X402ClientConfig) => {
    const client = new X402Client(config);

    return async <T = unknown>(url: string, options?: RequestInit): Promise<X402RequestResult<T>> => {
        return client.request<T>(url, options);
    };
};

export default X402Client;
