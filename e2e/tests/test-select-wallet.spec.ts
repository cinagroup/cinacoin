import { test, expect } from '../fixtures';
import { openConnectModal, selectWallet } from '../helpers/wallet';

test('test selectWallet function', async ({ page }) => {
  await page.goto('http://localhost:3002/demo/');
  await page.waitForLoadState('networkidle');
  
  console.log('About to call openConnectModal');
  await openConnectModal(page);
  console.log('openConnectModal returned successfully');
  
  console.log('About to call selectWallet');
  await selectWallet(page, 'MetaMask');
  console.log('selectWallet returned successfully');
});