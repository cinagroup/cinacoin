const { chromium } = require('/home/cina/.openclaw/workspace/onux/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');

const SITES = [
  { name: 'demo', base: 'https://demo.cinacoin.com', pages: ['/','/swap','/tokens','/multi-chain','/batch','/auth','/profile','/settings','/activity','/aa-demo','/onramp','/components'] },
  { name: 'dashboard', base: 'https://dash.cinacoin.com', pages: ['/','/login','/analytics','/chains','/keys-server','/notify-server','/project','/push-server','/relay-server','/rpc-proxy','/settings'] },
  { name: 'health', base: 'https://status.cinacoin.com', pages: ['/'] },
  { name: 'docs', base: 'https://docs.cinacoin.com', pages: ['/','/guide/quick-start','/guide/installation','/api/core-sdk','/zh/'] },
  { name: 'website', base: 'https://cinacoin.com', pages: ['/'] },
];

(async () => {
  console.log('🚀 Starting Cinacoin Full Browser Audit...\n');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
  
  const results = [];
  const issues = [];
  let totalScreenshots = 0;
  const fs = require('fs');
  const dir = '/home/cina/.openclaw/workspace/screenshots/audit';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const site of SITES) {
    console.log(`\n🌐 Testing: ${site.name} (${site.base})`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

    for (const pagePath of site.pages) {
      const url = site.base + pagePath;
      const page = await context.newPage();
      const r = { site: site.name, path: pagePath, url, status: 'pass' };
      const pgIssues = [];

      try {
        // Listen for errors
        const jsErrors = [];
        page.on('pageerror', e => jsErrors.push(e.message.slice(0,150)));
        const failedReqs = [];
        page.on('requestfailed', req => {
          const u = req.url();
          if (!u.includes('walletconnect') && !u.includes('analytics') && !u.includes('intercom') && !u.includes('vercel')) {
            failedReqs.push(u.slice(0,120));
          }
        });

        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);

        r.httpStatus = resp?.status() || 0;
        r.title = await page.title();
        r.jsErrors = jsErrors.length;
        r.failedReqs = failedReqs.length;

        // Check for visible error text
        const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0,500) || '');
        r.hasErrorText = /application error|failed to render|cannot find module|500 internal/i.test(bodyText);
        if (r.hasErrorText) pgIssues.push('Visible error text');

        if (r.httpStatus !== 200) pgIssues.push(`HTTP ${r.httpStatus}`);
        if (jsErrors.length > 0) pgIssues.push(`${jsErrors.length} JS runtime error(s)`);
        if (failedReqs.length > 5) pgIssues.push(`${failedReqs.length} failed resource requests`);

        // Desktop screenshot
        const safeName = `${site.name}${pagePath.replace(/\//g,'-') || '-home'}`;
        await page.screenshot({ path: `${dir}/${safeName}-desktop.png`, fullPage: false });
        totalScreenshots++;

        // Dark mode
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${dir}/${safeName}-dark.png`, fullPage: false });
        totalScreenshots++;
        await page.emulateMedia({ colorScheme: 'light' });

        // Mobile
        await page.setViewportSize({ width: 375, height: 812 });
        await page.waitForTimeout(1000);
        const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > 400);
        r.mobileOverflow = mobileOverflow;
        if (mobileOverflow) pgIssues.push('Mobile horizontal overflow');

        await page.screenshot({ path: `${dir}/${safeName}-mobile.png`, fullPage: false });
        totalScreenshots++;

        // Theme toggle check
        const hasThemeToggle = await page.evaluate(() => {
          const btn = document.querySelector('[aria-label*="Switch"], [title*="dark"], [title*="light"], button svg');
          return !!btn;
        });
        r.hasThemeToggle = hasThemeToggle;

        // Language switcher check
        const hasLangSwitcher = await page.evaluate(() => {
          const text = document.body?.innerText || '';
          return /中文|English|EN|ZH/i.test(text) && text.length < 1000;
        });
        r.hasLangSwitcher = hasLangSwitcher;

        if (pgIssues.length > 0) {
          r.status = 'warning';
          r.issues = pgIssues;
          issues.push({ url: `${site.name}${pagePath}`, issues: pgIssues });
        }

        const icon = r.status === 'pass' ? '✅' : '⚠️';
        const issueSummary = pgIssues.length > 0 ? ` (${pgIssues.join(', ')})` : '';
        console.log(`  ${icon} ${pagePath || '/'} → ${r.httpStatus} | ${r.title.slice(0,40)} | theme: ${hasThemeToggle?'✅':'❌'} | lang: ${hasLangSwitcher?'✅':'❌'}${issueSummary}`);

      } catch (e) {
        r.status = 'error';
        r.error = e.message.slice(0,150);
        issues.push({ url: `${site.name}${pagePath}`, issues: [e.message.slice(0,100)] });
        console.log(`  ❌ ${pagePath} → ${e.message.slice(0,80)}`);
      }

      results.push(r);
      await page.close();
    }
    await context.close();
  }

  await browser.close();

  // Summary
  const total = results.length;
  const passed = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const errors = results.filter(r => r.status === 'error').length;

  console.log('\n' + '='.repeat(70));
  console.log('📊 CINACOIN FULL BROWSER AUDIT SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total pages tested: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️ Warnings: ${warnings}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📸 Screenshots: ${totalScreenshots}`);

  if (issues.length > 0) {
    console.log('\n📋 Issues Detail:');
    issues.forEach(i => console.log(`  • ${i.url}: ${i.issues.join('; ')}`));
  }

  // Save report
  fs.writeFileSync(`${dir}/audit-report.json`, JSON.stringify({ results, issues, summary: { total, passed, warnings, errors, totalScreenshots } }, null, 2));
  console.log(`\n📸 Screenshots: ${dir}/`);
  console.log(`📋 Report: ${dir}/audit-report.json`);
})();
