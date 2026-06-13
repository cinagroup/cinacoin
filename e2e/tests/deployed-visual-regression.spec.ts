import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for deployed CINAcoin applications
 * Tests the live Cloudflare Pages deployments
 */

const deployedApps = {
  website: 'https://cinacoin.com',
  wallet: 'https://wallet.cinacoin.com',
  learn: 'https://learn.cinacoin.com',
  docs: 'https://docs.cinacoin.com',
  cloudDashboard: 'https://cloud.cinacoin.com',
  backendDashboard: 'https://backend.cinacoin.com',
  developerDashboard: 'https://developer.cinacoin.com',
  analyticsDashboard: 'https://analytics.cinacoin.com',
  unifiedDashboard: 'https://unified.cinacoin.com',
  healthStatus: 'https://health.cinacoin.com',
  demo: 'https://demo.cinacoin.com',
  demoDappReact: 'https://demo-dapp-react.cinacoin.com',
  demoReact: 'https://demo-react.cinacoin.com',
  farcasterApp: 'https://farcaster.cinacoin.com',
  telegramApp: 'https://telegram.cinacoin.com',
};

test.describe('Deployed Applications Visual Regression', () => {
  test('website homepage loads correctly', async ({ page }) => {
    await page.goto(deployedApps.website);
    await expect(page).toHaveTitle(/CINAcoin/i);
    
    // Check for key design elements
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Verify design system CSS variables are present
    const hasDesignTokens = await page.evaluate(() => {
      const styles = getComputedStyle(document.body);
      return styles.getPropertyValue('--cc-primary') !== '';
    });
    expect(hasDesignTokens).toBeTruthy();
    
    await expect(page).toHaveScreenshot('website-homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('wallet application loads correctly', async ({ page }) => {
    await page.goto(deployedApps.wallet);
    await expect(page).toHaveTitle(/Wallet|CINAcoin/i);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    await expect(page).toHaveScreenshot('wallet-homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('learn platform loads correctly', async ({ page }) => {
    await page.goto(deployedApps.learn);
    await expect(page).toHaveTitle(/Learn|CINAcoin/i);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    await expect(page).toHaveScreenshot('learn-homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('docs site loads correctly', async ({ page }) => {
    await page.goto(deployedApps.docs);
    await expect(page).toHaveTitle(/Docs|Documentation|CINAcoin/i);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    await expect(page).toHaveScreenshot('docs-homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('cloud dashboard loads correctly', async ({ page }) => {
    await page.goto(deployedApps.cloudDashboard);
    await expect(page).toHaveTitle(/Cloud|Dashboard|CINAcoin/i);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    await expect(page).toHaveScreenshot('cloud-dashboard.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('health status page loads correctly', async ({ page }) => {
    await page.goto(deployedApps.healthStatus);
    await expect(page).toHaveTitle(/Health|Status|CINAcoin/i);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    await expect(page).toHaveScreenshot('health-status.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('demo application loads correctly', async ({ page }) => {
    await page.goto(deployedApps.demo);
    await expect(page).toHaveTitle(/Demo|CINAcoin/i);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    await expect(page).toHaveScreenshot('demo-homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});

test.describe('Design System Compliance Check', () => {
  test('website uses correct design tokens', async ({ page }) => {
    await page.goto(deployedApps.website);
    
    const designTokens = await page.evaluate(() => {
      const styles = getComputedStyle(document.body);
      return {
        primary: styles.getPropertyValue('--cc-primary').trim(),
        canvas: styles.getPropertyValue('--cc-canvas').trim(),
        ink: styles.getPropertyValue('--cc-ink').trim(),
        error: styles.getPropertyValue('--cc-error').trim(),
        link: styles.getPropertyValue('--cc-link').trim(),
        roundedPill: styles.getPropertyValue('--cc-rounded-pill').trim(),
      };
    });

    // Verify design tokens match specification
    expect(designTokens.primary).toBe('#171717');
    expect(designTokens.canvas).toBe('#ffffff');
    expect(designTokens.ink).toBe('#171717');
    expect(designTokens.error).toBe('#ee0000');
    expect(designTokens.link).toBe('#0070f3');
    expect(designTokens.roundedPill).toBe('100px');
  });

  test('buttons use pill shape (100px border-radius)', async ({ page }) => {
    await page.goto(deployedApps.website);
    
    const buttonRadius = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a.cc-btn'));
      if (buttons.length === 0) return null;
      
      const firstButton = buttons[0];
      return getComputedStyle(firstButton).borderRadius;
    });

    if (buttonRadius) {
      expect(buttonRadius).toBe('100px');
    }
  });

  test('font weight does not exceed 600', async ({ page }) => {
    await page.goto(deployedApps.website);
    
    const fontWeights = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b'));
      return elements.map(el => {
        const weight = getComputedStyle(el).fontWeight;
        return parseInt(weight);
      });
    });

    const invalidWeights = fontWeights.filter(w => w > 600);
    expect(invalidWeights.length).toBe(0);
  });
});
