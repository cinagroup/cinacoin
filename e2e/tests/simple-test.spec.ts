import { test, expect } from '@playwright/test';

test('should find connect wallet button', async ({ page }) => {
  // Use full URL directly
  await page.goto('http://localhost:3002/demo/');
  
  // Wait for page to load completely
  await page.waitForLoadState('networkidle');
  
  // Get page content for debugging
  const content = await page.content();
  console.log('Page title:', await page.title());
  console.log('Connect Wallet count:', (content.match(/Connect Wallet/g) || []).length);
  
  // Try multiple selectors
  const button1 = page.getByText('Connect Wallet');
  const button2 = page.locator('button:has-text("Connect Wallet")');
  const button3 = page.getByRole('button', { name: 'Connect Wallet' });
  
  // Try each selector with longer timeout
  try {
    await expect(button1).toBeVisible({ timeout: 20000 });
    console.log('Found with getByText');
    return;
  } catch (e1) {
    console.log('getByText failed');
  }
  
  try {
    await expect(button2).toBeVisible({ timeout: 20000 });
    console.log('Found with locator');
    return;
  } catch (e2) {
    console.log('locator failed');
  }
  
  try {
    await expect(button3).toBeVisible({ timeout: 20000 });
    console.log('Found with getByRole');
    return;
  } catch (e3) {
    console.log('getByRole failed');
  }
  
  throw new Error('All selectors failed to find Connect Wallet button');
});