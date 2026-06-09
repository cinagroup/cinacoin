import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const ScreenshotDir = '/home/cina/.openclaw/workspace/screenshots';
mkdirSync(ScreenshotDir, { recursive: true });

const sites = [
  {
    name: 'demo',
    baseUrl: 'https://cinacoin-demo.pages.dev',
    pages: ['/', '/swap', '/tokens', '/multi-chain', '/batch', '/auth', '/profile', '/settings', '/activity', '/aa-demo', '/onramp', '/components'],
  },
  {
    name: 'backend-dashboard',
    baseUrl: 'https://backend-dashboard.pages.dev',
    pages: ['/', '/login', '/analytics', '/chains', '/keys-server', '/notify-server', '/project', '/push-server', '/relay-server', '/rpc-proxy', '/settings'],
  },
  {
    name: 'health-status',
    baseUrl: 'https://cinacoin-health-status.pages.dev',
    pages: ['/'],
  },
  {
    name: 'docs',
    baseUrl: 'https://cinacoin-docs.pages.dev',
    pages: ['/', '/guide/quick-start', '/guide/installation', '/guide/configuration', '/api/core-sdk', '/api/react', '/zh/'],
  },
];

const browser = await chromium.launch({ headless: true });
const results = [];
let totalIssues = 0;

for (const site of sites) {
  console.log(`\n🌐 Testing: ${site.name} (${site.baseUrl})`);
  
  for (const pagePath of site.pages) {
    const url = site.baseUrl + pagePath;
    const page = await browser.newPage();
    
    const errors = [];
    page.on('pageerror', (err) => errors.push({ type: 'js-error', message: err.message.slice(0, 200) }));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push({ type: 'console-error', message: msg.text().slice(0, 200) });
    });
    page.on('requestfailed', (req) => {
      if (!req.url().includes('walletconnect') && !req.url().includes('relay.walletconnect')) {
        errors.push({ type: 'request-failed', url: req.url().slice(0, 100), error: req.failure().errorText });
      }
    });
    
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const status = response?.status() || 0;
      
      // Wait for hydration
      await page.waitForTimeout(2000);
      
      // Check for visible text errors on page
      const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) || '');
      const hasErrorText = bodyText.includes('Application Error') || bodyText.includes('Failed to render') || bodyText.includes('MODULE_NOT_FOUND');
      
      // Check title
      const title = await page.title();
      
      // Check responsive (mobile)
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      const mobileOk = await page.evaluate(() => {
        const body = document.body;
        const w = body.scrollWidth;
        return w <= 500; // No horizontal overflow on mobile
      });
      
      // Reset to desktop
      await page.setViewportSize({ width: 1280, height: 800 });
      
      // Screenshot desktop
      await page.screenshot({ path: `${ScreenshotDir}/${site.name}${pagePath.replace(/\//g, '-') || '-home'}.png`, fullPage: false });
      
      // Check dark mode
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${ScreenshotDir}/${site.name}${pagePath.replace(/\//g, '-') || '-home'}-dark.png`, fullPage: false });
      await page.emulateMedia({ colorScheme: 'light' });
      
      const pageResult = {
        url,
        status,
        title,
        errors: errors.length,
        hasErrorText,
        mobileOk,
      };
      
      if (errors.length > 0 || hasErrorText || !mobileOk) {
        totalIssues += (errors.length + (hasErrorText ? 1 : 0) + (!mobileOk ? 1 : 0));
      }
      
      results.push(pageResult);
      console.log(`  ${status} ${pagePath || '/'} → ${title.slice(0, 40)} | errors: ${errors.length} | mobile: ${mobileOk ? '✅' : '❌'}`);
      
    } catch (e) {
      const pageResult = { url, status: 0, error: e.message.slice(0, 200) };
      results.push(pageResult);
      console.log(`  ❌ ${pagePath} → ${e.message.slice(0, 80)}`);
    }
    
    await page.close();
  }
}

await browser.close();

// Summary
console.log(`\n📊 Summary: ${results.length} pages tested, ${totalIssues} issues found`);
const failures = results.filter(r => r.status !== 200 || r.error);
if (failures.length) {
  console.log('\n❌ Failed pages:');
  failures.forEach(r => console.log(`  ${r.url} → ${r.status || 'error'} ${r.error || ''}`));
}

const errorPages = results.filter(r => r.errors > 0);
if (errorPages.length) {
  console.log('\n⚠️ Pages with JS errors:');
  errorPages.forEach(r => console.log(`  ${r.url} → ${r.errors} errors`));
}

writeFileSync(`${ScreenshotDir}/test-report.json`, JSON.stringify(results, null, 2));
console.log(`\n📸 Screenshots saved to ${ScreenshotDir}/`);
console.log(`📋 Full report: ${ScreenshotDir}/test-report.json`);
