import { test, expect } from '../fixtures';
import { openConnectModal } from '../helpers/wallet';

test('test openConnectModal function', async ({ page }) => {
  await page.goto('http://localhost:3002/demo/');
  await page.waitForLoadState('networkidle');
  
  console.log('About to call openConnectModal');
  await openConnectModal(page);
  console.log('openConnectModal returned successfully');
});