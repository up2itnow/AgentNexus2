/**
 * AgentNexusClient - Main SDK Entry Point
 * 
 * Provides a simple interface to interact with the AgentNexus platform.
 * 
 * @example
 * ```typescript
 * import { AgentNexusClient } from '@agentnexus/sdk';
 * 
 * const client = new AgentNexusClient({
 *   chainId: 8453,
 *   rpcUrl: 'https://mainnet.base.org',
 *   contracts: {
 *     escrow: '0x...',
 *     entitlements: '0x...'
 *   }
 * });
 * 
 * const agents = await client.agents.list();
 * ```
 */

import { ethers, Contract, Provider, Signer } from 'ethers';
import {
    AgentNexusConfig,
    Agent,
    AgentExecution,
    Pipeline,
    PipelineStep,
    Entitlement,
    ApiResponse,
    PaginatedResponse
} from './types';

// Contract ABIs (minimal for SDK)
const ESCROW_ABI = [
    'function depositPayment(bytes32 paymentId, uint256 agentId, uint256 amount, address token) external',
    'function getPayment(bytes32 paymentId) external view returns (tuple(address user, address token, uint256 amount, uint256 agentId, address developer, uint8 status, uint256 createdAt, uint256 expiresAt))',
    'function supportedTokens(address token) external view returns (bool)',
    'event PaymentDeposited(bytes32 indexed paymentId, address indexed user, uint256 agentId, uint256 amount, address token)'
];

const ENTITLEMENTS_ABI = [
    'function hasAccess(address user, uint256 tokenId) external view returns (bool)',
    'function balanceOf(address user, uint256 tokenId) external view returns (uint256)',
    'function getEntitlementExpiration(uint256 tokenId) external view returns (uint256)',
    'event EntitlementMinted(uint256 indexed tokenId, address indexed user, uint256 amount)'
];

const A2A_PROTOCOL_ABI = [
    'function createPipeline(uint256[] agentIds, address[] developers, uint256[] paymentBps, uint256[] stageIndices, uint256[] maxRetries, bytes32[] conditions, address paymentToken, uint256 timeout) external returns (bytes32)',
    'function fundPipeline(bytes32 pipelineId, uint256 amount) external',
    'function startStep(bytes32 pipelineId, uint256 stepIndex) external',
    'function completeStep(bytes32 pipelineId, uint256 stepIndex, bytes32 resultHash) external',
    'function getPipelineStatus(bytes32 pipelineId) external view returns (uint8)',
    'function getPipelineSteps(bytes32 pipelineId) external view returns (tuple(uint256 agentId, address developer, uint256 paymentBps, uint256 stageIndex, uint256 maxRetries, uint256 retryCount, bytes32 conditionHash, uint8 status)[])',
    'event PipelineCreated(bytes32 indexed pipelineId, address indexed creator, uint256 stepCount, uint256 stageCount, address paymentToken)',
    'event StepCompleted(bytes32 indexed pipelineId, uint256 stepIndex, uint256 agentId, address developer, uint256 paymentAmount, bytes32 resultHash)'
];

export class AgentNexusClient {
    private config: AgentNexusConfig;
    private provider: Provider;
    private signer?: Signer;

    // Contract instances
    private escrowContract: Contract;
    private entitlementsContract: Contract;
    private a2aContract?: Contract;

    /**
     * Create a new AgentNexus client
     */
    constructor(config: AgentNexusConfig, signer?: Signer) {
        this.config = config;
        this.signer = signer;

        // Initialize provider
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

        // Initialize contracts
        const signerOrProvider = signer || this.provider;

        this.escrowContract = new Contract(
            config.contracts.escrow,
            ESCROW_ABI,
            signerOrProvider
        );

        this.entitlementsContract = new Contract(
            config.contracts.entitlements,
            ENTITLEMENTS_ABI,
            signerOrProvider
        );

        if (config.contracts.a2aProtocol) {
            this.a2aContract = new Contract(
                config.contracts.a2aProtocol,
                A2A_PROTOCOL_ABI,
                signerOrProvider
            );
        }
    }

    /**
     * Connect a signer for write operations
     */
    connect(signer: Signer): AgentNexusClient {
        return new AgentNexusClient(this.config, signer);
    }

    // ============ Agent Operations ============

    /**
     * Agent-related operations
     */
    readonly agents = {
        /**
         * List available agents
         */
        list: async (): Promise<Agent[]> => {
            // In production, fetch from API
            const url = `${this.config.apiUrl}/agents`;
            if (this.config.apiUrl) {
                const response = await fetch(url);
                const data = await response.json() as ApiResponse<Agent[]>;
                return data.data || [];
            }
            return [];
        },

        /**
         * Get a specific agent by ID
         */
        get: async (agentId: string): Promise<Agent | null> => {
            if (this.config.apiUrl) {
                const response = await fetch(`${this.config.apiUrl}/agents/${agentId}`);
                const data = await response.json() as ApiResponse<Agent>;
                return data.data || null;
            }
            return null;
        },

        /**
         * Execute an agent
         */
        execute: async (agentId: string, input: string): Promise<AgentExecution> => {
            if (!this.config.apiUrl) throw new Error('API URL required for execution');

            const response = await fetch(`${this.config.apiUrl}/agents/${agentId}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
                },
                body: JSON.stringify({ input })
            });

            const data = await response.json() as ApiResponse<AgentExecution>;
            if (!data.success || !data.data) {
                throw new Error(data.error?.message || 'Execution failed');
            }
            return data.data;
        }
    };

    // ============ Entitlement Operations ============

    /**
     * Entitlement-related operations
     */
    readonly entitlements = {
        /**
         * Check if user has access to an agent
         */
        hasAccess: async (userAddress: string, tokenId: number): Promise<boolean> => {
            return this.entitlementsContract.hasAccess(userAddress, tokenId);
        },

        /**
         * Get user's entitlement balance for a token
         */
        getBalance: async (userAddress: string, tokenId: number): Promise<bigint> => {
            return this.entitlementsContract.balanceOf(userAddress, tokenId);
        },

        /**
         * Get entitlement expiration timestamp
         */
        getExpiration: async (tokenId: number): Promise<Date | null> => {
            const timestamp = await this.entitlementsContract.getEntitlementExpiration(tokenId);
            return timestamp > 0 ? new Date(Number(timestamp) * 1000) : null;
        }
    };

    // ============ Payment Operations ============

    /**
     * Payment-related operations
     */
    readonly payments = {
        /**
         * Check if a token is supported for payments
         */
        isTokenSupported: async (tokenAddress: string): Promise<boolean> => {
            return this.escrowContract.supportedTokens(tokenAddress);
        },

        /**
         * Deposit payment for agent execution
         */
        deposit: async (
            paymentId: string,
            agentId: number,
            amount: bigint,
            tokenAddress: string
        ): Promise<string> => {
            if (!this.signer) throw new Error('Signer required for transactions');

            const tx = await this.escrowContract.depositPayment(
                ethers.id(paymentId),
                agentId,
                amount,
                tokenAddress
            );
            const receipt = await tx.wait();
            return receipt.hash;
        }
    };

    // ============ A2A Pipeline Operations ============

    /**
     * A2A Protocol pipeline operations
     */
    readonly pipelines = {
        /**
         * Create a new agent pipeline
         */
        create: async (
            steps: Array<{
                agentId: number;
                developer: string;
                paymentBps: number;
                stageIndex: number;
                maxRetries?: number;
                condition?: string;
            }>,
            paymentToken: string,
            timeout: number = 0
        ): Promise<string> => {
            if (!this.a2aContract) throw new Error('A2A Protocol not configured');
            if (!this.signer) throw new Error('Signer required');

            const tx = await this.a2aContract.createPipeline(
                steps.map(s => s.agentId),
                steps.map(s => s.developer),
                steps.map(s => s.paymentBps),
                steps.map(s => s.stageIndex),
                steps.map(s => s.maxRetries || 0),
                steps.map(s => s.condition ? ethers.id(s.condition) : ethers.ZeroHash),
                paymentToken,
                timeout
            );

            const receipt = await tx.wait();
            // Extract pipelineId from event
            const event = receipt.logs.find((log: any) =>
                log.topics[0] === ethers.id('PipelineCreated(bytes32,address,uint256,uint256,address)')
            );

            return event ? event.topics[1] : receipt.hash;
        },

        /**
         * Fund a pipeline
         */
        fund: async (pipelineId: string, amount: bigint): Promise<string> => {
            if (!this.a2aContract) throw new Error('A2A Protocol not configured');
            if (!this.signer) throw new Error('Signer required');

            const tx = await this.a2aContract.fundPipeline(pipelineId, amount);
            const receipt = await tx.wait();
            return receipt.hash;
        },

        /**
         * Get pipeline status
         */
        getStatus: async (pipelineId: string): Promise<number> => {
            if (!this.a2aContract) throw new Error('A2A Protocol not configured');
            return this.a2aContract.getPipelineStatus(pipelineId);
        },

        /**
         * Get pipeline steps
         */
        getSteps: async (pipelineId: string): Promise<PipelineStep[]> => {
            if (!this.a2aContract) throw new Error('A2A Protocol not configured');
            const steps = await this.a2aContract.getPipelineSteps(pipelineId);
            return steps.map((s: any) => ({
                agentId: s.agentId.toString(),
                developer: s.developer,
                paymentBps: Number(s.paymentBps),
                stageIndex: Number(s.stageIndex),
                maxRetries: Number(s.maxRetries),
                status: ['pending', 'running', 'completed', 'failed', 'skipped'][Number(s.status)] as any
            }));
        }
    };

    // ============ Utility Methods ============

    /**
     * Get current chain ID
     */
    getChainId(): number {
        return this.config.chainId;
    }

    /**
     * Get contract addresses
     */
    getContracts() {
        return this.config.contracts;
    }
}
