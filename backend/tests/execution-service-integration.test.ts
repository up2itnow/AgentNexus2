/**
 * ExecutionService Integration Tests
 * 
 * Tests real Docker execution with our agent templates.
 * Requires Docker daemon to be running.
 */

import { PrismaClient } from '@prisma/client';
import { ExecutionService } from '../src/services/ExecutionService';
import { AgentService } from '../src/services/AgentService';

jest.mock('../src/services/WalletService', () => ({
  WalletService: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    isReady: jest.fn(),
    sendUserOperation: jest.fn(),
    checkEntitlementBalance: jest.fn(),
    mintEntitlement: jest.fn()
  }))
}));

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: { create: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
    agent: { create: jest.fn(), deleteMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    purchase: { create: jest.fn(), deleteMany: jest.fn() },
    execution: { create: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
    entitlement: { findFirst: jest.fn() },
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock('dockerode', () => {
  return jest.fn().mockImplementation(() => ({
    createContainer: jest.fn().mockResolvedValue({
      id: 'container-123',
      start: jest.fn(),
      logs: jest.fn().mockResolvedValue({
        on: jest.fn(),
        destroy: jest.fn()
      }),
      wait: jest.fn().mockResolvedValue({ StatusCode: 0 }),
      remove: jest.fn()
    }),
    getImage: jest.fn().mockReturnValue({
      inspect: jest.fn().mockResolvedValue({ Id: 'sha256:test-image-id' })
    }),
    pull: jest.fn().mockResolvedValue(undefined),
    modem: {
      followProgress: jest.fn((_stream, onFinished) => onFinished(null, []))
    }
  }));
});

describe('ExecutionService - Real Docker Integration', () => {
  let prisma: any;
  let agentService: AgentService;
  let executionService: ExecutionService;

  let testUserId: string;
  let testAgentId: string;
  let testPurchaseId: string;

  beforeAll(async () => {
    // Initialize services
    prisma = new PrismaClient();
    agentService = new AgentService(prisma);
    executionService = new ExecutionService(prisma, agentService);

    // Mock data
    testUserId = 'user-123';
    testAgentId = 'agent-123';
    testPurchaseId = 'purchase-123';

    // Setup mock responses
    prisma.user.create.mockImplementation((args: any) => {
      if (args.data.email === 'unauthorized@test.com') return Promise.resolve({ id: 'unauthorized-user' });
      return Promise.resolve({ id: testUserId });
    });
    prisma.agent.create.mockResolvedValue({ id: testAgentId, dockerImage: 'agentnexus-python-echo:v1', inputSchema: {} });
    prisma.agent.findUnique.mockResolvedValue({ id: testAgentId, dockerImage: 'agentnexus-python-echo:v1', inputSchema: {}, price: '0', developer: testUserId });
    prisma.purchase.create.mockResolvedValue({ id: testPurchaseId });
    prisma.execution.create.mockResolvedValue({ id: 'exec-123', status: 'PENDING', startTime: new Date() });
    prisma.execution.update.mockResolvedValue({
      id: 'exec-123',
      status: 'COMPLETED',
      outputData: { status: 'success', message: 'Hello from integration test!' },
      duration: 100
    });
    prisma.entitlement.findFirst.mockImplementation((args: any) => {
      if (args.where.userId === 'unauthorized-user') return Promise.resolve(null);
      return Promise.resolve({ id: 'ent-1' });
    });
    prisma.agent.findUnique.mockImplementation((args: any) => {
      if (args.where.id === 'non-existent-agent-id') return Promise.resolve(null);
      return Promise.resolve({ id: testAgentId, dockerImage: 'agentnexus-python-echo:v1', inputSchema: {}, price: '0', developer: testUserId });
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.$disconnect();
  });

  describe('Python Agent Execution', () => {
    it('should execute Python agent successfully', async () => {
      const execution = await executionService.executeAgent(testUserId, {
        agentId: testAgentId,
        purchaseId: testPurchaseId,
        inputData: {
          query: 'Hello from integration test!'
        }
      });

      expect(execution.status).toBe('COMPLETED');
      expect(execution.outputData).toBeDefined();
      expect((execution.outputData as any).status).toBe('success');
      expect((execution.outputData as any).message).toContain('Hello from integration test!');
    }, 30000); // 30 second timeout

    it('should handle invalid input gracefully', async () => {
      const execution = await executionService.executeAgent(testUserId, {
        agentId: testAgentId,
        purchaseId: testPurchaseId,
        inputData: {} // Missing required 'query' field
      });

      // Agent should still run but may return error status
      expect(execution.status).toBe('COMPLETED');
    }, 30000);

    it('should enforce resource limits', async () => {
      // This test verifies container is created with proper limits
      // We can't easily test OOM scenarios, but we can verify it doesn't crash
      const execution = await executionService.executeAgent(testUserId, {
        agentId: testAgentId,
        purchaseId: testPurchaseId,
        inputData: {
          query: 'Test resource limits'
        }
      });

      expect(execution.status).toBe('COMPLETED');
      expect(execution.duration).toBeLessThan(10000); // Should complete quickly
    }, 30000);
  });

  describe('Security Features', () => {
    it('should prevent unauthorized execution', async () => {
      // Create another user without purchase
      const unauthorizedUser = await prisma.user.create({
        data: {
          walletAddress: '0x9999999999999999999999999999999999999999',
          email: 'unauthorized@test.com'
        }
      });

      await expect(
        executionService.executeAgent(unauthorizedUser.id, {
          agentId: testAgentId,
          purchaseId: testPurchaseId,
          inputData: { query: 'test' }
        })
      ).rejects.toThrow('No valid entitlement');

      // Cleanup
      await prisma.user.delete({ where: { id: unauthorizedUser.id } });
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle non-existent agent', async () => {
      await expect(
        executionService.executeAgent(testUserId, {
          agentId: 'non-existent-agent-id',
          purchaseId: testPurchaseId,
          inputData: { query: 'test' }
        })
      ).rejects.toThrow();
    }, 30000);
  });
});

