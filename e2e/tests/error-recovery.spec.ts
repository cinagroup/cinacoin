/**
 * E2E Test - Error Recovery
 *
 * Tests for error scenarios and recovery flows
 */
import { test, expect } from '../fixtures';
import {
  getConnectButton,
  waitForConnected,
  openConnectModal,
  selectWallet,
  injectMockProvider,
  resetMockProvider,
  assertDisconnected,
} from '../helpers/wallet';

test.describe('Error Recovery', () => {
  test.afterEach(async ({ page }) => {
    await resetMockProvider(page);
  });

  test('should handle connection timeout', async ({ page }) => {
    await page.evaluate(() => {
      (window as unknown).mockProvider.connectionDelay = 10000;
    });
    
    await page.goto('/');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    
    // Should show timeout error
    const error = page.getByText(/timeout|timed out/i);
    await expect(error).toBeVisible({ timeout: 15000 });
    
    // Should allow retry
    const retryButton = page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
  });

  test('should handle network error', async ({ page }) => {
    await page.evaluate(() => {
      (window as unknown).mockProvider.networkError = true;
    });
    
    await page.goto('/');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    
    // Should show network error
    const error = page.getByText(/network|connection failed/i);
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('should recover from disconnection', async ({ page }) => {
    await injectMockProvider(page);
    await page.goto('/');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);
    
    // Simulate disconnection
    await page.evaluate(() => {
      (window as unknown).mockProvider.disconnect();
    });
    
    await assertDisconnected(page);
    
    // Should be able to reconnect
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);
  });

  test('should handle chain switch failure', async ({ page }) => {
    await injectMockProvider(page);
    await page.goto('/');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);
    
    await page.evaluate(() => {
      (window as unknown).mockProvider.rejectChainSwitch = true;
    });
    
    // Try to switch chain
    const chainSelector = page.getByRole('button', { name: /ethereum/i });
    await chainSelector.click();
    
    const polygonOption = page.getByText('Polygon');
    await polygonOption.click();
    
    // Should show error
    const error = page.getByText(/failed to switch|chain switch rejected/i);
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('should handle transaction failure', async ({ page }) => {
    await injectMockProvider(page);
    await page.goto('/');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);
    
    await page.evaluate(() => {
      (window as unknown).mockProvider.rejectTransaction = true;
    });
    
    // Try to send transaction
    const sendButton = page.getByRole('button', { name: /send|transaction/i });
    await sendButton.click();
    
    // Fill transaction form
    const toInput = page.locator('input[name="to"]');
    await toInput.fill('0x1234567890123456789012345678901234567890');
    
    const amountInput = page.locator('input[name="amount"]');
    await amountInput.fill('0.1');
    
    await page.getByRole('button', { name: /send/i }).click();
    
    // Should show error
    const error = page.getByText(/transaction failed|rejected/i);
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('should handle wallet not installed', async ({ page }) => {
    // Don't inject mock provider
    await page.goto('/');
    await openConnectModal(page);
    
    // Try to connect to MetaMask
    await selectWallet(page, 'MetaMask');
    
    // Should show install prompt
    const installPrompt = page.getByText(/install|download/i);
    await expect(installPrompt).toBeVisible({ timeout: 5000 });
    
    const installLink = page.getByRole('link', { name: /install metamask/i });
    await expect(installLink).toBeVisible();
  });

  test('should handle multiple connection attempts', async ({ page }) => {
    await page.evaluate(() => {
      (window as unknown).mockProvider.failCount = 2;
    });
    
    await page.goto('/');
    
    // First attempt - fail
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await expect(page.getByText(/failed|error/i)).toBeVisible({ timeout: 5000 });
    
    // Close modal
    await page.getByRole('button', { name: /close|✕/ }).click();
    
    // Second attempt - fail
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await expect(page.getByText(/failed|error/i)).toBeVisible({ timeout: 5000 });
    
    // Close modal
    await page.getByRole('button', { name: /close|✕/ }).click();
    
    // Third attempt - succeed
    await page.evaluate(() => {
      (window as unknown).mockProvider.failCount = 0;
    });
    
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);
  });

  test('should display error boundary for component crash', async ({ page }) => {
    await injectMockProvider(page);
    await page.goto('/');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);
    
    // Trigger component error
    await page.evaluate(() => {
      throw new Error('Component crash');
    });
    
    // Should show error boundary
    const errorBoundary = page.getByText(/something went wrong|error/i);
    await expect(errorBoundary).toBeVisible({ timeout: 5000 });
    
    // Should offer reload
    const reloadButton = page.getByRole('button', { name: /reload|refresh/i });
    await expect(reloadButton).toBeVisible();
  });
});
