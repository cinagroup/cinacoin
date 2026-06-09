import { chromium } from '/home/cina/.openclaw/workspace/onux/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core/index.mjs';

const BASE = '/home/cina/.openclaw/workspace/screenshots';

const sites = [
  {
    name: 'demo', url: 'https://cinacoin-demo.pages.dev',
    pages: ['/','/swap','/tokens','/multi-chain','/batch','/auth','/profile','/settings','/activity','/aa-demo','/onramp','/components']
  },
  {
    name: 'dash', url: 'https://backend-dashboard.pages.dev',
    pages: ['/','/login','/analytics','/chains','/keys-server','/notify-server','/project','/push-server','/relay-server','/rpc-proxy','/settings']
  },
  {
    name: 'health', url: 'https://cinacoin-health-status.pages.dev',
    pages: ['/']
  },
  {
    name: 'docs', url: 'https://cinacoin-docs.pages.dev',
    pages: ['/','/guide/quick-start','/guide/installation','/api/core-sdk','/api/react','/zh/','/zh/guide/quick-start']
  },
];

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const results = [];
let issues = [];

for (const site of sites) {
  for (const p of site.pages) {
    const entry = { site: site.name, page: p, url: site.url + p, status: 'ok' };
    try {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const pg = await ctx.newPage();
      
      const jsErrors = [];
      const reqFails = [];
      pg.on('pageerror', e => jsErrors.push(e.message.slice(0, 200)));
      pg.on('requestfailed', req => {
        if (!req.url().includes('walletconnect') && !req.url().includes('analytics') && !req.url().includes('intercom'))
          reqFails.push({ url: req.url().slice(0, 120) });
      });

      const resp = await pg.goto(site.url + p, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await pg.waitForTimeout(3000);
      
      entry.httpStatus = resp?.status() || 0;
      entry.title = await pg.title();
      entry.jsErrors = jsErrors.length;
      entry.reqFails = reqFails.length;
      
      // Check for visible error text
      const bodyText = await pg.evaluate(() => document.body?.innerText || '');
      entry.hasErrorText = /application error|failed to render|cannot find module/i.test(bodyText);
      
      // Mobile check
      await pg.setViewportSize({ width: 375, height: 812 });
      await pg.waitForTimeout(1000);
      entry.mobileOverflow = await pg.evaluate(() => document.body.scrollWidth > 400);
      
      // Desktop screenshot
      await pg.setViewportSize({ width: 1280, height: 900 });
      await pg.waitForTimeout(500);
      const safeName = (site.name + p).replace(/\//g, '-').replace(/--+/g, '-') || 'home';
      await pg.screenshot({ path: `${BASE}/${safeName}.png`, fullPage: false });
      
      // Dark mode screenshot
      await pg.emulateMedia({ colorScheme: 'dark' });
      await pg.waitForTimeout(500);
      await pg.screenshot({ path: `${BASE}/${safeName}-dark.png`, fullPage: false });
      await pg.emulateMedia({ colorScheme: 'light' });
      
      if (entry.jsErrors > 0 || entry.hasErrorText || entry.mobileOverflow || entry.httpStatus !== 200) {
        entry.status = 'issue';
        if (entry.jsErrors > 0) issues.push(`${site.name}${p}: ${entry.jsErrors} JS error(s)`);
        if (entry.hasErrorText) issues.push(`${site.name}${p}: visible error text`);
        if (entry.mobileOverflow) issues.push(`${site.name}${p}: mobile overflow`);
        if (entry.httpStatus !== 200) issues.push(`${site.name}${p}: HTTP ${entry.httpStatus}`);
      }
      
      await pg.close();
      await ctx.close();
      console.log(`✅ ${site.name}${p} (${entry.title.slice(0,40)})`);
    } catch (e) {
      entry.status = 'error';
      entry.error = e.message.slice(0, 200);
      issues.push(`${site.name}${p}: ${e.message.slice(0, 100)}`);
      console.log(`❌ ${site.name}${p}: ${e.message.slice(0, 80)}`);
    }
    results.push(entry);
  }
}

await browser.close();

// Summary
const total = results.length;
const ok = results.filter(r => r.status === 'ok').length;
const err = results.filter(r => r.status === 'error').length;
const iss = results.filter(r => r.status === 'issue').length;

console.log(`\n📊 Results: ${total} pages | ✅ ${ok} | ⚠️ ${iss} | ❌ ${err}`);
if (issues.length) {
  console.log('\n⚠️ Issues found:');
  issues.forEach(i => console.log(`  - ${i}`));
}

import { writeFileSync } from 'fs';
writeFileSync(`${BASE}/full-report.json`, JSON.stringify({ results, issues, timestamp: new Date().toISOString() }, null, 2));
console.log(`\n📸 Screenshots: ${BASE}/`);
console.log(`📋 Report: ${BASE}/full-report.json`);
