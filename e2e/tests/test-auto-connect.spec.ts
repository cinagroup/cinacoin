import { test, expect } from '../fixtures';
import { injectMockProvider, waitForConnected } from '../helpers/wallet';

test('test auto connect behavior', async ({ page }) => {
  await injectMockProvider(page);
  await page.goto('http://localhost:3002/demo/');
  await page.waitForLoadState('networkidle');
  
  console.log('Page loaded with mock provider injected');
  
  // Check if the page automatically connects
  try {
    await waitForConnected(page);
    console.log('Page auto-connected successfully');
  } catch (error) {
    console.log('Page did not auto-connect, checking for connect button');
    // Check if connect button exists
    const connectButton = page.getByText('Connect Wallet');
    await expect(connectButton).toBeVisible({ timeout: 5000 });
    console.log('Connect button found');
  }
});