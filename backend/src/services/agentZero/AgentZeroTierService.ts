/**
 * Agent Zero Tier Service
 * Manages tier verification, entitlements, and rate limiting
 */

import { PrismaClient, AgentZeroTier } from '@prisma/client';
import { createHash } from 'crypto';
import { 
  TierVerificationResult, 
  RateLimitInfo,
  AgentZeroConfig 
} from '../../types/agentZero';
import { WalletService } from '../WalletService';

export class AgentZeroTierService {
  private prisma: PrismaClient;
  private walletService: WalletService;
  private config: AgentZeroConfig;

  // Token IDs (computed from keccak256 hashes)
  private readonly BASIC_TOKEN_ID: string;
  private readonly PRO_TOKEN_ID: string;

  constructor(
    prisma: PrismaClient,
    walletService: WalletService,
    config: AgentZeroConfig
  ) {
    this.prisma = prisma;
    this.walletService = walletService;
    this.config = config;

    // Compute token IDs from string identifiers
    this.BASIC_TOKEN_ID = this.computeTokenId('agent-zero-basic');
    this.PRO_TOKEN_ID = this.computeTokenId('agent-zero-pro');
  }

  /**
   * Compute token ID from string (mimics keccak256)
   */
  private computeTokenId(identifier: string): string {
    // For testnet, use SHA256 hash as proxy for keccak256
    // In production, this would use actual keccak256
    const hash = createHash('sha256').update(identifier).digest('hex');
    return `0x${hash}`;
  }

  /**
   * Get token IDs for Agent Zero tiers
   */
  public getTokenIds() {
    return {
      basic: this.BASIC_TOKEN_ID,
      pro: this.PRO_TOKEN_ID,
    };
  }

  /**
   * Verify user's tier access
   */
  async verifyTierAccess(userId: string, requestedTier: AgentZeroTier): Promise<TierVerificationResult> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        return {
          tier: AgentZeroTier.BASIC,
          hasAccess: false,
          reason: 'User not found',
        };
      }

      // Check Pro tier entitlement if requested
      if (requestedTier === AgentZeroTier.PRO) {
        const hasProAccess = await this.hasProEntitlement(userId);
        
        if (!hasProAccess) {
          return {
            tier: AgentZeroTier.BASIC,
            hasAccess: false,
            reason: 'Pro tier requires purchase. Upgrade to access full features.',
          };
        }

        return {
          tier: AgentZeroTier.PRO,
          hasAccess: true,
        };
      }

      // Basic tier - check rate limits
      const rateLimit = await this.checkRateLimit(userId);
      
      if (rateLimit.remaining <= 0) {
        return {
          tier: AgentZeroTier.BASIC,
          hasAccess: false,
          reason: `Daily rate limit exceeded (${rateLimit.limit} executions/day)`,
          rateLimit,
        };
      }

      return {
        tier: AgentZeroTier.BASIC,
        hasAccess: true,
        rateLimit,
      };

    } catch (error) {
      console.error('Error verifying tier access:', error);
      throw new Error(`Failed to verify tier access: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if user has Pro tier entitlement (ERC-1155 token)
   */
  private async hasProEntitlement(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      
      if (!user || !user.walletAddress) {
        return false;
      }

      // Check on-chain entitlement via wallet service
      const balance = await this.walletService.checkEntitlementBalance(
        user.walletAddress,
        this.PRO_TOKEN_ID
      );

      return balance > 0n;
    } catch (error) {
      console.error('Error checking Pro entitlement:', error);
      return false;
    }
  }

  /**
   * Check rate limit for Basic tier users
   */
  async checkRateLimit(userId: string): Promise<RateLimitInfo> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Count executions today
    const executionsToday = await this.prisma.agentZeroExecution.count({
      where: {
        userId,
        tier: AgentZeroTier.BASIC,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const limit = this.config.basicRateLimit;
    const remaining = Math.max(0, limit - executionsToday);

    return {
      limit,
      current: executionsToday,
      remaining,
      resetAt: endOfDay,
    };
  }

  /**
   * Increment execution count (for rate limiting)
   */
  async incrementExecutionCount(userId: string, tier: AgentZeroTier): Promise<void> {
    // Execution count is tracked automatically by AgentZeroExecution records
    // This method can be used for additional tracking if needed
    console.log(`Execution count incremented for user ${userId}, tier ${tier}`);
  }

  /**
   * Get user's current tier based on entitlements
   */
  async getCurrentTier(userId: string): Promise<AgentZeroTier> {
    const hasPro = await this.hasProEntitlement(userId);
    return hasPro ? AgentZeroTier.PRO : AgentZeroTier.BASIC;
  }

  /**
   * Mint Basic tier entitlement (free, on first use)
   */
  async mintBasicEntitlement(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      
      if (!user || !user.walletAddress) {
        throw new Error('User wallet not initialized');
      }

      // Check if already has Basic entitlement
      const hasBasic = await this.walletService.checkEntitlementBalance(
        user.walletAddress,
        this.BASIC_TOKEN_ID
      );

      if (hasBasic > 0n) {
        console.log('User already has Basic tier entitlement');
        return;
      }

      // Mint Basic tier token (free)
      await this.walletService.mintEntitlement(
        user.walletAddress,
        this.BASIC_TOKEN_ID,
        1 // Mint 1 token
      );

      console.log(`Minted Basic tier entitlement for user ${userId}`);
    } catch (error) {
      console.error('Error minting Basic entitlement:', error);
      throw new Error(`Failed to mint Basic entitlement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get tier limits and features
   */
  getTierLimits(tier: AgentZeroTier) {
    if (tier === AgentZeroTier.PRO) {
      return {
        tier: AgentZeroTier.PRO,
        executionsPerDay: -1, // Unlimited
        timeout: this.config.proTimeout,
        features: {
          persistentMemory: true,
          subordinateAgents: true,
          allTools: true,
          webUI: true,
          mcpServers: true,
        },
        resources: {
          memory: this.config.proMaxMemory,
          cpu: this.config.proCpuLimit,
        },
      };
    }

    // Basic tier
    return {
      tier: AgentZeroTier.BASIC,
      executionsPerDay: this.config.basicRateLimit,
      timeout: this.config.basicTimeout,
      features: {
        persistentMemory: false,
        subordinateAgents: false,
        allTools: false,
        webUI: false,
        mcpServers: false,
      },
      resources: {
        memory: '1GB',
        cpu: '0.5',
      },
    };
  }

  /**
   * Get upgrade information for Basic tier users
   */
  getUpgradeInfo() {
    return {
      currentTier: AgentZeroTier.BASIC,
      upgradeTo: AgentZeroTier.PRO,
      price: this.config.proPrice.toString(),
      priceToken: this.config.proPriceToken,
      benefits: [
        'Unlimited executions per day',
        'Persistent memory and sessions',
        'Full Agent Zero WebUI access',
        'All tools and capabilities',
        'Subordinate agents',
        'MCP server integrations',
        'Priority support',
      ],
    };
  }
}

