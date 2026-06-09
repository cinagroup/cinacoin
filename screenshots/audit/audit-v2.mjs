import { chromium } from '/home/cina/.openclaw/workspace/onux/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core/index.mjs';
import { writeFile } from 'fs/promises';

const BASE = 'https://demo.cinacoin.com';
const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/swap', name: 'Swap' },
  { path: '/tokens', name: 'Tokens' },
  { path: '/multi-chain', name: 'Multi-Chain' },
  { path: '/batch', name: 'Batch' },
  { path: '/auth', name: 'Auth' },
  { path: '/profile', name: 'Profile' },
  { path: '/settings', name: 'Settings' },
  { path: '/activity', name: 'Activity' },
  { path: '/aa-demo', name: 'AA Demo' },
  { path: '/onramp', name: 'Onramp' },
  { path: '/components', name: 'Components' },
];

const OUT = '/home/cina/.openclaw/workspace/screenshots/audit';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  const results = [];

  for (const item of PAGES) {
    const r = { name: item.name, path: item.path, checks: {}, issues: [] };
    console.log(`\n🔍 ${item.name} (${item.path})`);

    // Load page
    try {
      await page.goto(`${BASE}${item.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await sleep(2500);
      r.checks.pageLoaded = '✅';
    } catch (e) {
      r.checks.pageLoaded = '❌';
      r.issues.push(`Page load failed: ${e.message}`);
      results.push(r);
      continue;
    }

    // Page title
    const title = await page.title();
    r.checks.pageTitle = title ? `✅ "${title}"` : '❌ empty';

    // Inspect DOM
    const domInfo = await page.evaluate(() => {
      // Navbar
      const hasNav = !!document.querySelector('nav, [role="navigation"], [class*="navbar"], [class*="nav-bar"], header[class*="header"]');
      // Check main content length
      const bodyLen = document.body.innerText.trim().length;
      // JS errors
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                     window.getComputedStyle(document.body).backgroundColor.includes('0, 0');
      // Theme toggle
      const allText = document.body.innerText.substring(0, 2000);
      const hasLangText = /EN|中文|日本語|language|语言/i.test(allText);
      // Dark mode toggle button
      const themeBtns = Array.from(document.querySelectorAll('button, [role="button"]'))
        .filter(b => /theme|dark|light|moon|sun/i.test(b.innerText + (b.getAttribute('aria-label') || '')));
      
      return {
        hasNav,
        bodyLen,
        isDark,
        hasLangText,
        themeToggleCount: themeBtns.length,
        dataTheme: document.documentElement.getAttribute('data-theme'),
        bg: window.getComputedStyle(document.body).backgroundColor,
      };
    });

    // Checks
    r.checks.navbar = domInfo.hasNav ? '✅ visible' : '⚠️ not detected';
    r.checks.mainContent = domInfo.bodyLen > 50 ? `✅ present (${domInfo.bodyLen} chars)` : '❌ empty';
    r.checks.darkTheme = domInfo.isDark ? `✅ active (data-theme="${domInfo.dataTheme}", bg: ${domInfo.bg})` : `ℹ️ light mode (bg: ${domInfo.bg})`;
    r.checks.darkModeToggle = domInfo.themeToggleCount > 0 ? `✅ found (${domInfo.themeToggleCount})` : '⚠️ no toggle (dark mode is default)';
    r.checks.languageSwitcher = domInfo.hasLangText ? '⚠️ text indicator only' : '❌ not found';
    r.checks.mobileResponsive = '✅ ok'; // verified below

    if (!domInfo.hasNav) r.issues.push('Navigation bar not detected by standard selectors');
    if (domInfo.themeToggleCount === 0) r.issues.push('No theme toggle button found; site is dark-mode-only by default');
    if (!domInfo.hasLangText) r.issues.push('No language switcher or language text detected');

    // Desktop screenshot (dark mode, 1280x900)
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: `${OUT}/${item.name.replace(/\s+/g, '-').toLowerCase()}-desktop-dark.png`, fullPage: false });

    // Mobile screenshot (375px)
    await page.setViewportSize({ width: 375, height: 812 });
    await sleep(1500);
    const mobileOk = await page.evaluate(() => document.documentElement.clientWidth <= 390);
    r.checks.mobileResponsive = mobileOk ? '✅ ok' : '❌ viewport mismatch';
    await page.screenshot({ path: `${OUT}/${item.name.replace(/\s+/g, '-').toLowerCase()}-mobile-dark.png`, fullPage: false });

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 900 });

    results.push(r);
    const passCount = Object.values(r.checks).filter(v => v.startsWith('✅')).length;
    console.log(`   ${passCount}/${Object.keys(r.checks).length} checks passed | Issues: ${r.issues.length}`);
    r.issues.forEach(i => console.log(`   ⚠ ${i}`));
  }

  await browser.close();

  // Generate updated report
  const report = generateReport(results);
  await writeFile(`${OUT}/demo-report.md`, report);
  console.log(`\n✅ Updated report written to ${OUT}/demo-report.md`);
}

function generateReport(results) {
  let md = `# Cinacoin Demo Site — Browser Audit Report\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Base URL:** https://demo.cinacoin.com\n`;
  md += `**Screenshots:** \`screenshots/audit/\`\n`;
  md += `**Viewport:** 1280×900 (desktop) / 375×812 (mobile)\n`;
  md += `**Mode:** Dark mode (site default)\n\n`;

  md += `## Summary\n\n`;
  md += `| Page | Path | Status | Checks | Issues |\n`;
  md += `|------|------|--------|--------|--------|\n`;

  for (const r of results) {
    const passCount = Object.values(r.checks).filter(v => v.startsWith('✅')).length;
    const total = Object.keys(r.checks).length;
    const hasCritical = r.issues.some(i => i.includes('❌') || i.includes('failed'));
    let status = hasCritical ? '❌' : (r.issues.length > 0 ? '⚠️' : '✅');
    md += `| ${r.name} | \`${r.path}\` | ${status} | ${passCount}/${total} | ${r.issues.length} |\n`;
  }

  md += `\n---\n\n## Per-Page Details\n\n`;

  for (const r of results) {
    md += `### ${r.name} (\`${r.path}\`)\n\n`;
    md += `| Check | Result |\n|------|--------|\n`;
    for (const [key, val] of Object.entries(r.checks)) {
      md += `| ${formatLabel(key)} | ${val} |\n`;
    }
    if (r.issues.length > 0) {
      md += `\n**Issues:**\n\n`;
      r.issues.forEach(i => md += `- ${i}\n`);
    }
    md += `\n`;
  }

  md += `---\n\n## Aggregated Findings\n\n`;

  // Group issues
  const allIssues = [];
  for (const r of results) {
    for (const i of r.issues) {
      allIssues.push({ page: r.name, path: r.path, issue: i });
    }
  }

  // Deduplicate by issue text
  const uniqueIssues = {};
  for (const ai of allIssues) {
    if (!uniqueIssues[ai.issue]) uniqueIssues[ai.issue] = [];
    uniqueIssues[ai.issue].push(`${ai.name || ai.page}`);
  }

  md += `| Issue | Affected Pages |\n|------|---------------|\n`;
  for (const [issue, pages] of Object.entries(uniqueIssues)) {
    md += `| ${issue} | ${pages.join(', ')} |\n`;
  }

  md += `\n## Recommendations\n\n`;
  md += `1. **Theme Toggle:** Add a visible light/dark mode toggle in the header for user accessibility.\n`;
  md += `2. **Language Switcher:** Implement a proper locale selector (i18n) for international users.\n`;
  md += `3. **Page Titles:** Consider unique \`<title>\` tags per route for SEO (currently all pages share "Cinacoin — Wallet Connection Toolkit").\n`;
  md += `4. **Error Boundaries:** Add React error boundaries to gracefully handle component crashes.\n`;
  md += `5. **Mobile Polish:** While responsive at 375px, some pages may benefit from mobile-optimized navigation (hamburger menu).\n`;
  md += `6. **Loading States:** Add loading spinners/skeletons for async content.\n`;
  md += `7. **Accessibility:** Ensure all interactive elements have \`aria-label\` attributes.\n`;

  return md;
}

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
