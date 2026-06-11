import { test, expect } from '../fixtures';
import { getConnectButton } from '../helpers/wallet';

test('test getConnectButton function', async ({ page }) => {
  await page.goto('http://localhost:3002/demo/');
  await page.waitForLoadState('networkidle');
  
  console.log('About to call getConnectButton');
  const button = await getConnectButton(page);
  console.log('getConnectButton returned successfully');
  
  await expect(button).toBeVisible();
});