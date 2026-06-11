import { test, expect } from '../fixtures';
import { injectMockProvider, getConnectButton } from '../helpers/wallet';

test('debug auth flow connect button', async ({ page }) => {
  await injectMockProvider(page);
  await page.goto('http://localhost:3002/demo/');
  await page.waitForLoadState('networkidle');
  
  console.log('Page loaded with mock provider');
  
  // Check if connect button exists
  const connectButton = await getConnectButton(page);
  console.log('Connect button found');
  
  // Click the button
  await connectButton.click();
  console.log('Button clicked');
  
  // Wait and check state
  await page.waitForTimeout(2000);
  console.log('Wait completed');
});