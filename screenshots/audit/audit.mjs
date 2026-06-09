import { chromium } from '/home/cina/.openclaw/workspace/onux/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core/index.mjs';
import { mkdir, writeFile } from 'fs/promises';

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

async function auditPage(page, item) {
  const results = { name: item.name, path: item.path, checks: {}, issues: [] };
  const url = `${BASE}${item.path}`;

  // Desktop dark screenshot
  await page.setViewportSize({ width: 1280, height: 900 });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(2000); // let hydration finish
    results.checks.loaded = true;
  } catch (e) {
    results.checks.loaded = false;
    results.issues.push(`Page failed to load: ${e.message}`);
    return results;
  }

  // Check for JS errors
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  // 1. Page title
  const title = await page.title();
  results.checks.title = title || 'empty';
  if (!title) results.issues.push('Page title is empty');

  // 2. Navbar
  const navVisible = await page.evaluate(() => {
    const selectors = ['nav', '[role="navigation"]', '.navbar', '.nav-bar', '.header', '[class*="nav"]', '[class*="header"]'];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el && el.offsetParent !== null) return true;
    }
    // fallback: check for common nav text patterns
    const bodyText = document.body.innerText;
    return /swap|token|home|settings|profile/i.test(bodyText.substring(0, 500));
  });
  results.checks.navbar = navVisible ? 'visible' : 'not found';
  if (!navVisible) results.issues.push('Navigation bar not detected');

  // 3. Main content
  const hasContent = await page.evaluate(() => {
    const body = document.body.innerText.trim();
    return body.length > 50;
  });
  results.checks.mainContent = hasContent ? 'present' : 'empty or minimal';
  if (!hasContent) results.issues.push('Main content area appears empty');

  // Screenshot desktop
  await page.screenshot({ path: `${OUT}/${item.name.replace(/\s+/g, '-').toLowerCase()}-desktop.png`, fullPage: false });

  // 4. JS errors
  await sleep(500);
  if (jsErrors.length > 0) {
    results.checks.jsErrors = jsErrors.slice(0, 5);
    results.issues.push(`JS runtime errors (${jsErrors.length}): ${jsErrors.slice(0, 2).join('; ')}`);
  } else {
    results.checks.jsErrors = 'none';
  }

  // 5. Mobile responsive (375px)
  await page.setViewportSize({ width: 375, height: 812 });
  await sleep(1500);
  const mobileOk = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    return viewport <= 390; // allow small margin
  });
  results.checks.mobileResponsive = mobileOk ? 'ok' : 'viewport mismatch';
  await page.screenshot({ path: `${OUT}/${item.name.replace(/\s+/g, '-').toLowerCase()}-mobile.png`, fullPage: false });

  // 6. Dark theme toggle
  // Reset viewport for dark mode check
  await page.setViewportSize({ width: 1280, height: 900 });
  await sleep(500);

  const darkModeResult = await page.evaluate(() => {
    // Check if there's a dark mode toggle button
    const toggleSelectors = [
      '[aria-label*="dark"]', '[aria-label*="theme"]', '[aria-label*="mode"]',
      '[class*="theme-toggle"]', '[class*="dark-toggle"]', '[class*="theme-switch"]',
      'button[class*="theme"]', 'button[class*="dark"]',
      '[data-testid*="theme"]', '[data-testid*="dark"]',
    ];
    let found = false;
    let selector = '';
    for (const s of toggleSelectors) {
      const el = document.querySelector(s);
      if (el) { found = true; selector = s; break; }
    }
    // Also check current computed background
    const bg = window.getComputedStyle(document.body).backgroundColor;
    const isDark = bg && (bg.includes('0, 0, 0') || bg.includes('rgb(17') || bg.includes('rgb(23') || bg.includes('rgb(30'));
    return { toggleFound: found, toggleSelector: selector, currentBg: bg, isDark };
  });
  results.checks.darkThemeToggle = darkModeResult.toggleFound ? `found (${darkModeResult.toggleSelector})` : 'not found';
  results.checks.currentTheme = darkModeResult.isDark ? 'dark' : 'light (or unknown bg)';
  if (!darkModeResult.toggleFound) results.issues.push('Dark mode toggle button not found');

  // Try toggling dark mode if button found
  if (darkModeResult.toggleFound) {
    try {
      await page.click(darkModeResult.toggleSelector, { timeout: 3000 });
      await sleep(500);
      const afterToggle = await page.evaluate(() => {
        const bg = window.getComputedStyle(document.body).backgroundColor;
        return bg;
      });
      results.checks.darkThemeToggleAction = `toggled, bg after: ${afterToggle}`;
    } catch (e) {
      results.issues.push(`Dark mode toggle click failed: ${e.message}`);
    }
  }

  // 7. Language switcher
  const langResult = await page.evaluate(() => {
    const selectors = [
      '[class*="lang"]', '[class*="locale"]', '[class*="i18n"]',
      '[data-testid*="lang"]', '[data-testid*="locale"]',
      'select[class*="lang"]', 'button[class*="lang"]',
    ];
    let found = false;
    let selector = '';
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el) { found = true; selector = s; break; }
    }
    // Also check for language text indicators
    const bodyText = document.body.innerText;
    const hasLangText = /EN|中文|日本語|ES|FR|DE|language|语言/i.test(bodyText.substring(0, 1000));
    return { found, selector, hasLangText };
  });
  results.checks.languageSwitcher = langResult.found ? `found (${langResult.selector})` : (langResult.hasLangText ? 'text indicator only' : 'not found');
  if (!langResult.found && !langResult.hasLangText) results.issues.push('Language switcher not found');

  return results;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  // Collect console errors too
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const allResults = [];

  for (const item of PAGES) {
    console.log(`\n🔍 Auditing: ${item.name} (${item.path})`);
    const result = await auditPage(page, item);
    allResults.push(result);

    // Summarize
    const pass = Object.values(result.checks).filter(v => v === true || v === 'visible' || v === 'present' || v === 'ok' || v === 'none' || (typeof v === 'string' && v.startsWith('found'))).length;
    const total = Object.keys(result.checks).length;
    console.log(`   Checks: ${pass}/${total} passed | Issues: ${result.issues.length}`);
    if (result.issues.length > 0) {
      result.issues.forEach(i => console.log(`   ⚠ ${i}`));
    }
  }

  await browser.close();

  // Generate report
  const report = generateReport(allResults);
  await writeFile(`${OUT}/demo-report.md`, report);
  console.log(`\n✅ Report written to ${OUT}/demo-report.md`);
}

function generateReport(results) {
  let md = `# Cinacoin Demo Site - Browser Audit Report\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Base URL:** https://demo.cinacoin.com\n`;
  md += `**Screenshots:** \`/screenshots/audit/\`\n\n`;

  // Summary table
  md += `## Summary\n\n`;
  md += `| Page | Path | Status | Checks Passed | Issues |\n`;
  md += `|------|------|--------|--------------|--------|\n`;

  for (const r of results) {
    const issueCount = r.issues.length;
    let status = '✅';
    if (issueCount >= 3) status = '❌';
    else if (issueCount >= 1) status = '⚠️';

    const passed = Object.values(r.checks).filter(v =>
      v === true || v === 'visible' || v === 'present' || v === 'ok' || v === 'none' ||
      (typeof v === 'string' && (v.startsWith('found') || v === 'toggled'))
    ).length;
    const total = Object.keys(r.checks).length;

    md += `| ${r.name} | \`${r.path}\` | ${status} | ${passed}/${total} | ${issueCount} |\n`;
  }

  md += `\n---\n\n`;

  // Per-page details
  md += `## Per-Page Details\n\n`;

  for (const r of results) {
    md += `### ${r.name} (\`${r.path}\`)\n\n`;
    md += `**Checks:**\n\n`;
    for (const [key, val] of Object.entries(r.checks)) {
      const icon = (val === true || val === 'visible' || val === 'present' || val === 'ok' || val === 'none' || (typeof val === 'string' && val.startsWith('found'))) ? '✅' : 'ℹ️';
      md += `- ${icon} **${key}:** ${typeof val === 'string' ? val : JSON.stringify(val)}\n`;
    }
    if (r.issues.length > 0) {
      md += `\n**Issues:**\n\n`;
      r.issues.forEach(i => md += `- ⚠️ ${i}\n`);
    }
    md += `\n`;
  }

  // All issues
  const allIssues = [];
  for (const r of results) {
    for (const i of r.issues) {
      allIssues.push(`- **${r.name}** (\`${r.path}\`): ${i}`);
    }
  }

  if (allIssues.length > 0) {
    md += `## All Issues Found\n\n`;
    allIssues.forEach(i => md += `${i}\n`);
    md += `\n`;
  }

  // Suggestions
  md += `## Improvement Suggestions\n\n`;
  md += `1. **Dark Mode Toggle:** Ensure a visible theme toggle exists on all pages for accessibility.\n`;
  md += `2. **Language Switcher:** Implement a consistent language/locale switcher across all pages.\n`;
  md += `3. **Error Handling:** Add global error boundaries to prevent unhandled JS errors from breaking the UI.\n`;
  md += `4. **Mobile Testing:** Regularly test at 375px viewport width to ensure responsive layouts.\n`;
  md += `5. **Navigation Consistency:** Ensure the navbar renders on every page for seamless navigation.\n`;
  md += `6. **Page Titles:** Every page should have a descriptive <title> for SEO and accessibility.\n`;
  md += `7. **Loading States:** Add loading indicators for async content to improve perceived performance.\n`;

  return md;
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
