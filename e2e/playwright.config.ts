import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for Cinacoin.
 *
 * Usage:
 *   npx playwright test              — run all tests
 *   npx playwright test --ui         — UI mode
 *   npx playwright test --headed     — headed browser
 *   npx playwright test --project=chromium  — chromium only
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  timeout: 60000,

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3002/demo',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30000,
    actionTimeout: 15000,
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: true },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], headless: true },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], headless: true },
    },
    // Mobile
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'], headless: true },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'], headless: true },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: 'cd apps/demo && npx next dev --port 3002',
        url: 'http://localhost:3002/demo',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
});