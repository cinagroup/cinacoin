import { test, expect } from '@playwright/test';

test('AA demo page loads', async ({ page }) => {
  await page.goto('/aa-demo');
  
  // Check page title
  await expect(page).toHaveTitle(/Account Abstraction Demo/);
  
  // Check wallet connection button
  const connectButton = page.getByRole('button', { name: /Connect Wallet/i });
  await expect(connectButton).toBeVisible();
  
  // Check demo sections
  const demoSections = page.locator('[data-testid="demo-section"]');
  await expect(demoSections).toHaveCount(5); // batch, auth, swap, profile, onramp
  
  // Check each section has proper content
  for (let i = 0; i < 5; i++) {
    const section = demoSections.nth(i);
    await expect(section.locator('[data-testid="section-title"]')).toBeVisible();
    await expect(section.locator('[data-testid="section-description"]')).toBeVisible();
  }
});

test('wallet connection flow', async ({ page }) => {
  await page.goto('/aa-demo');
  
  // Click connect wallet button
  const connectButton = page.getByRole('button', { name: /Connect Wallet/i });
  await connectButton.click();
  
  // Check wallet modal appears
  const walletModal = page.locator('[data-testid="wallet-modal"]');
  await expect(walletModal).toBeVisible();
  
  // Check available wallets
  const walletOptions = page.locator('[data-testid="wallet-option"]');
  await expect(walletOptions).toHaveCount(3); // MetaMask, WalletConnect, Coinbase
  
  // Select WalletConnect
  const walletConnectOption = page.getByText('WalletConnect');
  await walletConnectOption.click();
  
  // Check QR code appears
  const qrCode = page.locator('[data-testid="qr-code"]');
  await expect(qrCode).toBeVisible();
});

test('batch transaction demo', async ({ page }) => {
  await page.goto('/batch');
  
  // Check batch demo form
  const batchForm = page.locator('[data-testid="batch-form"]');
  await expect(batchForm).toBeVisible();
  
  // Fill transaction details
  await page.fill('[name="toAddress"]', '0x1234567890123456789012345678901234567890');
  await page.fill('[name="amount"]', '0.1');
  await page.fill('[name="gasLimit"]', '21000');
  
  // Add second transaction
  const addTxButton = page.getByRole('button', { name: /Add Transaction/i });
  await addTxButton.click();
  
  await page.fill('[name="toAddress-1"]', '0x0987654321098765432109876543210987654321');
  await page.fill('[name="amount-1"]', '0.05');
  await page.fill('[name="gasLimit-1"]', '21000');
  
  // Submit batch
  const submitButton = page.getByRole('button', { name: /Execute Batch/i });
  await submitButton.click();
  
  // Check confirmation message
  const confirmation = page.locator('[data-testid="batch-confirmation"]');
  await expect(confirmation).toBeVisible();
});