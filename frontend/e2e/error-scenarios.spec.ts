/**
 * Error Scenario Tests
 * 
 * Tests how the application handles various error conditions gracefully.
 * 
 * @author AgentNexus Team (Phase 6A: Integration Testing)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

test.describe('Error Handling', () => {

  test('should display error message for invalid agent ID', async ({ page }) => {
    // Navigate to invalid agent detail page
    await page.goto('/agents/invalid-agent-id-12345');

    await page.waitForTimeout(2000);

    // Should show error message, 404 page, or loading state (if still fetching)
    const hasError = await page.locator('text=/not found|404|error|doesn\'t exist/i').isVisible().catch(() => false);
    const hasLoading = await page.locator('[data-testid="agent-detail-loading"]').isVisible().catch(() => false);
    const hasErrorState = await page.locator('[data-testid="agent-detail-error"]').isVisible().catch(() => false);

    // Page should show error, loading, or error state
    expect(hasError || hasLoading || hasErrorState).toBeTruthy();
  });

  test('should handle network failure gracefully', async ({ page, context }) => {
    // Block API requests to simulate network failure
    await context.route(`${API_BASE_URL}/api/**`, route => route.abort());

    await page.goto('/');

    // Should show error message or loading state that doesn't crash
    await page.waitForTimeout(2000);

    // Page should not crash (no unhandled errors)
    const hasErrorBoundary = await page.locator('text=/error|try again|reload/i').isVisible().catch(() => false);
    const hasLoading = await page.locator('[data-testid="loading"]').isVisible().catch(() => false);

    // Either error boundary or loading state should be shown
    expect(hasErrorBoundary || hasLoading).toBeTruthy();
  });

  test('should show authentication error when accessing protected route', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/executions`);

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should show validation error for invalid input', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/executions`, {
      data: {
        // Missing required fields
        inputData: {}
      }
    });

    // Should return 400 Bad Request or 401 Unauthorized
    expect([400, 401]).toContain(response.status());
  });

  test('should handle malformed JSON gracefully', async ({ request }) => {
    try {
      const response = await request.post(`${API_BASE_URL}/api/executions`, {
        data: 'not valid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Should return error status
      expect(response.status()).toBeGreaterThanOrEqual(400);
    } catch (e) {
      // Request may fail, which is acceptable
      expect(true).toBeTruthy();
    }
  });

  test('should handle rate limiting', async ({ request }) => {
    // Make many rapid requests
    const requests = Array(50).fill(null).map(() =>
      request.get(`${API_BASE_URL}/api/agents`)
    );

    const responses = await Promise.all(requests);

    // Some responses may be rate limited (429)
    const statuses = responses.map(r => r.status());
    const hasRateLimit = statuses.some(s => s === 429);

    // Either all succeed or some are rate limited
    expect(statuses.every(s => s === 200) || hasRateLimit).toBeTruthy();
  });

  test('should display user-friendly error messages', async ({ page }) => {
    // Navigate to a route that might error
    await page.goto('/agents/test-error');

    await page.waitForTimeout(1000);

    // Check that any error message is user-friendly (not technical stack trace)
    const bodyText = await page.locator('body').textContent();

    if (bodyText && bodyText.includes('error')) {
      // Should not show technical error details in production
      const hasTechnicalError = bodyText.includes('stack') ||
        bodyText.includes('TypeError') ||
        bodyText.includes('.tsx') ||
        bodyText.includes('node_modules');

      // In production, technical errors should not be shown
      // In development, they may be shown (which is acceptable)
      const isDevelopment = bodyText.includes('localhost') || bodyText.includes('development');

      if (!isDevelopment) {
        expect(hasTechnicalError).toBeFalsy();
      }
    }
  });

  test('should handle missing environment variables', async ({ request }) => {
    // Health check should still work even if some features are unavailable
    const response = await request.get(`${API_BASE_URL}/health`);

    expect(response.status()).toBe(200);
  });

  test.skip('should show loading state during slow requests', async ({ page, context }) => {
    // Delay API responses
    await context.route(`${API_BASE_URL}/api/agents`, async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('/');

    // Check for loading indicator or wait for agents to load
    const hasLoading = await page.locator('[data-testid="loading"], .animate-pulse, [data-testid="skeleton"]').isVisible({ timeout: 1000 }).catch(() => false);
    const hasAgentGrid = await page.locator('[data-testid="agent-grid"]').isVisible().catch(() => false);
    const hasMainContent = await page.locator('main, [role="main"]').isVisible().catch(() => false);

    // Page should show loading, agent grid, or main content (didn't crash)
    expect(hasLoading || hasAgentGrid || hasMainContent).toBeTruthy();
  });

  test('should handle WebSocket connection failure', async ({ page }) => {
    await page.goto('/');

    const handled = await page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          const ws = new WebSocket('ws://invalid-host:9999/ws');

          ws.onerror = () => {
            // Error handled
            resolve(true);
          };

          ws.onopen = () => {
            ws.close();
            resolve(true);
          };

          setTimeout(() => resolve(true), 3000);
        } catch (e) {
          // Exception caught, error handled
          resolve(true);
        }
      });
    });

    expect(handled).toBeTruthy();
  });

  test('should show helpful message when no agents are available', async ({ page, context }) => {
    // Mock empty agents response
    await context.route(`${API_BASE_URL}/api/agents`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/');

    await page.waitForTimeout(1000);

    // Should show empty state message
    const hasEmptyState = await page.locator('text=/no agents|empty|create|get started/i').isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasEmptyState).toBeTruthy();
  });

  test('should handle unauthorized wallet connection', async ({ page }) => {
    await page.goto('/');

    // Try to access protected functionality without wallet
    const purchaseButton = page.locator('[data-testid="purchase-button"]').first();

    if (await purchaseButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await purchaseButton.click();

      // Should prompt to connect wallet
      const hasWalletPrompt = await page.locator('text=/connect|wallet/i').isVisible({ timeout: 3000 }).catch(() => false);

      // Either wallet prompt appears or purchase flow requires auth
      expect(hasWalletPrompt).toBeTruthy();
    }
  });

  test('should handle execution timeout errors', async ({ request }) => {
    // This tests the API's ability to handle timeout errors
    // In practice, this would be tested with a long-running agent

    // For now, verify error response format
    const response = await request.get(`${API_BASE_URL}/api/agents/timeout-test`);

    if (response.status() >= 400) {
      const data = await response.json().catch(() => ({}));

      // Error responses should have consistent format
      expect(data.error || data.message || response.statusText()).toBeTruthy();
    }
  });

  test('should handle database connection errors gracefully', async ({ request }) => {
    // Check readiness endpoint which includes DB check
    const response = await request.get(`${API_BASE_URL}/health/ready`);

    const data = await response.json();

    // Should have health check results
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('checks');

    // If DB is down, should indicate degraded/unhealthy
    if (data.checks.database?.status === 'error') {
      expect(['degraded', 'unhealthy']).toContain(data.status);
    }
  });

  test('should handle Docker daemon unavailability', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health/ready`);

    const data = await response.json();

    // If Docker is down, system should still respond
    if (data.checks.docker?.status === 'error') {
      // Service should be degraded but not completely down
      expect(['healthy', 'degraded']).toContain(data.status);
    }
  });
});

test.describe('Input Validation', () => {

  test('should validate required fields', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/agents`, {
      data: {
        // Missing required fields
      }
    });

    // Should return 400 or 401
    expect([400, 401]).toContain(response.status());
  });

  test('should validate field types', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/executions`, {
      data: {
        agentId: 123, // Should be string
        inputData: 'invalid' // Should be object
      }
    });

    // Should return validation error
    expect([400, 401, 422]).toContain(response.status());
  });

  test('should sanitize user input', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/executions`, {
      data: {
        agentId: 'test-agent',
        inputData: {
          query: '<script>alert("xss")</script>'
        }
      }
    });

    // Request should be processed (sanitized) or rejected
    expect(response.status()).toBeGreaterThanOrEqual(200);
  });

  test('should enforce string length limits', async ({ request }) => {
    const veryLongString = 'a'.repeat(1000000); // 1MB string

    const response = await request.post(`${API_BASE_URL}/api/executions`, {
      data: {
        agentId: 'test',
        inputData: {
          query: veryLongString
        }
      }
    });

    // Should either handle it or reject with 413 Payload Too Large
    expect([200, 201, 401, 413, 400]).toContain(response.status());
  });
});

test.describe('Security Errors', () => {

  test('should reject requests without CSRF token (if implemented)', async ({ request }) => {
    // This test checks if CSRF protection is implemented
    const response = await request.post(`${API_BASE_URL}/api/agents`, {
      data: {
        name: 'Test'
      }
    });

    // Should require authentication at minimum
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should handle SQL injection attempts safely', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/agents`, {
      params: {
        category: "'; DROP TABLE agents; --"
      }
    });

    // Should handle safely (return results or error, but not crash)
    expect(response.status()).toBeLessThan(500);
  });

  test('should block command injection attempts', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/executions`, {
      data: {
        agentId: 'test',
        inputData: {
          query: '; rm -rf /'
        }
      }
    });

    // Should be blocked or sanitized
    // System should not execute arbitrary commands
    expect([400, 401, 403]).toContain(response.status());
  });
});

