import { AgentZeroTierService } from '../AgentZeroTierService';
import { PrismaClient, AgentZeroTier } from '@prisma/client';
import { WalletService } from '../../WalletService';
import { AgentZeroConfig } from '../../../types/agentZero';
// import { keccak256, toHex, toBytes } from 'viem';

// Mock dependencies
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  agentZeroExecution: {
    count: jest.fn(),
  },
} as unknown as PrismaClient;

const mockWalletService = {
  checkEntitlementBalance: jest.fn(),
  mintEntitlement: jest.fn(),
} as unknown as WalletService;

const mockConfig: AgentZeroConfig = {
  quickImage: 'agent-zero:quick',
  fullImage: 'agent-zero:full',
  basicRateLimit: 10,
  basicTimeout: 300000,
  proTimeout: 1800000,
  proMaxMemory: '4GB',
  proCpuLimit: '2.0',
  proPrice: 50n,
  proPriceToken: 'USDC',
  basicTokenId: '0x123',
  proTokenId: '0x456',
};

describe('AgentZeroTierService', () => {
  let service: AgentZeroTierService;

  beforeEach(() => {
    service = new AgentZeroTierService(mockPrisma, mockWalletService, mockConfig);
    jest.clearAllMocks();
  });

  describe('computeTokenId', () => {
    it('should generate consistent token IDs', () => {
      const ids = service.getTokenIds();
      expect(ids.basic).toBeDefined();
      expect(ids.pro).toBeDefined();
      expect(ids.basic).not.toBe(ids.pro);
    });
  });

  describe('verifyTierAccess', () => {
    it('should return false if user not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.verifyTierAccess('user1', AgentZeroTier.BASIC);
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('User not found');
    });

    it('should verify Basic tier access within limits', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1' });
      (mockPrisma.agentZeroExecution.count as jest.Mock).mockResolvedValue(5); // 5 < 10

      const result = await service.verifyTierAccess('user1', AgentZeroTier.BASIC);
      expect(result.hasAccess).toBe(true);
      expect(result.tier).toBe(AgentZeroTier.BASIC);
    });

    it('should deny Basic tier access if limit exceeded', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1' });
      (mockPrisma.agentZeroExecution.count as jest.Mock).mockResolvedValue(10); // 10 >= 10

      const result = await service.verifyTierAccess('user1', AgentZeroTier.BASIC);
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('limit exceeded');
    });

    it('should verify Pro tier access if entitlement exists', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1', walletAddress: '0x123' });
      (mockWalletService.checkEntitlementBalance as jest.Mock).mockResolvedValue(1n);

      const result = await service.verifyTierAccess('user1', AgentZeroTier.PRO);
      expect(result.hasAccess).toBe(true);
      expect(result.tier).toBe(AgentZeroTier.PRO);
    });

    it('should deny Pro tier access if no entitlement', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1', walletAddress: '0x123' });
      (mockWalletService.checkEntitlementBalance as jest.Mock).mockResolvedValue(0n);

      const result = await service.verifyTierAccess('user1', AgentZeroTier.PRO);
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('Pro tier requires purchase');
    });
  });
});
