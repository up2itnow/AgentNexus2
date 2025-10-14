/**
 * WalletService - ERC-4337 Account Abstraction Wallet Management
 * 
 * Manages smart contract wallet creation and user operations using ERC-4337
 * Account Abstraction standard. This enables:
 * - Gasless transactions (sponsored by paymaster)
 * - Social recovery mechanisms
 * - Batch transaction execution
 * - Improved onboarding UX for non-crypto users
 * 
 * Architecture:
 * This service currently uses a simplified implementation for MVP.
 * In production, it integrates with Alchemy's Account Abstraction SDK
 * to create and manage Light Account smart contract wallets.
 * 
 * ERC-4337 Benefits:
 * - Users don't need to hold ETH for gas
 * - Multi-operation transactions in one call
 * - Social recovery (not holding private keys)
 * - Account programmability (custom logic)
 * 
 * Base L2 Integration:
 * - Low gas costs make AA economically viable
 * - Fast confirmations (~2 seconds)
 * - Growing ecosystem support
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @see https://accountkit.alchemy.com/
 * 
 * @author AgentNexus Team (Built with AstraForge 5-LLM Collaboration)
 */

import { PrismaClient } from '@prisma/client';
import {
  WalletCreationResult,
  UserOperationParams,
  Hex,
  BlockchainError,
  ValidationError,
  NotFoundError
} from '../types';
import { isValidAddress } from '../utils/blockchain';

/**
 * Service for managing ERC-4337 smart contract wallets
 * 
 * Key Responsibilities:
 * - Create deterministic smart wallet addresses
 * - Manage wallet deployment state
 * - Execute user operations (transactions)
 * - Handle gas estimation and sponsorship
 * - Batch multiple operations together
 */
export class WalletService {
  /** Chain ID for wallet deployment (Base mainnet: 8453, Base Sepolia: 84532) */
  private chainId: number;

  /**
   * Initialize WalletService with database connection
   * Automatically selects appropriate chain based on environment
   * 
   * @param prisma - Prisma client for database operations
   */
  constructor(private prisma: PrismaClient) {
    const env = process.env.NODE_ENV || 'development';
    // Production uses Base mainnet (8453), development uses Base Sepolia testnet (84532)
    this.chainId = env === 'production' ? 8453 : 84532;
  }

  /**
   * Create a new ERC-4337 smart contract wallet for a user
   * 
   * This creates a deterministic smart contract wallet address using the
   * ERC-4337 Light Account standard. The wallet is counterfactual - meaning
   * it gets an address before deployment, saving gas on initial setup.
   * 
   * Process:
   * 1. Validate owner address format (must be valid Ethereum address)
   * 2. Check user doesn't already have a wallet (one wallet per user)
   * 3. Generate deterministic wallet address using CREATE2
   * 4. Store wallet info in database (deployment happens on first tx)
   * 
   * Production Implementation Notes:
   * - Integrates with Alchemy's Light Account factory
   * - Uses CREATE2 for deterministic addresses
   * - Wallet deploys automatically on first transaction
   * - Owner EOA controls the smart wallet
   * - Supports paymasters for gasless transactions
   * 
   * Security Considerations:
   * - One wallet per user (prevents address confusion)
   * - Owner address validation (prevents invalid addresses)
   * - Deterministic generation (predictable, auditable)
   * 
   * @param userId - Internal user ID from database
   * @param ownerAddress - EOA address that will control the smart wallet
   * @returns Wallet creation result with address and deployment status
   * @throws ValidationError if address is invalid or user has existing wallet
   * @throws BlockchainError if wallet creation fails
   * 
   * @example
   * ```typescript
   * const wallet = await walletService.createWallet(
   *   'user_123',
   *   '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
   * );
   * console.log(wallet.walletAddress); // Smart wallet address
   * console.log(wallet.isDeployed); // false (deploys on first tx)
   * ```
   */
  async createWallet(userId: string, ownerAddress: string): Promise<WalletCreationResult> {
    // Validate owner address format (must be valid Ethereum address)
    // This prevents issues with malformed addresses being stored
    if (!isValidAddress(ownerAddress)) {
      throw new ValidationError('Invalid owner address format');
    }

    // Check if user already has a wallet - one wallet per user policy
    // This prevents confusion and potential security issues with multiple wallets
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (existingUser?.walletAddress) {
      throw new ValidationError('User already has a wallet');
    }

    try {
      // Production Implementation Path (Alchemy AA SDK):
      // ------------------------------------------------
      // 1. Import: import { AlchemyProvider, LightSmartContractAccount } from '@alchemy/aa-alchemy';
      // 2. Create provider with paymaster (optional, for gasless txs)
      // 3. Use Light Account factory to generate wallet address
      // 4. Address is deterministic based on owner + salt (userId)
      // 5. Wallet deploys on first transaction (counterfactual)
      //
      // Current MVP Implementation:
      // ---------------------------
      // Uses a simplified deterministic address generation
      // Ready to be replaced with actual Alchemy SDK integration
      
      // Generate deterministic wallet address using owner address and user ID as salt
      // In production: LightAccountFactory.getAddress(ownerAddress, salt)
      const walletAddress = this.generateDeterministicAddress(ownerAddress, userId);

      // Store wallet in database
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          walletAddress: walletAddress as Hex,
          walletType: 'LIGHT_ACCOUNT' // ERC-4337 Light Account
        }
      });

      return {
        walletAddress: walletAddress as Hex,
        ownerAddress: ownerAddress as Hex,
        isDeployed: false, // Will be true after first transaction
        chainId: this.chainId
      };
    } catch (error) {
      throw new BlockchainError(`Failed to create wallet: ${error}`);
    }
  }

  /**
   * Get wallet details for a user
   */
  async getWallet(userId: string): Promise<{ address: Hex; isDeployed: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true }
    });

    if (!user || !user.walletAddress) {
      throw new NotFoundError('Wallet not found for user');
    }

    // Check if wallet is deployed on-chain
    // In production, we'd check if the wallet contract exists at the address
    const isDeployed = await this.isWalletDeployed(user.walletAddress);

    return {
      address: user.walletAddress as Hex,
      isDeployed
    };
  }

  /**
   * Send a user operation (transaction) via the smart contract wallet
   * This enables gasless transactions and batching
   */
  async sendUserOperation(
    userId: string,
    params: UserOperationParams
  ): Promise<{ hash: Hex; status: 'pending' | 'success' | 'failed' }> {
    // Get user's wallet to ensure it exists
    await this.getWallet(userId);

    // Validate target address
    if (!isValidAddress(params.target)) {
      throw new ValidationError('Invalid target address');
    }

    try {
      // In production, we would:
      // 1. Build the user operation with the provider
      // 2. Sign it with the user's signer
      // 3. Send it to the bundler
      // 4. Wait for confirmation
      //
      // Example (pseudocode):
      // const userOp = await this.provider.sendUserOperation({
      //   target: params.target,
      //   data: params.data,
      //   value: params.value || 0n
      // });
      //
      // const txHash = await userOp.waitForTxHash();
      // return { hash: txHash, status: 'success' };

      // Placeholder implementation
      const mockTxHash = `0x${Date.now().toString(16).padEnd(64, '0')}` as Hex;

      return {
        hash: mockTxHash,
        status: 'pending'
      };
    } catch (error) {
      throw new BlockchainError(`Failed to send user operation: ${error}`);
    }
  }

  /**
   * Estimate gas for a user operation
   */
  async estimateUserOperationGas(
    userId: string,
    _params: UserOperationParams
  ): Promise<{ gasLimit: bigint; gasPrice: bigint; totalCost: bigint }> {
    // Ensure wallet exists
    await this.getWallet(userId);

    // In production, we would use the provider to estimate gas
    // For now, return reasonable estimates
    const gasLimit = BigInt(100000);
    const gasPrice = BigInt(1000000000); // 1 gwei
    const totalCost = gasLimit * gasPrice;

    return { gasLimit, gasPrice, totalCost };
  }

  /**
   * Check if a wallet contract is deployed on-chain
   */
  private async isWalletDeployed(_address: string): Promise<boolean> {
    try {
      // In production, we would check if contract code exists at the address
      // For now, assume not deployed until first transaction
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a deterministic wallet address
   * In production, this would be calculated by the ERC-4337 factory
   */
  private generateDeterministicAddress(ownerAddress: string, userId: string): string {
    // Simple deterministic generation for development
    // In production, use proper CREATE2 address calculation
    const hash = Buffer.from(`${ownerAddress}-${userId}`).toString('hex').padEnd(40, '0');
    return `0x${hash.slice(0, 40)}`;
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId: string): Promise<{ balance: bigint; formatted: string }> {
    // Ensure wallet exists
    await this.getWallet(userId);

    try {
      // In production, query on-chain balance
      // For now, return zero
      const balance = BigInt(0);
      const formatted = (Number(balance) / 1e18).toFixed(4);

      return { balance, formatted };
    } catch (error) {
      throw new BlockchainError(`Failed to get wallet balance: ${error}`);
    }
  }

  /**
   * Batch multiple operations into a single user operation
   * One of the key benefits of Account Abstraction
   */
  async batchUserOperations(
    userId: string,
    operations: UserOperationParams[]
  ): Promise<{ hash: Hex; status: 'pending' | 'success' | 'failed' }> {
    // Ensure wallet exists
    await this.getWallet(userId);

    // Validate all operations
    for (const op of operations) {
      if (!isValidAddress(op.target)) {
        throw new ValidationError(`Invalid target address: ${op.target}`);
      }
    }

    try {
      // In production, build and send batched user operation
      // This is a major UX improvement: multiple actions in one transaction
      const mockTxHash = `0x${Date.now().toString(16).padEnd(64, '0')}` as Hex;

      return {
        hash: mockTxHash,
        status: 'pending'
      };
    } catch (error) {
      throw new BlockchainError(`Failed to send batched user operations: ${error}`);
    }
  }

  /**
   * Check ERC-1155 entitlement token balance
   * Used for Agent Zero tier verification
   */
  async checkEntitlementBalance(walletAddress: string, tokenId: string): Promise<bigint> {
    try {
      // In production, this would call the smart contract:
      // const contract = new Contract(ENTITLEMENTS_ADDRESS, ABI, provider);
      // const balance = await contract.balanceOf(walletAddress, tokenId);
      // return balance;

      // For now, check database
      const entitlement = await this.prisma.entitlement.findFirst({
        where: {
          user: {
            walletAddress: walletAddress as Hex
          },
          tokenId: BigInt(tokenId)
        }
      });

      return entitlement ? BigInt(entitlement.balance) : BigInt(0);
    } catch (error) {
      console.error('Error checking entitlement balance:', error);
      return BigInt(0);
    }
  }

  /**
   * Mint ERC-1155 entitlement token
   * Used for granting Agent Zero tier access
   */
  async mintEntitlement(
    walletAddress: string,
    tokenId: string,
    amount: number
  ): Promise<{ transactionHash: Hex }> {
    try {
      // In production, this would call the smart contract:
      // const contract = new Contract(ENTITLEMENTS_ADDRESS, ABI, signer);
      // const tx = await contract.mint(walletAddress, tokenId, amount, "0x");
      // await tx.wait();
      // return { transactionHash: tx.hash };

      // For now, update database
      const user = await this.prisma.user.findUnique({
        where: { walletAddress: walletAddress as Hex }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Find or create Agent entity for this entitlement
      // For Agent Zero, we use special agent IDs
      const agentId = tokenId.includes('basic') ? 'agent-zero-basic' : 'agent-zero-pro';
      
      // Create or update entitlement
      await this.prisma.entitlement.upsert({
        where: {
          userId_agentId_tokenId: {
            userId: user.id,
            agentId,
            tokenId: BigInt(tokenId)
          }
        },
        create: {
          userId: user.id,
          agentId,
          tokenId: BigInt(tokenId),
          balance: amount,
          isActive: true
        },
        update: {
          balance: {
            increment: amount
          }
        }
      });

      const mockTxHash = `0x${Date.now().toString(16).padEnd(64, '0')}` as Hex;
      return { transactionHash: mockTxHash };
    } catch (error) {
      throw new BlockchainError(`Failed to mint entitlement: ${error}`);
    }
  }
}

