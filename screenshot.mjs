import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('https://d2b6d27a.cinacoin-website.pages.dev', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/cina/.openclaw/workspace/cinacoin-website-screenshot.png', fullPage: false });
console.log('Screenshot saved!');
await browser.close();
