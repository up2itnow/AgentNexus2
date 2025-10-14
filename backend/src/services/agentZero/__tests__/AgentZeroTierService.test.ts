/**
 * Agent Zero Tier Service Tests
 * Unit tests for tier verification, rate limiting, and entitlement management
 */

import { PrismaClient, AgentZeroTier } from '@prisma/client';
import { AgentZeroTierService } from '../AgentZeroTierService';
import { WalletService } from '../../WalletService';
import { AgentZeroConfig } from '../../../types/agentZero';

// Mock Prisma
jest.mock('@prisma/client');

// Mock WalletService
jest.mock('../../WalletService');

describe('AgentZeroTierService', () => {
  let service: AgentZeroTierService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockWalletService: jest.Mocked<WalletService>;
  
  const mockConfig: AgentZeroConfig = {
    basicTokenId: '0xbasic123',
    proTokenId: '0xpro123',
    proPrice: BigInt(50000000),
    proPriceToken: 'USDC',
    quickImage: 'test-quick:latest',
    fullImage: 'test-full:latest',
    basicRateLimit: 10,
    basicTimeout: 300000,
    proTimeout: 1800000,
    proMaxMemory: '4GB',
    proCpuLimit: '2.0',
  };

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    mockWalletService = new WalletService(mockPrisma) as jest.Mocked<WalletService>;
    service = new AgentZeroTierService(mockPrisma, mockWalletService, mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyTierAccess', () => {
    it('should allow Basic tier access when rate limit not exceeded', async () => {
      // Mock user
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 'user123',
        walletAddress: '0x123',
      });

      // Mock execution count (3 out of 10)
      mockPrisma.agentZeroExecution.count = jest.fn().mockResolvedValue(3);

      const result = await service.verifyTierAccess('user123', AgentZeroTier.BASIC);

      expect(result.hasAccess).toBe(true);
      expect(result.tier).toBe(AgentZeroTier.BASIC);
      expect(result.rateLimit?.remaining).toBe(7);
    });

    it('should deny Basic tier access when rate limit exceeded', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 'user123',
        walletAddress: '0x123',
      });

      // Mock execution count (10 out of 10)
      mockPrisma.agentZeroExecution.count = jest.fn().mockResolvedValue(10);

      const result = await service.verifyTierAccess('user123', AgentZeroTier.BASIC);

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('rate limit exceeded');
      expect(result.rateLimit?.remaining).toBe(0);
    });

    it('should allow Pro tier access when entitlement exists', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 'user123',
        walletAddress: '0x123',
      });

      // Mock entitlement check (Pro tier owned)
      mockWalletService.checkEntitlementBalance = jest.fn().mockResolvedValue(BigInt(1));

      const result = await service.verifyTierAccess('user123', AgentZeroTier.PRO);

      expect(result.hasAccess).toBe(true);
      expect(result.tier).toBe(AgentZeroTier.PRO);
    });

    it('should deny Pro tier access when entitlement missing', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 'user123',
        walletAddress: '0x123',
      });

      // Mock entitlement check (no Pro tier)
      mockWalletService.checkEntitlementBalance = jest.fn().mockResolvedValue(BigInt(0));

      const result = await service.verifyTierAccess('user123', AgentZeroTier.PRO);

      expect(result.hasAccess).toBe(false);
      expect(result.tier).toBe(AgentZeroTier.BASIC);
      expect(result.reason).toContain('Pro tier requires purchase');
    });
  });

  describe('checkRateLimit', () => {
    it('should return correct rate limit info', async () => {
      // Mock 5 executions today
      mockPrisma.agentZeroExecution.count = jest.fn().mockResolvedValue(5);

      const result = await service.checkRateLimit('user123');

      expect(result.limit).toBe(10);
      expect(result.current).toBe(5);
      expect(result.remaining).toBe(5);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should never return negative remaining', async () => {
      // Mock 15 executions (over limit)
      mockPrisma.agentZeroExecution.count = jest.fn().mockResolvedValue(15);

      const result = await service.checkRateLimit('user123');

      expect(result.remaining).toBe(0);
    });
  });

  describe('getCurrentTier', () => {
    it('should return PRO when user has Pro entitlement', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 'user123',
        walletAddress: '0x123',
      });

      mockWalletService.checkEntitlementBalance = jest.fn().mockResolvedValue(BigInt(1));

      const tier = await service.getCurrentTier('user123');

      expect(tier).toBe(AgentZeroTier.PRO);
    });

    it('should return BASIC when user has no Pro entitlement', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 'user123',
        walletAddress: '0x123',
      });

      mockWalletService.checkEntitlementBalance = jest.fn().mockResolvedValue(BigInt(0));

      const tier = await service.getCurrentTier('user123');

      expect(tier).toBe(AgentZeroTier.BASIC);
    });
  });

  describe('getTierLimits', () => {
    it('should return correct limits for Basic tier', () => {
      const limits = service.getTierLimits(AgentZeroTier.BASIC);

      expect(limits.tier).toBe(AgentZeroTier.BASIC);
      expect(limits.executionsPerDay).toBe(10);
      expect(limits.timeout).toBe(300000);
      expect(limits.features.persistentMemory).toBe(false);
      expect(limits.features.webUI).toBe(false);
    });

    it('should return correct limits for Pro tier', () => {
      const limits = service.getTierLimits(AgentZeroTier.PRO);

      expect(limits.tier).toBe(AgentZeroTier.PRO);
      expect(limits.executionsPerDay).toBe(-1); // Unlimited
      expect(limits.timeout).toBe(1800000);
      expect(limits.features.persistentMemory).toBe(true);
      expect(limits.features.webUI).toBe(true);
      expect(limits.features.subordinateAgents).toBe(true);
    });
  });

  describe('getUpgradeInfo', () => {
    it('should return upgrade information', () => {
      const info = service.getUpgradeInfo();

      expect(info.currentTier).toBe(AgentZeroTier.BASIC);
      expect(info.upgradeTo).toBe(AgentZeroTier.PRO);
      expect(info.price).toBe('50000000');
      expect(info.priceToken).toBe('USDC');
      expect(info.benefits).toHaveLength(7);
    });
  });

  describe('mintBasicEntitlement', () => {
    it('should mint Basic entitlement if not already owned', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 'user123',
        walletAddress: '0x123',
      });

      // User doesn't have Basic entitlement yet
      mockWalletService.checkEntitlementBalance = jest.fn().mockResolvedValue(BigInt(0));
      mockWalletService.mintEntitlement = jest.fn().mockResolvedValue({
        transactionHash: '0xtx123',
      });

      await service.mintBasicEntitlement('user123');

      expect(mockWalletService.mintEntitlement).toHaveBeenCalledWith(
        '0x123',
        expect.any(String), // tokenId
        1
      );
    });

    it('should skip minting if user already has Basic entitlement', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 'user123',
        walletAddress: '0x123',
      });

      // User already has Basic entitlement
      mockWalletService.checkEntitlementBalance = jest.fn().mockResolvedValue(BigInt(1));
      mockWalletService.mintEntitlement = jest.fn();

      await service.mintBasicEntitlement('user123');

      expect(mockWalletService.mintEntitlement).not.toHaveBeenCalled();
    });
  });
});

// Run tests:
// cd backend && pnpm test AgentZeroTierService.test.ts

