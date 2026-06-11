import { test, expect } from '../fixtures';
import {
  injectMockProvider,
  resetMockProvider,
  openConnectModal,
  selectWallet,
  waitForConnected,
} from '../helpers/wallet';

// ============================================================
// E2E tests for SIWE (Sign-In With Ethereum) authentication flow
// ============================================================

test.describe('SIWE Auth Flow', () => {
  test.afterEach(async ({ page }) => {
    await resetMockProvider(page);
  });

  // Skip wallet interaction tests in headless mode
  test.skip('should prompt SIWE message after wallet connect', async ({ page }) => {
    await injectMockProvider(page);
    await page.goto('http://localhost:3002/demo/');
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);

    // After connection, SIWE message should be presented
    // The SIWE prompt may appear as a modal or toast
    const siwePrompt = page.getByText(/sign in with ethereum/i);
    await expect(siwePrompt).toBeVisible({ timeout: 10_000 });
  });

  test.skip('should verify connected address format', async ({ page }) => {
    await injectMockProvider(page);
    await page.goto('http://localhost:3002/demo/');
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);

    // Address should be a valid hex address
    await expect(page.getByText(/0x[0-9a-fA-F]{40}/)).toBeVisible({ timeout: 10_000 });
  });

  test.skip('should handle auth state persistence', async ({ page }) => {
    await injectMockProvider(page);
    await page.goto('http://localhost:3002/demo/');
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);

    // Reload page - auth state should persist
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /disconnect/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test.skip('should show auth error on rejected connection', async ({ page }) => {
    await page.goto('http://localhost:3002/demo/');
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');

    // Simulate rejection by not injecting a provider
    // The app should show an error message
    await expect(page.getByText(/error|failed/i)).toBeVisible({ timeout: 10_000 });
  });

  test.skip('should display nonce in SIWE message', async ({ page }) => {
    await injectMockProvider(page);
    await page.goto('http://localhost:3002/demo/');
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);

    // SIWE message should contain a nonce (random string)
    const nonceElement = page.getByText(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/);
    await expect(nonceElement).toBeVisible({ timeout: 10_000 });
  });
});