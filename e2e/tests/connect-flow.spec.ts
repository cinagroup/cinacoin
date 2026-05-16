import { test, expect } from '../fixtures';
import {
  getConnectButton,
  waitForConnected,
  openConnectModal,
  selectWallet,
  assertAddressDisplayed,
  assertDisconnected,
  injectMockProvider,
  resetMockProvider,
} from '../helpers/wallet';

// ============================================================
// E2E tests for the wallet connect flow
// ============================================================

test.describe('Connect Wallet Flow', () => {
  test.afterEach(async ({ page }) => {
    await resetMockProvider(page);
  });

  test('should display connect button on landing page', async ({ demoPage }) => {
    await expect(await getConnectButton(demoPage)).toBeVisible();
  });

  test('should open connect modal when clicking connect button', async ({ demoPage }) => {
    await openConnectModal(demoPage);
    await expect(demoPage.getByText(/connect wallet/i)).toBeVisible();
    // Verify modal shows wallet options
    await expect(demoPage.getByText('MetaMask')).toBeVisible();
    await expect(demoPage.getByText('WalletConnect')).toBeVisible();
  });

  test('should connect with mock injected provider', async ({ page }) => {
    await injectMockProvider(page);
    await page.goto('/');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);
  });

  test('should show wallet list with expected wallets', async ({ demoPage }) => {
    await openConnectModal(demoPage);
    const wallets = ['MetaMask', 'WalletConnect', 'Coinbase'];
    for (const wallet of wallets) {
      await expect(demoPage.getByText(wallet)).toBeVisible();
    }
  });

  test('should close modal on close button click', async ({ demoPage }) => {
    await openConnectModal(demoPage);
    await demoPage.getByRole('button', { name: /✕/ }).click();
    // Modal should be hidden
    await expect(demoPage.getByText(/connect wallet/i)).not.toBeVisible();
  });

  test('should handle disconnect correctly', async ({ page }) => {
    await injectMockProvider(page);
    await page.goto('/');
    await openConnectModal(page);
    await selectWallet(page, 'MetaMask');
    await waitForConnected(page);

    // Click disconnect
    await page.getByRole('button', { name: /disconnect/i }).click();
    await assertDisconnected(page);
  });

  test('should display recommended wallets first', async ({ demoPage }) => {
    await openConnectModal(demoPage);
    // Get wallet card positions
    const walletCards = demoPage.locator('[class*="wallet"]');
    // First wallet should be MetaMask (typically recommended)
    const firstWallet = walletCards.first();
    await expect(firstWallet).toContainText('MetaMask');
  });
});
