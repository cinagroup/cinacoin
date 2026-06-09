const { chromium } = require('/home/cina/.openclaw/workspace/onux/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/home/cina/.openclaw/workspace/screenshots/brand-audit-v2';
const RESULTS_FILE = path.join(OUTPUT_DIR, 'audit-v2.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const PAGES = [
  { site: 'Main Website', url: 'https://cinacoin.com/', pagePath: '/' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/', pagePath: '/' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/swap', pagePath: '/swap' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/tokens', pagePath: '/tokens' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/multi-chain', pagePath: '/multi-chain' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/batch', pagePath: '/batch' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/auth', pagePath: '/auth' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/profile', pagePath: '/profile' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/settings', pagePath: '/settings' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/activity', pagePath: '/activity' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/aa-demo', pagePath: '/aa-demo' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/onramp', pagePath: '/onramp' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/components', pagePath: '/components' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/', pagePath: '/' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/analytics', pagePath: '/analytics' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/chains', pagePath: '/chains' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/keys-server', pagePath: '/keys-server' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/notify-server', pagePath: '/notify-server' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/project', pagePath: '/project' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/push-server', pagePath: '/push-server' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/relay-server', pagePath: '/relay-server' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/rpc-proxy', pagePath: '/rpc-proxy' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/settings', pagePath: '/settings' },
  { site: 'Documentation', url: 'https://docs.cinacoin.com/', pagePath: '/' },
  { site: 'Documentation', url: 'https://docs.cinacoin.com/guide/quick-start', pagePath: '/guide/quick-start' },
  { site: 'Documentation', url: 'https://docs.cinacoin.com/guide/installation', pagePath: '/guide/installation' },
  { site: 'Documentation', url: 'https://docs.cinacoin.com/api/core-sdk', pagePath: '/api/core-sdk' },
  { site: 'Documentation', url: 'https://docs.cinacoin.com/zh/', pagePath: '/zh/' },
  { site: 'Health Status', url: 'https://status.cinacoin.com/', pagePath: '/' },
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function auditPage(browser, entry) {
  const { site, url, pagePath } = entry;
  const pageLabel = pagePath === '/' ? 'home' : pagePath.replace(/^\//, '').replace(/\//g, '_');
  const siteLabel = site.toLowerCase().replace(/\s+/g, '_');

  const page = await browser.newPage();
  const result = { site, url, path: pagePath, checks: {} };

  try {
    // Desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_desktop.png`), fullPage: false });

    // Extract computed styles for key elements
    const desktopStyles = await page.evaluate(() => {
      const getStyle = (sel, prop) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).getPropertyValue(prop).trim() : 'not-found';
      };
      const getAll = (sel, prop) => {
        const els = document.querySelectorAll(sel);
        return Array.from(els).map(el => getComputedStyle(el).getPropertyValue(prop).trim());
      };
      return {
        bodyBg: getStyle('body', 'background-color'),
        bodyColor: getStyle('body', 'color'),
        bodyFontFamily: getStyle('body', 'font-family'),
        headerBg: getStyle('header', 'background-color'),
        headerHeight: getStyle('header', 'height'),
        // Buttons
        buttonBg: getAll('button', 'background-color'),
        buttonRadius: getAll('button', 'border-radius'),
        buttonFontWeight: getAll('button', 'font-weight'),
        // Headings
        h1Weight: getStyle('h1', 'font-weight'),
        h1LetterSpacing: getStyle('h1', 'letter-spacing'),
        h1TextTransform: getStyle('h1', 'text-transform'),
        // Cards
        cardRadius: getAll('[class*="card"], [class*="Card"]', 'border-radius'),
        // Links
        linkColor: getStyle('a', 'color'),
      };
    });
    result.desktopStyles = desktopStyles;

    // Checks
    const btnRadii = desktopStyles.buttonRadius.filter(r => r !== '0px' && r !== 'not-found');
    const hasPill = btnRadii.some(r => parseFloat(r) >= 50);
    const hasHeavyWeight = desktopStyles.h1Weight && parseInt(desktopStyles.h1Weight) > 600;
    const hasAllCaps = desktopStyles.h1TextTransform === 'uppercase';
    const hasGradientBtn = desktopStyles.buttonBg.some(bg => bg.includes('gradient') || bg.includes('linear'));

    result.checks = {
      hasPillButtons: hasPill,
      headingWeightOK: !hasHeavyWeight,
      headingNotAllCaps: !hasAllCaps,
      noGradientButtons: !hasGradientBtn,
      buttonRadii: btnRadii.slice(0, 5),
      h1Weight: desktopStyles.h1Weight,
      h1LetterSpacing: desktopStyles.h1LetterSpacing,
    };

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_mobile.png`), fullPage: false });

    // Dark mode check
    const hasDarkMode = await page.evaluate(() => {
      return !!document.querySelector('[data-theme]') || 
             !!document.querySelector('.theme-toggle') ||
             !!document.querySelector('[aria-label*="theme"]') ||
             getComputedStyle(document.documentElement).getPropertyValue('--cc-canvas-soft') !== '';
    });
    result.hasDarkMode = hasDarkMode;

  } catch (err) {
    result.error = err.message;
  } finally {
    await page.close();
  }

  return result;
}

(async () => {
  console.log('🔍 Cinacoin Brand Audit v2 — Verifying Vercel DESIGN.md compliance');
  console.log(`📸 Output: ${OUTPUT_DIR}`);
  console.log(`📄 Pages: ${PAGES.length}`);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (let i = 0; i < PAGES.length; i++) {
    const entry = PAGES[i];
    console.log(`\n[${i + 1}/${PAGES.length}] ${entry.site} — ${entry.pagePath}`);
    const result = await auditPage(browser, entry);
    results.push(result);
    if (result.error) {
      console.log(`  ❌ Error: ${result.error}`);
    } else {
      const c = result.checks;
      const pills = c.hasPillButtons ? '✅' : '❌';
      const weight = c.headingWeightOK ? '✅' : '❌';
      const caps = c.headingNotAllCaps ? '✅' : '❌';
      const gradient = c.noGradientButtons ? '✅' : '❌';
      console.log(`  ${pills} Pill buttons | ${weight} Heading weight | ${caps} Not ALL-CAPS | ${gradient} No gradient buttons`);
    }
  }

  await browser.close();

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`\n✅ Audit complete. Results: ${RESULTS_FILE}`);

  // Summary
  const totalChecks = results.filter(r => !r.error);
  const passRate = totalChecks.filter(r => 
    r.checks.hasPillButtons && r.checks.headingWeightOK && r.checks.headingNotAllCaps && r.checks.noGradientButtons
  ).length;
  console.log(`\n📊 Summary: ${passRate}/${totalChecks.length} pages fully compliant`);
})();
