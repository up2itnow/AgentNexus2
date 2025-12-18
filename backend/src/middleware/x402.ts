/**
 * x402 Payment Middleware
 * 
 * Express middleware implementing the x402 internet-native payment protocol.
 * Protects endpoints by requiring payment via USDC on Base.
 * 
 * NodeID: X402_PAYWALL
 * 
 * @module x402-middleware
 * @see https://docs.cdp.coinbase.com/x402/welcome
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { parseUnits } from 'viem';
import {
    X402PaymentRequest,
    X402PaymentPayload,
    X402MiddlewareConfig,
    X402ProtectedEndpoint,
    X402VerificationResult,
    X402ErrorCode,
    X402_NETWORKS,
    USDC_ADDRESSES,
    DEFAULT_FACILITATOR_URL,
} from '../types/x402-types';
import { CCTP_CONFIG } from '../config/cctp';

// Environment-based configuration
const getConfig = (): X402MiddlewareConfig => ({
    // ... (lines 33-124 skipped)
    /**
     * Generate payment request for 402 response
     */
    export const generatePaymentRequest = (
        endpoint: X402ProtectedEndpoint,
        config: X402MiddlewareConfig
    ): X402PaymentRequest => {
        const network = config.facilitator.network;
        // Use parseUnits for safe decimal-to-smallest-unit conversion (avoids floating-point errors)
        const amountInSmallestUnit = parseUnits(endpoint.priceUsdc, 6).toString();
        const referenceId = randomUUID();
        const expiresAt = Math.floor(Date.now() / 1000) + (config.facilitator.paymentTimeout || 300);

        const request: X402PaymentRequest = {
            amount: amountInSmallestUnit,
            recipient: config.facilitator.recipientAddress,
            token: USDC_ADDRESSES[network],
            chainId: X402_NETWORKS[network],
            description: endpoint.description,
            reference: referenceId,
            expiresAt: expiresAt,
            facilitatorUrl: config.facilitator.url,
        };

        // Add CCTP routes if enabled
        if (process.env.ENABLE_CCTP_ROUTES === 'true') {
            const cctpReciever = process.env.CCTP_BASE_RECEIVER_CONTRACT || config.facilitator.recipientAddress;
            const isTestnet = network === 'base-sepolia';

            const arbConfig = CCTP_CONFIG[isTestnet ? 'arbitrum-sepolia' : 'arbitrum'];
            const opConfig = CCTP_CONFIG[isTestnet ? 'optimism-sepolia' : 'optimism'];

            request.routes = [
                // Option 1: Base Direct (Default)
                {
                    id: 'base_direct_usdc',
                    amount: amountInSmallestUnit,
                    token: USDC_ADDRESSES[network],
                    sourceChain: X402_NETWORKS[network],
                    destinationChain: X402_NETWORKS[network],
                    destinationReceiver: config.facilitator.recipientAddress,
                    referenceId: referenceId,
                    expiry: expiresAt
                },
                // Option 2: Optimism CCTP
                {
                    id: 'optimism_cctp_to_base',
                    amount: amountInSmallestUnit,
                    token: opConfig.usdcAddress,
                    sourceChain: opConfig.caip2,
                    destinationChain: X402_NETWORKS[network],
                    destinationReceiver: cctpReciever,
                    referenceId: referenceId,
                    expiry: expiresAt,
                    settlement: {
                        type: 'cctp',
                        source: opConfig.caip2,
                        destination: X402_NETWORKS[network],
                        destinationReceiver: cctpReciever,
                        referenceId: referenceId
                    }
                },
                // Option 3: Arbitrum CCTP
                {
                    id: 'arbitrum_cctp_to_base',
                    amount: amountInSmallestUnit,
                    token: arbConfig.usdcAddress,
                    sourceChain: arbConfig.caip2,
                    destinationChain: X402_NETWORKS[network],
                    destinationReceiver: cctpReciever,
                    referenceId: referenceId,
                    expiry: expiresAt,
                    settlement: {
                        type: 'cctp',
                        source: arbConfig.caip2,
                        destination: X402_NETWORKS[network],
                        destinationReceiver: cctpReciever,
                        referenceId: referenceId
                    }
                }
            ];
        }

        return request;
    };

    // Environment-based configuration
    const getConfig = (): X402MiddlewareConfig => ({
        enabled: process.env.ENABLE_X402 === 'true',
        facilitator: {
            url: process.env.X402_FACILITATOR_URL || DEFAULT_FACILITATOR_URL,
            network: (process.env.X402_NETWORK as 'base' | 'base-sepolia') || 'base-sepolia',
            recipientAddress: process.env.X402_PAYMENT_RECIPIENT || '',
            maxPaymentUsdc: Number(process.env.X402_MAX_PAYMENT_USDC) || 100,
            paymentTimeout: 300, // 5 minutes
        },
        protectedEndpoints: [], // Configured per-route
    });

    /**
     * Maximum size for X-Payment header (64KB base64 encoded)
     */
    const MAX_PAYMENT_HEADER_SIZE = 64 * 1024;

    /**
     * Parse payment payload from X-PAYMENT header
     */
    const parsePaymentHeader = (header: string | undefined): X402PaymentPayload | null => {
        if (!header) return null;

        // Guard against oversized headers
        if (header.length > MAX_PAYMENT_HEADER_SIZE) {
            console.warn('[X402] Payment header exceeds maximum size');
            return null;
        }

        try {
            const decoded = Buffer.from(header, 'base64').toString('utf-8');
            const parsed = JSON.parse(decoded);

            // Validate required fields exist
            if (!parsed.paymentRequest || !parsed.transactionHash || !parsed.payer) {
                return null;
            }
            if (!parsed.paymentRequest.amount || !parsed.paymentRequest.recipient) {
                return null;
            }

            return parsed as X402PaymentPayload;
        } catch {
            return null;
        }
    };

    /**
     * Verify payment with facilitator
     * 
     * NodeID: X402_FACILITATOR
     */
    const verifyPayment = async (
        payload: X402PaymentPayload,
        config: X402MiddlewareConfig
    ): Promise<X402VerificationResult> => {
        try {
            const response = await fetch(`${config.facilitator.url}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionHash: payload.transactionHash,
                    paymentRequest: payload.paymentRequest,
                    signature: payload.signature,
                    payer: payload.payer,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                return { valid: false, error: `Facilitator error: ${error}` };
            }

            const result = await response.json();

            return {
                valid: result.valid === true,
                transactionHash: payload.transactionHash,
                payer: payload.payer,
                error: result.error,
            };
        } catch (error) {
            console.error('[X402] Facilitator verification error:', error);
            return {
                valid: false,
                error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    };

    /**
     * Generate payment request for 402 response
     */
<<<<<<< HEAD
    const generatePaymentRequest = (
=======
export const generatePaymentRequest = (
>>>>>>> feat/x402-cctp-arb-op
        endpoint: X402ProtectedEndpoint,
        config: X402MiddlewareConfig
    ): X402PaymentRequest => {
        const network = config.facilitator.network;
        // Use parseUnits for safe decimal-to-smallest-unit conversion (avoids floating-point errors)
        const amountInSmallestUnit = parseUnits(endpoint.priceUsdc, 6).toString();
<<<<<<< HEAD

        return {
=======
    const referenceId = randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + (config.facilitator.paymentTimeout || 300);

    const request: X402PaymentRequest = {
>>>>>>> feat/x402-cctp-arb-op
            amount: amountInSmallestUnit,
            recipient: config.facilitator.recipientAddress,
            token: USDC_ADDRESSES[network],
            chainId: X402_NETWORKS[network],
            description: endpoint.description,
<<<<<<< HEAD
            reference: randomUUID(),
            expiresAt: Math.floor(Date.now() / 1000) + (config.facilitator.paymentTimeout || 300),
            facilitatorUrl: config.facilitator.url,
        };
=======
        reference: referenceId,
        expiresAt: expiresAt,
        facilitatorUrl: config.facilitator.url,
    };

    // Add CCTP routes if enabled
    if (process.env.ENABLE_CCTP_ROUTES === 'true') {
        const cctpReciever = process.env.CCTP_BASE_RECEIVER_CONTRACT || config.facilitator.recipientAddress;
        const isTestnet = network === 'base-sepolia';

        const arbConfig = CCTP_CONFIG[isTestnet ? 'arbitrum-sepolia' : 'arbitrum'];
        const opConfig = CCTP_CONFIG[isTestnet ? 'optimism-sepolia' : 'optimism'];

        request.routes = [
            // Option 1: Base Direct (Default)
            {
                id: 'base_direct_usdc',
                amount: amountInSmallestUnit,
                token: USDC_ADDRESSES[network],
                sourceChain: X402_NETWORKS[network],
                destinationChain: X402_NETWORKS[network],
                destinationReceiver: config.facilitator.recipientAddress,
                referenceId: referenceId,
                expiry: expiresAt
            },
            // Option 2: Optimism CCTP
            {
                id: 'optimism_cctp_to_base',
                amount: amountInSmallestUnit,
                token: opConfig.usdcAddress,
                sourceChain: opConfig.caip2,
                destinationChain: X402_NETWORKS[network],
                destinationReceiver: cctpReciever,
                referenceId: referenceId,
                expiry: expiresAt,
                settlement: {
                    type: 'cctp',
                    source: opConfig.caip2,
                    destination: X402_NETWORKS[network],
                    destinationReceiver: cctpReciever,
                    referenceId: referenceId
                }
            },
            // Option 3: Arbitrum CCTP
            {
                id: 'arbitrum_cctp_to_base',
                amount: amountInSmallestUnit,
                token: arbConfig.usdcAddress,
                sourceChain: arbConfig.caip2,
                destinationChain: X402_NETWORKS[network],
                destinationReceiver: cctpReciever,
                referenceId: referenceId,
                expiry: expiresAt,
                settlement: {
                    type: 'cctp',
                    source: arbConfig.caip2,
                    destination: X402_NETWORKS[network],
                    destinationReceiver: cctpReciever,
                    referenceId: referenceId
                }
            }
        ];
    }

    return request;
>>>>>>> feat/x402-cctp-arb-op
    };

    /**
     * Create x402 paywall middleware for a specific endpoint
     * 
     * @param priceUsdc - Price in USDC (e.g., "0.01" for 1 cent)
     * @param description - Human-readable description of the protected resource
     * @returns Express middleware
     * 
     * @example
     * ```typescript
     * router.get('/premium-data', x402Paywall('0.05', 'Premium data access'), (req, res) => {
     *   res.json({ data: 'premium content' });
     * });
     * ```
     */
    export const x402Paywall = (priceUsdc: string, description: string) => {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            const config = getConfig();

            // Skip if x402 is disabled
            if (!config.enabled) {
                next();
                return;
            }

            // Validate configuration
            if (!config.facilitator.recipientAddress) {
                console.error('[X402] Missing X402_PAYMENT_RECIPIENT configuration');
                res.status(500).json({
                    error: 'Payment system not configured',
                    code: X402ErrorCode.FACILITATOR_ERROR,
                });
                return;
            }

            const endpoint: X402ProtectedEndpoint = {
                method: req.method,
                path: req.path,
                priceUsdc,
                description,
            };

            // Check for payment header
            const paymentHeader = req.headers['x-payment'] as string | undefined;
            const payment = parsePaymentHeader(paymentHeader);

            if (!payment) {
                // No payment provided - return 402 Payment Required
                const paymentRequest = generatePaymentRequest(endpoint, config);

                res.status(402)
                    .header('X-Payment-Required', Buffer.from(JSON.stringify(paymentRequest)).toString('base64'))
                    .header('Content-Type', 'application/json')
                    .json({
                        error: 'Payment Required',
                        code: X402ErrorCode.PAYMENT_REQUIRED,
                        paymentRequest,
                    });
                return;
            }

            // Local validation before facilitator call
            const expectedRecipient = config.facilitator.recipientAddress.toLowerCase();
            const expectedToken = USDC_ADDRESSES[config.facilitator.network].toLowerCase();
            const expectedChainId = X402_NETWORKS[config.facilitator.network];

            if (payment.paymentRequest.recipient.toLowerCase() !== expectedRecipient) {
                res.status(402).json({
                    error: 'Payment recipient mismatch',
                    code: X402ErrorCode.PAYMENT_INVALID,
                    expected: config.facilitator.recipientAddress,
                });
                return;
            }

            if (payment.paymentRequest.token.toLowerCase() !== expectedToken) {
                res.status(402).json({
                    error: 'Payment token mismatch - only USDC accepted',
                    code: X402ErrorCode.PAYMENT_INVALID,
                    expected: USDC_ADDRESSES[config.facilitator.network],
                });
                return;
            }

            if (payment.paymentRequest.chainId !== expectedChainId) {
                res.status(402).json({
                    error: 'Payment chain mismatch',
                    code: X402ErrorCode.PAYMENT_INVALID,
                    expected: expectedChainId,
                });
                return;
            }

            // Validate payment amount (use parseUnits for safe conversion)
            const expectedAmount = parseUnits(priceUsdc, 6);
            let providedAmount: bigint;
            try {
                providedAmount = BigInt(payment.paymentRequest.amount);
            } catch {
                res.status(402).json({
                    error: 'Invalid payment amount format',
                    code: X402ErrorCode.PAYMENT_INVALID,
                });
                return;
            }

            if (providedAmount < expectedAmount) {
                res.status(402).json({
                    error: 'Insufficient payment amount',
                    code: X402ErrorCode.PAYMENT_INSUFFICIENT,
                    required: expectedAmount.toString(),
                    provided: providedAmount.toString(),
                });
                return;
            }

            // Check expiration
            if (payment.paymentRequest.expiresAt < Math.floor(Date.now() / 1000)) {
                res.status(402).json({
                    error: 'Payment request expired',
                    code: X402ErrorCode.PAYMENT_EXPIRED,
                });
                return;
            }

            // Verify payment with facilitator
            const verification = await verifyPayment(payment, config);

            if (!verification.valid) {
                res.status(402).json({
                    error: verification.error || 'Payment verification failed',
                    code: X402ErrorCode.VERIFICATION_FAILED,
                });
                return;
            }

            // Payment verified - attach payment info to request and continue
            (req as Request & { x402Payment?: X402VerificationResult }).x402Payment = verification;

            // Add payment response header
            res.setHeader('X-Payment-Response', JSON.stringify({
                transactionHash: verification.transactionHash,
                status: 'confirmed',
            }));

            next();
        };
    };

    /**
     * Express middleware to check if x402 is enabled
     */
    export const x402Enabled = (): boolean => {
        return process.env.ENABLE_X402 === 'true';
    };

    /**
     * Get current x402 configuration (for debugging/admin)
     */
    export const getX402Config = (): Omit<X402MiddlewareConfig, 'facilitator'> & {
        facilitator: Omit<X402MiddlewareConfig['facilitator'], 'recipientAddress'> & { recipientAddress: string };
    } => {
        const config = getConfig();
        return {
            ...config,
            facilitator: {
                ...config.facilitator,
                // Mask recipient address in logs
                recipientAddress: config.facilitator.recipientAddress
                    ? `${config.facilitator.recipientAddress.slice(0, 6)}...${config.facilitator.recipientAddress.slice(-4)}`
                    : 'not configured',
            },
        };
    };

    export default x402Paywall;
