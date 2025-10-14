/**
 * Backend API Integration Tests
 * 
 * Tests all API endpoints with real database interactions.
 * 
 * @author AgentNexus Team (Phase 6A: Integration Testing)
 */

import * as request from 'supertest';
import { PrismaClient, AgentCategory } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:3001';

describe('API Endpoints Integration', () => {
  
  beforeAll(async () => {
    // Ensure database connection
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.$disconnect();
  });

  describe('Health Endpoints', () => {
    
    test('GET /health should return healthy status', async () => {
      const response = await request(API_URL).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });

    test('GET /health/ready should return readiness status', async () => {
      const response = await request(API_URL).get('/health/ready');
      
      // Should return 200 (healthy) or 503 (unhealthy)
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('docker');
    });
  });

  describe('Metrics Endpoint', () => {
    
    test('GET /metrics should return Prometheus metrics', async () => {
      const response = await request(API_URL).get('/metrics');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('agentnexus');
    });
  });

  describe('Agent Endpoints', () => {
    
    test('GET /api/agents should return list of agents', async () => {
      const response = await request(API_URL).get('/api/agents');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /api/agents should support pagination', async () => {
      const response = await request(API_URL)
        .get('/api/agents')
        .query({ page: 1, limit: 5 });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    test('GET /api/agents should support category filtering', async () => {
      const response = await request(API_URL)
        .get('/api/agents')
        .query({ category: 'ANALYTICS' });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // All returned agents should have the specified category
      response.body.forEach((agent: any) => {
        if (agent.category) {
          expect(agent.category).toBe('ANALYTICS');
        }
      });
    });

    test('GET /api/agents/:id should return agent details', async () => {
      // First get list of agents
      const listResponse = await request(API_URL).get('/api/agents');
      
      if (listResponse.body.length > 0) {
        const agentId = listResponse.body[0].id;
        
        const response = await request(API_URL).get(`/api/agents/${agentId}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', agentId);
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('description');
        expect(response.body).toHaveProperty('price');
      }
    });

    test('GET /api/agents/:id should return 404 for non-existent agent', async () => {
      const response = await request(API_URL).get('/api/agents/non-existent-id');
      
      expect(response.status).toBe(404);
    });

    test('POST /api/agents should require authentication', async () => {
      const response = await request(API_URL)
        .post('/api/agents')
        .send({
          name: 'Test Agent',
          description: 'Test Description',
          category: 'ANALYTICS',
          price: '1000000000000000000',
          dockerImage: 'test-image:latest'
        });
      
      expect(response.status).toBe(401);
    });
  });

  describe('Execution Endpoints', () => {
    
    test('GET /api/executions should require authentication', async () => {
      const response = await request(API_URL).get('/api/executions');
      
      expect(response.status).toBe(401);
    });

    test('POST /api/executions should require authentication', async () => {
      const response = await request(API_URL)
        .post('/api/executions')
        .send({
          agentId: 'test-agent-id',
          inputData: { query: 'test' }
        });
      
      expect(response.status).toBe(401);
    });

    test('GET /api/executions/:id should require authentication', async () => {
      const response = await request(API_URL).get('/api/executions/test-id');
      
      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    
    test('should return 404 for non-existent routes', async () => {
      const response = await request(API_URL).get('/api/non-existent-route');
      
      expect(response.status).toBe(404);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(API_URL)
        .post('/api/agents')
        .set('Content-Type', 'application/json')
        .send('invalid json');
      
      expect([400, 401]).toContain(response.status);
    });

    test('should validate required fields', async () => {
      const response = await request(API_URL)
        .post('/api/agents')
        .send({});
      
      expect([400, 401]).toContain(response.status);
    });

    test('should sanitize error messages', async () => {
      const response = await request(API_URL).get('/api/agents/test-error');
      
      if (response.status >= 400) {
        // Error should not contain sensitive information
        expect(response.body).not.toHaveProperty('stack');
        
        // In production mode
        const bodyText = JSON.stringify(response.body);
        expect(bodyText).not.toContain('node_modules');
        expect(bodyText).not.toContain('.ts:');
      }
    });
  });

  describe('CORS', () => {
    
    test('should allow requests from frontend', async () => {
      const response = await request(API_URL)
        .get('/health')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.status).toBe(200);
      // CORS headers may or may not be present depending on configuration
    });
  });
});

describe('Database Integration', () => {
  
  test('should connect to database successfully', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    expect(result).toBeTruthy();
  });

  test('should create and retrieve agent', async () => {
    // Create test agent
    const agent = await prisma.agent.create({
      data: {
        id: `test-agent-${Date.now()}`,
        name: 'Test Agent',
        description: 'Test Description',
        category: AgentCategory.ANALYTICS,
        developer: 'Test Developer',
        developerWallet: '0x1234567890123456789012345678901234567890',
        price: '1.0',
        dockerImage: 'test-image:latest',
        inputSchema: {},
        outputSchema: {}
      }
    });
    
    expect(agent).toHaveProperty('id');
    expect(agent.name).toBe('Test Agent');
    
    // Retrieve agent
    const retrieved = await prisma.agent.findUnique({
      where: { id: agent.id }
    });
    
    expect(retrieved).toHaveProperty('id', agent.id);
    
    // Cleanup
    await prisma.agent.delete({
      where: { id: agent.id }
    });
  });

  test('should enforce unique constraints', async () => {
    const agentId = `test-unique-${Date.now()}`;
    
    // Create agent
    await prisma.agent.create({
      data: {
        id: agentId,
        name: 'Unique Test',
        description: 'Test',
        category: AgentCategory.ANALYTICS,
        developer: 'Test Developer',
        developerWallet: '0x1234567890123456789012345678901234567890',
        price: '1.0',
        dockerImage: 'test:latest',
        inputSchema: {},
        outputSchema: {}
      }
    });
    
    // Try to create duplicate
    await expect(
      prisma.agent.create({
        data: {
          id: agentId,
          name: 'Duplicate Test',
          description: 'Test',
          category: AgentCategory.ANALYTICS,
          developer: 'Test Developer',
          developerWallet: '0x1234567890123456789012345678901234567890',
          price: '1.0',
          dockerImage: 'test:latest',
          inputSchema: {},
          outputSchema: {}
        }
      })
    ).rejects.toThrow();
    
    // Cleanup
    await prisma.agent.delete({
      where: { id: agentId }
    });
  });
});

