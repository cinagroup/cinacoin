/**
 * E2E Test - Sign Message Flow
 *
 * Tests for message signing functionality
 */
import { test, expect } from '../fixtures';
import {
  getConnectButton,
  waitForConnected,
  openConnectModal,
  selectWallet,
  injectMockProvider,
  resetMockProvider,
} from '../helpers/wallet';

test.describe('Sign Message Flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockProvider(page);
    await page.goto('/');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);
  });

  test.afterEach(async ({ page }) => {
    await resetMockProvider(page);
  });

  test('should display sign message button', async ({ page }) => {
    const signButton = page.getByRole('button', { name: /sign message/i });
    await expect(signButton).toBeVisible();
  });

  test('should open sign message modal', async ({ page }) => {
    await page.getByRole('button', { name: /sign message/i }).click();
    
    const modal = page.getByText(/sign message/i);
    await expect(modal).toBeVisible();
    
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
  });

  test('should sign plain text message', async ({ page }) => {
    await page.getByRole('button', { name: /sign message/i }).click();
    
    const textarea = page.locator('textarea');
    await textarea.fill('Hello, Cinacoin!');
    
    await page.getByRole('button', { name: /sign/i }).click();
    
    // Wait for signature
    const signature = page.locator('[data-testid="signature"]');
    await expect(signature).toBeVisible({ timeout: 10000 });
    
    const sigText = await signature.textContent();
    expect(sigText).toMatch(/^0x[a-fA-F0-9]+$/);
  });

  test('should sign SIWE message', async ({ page }) => {
    await page.getByRole('button', { name: /sign in with ethereum/i }).click();
    
    // Wait for signature
    const signature = page.locator('[data-testid="signature"]');
    await expect(signature).toBeVisible({ timeout: 10000 });
    
    // Verify SIWE structure
    const sigText = await signature.textContent();
    expect(sigText).toMatch(/^0x[a-fA-F0-9]+$/);
  });

  test('should handle signature rejection', async ({ page }) => {
    // Mock rejection
    await page.evaluate(() => {
      (window as unknown).mockProvider.rejectNextSignature = true;
    });
    
    await page.getByRole('button', { name: /sign message/i }).click();
    
    const textarea = page.locator('textarea');
    await textarea.fill('Test message');
    
    await page.getByRole('button', { name: /sign/i }).click();
    
    // Should show error
    const error = page.getByText(/rejected|cancelled|denied/i);
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('should validate empty message', async ({ page }) => {
    await page.getByRole('button', { name: /sign message/i }).click();
    
    const textarea = page.locator('textarea');
    await textarea.fill('');
    
    const signButton = page.getByRole('button', { name: /sign/i });
    await expect(signButton).toBeDisabled();
  });

  test('should copy signature to clipboard', async ({ page }) => {
    await page.getByRole('button', { name: /sign message/i }).click();
    
    const textarea = page.locator('textarea');
    await textarea.fill('Test');
    
    await page.getByRole('button', { name: /sign/i }).click();
    
    const signature = page.locator('[data-testid="signature"]');
    await expect(signature).toBeVisible({ timeout: 10000 });
    
    const copyButton = page.getByRole('button', { name: /copy/i });
    await copyButton.click();
    
    // Verify copy feedback
    const copied = page.getByText(/copied/i);
    await expect(copied).toBeVisible();
  });
});
