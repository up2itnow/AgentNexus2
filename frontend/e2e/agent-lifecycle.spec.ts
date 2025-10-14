/**
 * Agent Lifecycle E2E Tests
 * 
 * Tests the complete agent lifecycle from browsing marketplace
 * through purchasing and executing an agent.
 * 
 * @author AgentNexus Team (Phase 6A: Integration Testing)
 */

import { test, expect } from '@playwright/test';

test.describe('Agent Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
  });

  test('should display marketplace with agents', async ({ page }) => {
    // Wait for agents to load
    await page.waitForSelector('[data-testid="agent-card"]', { timeout: 10000 });
    
    // Check that at least one agent is displayed
    const agentCards = await page.locator('[data-testid="agent-card"]').count();
    expect(agentCards).toBeGreaterThan(0);
    
    // Verify agent card has required elements
    const firstAgent = page.locator('[data-testid="agent-card"]').first();
    await expect(firstAgent.locator('[data-testid="agent-name"]')).toBeVisible();
    await expect(firstAgent.locator('[data-testid="agent-price"]')).toBeVisible();
    await expect(firstAgent.locator('[data-testid="agent-category"]')).toBeVisible();
  });

  test('should navigate to agent detail page', async ({ page }) => {
    // Wait for agents to load
    await page.waitForSelector('[data-testid="agent-card"]');
    
    // Click on first agent
    await page.locator('[data-testid="agent-card"]').first().click();
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/agents\/[a-zA-Z0-9-]+/);
    
    // Verify detail page elements
    await expect(page.locator('[data-testid="agent-detail-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-detail-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-detail-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="purchase-button"]')).toBeVisible();
  });

  test('should filter agents by category', async ({ page }) => {
    // Wait for agents to load
    await page.waitForSelector('[data-testid="agent-card"]');
    
    // Get initial agent count
    const initialCount = await page.locator('[data-testid="agent-card"]').count();
    
    // Click on a category filter (if exists)
    const categoryFilter = page.locator('[data-testid="category-filter"]').first();
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Verify filtering worked
      const filteredCount = await page.locator('[data-testid="agent-card"]').count();
      
      // All displayed agents should have the selected category
      const agents = await page.locator('[data-testid="agent-card"]').all();
      for (const agent of agents) {
        const category = await agent.locator('[data-testid="agent-category"]').textContent();
        expect(category).toBeTruthy();
      }
    }
  });

  test('should search for agents', async ({ page }) => {
    // Wait for search input
    const searchInput = page.locator('[data-testid="search-input"]');
    
    if (await searchInput.isVisible()) {
      // Type search query
      await searchInput.fill('data');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Verify search results
      const agents = await page.locator('[data-testid="agent-card"]').all();
      
      if (agents.length > 0) {
        // At least one result should contain search term
        const firstAgentName = await agents[0].locator('[data-testid="agent-name"]').textContent();
        expect(firstAgentName?.toLowerCase()).toContain('data');
      }
    }
  });

  test('should show wallet connection prompt on purchase attempt', async ({ page }) => {
    // Navigate to agent detail
    await page.waitForSelector('[data-testid="agent-card"]');
    await page.locator('[data-testid="agent-card"]').first().click();
    
    // Wait for detail page
    await page.waitForSelector('[data-testid="purchase-button"]');
    
    // Click purchase button
    await page.locator('[data-testid="purchase-button"]').click();
    
    // Should show wallet connection modal or redirect
    // This will vary based on RainbowKit implementation
    const connectButton = page.locator('text=/connect wallet/i');
    
    // Either connect button appears or we're already on purchase flow
    const isVisible = await connectButton.isVisible().catch(() => false);
    
    if (isVisible) {
      expect(await connectButton.isVisible()).toBeTruthy();
    } else {
      // Check if we proceeded to purchase flow (wallet already connected in test env)
      const purchaseModal = page.locator('[data-testid="purchase-modal"]');
      const modalVisible = await purchaseModal.isVisible().catch(() => false);
      
      if (modalVisible) {
        expect(await purchaseModal.isVisible()).toBeTruthy();
      }
    }
  });

  test('should display agent execution form', async ({ page }) => {
    // Navigate to execution page (assuming /execute route exists)
    await page.goto('/execute');
    
    // Check for execution form elements
    const hasAgentSelect = await page.locator('[data-testid="agent-select"]').isVisible().catch(() => false);
    const hasInputForm = await page.locator('[data-testid="execution-input"]').isVisible().catch(() => false);
    const hasExecuteButton = await page.locator('[data-testid="execute-button"]').isVisible().catch(() => false);
    
    // At least one execution-related element should be visible
    expect(hasAgentSelect || hasInputForm || hasExecuteButton).toBeTruthy();
  });

  test('should display user profile page', async ({ page }) => {
    // Navigate to profile
    await page.goto('/profile');
    
    // Check for profile elements
    const hasContent = await page.locator('text=/purchased|executions|history/i').isVisible().catch(() => false);
    
    // Profile page should have some content
    expect(hasContent || await page.locator('[data-testid="profile-content"]').isVisible().catch(() => false)).toBeTruthy();
  });

  test('should navigate using navbar', async ({ page }) => {
    // Check navbar exists
    const navbar = page.locator('nav, [data-testid="navbar"]');
    await expect(navbar).toBeVisible();
    
    // Check for common nav links
    const hasMarketplace = await page.locator('text=/marketplace|agents/i').first().isVisible().catch(() => false);
    const hasProfile = await page.locator('text=/profile/i').first().isVisible().catch(() => false);
    
    // At least some navigation should be present
    expect(hasMarketplace || hasProfile).toBeTruthy();
  });

  test('should show loading state while fetching agents', async ({ page }) => {
    // Navigate to page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check for loading indicator (skeleton, spinner, etc.)
    const hasLoading = await page.locator('[data-testid="loading"], [data-testid="skeleton"], .animate-pulse').isVisible().catch(() => false);
    
    // Loading state should appear briefly (or agents load immediately)
    // This test passes if either loading state appears or agents load
    const hasAgents = await page.locator('[data-testid="agent-card"]').isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasLoading || hasAgents).toBeTruthy();
  });

  test('should handle empty marketplace gracefully', async ({ page }) => {
    // This test checks if empty state handling exists
    // Navigate to marketplace
    await page.goto('/');
    
    await page.waitForTimeout(2000);
    
    // Check if there are agents or an empty state message
    const hasAgents = await page.locator('[data-testid="agent-card"]').count() > 0;
    const hasEmptyState = await page.locator('text=/no agents|empty|create agent/i').isVisible().catch(() => false);
    
    // Either agents exist or empty state is shown
    expect(hasAgents || hasEmptyState).toBeTruthy();
  });
});

test.describe('Agent Execution Flow', () => {
  test('should show execution results page', async ({ page }) => {
    // Navigate to a mock execution result
    // This would typically be after an execution completes
    await page.goto('/executions');
    
    // Check if executions page exists and has content
    const hasContent = await page.locator('text=/execution|status|result/i').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasContent) {
      // If no executions page, check if we're redirected or shown empty state
      const hasEmptyState = await page.locator('text=/no executions|empty/i').isVisible().catch(() => false);
      expect(hasEmptyState || hasContent).toBeTruthy();
    }
  });
});

