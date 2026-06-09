// Comprehensive browser test for all Cinacoin sites
const { chromium } = require('/home/cina/.openclaw/workspace/onux/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');

const SITES = {
  'Demo App': {
    base: 'https://cinacoin-demo.pages.dev',
    pages: ['/', '/swap', '/tokens', '/multi-chain', '/batch', '/auth', '/profile', '/settings', '/activity', '/aa-demo', '/onramp', '/components'],
  },
  'Backend Dashboard': {
    base: 'https://backend-dashboard.pages.dev',
    pages: ['/', '/login', '/analytics', '/chains', '/keys-server', '/notify-server', '/project', '/push-server', '/relay-server', '/rpc-proxy', '/settings'],
  },
  'Health Status': {
    base: 'https://cinacoin-health-status.pages.dev',
    pages: ['/'],
  },
  'Docs': {
    base: 'https://cinacoin-docs.pages.dev',
    pages: ['/', '/guide/quick-start', '/guide/installation', '/guide/configuration', '/api/core-sdk', '/api/react', '/zh/', '/zh/guide/quick-start'],
  },
};

(async () => {
  console.log('🚀 Starting comprehensive Cinacoin browser tests...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const allResults = [];
  const allIssues = [];

  for (const [siteName, site] of Object.entries(SITES)) {
    console.log(`\n🌐 Testing: ${siteName} (${site.base})`);

    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });

    for (const pagePath of site.pages) {
      const url = site.base + pagePath;
      const page = await context.newPage();
      const issues = [];
      const result = { site: siteName, path: pagePath, url, status: 'pass' };

      try {
        // Listen for JS errors
        const jsErrors = [];
        page.on('pageerror', (err) => jsErrors.push(err.message.slice(0, 150)));

        // Listen for failed requests (exclude external tracking)
        const failedRequests = [];
        page.on('requestfailed', (req) => {
          const u = req.url();
          if (!u.includes('walletconnect') && !u.includes('analytics') && !u.includes('intercom') && !u.includes('vercel-insights')) {
            failedRequests.push(u.slice(0, 120));
          }
        });

        // Navigate
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);

        result.httpStatus = response?.status() || 0;
        result.title = await page.title();
        result.jsErrors = jsErrors;
        result.failedRequests = failedRequests;

        // Check for visible error text
        const bodyText = await page.evaluate(() => document.body?.innerText || '');
        result.hasErrorText = /application error|failed to render|cannot find module|500 Internal Server Error/i.test(bodyText);
        if (result.hasErrorText) {
          issues.push('Visible error text on page');
        }

        // Check HTTP status
        if (result.httpStatus !== 200) {
          issues.push(`HTTP ${result.httpStatus}`);
        }

        // Check for JS runtime errors
        if (jsErrors.length > 0) {
          issues.push(`${jsErrors.length} JS runtime error(s)`);
        }

        // Check for failed resource requests
        if (failedRequests.length > 3) {
          issues.push(`${failedRequests.length} failed resource requests`);
        }

        // Desktop screenshot
        const safeName = `${siteName.toLowerCase().replace(/\s+/g, '-')}${pagePath.replace(/\//g, '-') || '-home'}`;
        await page.screenshot({
          path: `/home/cina/.openclaw/workspace/screenshots/${safeName}-desktop.png`,
          fullPage: false,
        });

        // Test dark mode
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.waitForTimeout(1000);
        const darkScreenshot = await page.screenshot({
          path: `/home/cina/.openclaw/workspace/screenshots/${safeName}-dark.png`,
          fullPage: false,
        });
        result.hasDarkMode = true;

        // Reset to light
        await page.emulateMedia({ colorScheme: 'light' });

        // Test mobile responsiveness
        await page.setViewportSize({ width: 375, height: 812 });
        await page.waitForTimeout(1000);
        const mobileScreenshot = await page.screenshot({
          path: `/home/cina/.openclaw/workspace/screenshots/${safeName}-mobile.png`,
          fullPage: false,
        });

        // Check for horizontal overflow on mobile
        const mobileOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > 400;
        });
        result.mobileOverflow = mobileOverflow;
        if (mobileOverflow) {
          issues.push('Mobile horizontal overflow');
        }

        // Check page load performance
        const perfMetrics = await page.evaluate(() => {
          const entries = performance.getEntriesByType('navigation');
          if (entries.length === 0) return null;
          const nav = entries[0];
          return {
            domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
            loadComplete: Math.round(nav.loadEventEnd - nav.startTime),
            domInteractive: Math.round(nav.domInteractive - nav.startTime),
          };
        });
        result.perfMetrics = perfMetrics;

        // Check for missing meta tags
        const metaTags = await page.evaluate(() => {
          const viewport = document.querySelector('meta[name="viewport"]');
          const description = document.querySelector('meta[name="description"]');
          return {
            hasViewport: !!viewport,
            hasDescription: !!description,
          };
        });
        result.metaTags = metaTags;

        // Set result status
        if (issues.length > 0) {
          result.status = 'warning';
          result.issues = issues;
          allIssues.push({ url: `${siteName}${pagePath}`, issues });
        }

        // Log result
        const icon = result.status === 'pass' ? '✅' : '⚠️';
        const issueSummary = issues.length > 0 ? ` (${issues.join(', ')})` : '';
        console.log(`  ${icon} ${pagePath || '/'} → ${result.httpStatus} | ${result.title.slice(0, 50)}${issueSummary}`);

        allResults.push(result);
      } catch (error) {
        result.status = 'error';
        result.error = error.message.slice(0, 200);
        allResults.push(result);
        allIssues.push({ url: `${siteName}${pagePath}`, issues: [error.message.slice(0, 100)] });
        console.log(`  ❌ ${pagePath} → ${error.message.slice(0, 80)}`);
      } finally {
        await page.close();
      }
    }

    await context.close();
  }

  await browser.close();

  // Generate summary report
  const total = allResults.length;
  const passed = allResults.filter((r) => r.status === 'pass').length;
  const warnings = allResults.filter((r) => r.status === 'warning').length;
  const errors = allResults.filter((r) => r.status === 'error').length;

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total pages tested: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️ Warnings: ${warnings}`);
  console.log(`❌ Errors: ${errors}`);

  if (allIssues.length > 0) {
    console.log('\n📋 Issues Detail:');
    for (const issue of allIssues) {
      console.log(`  • ${issue.url}: ${issue.issues.join('; ')}`);
    }
  }

  // Save report
  const fs = require('fs');
  const report = {
    timestamp: new Date().toISOString(),
    summary: { total, passed, warnings, errors },
    results: allResults,
    issues: allIssues,
  };
  fs.writeFileSync(
    '/home/cina/.openclaw/workspace/screenshots/test-report.json',
    JSON.stringify(report, null, 2),
  );
  console.log(`\n📸 Screenshots saved to: /home/cina/.openclaw/workspace/screenshots/`);
  console.log(`📄 Full report: /home/cina/.openclaw/workspace/screenshots/test-report.json`);
})();
