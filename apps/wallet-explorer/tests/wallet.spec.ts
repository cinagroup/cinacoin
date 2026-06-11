import { test, expect } from '@playwright/test';

test.describe('Wallet Explorer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays connect wallet button when not connected', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /Connect Wallet/i });
    await expect(connectButton).toBeVisible();
  });

  test('shows welcome message when not connected', async ({ page }) => {
    await expect(page.getByText('Welcome to CinaCoin Wallet Explorer')).toBeVisible();
  });

  test('connects wallet and displays wallet info', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /Connect Wallet/i });
    await connectButton.click();

    // Check wallet info is displayed
    await expect(page.getByText('Wallet Details')).toBeVisible();
    await expect(page.getByText('1,234,567.89')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });

  test('displays transaction list after connecting', async ({ page }) => {
    await page.getByRole('button', { name: /Connect Wallet/i }).click();

    // Check transaction list
    await expect(page.getByText('Transactions')).toBeVisible();
    await expect(page.getByText(/0x8ba1f109/)).toBeVisible();
  });

  test('navigation links work', async ({ page }) => {
    await page.getByRole('button', { name: /Connect Wallet/i }).click();

    // Test Send page
    await page.getByRole('link', { name: 'Send' }).click();
    await expect(page).toHaveURL('/send');
    await expect(page.getByText('Send CINA')).toBeVisible();

    // Test Receive page
    await page.getByRole('link', { name: 'Receive' }).click();
    await expect(page).toHaveURL('/receive');
    await expect(page.getByText('Receive CINA')).toBeVisible();

    // Test Tokens page
    await page.getByRole('link', { name: 'Tokens' }).click();
    await expect(page).toHaveURL('/tokens');
    await expect(page.getByText('Tokens')).toBeVisible();
  });

  test('send page validates form', async ({ page }) => {
    await page.getByRole('button', { name: /Connect Wallet/i }).click();
    await page.getByRole('link', { name: 'Send' }).click();

    // Try to submit empty form
    const sendButton = page.getByRole('button', { name: /Send/i });
    await sendButton.click();

    // Should show validation errors
    await expect(page.getByText('Recipient address is required')).toBeVisible();
  });

  test('send page validates address format', async ({ page }) => {
    await page.getByRole('button', { name: /Connect Wallet/i }).click();
    await page.getByRole('link', { name: 'Send' }).click();

    // Fill invalid address
    await page.fill('input[id="recipient"]', 'invalid-address');
    await page.fill('input[id="amount"]', '10');

    const sendButton = page.getByRole('button', { name: /Send/i });
    await sendButton.click();

    // Should show validation error
    await expect(page.getByText('Invalid Ethereum address format')).toBeVisible();
  });

  test('receive page shows address and copy button', async ({ page }) => {
    await page.getByRole('button', { name: /Connect Wallet/i }).click();
    await page.getByRole('link', { name: 'Receive' }).click();

    // Check address is displayed
    await expect(page.getByText('Your Wallet Address')).toBeVisible();
    await expect(page.getByRole('button', { name: /Copy Address/i })).toBeVisible();
  });

  test('settings page shows preferences', async ({ page }) => {
    await page.getByRole('button', { name: /Connect Wallet/i }).click();
    await page.getByRole('link', { name: 'Settings' }).click();

    await expect(page.getByText('Connection')).toBeVisible();
    await expect(page.getByText('Preferences')).toBeVisible();
    await expect(page.getByText('Display Currency')).toBeVisible();
    await expect(page.getByText('Notifications')).toBeVisible();
  });

  test('404 page displays correctly', async ({ page }) => {
    await page.goto('/nonexistent-page');

    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Page not found')).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to Wallet Explorer/i })).toBeVisible();
  });
});
