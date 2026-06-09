const { chromium } = require('/home/cina/.openclaw/workspace/onux/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/home/cina/.openclaw/workspace/screenshots/brand-audit';
const RESULTS_FILE = path.join(OUTPUT_DIR, 'audit-all.json');

const PAGES = [
  { site: 'Main Website', url: 'https://cinacoin.com/', path: '/' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/', path: '/' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/swap', path: '/swap' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/tokens', path: '/tokens' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/multi-chain', path: '/multi-chain' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/batch', path: '/batch' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/auth', path: '/auth' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/profile', path: '/profile' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/settings', path: '/settings' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/activity', path: '/activity' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/aa-demo', path: '/aa-demo' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/onramp', path: '/onramp' },
  { site: 'Demo App', url: 'https://demo.cinacoin.com/components', path: '/components' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/', path: '/' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/login', path: '/login' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/analytics', path: '/analytics' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/chains', path: '/chains' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/keys-server', path: '/keys-server' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/notify-server', path: '/notify-server' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/project', path: '/project' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/push-server', path: '/push-server' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/relay-server', path: '/relay-server' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/rpc-proxy', path: '/rpc-proxy' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/settings', path: '/settings' },
  { site: 'Documentation', url: 'https://docs.cinacoin.com/', path: '/' },
  { site: 'Documentation', url: 'https://docs.cinacoin.com/guide/quick-start', path: '/guide/quick-start' },
  { site: 'Documentation', url: 'https://docs.cinacoin.com/guide/installation', path: '/guide/installation' },
  { site: 'Documentation', url: 'https://docs.cinacoin.com/api/core-sdk', path: '/api/core-sdk' },
  { site: 'Documentation', url: 'https://docs.cinacoin.com/zh/', path: '/zh/' },
  { site: 'Health Status', url: 'https://status.cinacoin.com/', path: '/' },
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function auditPage(browser, entry, idx) {
  const { site, url, path: pagePath } = entry;
  const pageLabel = pagePath === '/' ? 'home' : pagePath.replace(/^\//, '').replace(/\//g, '_');
  const siteLabel = site.toLowerCase().replace(/\s+/g, '_');

  // Skip if both desktop and mobile already exist
  if (fs.existsSync(path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_desktop.png`)) &&
      fs.existsSync(path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_mobile.png`))) {
    // Read existing results if available
    const existing = loadResults();
    const found = existing.find(r => r.url === url);
    if (found) {
      console.log(`  ⏭️ [${idx+1}/${PAGES.length}] ${url}`);
      return null;
    }
  }

  console.log(`  📸 [${idx+1}/${PAGES.length}] ${url}`);

  const result = { url, siteName: site, pagePath, issues: [], brandChecks: {}, functionalChecks: {} };

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);

    result.statusCode = resp ? resp.status() : null;

    // All checks
    const checks = await page.evaluate(() => {
      // Logo
      const logoEls = document.querySelectorAll('img[alt*="logo" i], .logo img, .logo, nav img:first-of-type, header a img:first-of-type, .navbar-brand img, [data-testid*="logo"], a[class*="logo"], .header-logo, .brand-logo');
      let logo = { found: false };
      if (logoEls.length > 0) {
        const el = logoEls[0];
        const rect = el.getBoundingClientRect();
        logo = { found: true, tag: el.tagName, src: (el.src||'').substring(0,80), alt: el.alt||'', text: el.textContent?.trim().substring(0,50)||'', width: Math.round(rect.width), height: Math.round(rect.height) };
      } else if (/cinacoin|cina coin/i.test(document.body.textContent.substring(0, 500))) {
        logo = { found: true, type: 'text' };
      }

      // Nav
      const navs = document.querySelectorAll('nav, [role="navigation"], .navbar, .nav, .menu, header');
      let linkCount = 0;
      for (const nav of navs) {
        for (const a of nav.querySelectorAll('a[href]')) {
          if (a.textContent.trim() && !a.getAttribute('href')?.startsWith('#')) linkCount++;
        }
      }

      // Footer
      const footers = document.querySelectorAll('footer, [role="contentinfo"], .footer, .site-footer');
      let footer = { found: false, hasCopyright: false, textPreview: '' };
      if (footers.length > 0) {
        const text = Array.from(footers).map(f => f.textContent.trim().replace(/\s+/g, ' ').substring(0, 200)).join(' | ');
        footer = { found: true, hasCopyright: /copyright|©|\d{4}/i.test(text), textPreview: text.substring(0, 150) };
      }

      // Colors
      const bg = window.getComputedStyle(document.body).backgroundColor;
      const font = window.getComputedStyle(document.body).fontFamily.substring(0, 100);

      // Dark mode indicators
      const dark = document.documentElement.classList.contains('dark') ||
                   document.querySelector('[data-theme="dark"]') ||
                   document.querySelector('.dark-mode-toggle, .theme-toggle, [class*="dark-mode"]');

      // Language
      const langEls = document.querySelectorAll('[class*="lang" i], [class*="locale" i], [class*="i18n" i], .language-switcher, .locale-selector');
      let lang = { found: false };
      if (langEls.length > 0) lang = { found: true, text: langEls[0].textContent.trim().substring(0, 50) };
      else if (/中文|English|日本語|切换语言|Language/i.test(document.body.textContent.substring(0, 3000))) lang = { found: true, hint: 'detected' };

      return { logo, navFound: navs.length > 0, linkCount, footer, bg, font, dark, lang };
    });

    result.brandChecks.logo = checks.logo;
    result.brandChecks.pageTitle = await page.title();
    result.brandChecks.navigation = { found: checks.navFound, linkCount: checks.linkCount };
    result.brandChecks.footer = checks.footer;
    result.brandChecks.colors = { bodyBg: checks.bg, fontFamily: checks.font };
    result.brandChecks.multiLanguage = checks.lang;

    result.functionalChecks.jsErrors = jsErrors.slice(0, 10);
    result.functionalChecks.responseOk = resp ? resp.ok() : false;

    // Desktop
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_desktop.png`), fullPage: false });

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await sleep(500);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 5
    }));
    result.functionalChecks.mobileOverflow = overflow;
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_mobile.png`), fullPage: false });

    // Dark
    if (checks.dark) {
      const dCtx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
      const dPg = await dCtx.newPage();
      try {
        await dPg.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await sleep(1500);
        await dPg.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_dark.png`), fullPage: false });
        result.functionalChecks.darkMode = 'captured';
      } catch (e) { result.functionalChecks.darkMode = e.message.substring(0, 80); }
      await dCtx.close();
    } else {
      result.functionalChecks.darkMode = 'not detected';
    }

    // Issues
    if (!resp || !resp.ok()) result.issues.push(`HTTP ${result.statusCode}`);
    if (jsErrors.length) result.issues.push(`JS errors: ${jsErrors.slice(0, 3).join('; ')}`);
    if (!checks.logo.found) result.issues.push('No logo detected');
    if (!result.brandChecks.pageTitle) result.issues.push('Missing page title');
    if (!checks.footer.found) result.issues.push('No footer detected');
    if (overflow.overflow) result.issues.push(`Mobile overflow: ${overflow.scrollWidth}px`);

  } catch (err) {
    result.functionalChecks.error = err.message.substring(0, 200);
    result.issues.push(`Page error: ${err.message.substring(0, 100)}`);
  }

  await context.close();
  return result;
}

function loadResults() {
  if (fs.existsSync(RESULTS_FILE)) {
    try { return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')); } catch(e) { return []; }
  }
  return [];
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  let allResults = loadResults();
  const knownUrls = new Set(allResults.map(r => r.url));

  let done = 0, skipped = 0;
  for (let i = 0; i < PAGES.length; i++) {
    const entry = PAGES[i];
    if (knownUrls.has(entry.url)) { skipped++; continue; }
    const result = await auditPage(browser, entry, i);
    if (result) {
      allResults.push(result);
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(allResults, null, 2));
      done++;
    }
  }

  await browser.close();
  console.log(`\n✅ ${done} new, ${skipped} skipped, ${allResults.length} total`);

  generateReport(allResults);
  console.log(`📋 Report: ${OUTPUT_DIR}/brand-audit-report.md`);
}

function generateReport(results) {
  const now = new Date().toISOString();
  let md = `# Cinacoin 品牌审计报告 (Brand Audit Report)\n\n`;
  md += `> 审计时间: ${now}\n`;
  md += `> 审计范围: 5 个站点, ${results.length} 个页面\n\n`;

  // Brand table
  md += `## 一、品牌元素状态表\n\n`;
  md += `| 站点 | 页面 | Logo | 页面标题 | 导航 | 页脚 | 版权 | 背景色 | 字体 |\n`;
  md += `|------|------|------|----------|------|------|------|--------|------|\n`;
  for (const r of results) {
    const b = r.brandChecks;
    md += `| ${r.siteName} | \`${r.pagePath}\` | ${b.logo?.found ? '✅' : '❌'} | ${(b.pageTitle||'').substring(0,35)||'❌'} | ${b.navigation?.found ? `✅(${b.navigation.linkCount})` : '⚠️'} | ${b.footer?.found ? '✅' : '❌'} | ${b.footer?.hasCopyright ? '✅' : '⚠️'} | \`${b.colors?.bodyBg||'N/A'}\` | \`${(b.colors?.fontFamily||'N/A').substring(0,20)}\` |\n`;
  }

  // Functional table
  md += `\n## 二、功能状态表\n\n`;
  md += `| 站点 | 页面 | HTTP | JS 错误 | 移动端 | 暗色模式 | 多语言 |\n`;
  md += `|------|------|------|---------|--------|----------|--------|\n`;
  for (const r of results) {
    const f = r.functionalChecks;
    md += `| ${r.siteName} | \`${r.pagePath}\` | ${f.error ? '❌err' : (f.responseOk ? `✅${r.statusCode||200}` : `⚠️${r.statusCode}`)} | ${f.jsErrors?.length ? `❌${f.jsErrors.length}` : '✅'} | ${f.mobileOverflow?.overflow ? '❌溢出' : '✅'} | ${f.darkMode||'N/A'} | ${r.brandChecks.multiLanguage?.found ? '✅' : '⚠️'} |\n`;
  }

  // Issues by priority
  md += `\n## 三、问题列表（按优先级）\n\n`;
  const p0=[], p1=[], p2=[];
  for (const r of results) {
    for (const issue of r.issues) {
      if (issue.includes('HTTP') || issue.includes('Page error')) p0.push(`**P0** [${r.siteName}] \`${r.pagePath}\`: ${issue}`);
      else if (issue.includes('JS error') || issue.includes('overflow') || issue.includes('No logo')) p1.push(`**P1** [${r.siteName}] \`${r.pagePath}\`: ${issue}`);
      else p2.push(`**P2** [${r.siteName}] \`${r.pagePath}\`: ${issue}`);
    }
  }
  if (p0.length) { md += `### P0 — 严重\n\n`; p0.forEach(i => md += `- ${i}\n`); md += `\n`; }
  if (p1.length) { md += `### P1 — 重要\n\n`; p1.forEach(i => md += `- ${i}\n`); md += `\n`; }
  if (p2.length) { md += `### P2 — 建议\n\n`; p2.forEach(i => md += `- ${i}\n`); md += `\n`; }
  if (!p0.length && !p1.length && !p2.length) md += `> 无显著问题 ✅\n\n`;

  // Brand consistency
  md += `## 四、品牌一致性评估\n\n`;
  const logos = results.filter(r => r.brandChecks.logo?.found);
  const footers = results.filter(r => r.brandChecks.footer?.found);
  const darks = results.filter(r => r.functionalChecks.darkMode === 'captured');
  const langs = results.filter(r => r.brandChecks.multiLanguage?.found);
  md += `### Logo 一致性\n- ${logos.length}/${results.length} 页面检测到 Logo\n\n`;
  md += `### 页脚一致性\n- ${footers.length}/${results.length} 页面有页脚，其中 ${footers.filter(f=>f.brandChecks.footer?.hasCopyright).length} 有版权信息\n\n`;
  md += `### 暗色主题\n- ${darks.length}/${results.length} 页面支持暗色模式\n\n`;
  md += `### 多语言\n- ${langs.length}/${results.length} 页面检测到多语言入口\n\n`;

  // Summary
  const totalIssues = results.reduce((s,r) => s + r.issues.length, 0);
  md += `## 五、总结\n\n`;
  md += `- **总页面数**: ${results.length}\n`;
  md += `- **正常页面**: ${results.filter(r => !r.issues.length).length}\n`;
  md += `- **有问题页面**: ${results.filter(r => r.issues.length).length}\n`;
  md += `- **问题总数**: ${totalIssues}\n`;
  md += `- **截图总数**: ${fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png')).length} 张\n\n`;
  md += `> 📸 截图目录: \`${OUTPUT_DIR}\`\n`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'brand-audit-report.md'), md, 'utf8');
}

main().catch(err => { console.error('Failed:', err); process.exit(1); });
