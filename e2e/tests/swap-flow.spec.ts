import { test, expect } from '../fixtures';
import {
  openConnectModal,
  selectWallet,
  waitForConnected,
  injectMockProvider,
  resetMockProvider,
} from '../helpers/wallet';

// ============================================================
// E2E tests for the swap flow
// ============================================================

test.describe('Swap Flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockProvider(page);
    await page.goto('/swap');
    // Ensure connected state
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);
  });

  test.afterEach(async ({ page }) => {
    await resetMockProvider(page);
  });

  test('should display swap interface when connected', async ({ page }) => {
    // Navigate to swap page
    await page.goto('/swap');
    await expect(page.getByText(/swap/i)).toBeVisible();
    // Should see token input fields
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('should allow entering token amount', async ({ page }) => {
    await page.goto('/swap');
    const tokenInput = page.locator('input').first();
    await tokenInput.fill('0.5');
    await expect(tokenInput).toHaveValue('0.5');
  });

  test('should show chain selector', async ({ page }) => {
    await page.goto('/swap');
    await expect(page.getByText(/ethereum/i)).toBeVisible();
  });

  test('should display slippage settings', async ({ page }) => {
    await page.goto('/swap');
    // Slippage tolerance should be accessible
    const slippageSetting = page.getByText(/slippage/i);
    await expect(slippageSetting).toBeVisible();
  });

  test('should handle token selection', async ({ page }) => {
    await page.goto('/swap');
    // Click token selector for "from" token
    const fromToken = page.locator('button').filter({ hasText: /ETH/i }).first();
    await expect(fromToken).toBeVisible();
  });
});
