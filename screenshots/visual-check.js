import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';

const PAGES = [
  'https://cinacoin-demo.pages.dev/',
  'https://cinacoin-demo.pages.dev/swap',
  'https://cinacoin-demo.pages.dev/tokens',
  'https://cinacoin-demo.pages.dev/multi-chain',
  'https://cinacoin-demo.pages.dev/batch',
  'https://cinacoin-demo.pages.dev/auth',
  'https://cinacoin-demo.pages.dev/profile',
  'https://cinacoin-demo.pages.dev/settings',
  'https://cinacoin-demo.pages.dev/activity',
  'https://cinacoin-demo.pages.dev/aa-demo',
  'https://cinacoin-demo.pages.dev/onramp',
  'https://cinacoin-demo.pages.dev/components',
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const url of PAGES) {
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Light mode
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const lightTitle = await page.title();
    const lightErrors = await page.evaluate(() => {
      const errors = [];
      window.addEventListener('error', e => errors.push(e.message));
      return errors;
    });
    const lightBody = await page.evaluate(() => document.body.innerText.slice(0, 200));
    
    // Check for visible errors
    const consoleErrors = [];
    page.on('pageerror', err => consoleErrors.push(err.message));
    
    await page.close();
    
    // Dark mode
    const page2 = await browser.newPage();
    await page2.setViewportSize({ width: 1280, height: 800 });
    await page2.emulateMedia({ colorScheme: 'dark' });
    await page2.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const darkTitle = await page2.title();
    
    await page2.close();
    
    results.push({
      url,
      title: lightTitle,
      status: 'OK',
      lightBodyPreview: lightBody.slice(0, 100),
      consoleErrors: consoleErrors.length,
    });
  } catch (e) {
    results.push({ url, status: 'ERROR', error: e.message.slice(0, 200) });
  }
}

await browser.close();

writeFileSync('/home/cina/.openclaw/workspace/screenshots/test-results.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
