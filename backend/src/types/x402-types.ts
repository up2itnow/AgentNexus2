/**
 * x402 Protocol Type Definitions
 * 
 * Types for the x402 internet-native payment protocol integration.
 * Supports USDC payments on Base/Base Sepolia via Coinbase facilitator.
 * 
 * @module x402-types
 * @see https://docs.cdp.coinbase.com/x402/welcome
 */

/**
 * Payment request returned in 402 response PAYMENT-REQUIRED header
 */
export interface X402PaymentRequest {
  /** Payment amount in token's smallest unit (e.g., 6 decimals for USDC) */
  amount: string;
  /** Recipient wallet address */
  recipient: string;
  /** Payment token address (USDC) */
  token: string;
  /** Chain identifier in CAIP-2 format (e.g., "eip155:8453" for Base) */
  chainId: string;
  /** Human-readable description of what the payment is for */
  description?: string;
  /** Unique payment reference ID */
  reference: string;
  /** Unix timestamp when payment request expires */
  expiresAt: number;
  /** Facilitator URL for payment verification */
  facilitatorUrl: string;
  /** Optional settlement details for cross-chain payments */
  settlement?: X402SettlementDetails;
  /** Available payment routes (e.g. Base Direct, Arbitrum CCTP) */
  routes?: X402PaymentRoute[];
}

export interface X402SettlementDetails {
  type: 'cctp';
  source: string; // CAIP-2
  destination: string; // CAIP-2
  destinationReceiver: string;
  referenceId: string;
}

export interface X402PaymentRoute {
  id: string; // e.g. 'base_direct_usdc', 'optimism_cctp'
  amount: string;
  token: string;
  sourceChain: string; // CAIP-2
  destinationChain: string; // CAIP-2
  destinationReceiver: string;
  referenceId: string;
  expiry: number;
  settlement?: X402SettlementDetails;
}

/**
 * Signed payment payload sent in X-PAYMENT header
 */
export interface X402PaymentPayload {
  /** The original payment request */
  paymentRequest: X402PaymentRequest;
  /** Transaction hash of the onchain payment */
  transactionHash: string;
  /** Signature proving payment authorization */
  signature: string;
  /** Payer's wallet address */
  payer: string;
  /** Unix timestamp of when payment was made */
  timestamp: number;
}

/**
 * Configuration for x402 facilitator connection
 */
export interface X402FacilitatorConfig {
  /** Facilitator API URL */
  url: string;
  /** Network to use ("base" | "base-sepolia") */
  network: 'base' | 'base-sepolia';
  /** Recipient address for payments */
  recipientAddress: string;
  /** Maximum payment amount in USDC (decimal) */
  maxPaymentUsdc: number;
  /** Payment timeout in seconds */
  paymentTimeout?: number;
}

/**
 * Configuration for x402 middleware
 */
export interface X402MiddlewareConfig {
  /** Whether x402 is enabled */
  enabled: boolean;
  /** Facilitator configuration */
  facilitator: X402FacilitatorConfig;
  /** Endpoints protected by x402 paywall */
  protectedEndpoints: X402ProtectedEndpoint[];
}

/**
 * Definition of an x402-protected endpoint
 */
export interface X402ProtectedEndpoint {
  /** HTTP method (GET, POST, etc.) */
  method: string;
  /** Route path pattern (Express-style) */
  path: string;
  /** Payment amount in USDC (decimal, e.g., "0.01" for 1 cent) */
  priceUsdc: string;
  /** Human-readable description */
  description: string;
}

/**
 * Response from payment verification
 */
export interface X402VerificationResult {
  /** Whether payment is valid */
  valid: boolean;
  /** Transaction hash if verified */
  transactionHash?: string;
  /** Error message if invalid */
  error?: string;
  /** Payer address */
  payer?: string;
}

/**
 * x402 error types
 */
export enum X402ErrorCode {
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  PAYMENT_INVALID = 'PAYMENT_INVALID',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  PAYMENT_INSUFFICIENT = 'PAYMENT_INSUFFICIENT',
  FACILITATOR_ERROR = 'FACILITATOR_ERROR',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
}

/**
 * x402 error response
 */
export interface X402Error {
  code: X402ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Supported networks with their CAIP-2 identifiers
 */
export const X402_NETWORKS = {
  base: 'eip155:8453',
  'base-sepolia': 'eip155:84532',
} as const;

/**
 * USDC contract addresses per network
 */
export const USDC_ADDRESSES = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
} as const;

/**
 * Default Coinbase facilitator URL
 */
export const DEFAULT_FACILITATOR_URL = 'https://x402.coinbase.com';
