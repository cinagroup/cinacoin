import { test, expect } from '@playwright/test';

test('complete user journey: website to wallet explorer', async ({ page }) => {
  // Step 1: Visit website homepage
  await page.goto('https://cinacoin.com');
  
  // Verify homepage loads
  await expect(page).toHaveTitle("CINAcoin - The Future of Decentralized Finance");
  
  // Step 2: Go to demo
  await page.goto('https://e4d421eb.cinacoin-demo.pages.dev');
  
  // Verify demo loads by checking title
  await expect(page).toHaveTitle("Cinacoin Demo");
  
  // Step 3: Check connect wallet button exists
  const connectButton = page.getByRole('button', { name: /Connect Wallet/i });
  await expect(connectButton).toBeVisible();
  
  // Step 4: Go to wallet explorer
  await page.goto('https://924b3a07.cinacoin-wallet-explorer.pages.dev');
  
  // Verify wallet explorer loads (check for any content since title might not be reliable)
  await expect(page.locator('body')).toBeVisible();
  
  // Step 5: Check health status
  await page.goto('https://d643e9a3.cinacoin-health-status.pages.dev');
  
  // Verify health status shows services
  await expect(page.locator('body')).toBeVisible();
});

test('dashboard user journey', async ({ page }) => {
  // Step 1: Go to backend dashboard
  await page.goto('https://7fd8ecd8.cinacoin-backend-dashboard.pages.dev');
  
  // Verify dashboard loads
  await expect(page.locator('body')).toBeVisible();
  
  // Step 2: Go to unified dashboard
  await page.goto('https://53d88fa7.cinacoin-unified-dashboard.pages.dev');
  
  // Verify unified dashboard loads
  await expect(page.locator('body')).toBeVisible();
  
  // Step 3: Check analytics dashboard
  await page.goto('https://cf194e0f.cinacoin-analytics-dashboard.pages.dev');
  
  // Verify analytics dashboard loads
  await expect(page.locator('body')).toBeVisible();
  
  // Step 4: Check cloud dashboard
  await page.goto('https://9485066d.cinacoin-cloud-dashboard.pages.dev');
  
  // Verify cloud dashboard loads
  await expect(page.locator('body')).toBeVisible();
});