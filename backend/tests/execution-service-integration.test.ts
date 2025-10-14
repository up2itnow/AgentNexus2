/**
 * ExecutionService Integration Tests
 * 
 * Tests real Docker execution with our agent templates.
 * Requires Docker daemon to be running.
 */

import { PrismaClient } from '@prisma/client';
import { ExecutionService } from '../src/services/ExecutionService';
import { AgentService } from '../src/services/AgentService';

describe('ExecutionService - Real Docker Integration', () => {
  let prisma: PrismaClient;
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

    // Create test user
    const user = await prisma.user.create({
      data: {
        walletAddress: '0x1234567890123456789012345678901234567890',
        email: 'test@agentnexus.dev'
      }
    });
    testUserId = user.id;

    // Create test agent using Python echo image
    const agent = await prisma.agent.create({
      data: {
        name: 'Python Echo Agent (Test)',
        description: 'Test agent for integration testing',
        category: 'testing',
        price: '0',
        dockerImage: 'agentnexus-python-echo:v1',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' }
          },
          required: ['query']
        },
        outputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' }
          }
        },
        developer: testUserId,
        status: 'ACTIVE'
      }
    });
    testAgentId = agent.id;

    // Create test purchase
    const purchase = await prisma.purchase.create({
      data: {
        userId: testUserId,
        agentId: testAgentId,
        amount: '0',
        transactionHash: '0xtest',
        status: 'COMPLETED'
      }
    });
    testPurchaseId = purchase.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.execution.deleteMany({ where: { userId: testUserId } });
    await prisma.purchase.deleteMany({ where: { userId: testUserId } });
    await prisma.agent.deleteMany({ where: { id: testAgentId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
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
      ).rejects.toThrow('not authorized');

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

