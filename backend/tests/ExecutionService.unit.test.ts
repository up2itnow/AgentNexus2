import { ExecutionService } from '../src/services/ExecutionService';
import { AgentService } from '../src/services/AgentService';
import { PrismaClient } from '@prisma/client';
import Docker from 'dockerode';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('dockerode');
jest.mock('../src/services/AgentService');
jest.mock('../src/services/WalletService', () => ({
    WalletService: jest.fn().mockImplementation(() => ({
        init: jest.fn(),
        isReady: jest.fn(),
        sendUserOperation: jest.fn(),
        checkEntitlementBalance: jest.fn(),
        mintEntitlement: jest.fn()
    }))
}));
jest.mock('../src/services/WebSocketService', () => ({
    webSocketService: {
        broadcast: jest.fn()
    }
}));
jest.mock('../src/services/MetricsService', () => ({
    metricsService: {
        recordExecution: jest.fn(),
        setRunningExecutions: jest.fn(),
        recordExecutionStatus: jest.fn(),
        recordExecutionDuration: jest.fn(),
        recordRevenue: jest.fn()
    }
}));

describe('ExecutionService Unit Tests', () => {
    let executionService: ExecutionService;
    let prisma: jest.Mocked<PrismaClient>;
    let agentService: jest.Mocked<AgentService>;
    let docker: jest.Mocked<Docker>;

    const mockDate = new Date('2024-01-01T00:00:00Z');

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup Prisma mock
        prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
        (prisma as any).execution = {
            create: jest.fn(),
            update: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn()
        };
        (prisma as any).entitlement = {
            findFirst: jest.fn()
        };

        // Setup AgentService mock
        agentService = new AgentService(prisma) as jest.Mocked<AgentService>;

        // Setup Docker mock
        docker = new Docker() as jest.Mocked<Docker>;
        (Docker as unknown as jest.Mock).mockImplementation(() => docker);

        // Initialize service
        executionService = new ExecutionService(prisma, agentService);
    });

    describe('executeAgent', () => {
        const mockUser = { id: 'user-123' };
        const mockAgent = {
            id: 'agent-123',
            name: 'Test Agent',
            price: '10',
            dockerImage: 'test-image:latest',
            inputSchema: { required: ['query'] }
        };
        const mockExecution = {
            id: 'exec-123',
            userId: mockUser.id,
            agentId: mockAgent.id,
            startTime: mockDate,
            status: 'PENDING'
        };

        it('should execute agent successfully when authorized', async () => {
            // Mock entitlement check
            (prisma.entitlement.findFirst as jest.Mock).mockResolvedValue({ id: 'ent-1' });

            // Mock agent retrieval
            agentService.getAgentById.mockResolvedValue(mockAgent as any);

            // Mock execution creation
            (prisma.execution.create as jest.Mock).mockResolvedValue(mockExecution);
            (prisma.execution.update as jest.Mock).mockResolvedValue({ ...mockExecution, status: 'COMPLETED' });

            // Mock Docker flow
            const mockContainer = {
                start: jest.fn().mockResolvedValue(undefined),
                logs: jest.fn().mockResolvedValue({
                    on: jest.fn(), // stream.on
                    destroy: jest.fn()
                }),
                wait: jest.fn().mockResolvedValue({ StatusCode: 0 }),
                remove: jest.fn().mockResolvedValue(undefined),
                id: 'container-123'
            };

            docker.createContainer = jest.fn().mockResolvedValue(mockContainer);
            docker.getImage = jest.fn().mockReturnValue({
                inspect: jest.fn().mockResolvedValue({ Id: 'image-id' })
            });

            // Execute
            await executionService.executeAgent(mockUser.id, {
                agentId: mockAgent.id,
                purchaseId: 'purch-1',
                inputData: { query: 'test' }
            });

            // Verify entitlement check
            expect(prisma.entitlement.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    userId: mockUser.id,
                    agentId: mockAgent.id
                })
            }));

            // Verify Docker container creation with security options
            expect(docker.createContainer).toHaveBeenCalledWith(expect.objectContaining({
                Image: mockAgent.dockerImage,
                HostConfig: expect.objectContaining({
                    NetworkMode: 'none',
                    ReadonlyRootfs: true,
                    SecurityOpt: expect.arrayContaining(['no-new-privileges:true'])
                })
            }));
        });

        it('should throw ForbiddenError if no entitlement', async () => {
            // Mock no entitlement
            (prisma.entitlement.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(executionService.executeAgent(mockUser.id, {
                agentId: mockAgent.id,
                purchaseId: 'purch-1',
                inputData: { query: 'test' }
            })).rejects.toThrow('No valid entitlement');
        });

        it('should throw ValidationError for injection attempts', async () => {
            // Mock entitlement
            (prisma.entitlement.findFirst as jest.Mock).mockResolvedValue({ id: 'ent-1' });
            agentService.getAgentById.mockResolvedValue(mockAgent as any);

            await expect(executionService.executeAgent(mockUser.id, {
                agentId: mockAgent.id,
                purchaseId: 'purch-1',
                inputData: { query: '$(rm -rf /)' } // Injection attempt
            })).rejects.toThrow('Input contains potential injection attempt');
        });
    });
});
