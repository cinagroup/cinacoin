import { test, expect } from '@playwright/test';

test('test button selectors', async ({ page }) => {
  await page.goto('file:///home/cina/.openclaw/workspace/e2e/test-button.html');
  
  // Test getByText
  const button1 = page.getByText('Connect Wallet');
  await expect(button1).toBeVisible();
  
  // Test locator
  const button2 = page.locator('button:has-text("Connect Wallet")');
  await expect(button2).toBeVisible();
  
  // Test getByRole
  const button3 = page.getByRole('button', { name: 'Connect Wallet' });
  await expect(button3).toBeVisible();
  
  console.log('All selectors work on static HTML');
});