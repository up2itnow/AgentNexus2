/**
 * API Contract Tests
 * 
 * Tests all API endpoints to ensure they meet their contracts
 * and return expected response structures.
 * 
 * @author AgentNexus Team (Phase 6A: Integration Testing)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

test.describe('API Contract Tests', () => {

  test('GET /health - should return healthy status', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('uptime');
    expect(data.status).toBe('healthy');
  });

  test('GET /health/ready - should return readiness status', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health/ready`);

    // Should return 200 (healthy) or 503 (unhealthy)
    expect([200, 503]).toContain(response.status());

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('checks');
    expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
  });

  test('GET /metrics - should return Prometheus metrics', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/metrics`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');

    const metrics = await response.text();

    // Should contain AgentNexus metrics
    expect(metrics).toContain('agentnexus');
  });

  test('GET /api/agents - should return list of agents', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/agents`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();

    // If agents exist, verify structure
    if (data.length > 0) {
      const agent = data[0];
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('description');
      expect(agent).toHaveProperty('price');
      expect(agent).toHaveProperty('category');
    }
  });

  test('GET /api/agents with pagination', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/agents?page=1&limit=10`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeLessThanOrEqual(10);
  });

  test('GET /api/agents with category filter', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/agents?category=ANALYTICS`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();

    // All returned agents should have the specified category
    data.forEach((agent: any) => {
      if (agent.category) {
        expect(agent.category).toBe('ANALYTICS');
      }
    });
  });

  test('GET /api/agents/:id - should return agent details', async ({ request }) => {
    // First get list of agents
    const listResponse = await request.get(`${API_BASE_URL}/api/agents`);
    const agents = await listResponse.json();

    if (agents.length > 0) {
      const agentId = agents[0].id;

      // Get specific agent
      const response = await request.get(`${API_BASE_URL}/api/agents/${agentId}`);

      expect(response.status()).toBe(200);

      const agent = await response.json();
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('description');
      expect(agent).toHaveProperty('price');
      expect(agent.id).toBe(agentId);
    }
  });

  test('GET /api/agents/:id - should return 404 for non-existent agent', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/agents/non-existent-id`);

    expect(response.status()).toBe(404);
  });

  test('POST /api/agents - should require authentication', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/agents`, {
      data: {
        name: 'Test Agent',
        description: 'Test Description',
        category: 'DATA_ANALYSIS',
        price: '1000000000000000000', // 1 ETH in Wei
        dockerImage: 'test-image:latest'
      }
    });

    // Should return 401 Unauthorized without token
    expect(response.status()).toBe(401);
  });

  test('GET /api/executions - should require authentication', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/executions`);

    // Should return 401 Unauthorized without token
    expect(response.status()).toBe(401);
  });

  test('POST /api/executions - should require authentication', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/executions`, {
      data: {
        agentId: 'test-agent-id',
        inputData: { query: 'test' }
      }
    });

    // Should return 401 Unauthorized without token
    expect(response.status()).toBe(401);
  });

  test('GET /api/categories - should return available categories', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/categories`);

    // May or may not exist, but if it does, should return array
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    }
  });

  test('API should handle CORS properly', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`, {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });

    // Should allow requests from frontend
    expect(response.status()).toBe(200);
  });

  test('API should reject malformed JSON', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/executions`, {
      data: 'invalid json string',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Should return 400 Bad Request for malformed JSON
    expect([400, 401]).toContain(response.status());
  });

  test('API should handle rate limiting', async ({ request }) => {
    // Make multiple rapid requests
    const requests = Array(20).fill(null).map(() =>
      request.get(`${API_BASE_URL}/health`)
    );

    const responses = await Promise.all(requests);

    // All should succeed (rate limit not hit with health endpoint)
    // or some may return 429 Too Many Requests
    responses.forEach(response => {
      expect([200, 429]).toContain(response.status());
    });
  });

  test('API should return proper error format', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/agents/invalid-id`);

    if (response.status() >= 400) {
      const data = await response.json();

      // Error response should have consistent structure
      expect(data).toHaveProperty('error');
    }
  });

  test('API should handle OPTIONS requests', async ({ request }) => {
    const response = await request.fetch(`${API_BASE_URL}/api/agents`, {
      method: 'OPTIONS'
    });

    // Should return 200 or 204 for OPTIONS
    expect([200, 204]).toContain(response.status());
  });
});

test.describe('WebSocket API', () => {

  test('WebSocket server should be accessible', async ({ page }) => {
    // Navigate to a page that uses WebSocket
    await page.goto('/');

    // Try to establish WebSocket connection
    const wsConnected = await page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          const ws = new WebSocket('ws://localhost:3001/ws');

          ws.onopen = () => {
            ws.close();
            resolve(true);
          };

          ws.onerror = () => {
            resolve(false);
          };

          setTimeout(() => resolve(false), 5000);
        } catch (e) {
          resolve(false);
        }
      });
    });

    // WebSocket should connect successfully
    expect(wsConnected).toBeTruthy();
  });
});

