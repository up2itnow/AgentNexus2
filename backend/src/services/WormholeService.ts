/**
 * Wormhole Bridging Service
 * 
 * Enables cross-chain asset transfers between EVM chains and Solana
 * using the Wormhole Protocol.
 * 
 * Wormhole is a decentralized message-passing protocol that allows
 * assets and data to be transferred across blockchains securely.
 * 
 * Supported Routes:
 * - EVM ↔ Solana (USDC, USDT, ETH)
 * - EVM ↔ EVM (alternative to LI.FI for Wormhole-native tokens)
 * 
 * @see https://docs.wormhole.com/
 * @author AgentNexus Team
 */

import { PublicKey, Connection } from '@solana/web3.js';

/**
 * Wormhole Chain IDs (different from EVM chain IDs)
 */
export enum WormholeChainId {
    SOLANA = 1,
    ETHEREUM = 2,
    BSC = 4,
    POLYGON = 5,
    AVALANCHE = 6,
    ARBITRUM = 23,
    OPTIMISM = 24,
    BASE = 30,
}

/**
 * Mapping from EVM chain ID to Wormhole chain ID
 */
export const EVM_TO_WORMHOLE: Record<number, WormholeChainId> = {
    1: WormholeChainId.ETHEREUM,
    56: WormholeChainId.BSC,
    137: WormholeChainId.POLYGON,
    43114: WormholeChainId.AVALANCHE,
    42161: WormholeChainId.ARBITRUM,
    10: WormholeChainId.OPTIMISM,
    8453: WormholeChainId.BASE,
};

/**
 * Common bridgeable tokens
 */
export interface BridgeableToken {
    symbol: string;
    decimals: number;
    addresses: Partial<Record<WormholeChainId, string>>;
}

export const BRIDGEABLE_TOKENS: BridgeableToken[] = [
    {
        symbol: 'USDC',
        decimals: 6,
        addresses: {
            [WormholeChainId.SOLANA]: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            [WormholeChainId.ETHEREUM]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            [WormholeChainId.BASE]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            [WormholeChainId.ARBITRUM]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            [WormholeChainId.POLYGON]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        },
    },
    {
        symbol: 'USDT',
        decimals: 6,
        addresses: {
            [WormholeChainId.SOLANA]: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            [WormholeChainId.ETHEREUM]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            [WormholeChainId.BSC]: '0x55d398326f99059fF775485246999027B3197955',
        },
    },
];

/**
 * Bridge quote request
 */
export interface BridgeQuoteRequest {
    fromChain: WormholeChainId;
    toChain: WormholeChainId;
    token: string; // Token symbol (e.g., 'USDC')
    amount: string; // Human-readable amount
    senderAddress: string;
    recipientAddress: string;
}

/**
 * Bridge quote response
 */
export interface BridgeQuote {
    fromChain: WormholeChainId;
    toChain: WormholeChainId;
    token: string;
    inputAmount: bigint;
    outputAmount: bigint;
    relayerFee: bigint;
    estimatedTimeSeconds: number;
    route: 'wormhole' | 'wormhole-connect';
}

/**
 * Bridge transaction status
 */
export enum BridgeStatus {
    PENDING = 'pending',
    SOURCE_CONFIRMED = 'source_confirmed',
    VAA_AVAILABLE = 'vaa_available',
    REDEEMED = 'redeemed',
    FAILED = 'failed',
}

export interface BridgeTransaction {
    id: string;
    quote: BridgeQuote;
    status: BridgeStatus;
    sourceTxHash?: string;
    destinationTxHash?: string;
    vaaBytes?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Wormhole Service for cross-chain bridging
 */
export class WormholeService {
    private readonly solanaRpcUrl: string;
    private readonly transactions: Map<string, BridgeTransaction> = new Map();

    constructor() {
        this.solanaRpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
        console.log('🌉 WormholeService initialized');
    }

    /**
     * Get Solana connection
     */
    private getSolanaConnection(): Connection {
        return new Connection(this.solanaRpcUrl, 'confirmed');
    }

    /**
     * Convert EVM chain ID to Wormhole chain ID
     */
    public getWormholeChainId(evmChainId: number): WormholeChainId | undefined {
        return EVM_TO_WORMHOLE[evmChainId];
    }

    /**
     * Check if a route is supported
     */
    public isRouteSupported(fromChain: WormholeChainId, toChain: WormholeChainId, token: string): boolean {
        const tokenConfig = BRIDGEABLE_TOKENS.find(t => t.symbol === token);
        if (!tokenConfig) return false;

        return !!tokenConfig.addresses[fromChain] && !!tokenConfig.addresses[toChain];
    }

    /**
     * Get supported tokens for a chain
     */
    public getSupportedTokens(chain: WormholeChainId): string[] {
        return BRIDGEABLE_TOKENS
            .filter(t => t.addresses[chain])
            .map(t => t.symbol);
    }

    /**
     * Get bridge quote
     * 
     * NOTE: This is a simplified implementation. Production should use
     * the actual Wormhole SDK for accurate fee estimation.
     */
    public async getQuote(request: BridgeQuoteRequest): Promise<BridgeQuote> {
        const { fromChain, toChain, token, amount } = request;

        // Validate route
        if (!this.isRouteSupported(fromChain, toChain, token)) {
            throw new Error(`Route not supported: ${token} from chain ${fromChain} to ${toChain}`);
        }

        // Get token config
        const tokenConfig = BRIDGEABLE_TOKENS.find(t => t.symbol === token)!;
        const inputAmount = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, tokenConfig.decimals)));

        // Estimate relayer fee (simplified - production should query Wormhole API)
        // Typical relayer fee is around $0.50-$2 depending on destination chain
        const relayerFeeUsd = toChain === WormholeChainId.SOLANA ? 0.5 : 1.5;
        const relayerFee = BigInt(Math.floor(relayerFeeUsd * Math.pow(10, tokenConfig.decimals)));

        // Calculate output (input - fee)
        const outputAmount = inputAmount - relayerFee;

        // Estimate time based on destination chain
        const estimatedTimeSeconds = this.getEstimatedTime(fromChain, toChain);

        return {
            fromChain,
            toChain,
            token,
            inputAmount,
            outputAmount,
            relayerFee,
            estimatedTimeSeconds,
            route: 'wormhole',
        };
    }

    /**
     * Get estimated bridge time in seconds
     */
    private getEstimatedTime(fromChain: WormholeChainId, toChain: WormholeChainId): number {
        // Wormhole finality times vary by chain
        const chainFinalitySeconds: Partial<Record<WormholeChainId, number>> = {
            [WormholeChainId.SOLANA]: 15,
            [WormholeChainId.ETHEREUM]: 900, // ~15 minutes for finality
            [WormholeChainId.ARBITRUM]: 60,
            [WormholeChainId.OPTIMISM]: 60,
            [WormholeChainId.BASE]: 60,
            [WormholeChainId.POLYGON]: 300,
            [WormholeChainId.BSC]: 90,
            [WormholeChainId.AVALANCHE]: 15,
        };

        const fromTime = chainFinalitySeconds[fromChain] || 120;
        const toTime = chainFinalitySeconds[toChain] || 120;

        // Total = source finality + guardian attestation (~30s) + destination tx
        return fromTime + 30 + Math.min(toTime, 30);
    }

    /**
     * Initiate bridge transfer
     * 
     * NOTE: This is a simplified simulation. Production implementation
     * requires the full Wormhole SDK and actual transaction signing.
     */
    public async initiateBridge(quote: BridgeQuote, _senderAddress: string): Promise<BridgeTransaction> {
        const txId = `wh_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const transaction: BridgeTransaction = {
            id: txId,
            quote,
            status: BridgeStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.transactions.set(txId, transaction);

        console.log(`🌉 Bridge initiated: ${quote.token} from chain ${quote.fromChain} to ${quote.toChain}`);
        console.log(`   Amount: ${quote.inputAmount.toString()} → ${quote.outputAmount.toString()}`);
        console.log(`   Transaction ID: ${txId}`);

        // In production, this would:
        // 1. Call token.approve() for Wormhole token bridge
        // 2. Call tokenBridge.transferTokens() or tokenBridge.transferTokensWithPayload()
        // 3. Wait for VAA from guardians
        // 4. Submit VAA to destination chain

        return transaction;
    }

    /**
     * Get transaction status
     */
    public async getTransactionStatus(txId: string): Promise<BridgeTransaction | undefined> {
        return this.transactions.get(txId);
    }

    /**
     * Get all transactions for an address
     */
    public getTransactionsForAddress(_address: string): BridgeTransaction[] {
        // In production, filter by sender/recipient address
        return Array.from(this.transactions.values());
    }

    /**
     * Check Solana wallet balance
     */
    public async getSolanaBalance(walletAddress: string): Promise<number> {
        try {
            const connection = this.getSolanaConnection();
            const pubkey = new PublicKey(walletAddress);
            const balance = await connection.getBalance(pubkey);
            return balance / 1e9; // Convert lamports to SOL
        } catch (error) {
            console.error('Failed to get Solana balance:', error);
            return 0;
        }
    }

    /**
     * Get supported chains
     */
    public getSupportedChains(): Array<{ id: WormholeChainId; name: string; type: 'evm' | 'solana' }> {
        return [
            { id: WormholeChainId.SOLANA, name: 'Solana', type: 'solana' },
            { id: WormholeChainId.BASE, name: 'Base', type: 'evm' },
            { id: WormholeChainId.ARBITRUM, name: 'Arbitrum', type: 'evm' },
            { id: WormholeChainId.OPTIMISM, name: 'Optimism', type: 'evm' },
            { id: WormholeChainId.POLYGON, name: 'Polygon', type: 'evm' },
            { id: WormholeChainId.ETHEREUM, name: 'Ethereum', type: 'evm' },
            { id: WormholeChainId.BSC, name: 'BNB Chain', type: 'evm' },
            { id: WormholeChainId.AVALANCHE, name: 'Avalanche', type: 'evm' },
        ];
    }
}

// Export singleton instance
export const wormholeService = new WormholeService();
