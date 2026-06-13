# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: deployed-visual-regression.spec.ts >> Deployed Applications Visual Regression >> learn platform loads correctly
- Location: tests/deployed-visual-regression.spec.ts:61:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_CLOSED at https://learn.cinacoin.com/
Call log:
  - navigating to "https://learn.cinacoin.com/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Visual regression tests for deployed CINAcoin applications
  5   |  * Tests the live Cloudflare Pages deployments
  6   |  */
  7   | 
  8   | const deployedApps = {
  9   |   website: 'https://cinacoin.com',
  10  |   wallet: 'https://wallet.cinacoin.com',
  11  |   learn: 'https://learn.cinacoin.com',
  12  |   docs: 'https://docs.cinacoin.com',
  13  |   cloudDashboard: 'https://cloud.cinacoin.com',
  14  |   backendDashboard: 'https://backend.cinacoin.com',
  15  |   developerDashboard: 'https://developer.cinacoin.com',
  16  |   analyticsDashboard: 'https://analytics.cinacoin.com',
  17  |   unifiedDashboard: 'https://unified.cinacoin.com',
  18  |   healthStatus: 'https://health.cinacoin.com',
  19  |   demo: 'https://demo.cinacoin.com',
  20  |   demoDappReact: 'https://demo-dapp-react.cinacoin.com',
  21  |   demoReact: 'https://demo-react.cinacoin.com',
  22  |   farcasterApp: 'https://farcaster.cinacoin.com',
  23  |   telegramApp: 'https://telegram.cinacoin.com',
  24  | };
  25  | 
  26  | test.describe('Deployed Applications Visual Regression', () => {
  27  |   test('website homepage loads correctly', async ({ page }) => {
  28  |     await page.goto(deployedApps.website);
  29  |     await expect(page).toHaveTitle(/CINAcoin/i);
  30  |     
  31  |     // Check for key design elements
  32  |     const body = page.locator('body');
  33  |     await expect(body).toBeVisible();
  34  |     
  35  |     // Verify design system CSS variables are present
  36  |     const hasDesignTokens = await page.evaluate(() => {
  37  |       const styles = getComputedStyle(document.body);
  38  |       return styles.getPropertyValue('--cc-primary') !== '';
  39  |     });
  40  |     expect(hasDesignTokens).toBeTruthy();
  41  |     
  42  |     await expect(page).toHaveScreenshot('website-homepage.png', {
  43  |       fullPage: true,
  44  |       maxDiffPixelRatio: 0.05,
  45  |     });
  46  |   });
  47  | 
  48  |   test('wallet application loads correctly', async ({ page }) => {
  49  |     await page.goto(deployedApps.wallet);
  50  |     await expect(page).toHaveTitle(/Wallet|CINAcoin/i);
  51  |     
  52  |     const body = page.locator('body');
  53  |     await expect(body).toBeVisible();
  54  |     
  55  |     await expect(page).toHaveScreenshot('wallet-homepage.png', {
  56  |       fullPage: true,
  57  |       maxDiffPixelRatio: 0.05,
  58  |     });
  59  |   });
  60  | 
  61  |   test('learn platform loads correctly', async ({ page }) => {
> 62  |     await page.goto(deployedApps.learn);
      |                ^ Error: page.goto: net::ERR_CONNECTION_CLOSED at https://learn.cinacoin.com/
  63  |     await expect(page).toHaveTitle(/Learn|CINAcoin/i);
  64  |     
  65  |     const body = page.locator('body');
  66  |     await expect(body).toBeVisible();
  67  |     
  68  |     await expect(page).toHaveScreenshot('learn-homepage.png', {
  69  |       fullPage: true,
  70  |       maxDiffPixelRatio: 0.05,
  71  |     });
  72  |   });
  73  | 
  74  |   test('docs site loads correctly', async ({ page }) => {
  75  |     await page.goto(deployedApps.docs);
  76  |     await expect(page).toHaveTitle(/Docs|Documentation|CINAcoin/i);
  77  |     
  78  |     const body = page.locator('body');
  79  |     await expect(body).toBeVisible();
  80  |     
  81  |     await expect(page).toHaveScreenshot('docs-homepage.png', {
  82  |       fullPage: true,
  83  |       maxDiffPixelRatio: 0.05,
  84  |     });
  85  |   });
  86  | 
  87  |   test('cloud dashboard loads correctly', async ({ page }) => {
  88  |     await page.goto(deployedApps.cloudDashboard);
  89  |     await expect(page).toHaveTitle(/Cloud|Dashboard|CINAcoin/i);
  90  |     
  91  |     const body = page.locator('body');
  92  |     await expect(body).toBeVisible();
  93  |     
  94  |     await expect(page).toHaveScreenshot('cloud-dashboard.png', {
  95  |       fullPage: true,
  96  |       maxDiffPixelRatio: 0.05,
  97  |     });
  98  |   });
  99  | 
  100 |   test('health status page loads correctly', async ({ page }) => {
  101 |     await page.goto(deployedApps.healthStatus);
  102 |     await expect(page).toHaveTitle(/Health|Status|CINAcoin/i);
  103 |     
  104 |     const body = page.locator('body');
  105 |     await expect(body).toBeVisible();
  106 |     
  107 |     await expect(page).toHaveScreenshot('health-status.png', {
  108 |       fullPage: true,
  109 |       maxDiffPixelRatio: 0.05,
  110 |     });
  111 |   });
  112 | 
  113 |   test('demo application loads correctly', async ({ page }) => {
  114 |     await page.goto(deployedApps.demo);
  115 |     await expect(page).toHaveTitle(/Demo|CINAcoin/i);
  116 |     
  117 |     const body = page.locator('body');
  118 |     await expect(body).toBeVisible();
  119 |     
  120 |     await expect(page).toHaveScreenshot('demo-homepage.png', {
  121 |       fullPage: true,
  122 |       maxDiffPixelRatio: 0.05,
  123 |     });
  124 |   });
  125 | });
  126 | 
  127 | test.describe('Design System Compliance Check', () => {
  128 |   test('website uses correct design tokens', async ({ page }) => {
  129 |     await page.goto(deployedApps.website);
  130 |     
  131 |     const designTokens = await page.evaluate(() => {
  132 |       const styles = getComputedStyle(document.body);
  133 |       return {
  134 |         primary: styles.getPropertyValue('--cc-primary').trim(),
  135 |         canvas: styles.getPropertyValue('--cc-canvas').trim(),
  136 |         ink: styles.getPropertyValue('--cc-ink').trim(),
  137 |         error: styles.getPropertyValue('--cc-error').trim(),
  138 |         link: styles.getPropertyValue('--cc-link').trim(),
  139 |         // website uses --cc-radius-pill, design-tokens uses --cc-rounded-pill
  140 |         roundedPill: (styles.getPropertyValue('--cc-radius-pill') || styles.getPropertyValue('--cc-rounded-pill')).trim(),
  141 |       };
  142 |     });
  143 | 
  144 |     // Verify design tokens match specification
  145 |     // Note: CSS shorthand normalizes colors (e.g., #ee0000 -> #e00, #ffffff -> #fff)
  146 |     expect(designTokens.primary).toBe('#171717');
  147 |     expect(designTokens.canvas.toLowerCase()).toMatch(/^#fff(ffff)?$/);
  148 |     expect(designTokens.ink).toBe('#171717');
  149 |     expect(designTokens.error.toLowerCase()).toMatch(/^#(e00|ee0000)$/);
  150 |     expect(designTokens.link.toLowerCase()).toMatch(/^#0070f3$/);
  151 |     expect(designTokens.roundedPill).toBe('100px');
  152 |   });
  153 | 
  154 |   test('buttons use pill shape (100px border-radius)', async ({ page }) => {
  155 |     await page.goto(deployedApps.website);
  156 |     
  157 |     const buttonRadius = await page.evaluate(() => {
  158 |       // Select CTA buttons with cc-btn-primary or cc-btn-secondary classes
  159 |       const buttons = Array.from(document.querySelectorAll('.cc-btn-primary, .cc-btn-secondary'));
  160 |       if (buttons.length === 0) return null;
  161 |       
  162 |       const firstButton = buttons[0];
```