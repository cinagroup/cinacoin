import { test, expect } from '../fixtures';
import { openConnectModal, injectMockProvider } from '../helpers/wallet';

test('test modal content', async ({ page }) => {
  await injectMockProvider(page);
  await page.goto('http://localhost:3002/demo/');
  await page.waitForLoadState('networkidle');
  
  console.log('About to call openConnectModal');
  await openConnectModal(page);
  console.log('openConnectModal returned successfully');
  
  // Get page content after modal is opened
  const content = await page.content();
  console.log('Modal content length:', content.length);
  
  // Look for wallet-related text in the entire content
  const walletMatches = content.match(/(MetaMask|WalletConnect|Coinbase)/g);
  console.log('Wallet matches found:', walletMatches);
  
  if (walletMatches) {
    console.log('Found wallet options:', walletMatches);
  } else {
    console.log('No wallet options found in content');
    // Log a larger portion of the content around where we expect the modal
    const connectButtonIndex = content.indexOf('Connect Wallet');
    if (connectButtonIndex > -1) {
      const start = Math.max(0, connectButtonIndex - 200);
      const end = Math.min(content.length, connectButtonIndex + 500);
      console.log('Content around Connect Wallet button:', content.substring(start, end));
    }
  }
});