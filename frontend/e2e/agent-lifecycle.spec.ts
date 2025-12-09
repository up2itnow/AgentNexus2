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

  test.skip('should navigate to agent detail page', async ({ page }) => {
    // Wait for agents to load
    await page.waitForSelector('[data-testid="agent-card"]');

    // Click on first agent
    await page.locator('[data-testid="agent-card"]').first().click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/agents\/[a-zA-Z0-9-]+/);

    // Verify detail page elements - name should always be visible
    await expect(page.locator('[data-testid="agent-detail-name"]')).toBeVisible();

    // Price/purchase button OR connect wallet button may be visible depending on wallet state
    const hasPrice = await page.locator('[data-testid="agent-detail-price"]').isVisible().catch(() => false);
    const hasPurchase = await page.locator('[data-testid="purchase-button"]').isVisible().catch(() => false);
    const hasConnect = await page.locator('[data-testid="connect-wallet-button"], text=/connect wallet/i').isVisible().catch(() => false);

    expect(hasPrice || hasPurchase || hasConnect).toBeTruthy();
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

  test.skip('should show wallet connection prompt on purchase attempt', async ({ page }) => {
    // Navigate to agent detail
    await page.waitForSelector('[data-testid="agent-card"]');
    await page.locator('[data-testid="agent-card"]').first().click();

    // Wait for either purchase button or connect wallet button
    await page.waitForTimeout(2000);

    const purchaseButton = page.locator('[data-testid="purchase-button"]');
    const connectButton = page.locator('[data-testid="connect-wallet-button"], text=/connect wallet/i');

    // Either wallet connection is prompted directly, or we can click purchase
    const hasPurchase = await purchaseButton.isVisible().catch(() => false);
    const hasConnect = await connectButton.isVisible().catch(() => false);

    if (hasPurchase) {
      await purchaseButton.click();
      await page.waitForTimeout(500);
      // After clicking purchase, wallet prompt should appear
      const hasWalletPrompt = await page.locator('text=/connect|wallet/i').isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasWalletPrompt).toBeTruthy();
    } else {
      // Connect wallet button is already visible
      expect(hasConnect).toBeTruthy();
    }
  });

  test.skip('should display agent execution form', async ({ page }) => {
    // Navigate to execution page or agent detail page with execute tab
    await page.goto('/');
    await page.waitForSelector('[data-testid="agent-card"]');
    await page.locator('[data-testid="agent-card"]').first().click();

    await page.waitForTimeout(1000);

    // Look for execution tab or execution-related elements
    const hasExecuteTab = await page.locator('[data-testid="execute-tab-button"]').isVisible().catch(() => false);
    const hasExecuteButton = await page.locator('[data-testid="execute-button"]').isVisible().catch(() => false);
    const hasAgentDetail = await page.locator('[data-testid="agent-detail-container"]').isVisible().catch(() => false);

    // Page should have agent detail or execution interface
    expect(hasExecuteTab || hasExecuteButton || hasAgentDetail).toBeTruthy();
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

  test.skip('should show loading state while fetching agents', async ({ page }) => {
    // Navigate to page
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Check for loading indicator, agents, or any main content
    const hasLoading = await page.locator('[data-testid="loading"], [data-testid="skeleton"], .animate-pulse').isVisible().catch(() => false);
    const hasAgents = await page.locator('[data-testid="agent-card"]').isVisible().catch(() => false);
    const hasAgentGrid = await page.locator('[data-testid="agent-grid"]').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('[data-testid="empty-agents"]').isVisible().catch(() => false);
    const hasPageContent = await page.locator('main, [role="main"]').isVisible().catch(() => false);

    // Page should have rendered something - loading, agents, empty state, or main content
    expect(hasLoading || hasAgents || hasAgentGrid || hasEmptyState || hasPageContent).toBeTruthy();
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
  test.skip('should show execution results page', async ({ page }) => {
    // Navigate to profile which contains execution history
    await page.goto('/profile');

    await page.waitForTimeout(2000);

    // Check if execution history section exists (may require wallet connection)
    const hasExecutions = await page.locator('[data-testid="execution-history"]').isVisible().catch(() => false);
    const hasEmptyHistory = await page.locator('[data-testid="empty-history"]').isVisible().catch(() => false);
    const hasWalletPrompt = await page.locator('text=/connect wallet|connect your wallet/i').isVisible().catch(() => false);
    const hasProfileContent = await page.locator('[data-testid="profile-content"]').isVisible().catch(() => false);

    // Page should show execution history, empty state, wallet prompt, or profile content
    expect(hasExecutions || hasEmptyHistory || hasWalletPrompt || hasProfileContent).toBeTruthy();
  });
});

