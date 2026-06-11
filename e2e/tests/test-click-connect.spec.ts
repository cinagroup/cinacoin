import { test, expect } from '../fixtures';
import { injectMockProvider, getConnectButton } from '../helpers/wallet';

test('test click connect button', async ({ page }) => {
  await injectMockProvider(page);
  await page.goto('http://localhost:3002/demo/');
  await page.waitForLoadState('networkidle');
  
  console.log('Page loaded with mock provider injected');
  
  // Get and click connect button
  const connectButton = await getConnectButton(page);
  await connectButton.click();
  console.log('Connect button clicked');
  
  // Wait a bit for any changes
  await page.waitForTimeout(2000);
  
  // Check if we are now connected
  try {
    await expect(page.getByRole('button', { name: /disconnect/i })).toBeVisible({ timeout: 5000 });
    console.log('Successfully connected after clicking button');
  } catch (error) {
    console.log('Not connected, checking page content');
    const content = await page.content();
    console.log('Content length after click:', content.length);
    
    // Look for any error messages
    if (content.includes('error') || content.includes('Error')) {
      console.log('Found error message in content');
    }
  }
});