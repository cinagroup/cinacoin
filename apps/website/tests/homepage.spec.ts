import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check title
  await expect(page).toHaveTitle("CINAcoin - The Future of Decentralized Finance");
  
  // Check main navigation
  const nav = page.locator('nav[aria-label="Main navigation"]');
  await expect(nav).toBeVisible();
  
  // Check hero section (h1 with CinaCoin text)
  const heroHeading = page.locator('h1:has-text("CinaCoin")');
  await expect(heroHeading).toBeVisible();
  
  // Check CTA buttons
  const getStartedButton = page.getByRole('link', { name: /Get Started/i });
  await expect(getStartedButton).toBeVisible();
  
  // Check footer
  const footer = page.locator('footer');
  await expect(footer).toBeVisible();
});

test('main navigation links exist', async ({ page }) => {
  await page.goto('/');
  
  // Check that navigation links exist (use first() to avoid strict mode)
  await expect(page.locator('a[href="/"]').first()).toBeVisible(); // Home
  await expect(page.locator('a[href="/pricing"]').first()).toBeVisible(); // Pricing
  await expect(page.locator('a[href="/about"]').first()).toBeVisible(); // About
  await expect(page.locator('a[href="https://docs.cinacoin.com"]').first()).toBeVisible(); // Docs
});

test('newsletter form exists', async ({ page }) => {
  await page.goto('/');
  
  // Find the newsletter form in the main content
  const newsletterForm = page.locator('form:has(input[name="email"])').first();
  await expect(newsletterForm).toBeVisible();
  
  // Check email input exists (use first())
  await expect(page.locator('input[name="email"]').first()).toBeVisible();
  
  // Check subscribe button exists
  await expect(page.getByRole('button', { name: /Subscribe/i }).first()).toBeVisible();
});