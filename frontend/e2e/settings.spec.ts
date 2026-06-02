import { expect, test } from '@playwright/test';

test('settings save endpoint aliases and keep API key reload-scoped', async ({ page }) => {
  await page.goto('/settings');

  const endpointInput = page.getByPlaceholder('https://api.agentnexus.xyz');
  const tokenInput = page.getByPlaceholder('sk-...');

  await expect(endpointInput).toBeVisible();
  await endpointInput.fill('https://api.manual-test.example');
  await tokenInput.fill('manual-token-123');

  const dialogPromise = new Promise<string>((resolve) => {
    page.once('dialog', async (dialog) => {
      const message = dialog.message();
      await dialog.accept();
      resolve(message);
    });
  });
  await page.getByRole('button', { name: 'Save Settings' }).click();
  await expect(dialogPromise).resolves.toContain('Settings saved');

  await expect.poll(async () => page.evaluate(() => ({
    apiUrl: window.localStorage.getItem('api_url'),
    backendBaseUrl: window.localStorage.getItem('backend_base_url'),
    agentNexusBackendUrl: window.localStorage.getItem('agentnexus_backend_url'),
    legacyEndpoint: window.localStorage.getItem('agentnexus_api_endpoint'),
    persistedToken: window.localStorage.getItem('auth_token'),
  }))).toEqual({
    apiUrl: 'https://api.manual-test.example',
    backendBaseUrl: 'https://api.manual-test.example',
    agentNexusBackendUrl: 'https://api.manual-test.example',
    legacyEndpoint: 'https://api.manual-test.example',
    persistedToken: null,
  });

  await page.reload();

  await expect(endpointInput).toHaveValue('https://api.manual-test.example');
  await expect(tokenInput).toHaveValue('');

  if (process.env.SETTINGS_SCREENSHOT_PATH) {
    await page.screenshot({ path: process.env.SETTINGS_SCREENSHOT_PATH, fullPage: true });
  }
});

