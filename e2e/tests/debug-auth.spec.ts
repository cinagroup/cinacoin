import { test, expect } from '../fixtures';
import { injectMockProvider, openConnectModal, getConnectButton } from '../helpers/wallet';

test('debug auth flow', async ({ page }) => {
  await injectMockProvider(page);
  // Use full URL to be sure
  await page.goto('http://localhost:3002/demo/');
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  console.log('Page loaded, title:', await page.title());
  
  // Check if connect button exists before opening modal
  const connectButton = await getConnectButton(page);
  console.log('Connect button found via getConnectButton');
  
  // Now open modal
  await openConnectModal(page);
  console.log('Modal opened successfully');
});