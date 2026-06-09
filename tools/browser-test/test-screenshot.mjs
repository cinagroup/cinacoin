import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('https://cinacoin.com', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/home/cina/.openclaw/workspace/tools/browser-test/cinacoin-home.png', fullPage: true });
console.log('Screenshot saved: cinacoin-home.png');
await browser.close();
