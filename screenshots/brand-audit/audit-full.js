// Read the console output from part1 log to reconstruct results
// Actually, let's just re-run the full audit in a more resilient way
// with smaller batches to avoid SIGKILL

const { chromium } = require('/home/cina/.openclaw/workspace/onux/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/home/cina/.openclaw/workspace/screenshots/brand-audit';
const RESULTS_FILE = path.join(OUTPUT_DIR, 'audit-results-partial.json');

const SITES = [
  {
    name: 'Main Website',
    baseUrl: 'https://cinacoin.com',
    pages: ['/']
  },
  {
    name: 'Demo App',
    baseUrl: 'https://demo.cinacoin.com',
    pages: ['/', '/swap', '/tokens', '/multi-chain', '/batch', '/auth', '/profile', '/settings', '/activity', '/aa-demo', '/onramp', '/components']
  },
  {
    name: 'Dashboard',
    baseUrl: 'https://dash.cinacoin.com',
    pages: ['/', '/login', '/analytics', '/chains', '/keys-server', '/notify-server', '/project', '/push-server', '/relay-server', '/rpc-proxy', '/settings']
  },
  {
    name: 'Documentation',
    baseUrl: 'https://docs.cinacoin.com',
    pages: ['/', '/guide/quick-start', '/guide/installation', '/api/core-sdk', '/zh/']
  },
  {
    name: 'Health Status',
    baseUrl: 'https://status.cinacoin.com',
    pages: ['/']
  }
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Check if screenshot already exists to skip re-auditing
function hasScreenshots(siteLabel, pageLabel) {
  return fs.existsSync(path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_desktop.png`)) &&
         fs.existsSync(path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_mobile.png`));
}

async function auditPage(browser, siteName, pagePath, baseUrl, skipExisting = false) {
  const fullUrl = baseUrl + pagePath;
  const pageLabel = pagePath === '/' ? 'home' : pagePath.replace(/^\//, '').replace(/\//g, '_');
  const siteLabel = siteName.toLowerCase().replace(/\s+/g, '_');

  if (skipExisting && hasScreenshots(siteLabel, pageLabel)) {
    console.log(`  ⏭️ Skipping (screenshots exist): ${fullUrl}`);
    return null;
  }

  const results = { url: fullUrl, siteName, pagePath, issues: [], brandChecks: {}, functionalChecks: {} };

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  try {
    const resp = await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);

    results.statusCode = resp ? resp.status() : null;

    // Logo
    results.brandChecks.logo = await page.evaluate(() => {
      const selectors = ['img[alt*="logo" i]', '.logo img', '.logo', 'nav img:first-of-type', 'header a img:first-of-type', '.navbar-brand img', '[data-testid*="logo"]', 'a[class*="logo"]', '.header-logo', '.brand-logo'];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const rect = el.getBoundingClientRect();
          return { found: true, src: (el.src || '').substring(0, 80), alt: el.alt || '', text: el.textContent?.trim().substring(0,50) || '', width: rect.width, height: rect.height };
        }
      }
      const allText = document.body.textContent.substring(0, 500);
      if (allText.match(/cinacoin|cina coin/i)) {
        return { found: true, type: 'text', text: 'cinacoin text in page' };
      }
      return { found: false };
    });

    // Page title
    results.brandChecks.pageTitle = await page.title();

    // Navigation
    results.brandChecks.navigation = await page.evaluate(() => {
      const navs = document.querySelectorAll('nav, [role="navigation"], .navbar, .nav, .menu, header');
      const links = [];
      for (const nav of navs) {
        for (const a of nav.querySelectorAll('a[href]')) {
          const href = a.getAttribute('href') || '';
          const text = a.textContent.trim();
          if (text && href && !href.startsWith('#')) links.push({ text: text.substring(0, 40), href: href.substring(0, 100) });
        }
      }
      return { found: navs.length > 0, linkCount: links.length };
    });

    // Footer
    results.brandChecks.footer = await page.evaluate(() => {
      const footers = document.querySelectorAll('footer, [role="contentinfo"], .footer, .site-footer');
      if (footers.length === 0) return { found: false, hasCopyright: false, textPreview: '' };
      const text = Array.from(footers).map(f => f.textContent.trim().replace(/\s+/g, ' ').substring(0, 200)).join(' | ');
      return { found: true, hasCopyright: /copyright|©|\d{4}/i.test(text), textPreview: text.substring(0, 150) };
    });

    // Colors
    results.brandChecks.colors = await page.evaluate(() => {
      return {
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        fontFamily: window.getComputedStyle(document.body).fontFamily.substring(0, 100)
      };
    });

    // Multi-language
    results.brandChecks.multiLanguage = await page.evaluate(() => {
      const langEls = document.querySelectorAll('[class*="lang" i], [class*="locale" i], [class*="i18n" i], .language-switcher, .locale-selector');
      if (langEls.length > 0) return { found: true, text: langEls[0].textContent.trim().substring(0, 50) };
      if (/中文|English|日本語|切换语言|Language/i.test(document.body.textContent.substring(0, 3000))) return { found: true, hint: 'language text detected' };
      return { found: false };
    });

    // Functional
    results.functionalChecks.jsErrors = jsErrors.slice(0, 10);
    results.functionalChecks.responseOk = resp ? resp.ok() : false;

    // Desktop
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_desktop.png`), fullPage: false });

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await sleep(500);
    results.functionalChecks.mobileOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 5
    }));
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_mobile.png`), fullPage: false });

    // Dark mode
    const darkSupported = await page.evaluate(() =>
      document.documentElement.classList.contains('dark') ||
      document.querySelector('[data-theme="dark"]') ||
      document.querySelector('.dark-mode-toggle, .theme-toggle, [class*="dark-mode"]')
    );

    if (darkSupported) {
      const darkCtx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
      const darkPg = await darkCtx.newPage();
      try {
        await darkPg.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await sleep(1500);
        await darkPg.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_dark.png`), fullPage: false });
        results.functionalChecks.darkMode = 'captured';
      } catch (e) {
        results.functionalChecks.darkMode = e.message.substring(0, 100);
      }
      await darkCtx.close();
    } else {
      results.functionalChecks.darkMode = 'not detected';
    }

    // Issues
    if (!resp || !resp.ok()) results.issues.push(`HTTP ${results.statusCode}`);
    if (jsErrors.length) results.issues.push(`JS errors: ${jsErrors.slice(0, 3).join('; ')}`);
    if (!results.brandChecks.logo.found) results.issues.push('No logo detected');
    if (!results.brandChecks.pageTitle) results.issues.push('Missing page title');
    if (!results.brandChecks.footer.found) results.issues.push('No footer detected');
    if (results.functionalChecks.mobileOverflow.overflow) results.issues.push(`Mobile overflow: ${results.functionalChecks.mobileOverflow.scrollWidth}px`);

  } catch (err) {
    results.functionalChecks.error = err.message.substring(0, 200);
    results.issues.push(`Page error: ${err.message.substring(0, 100)}`);
  }

  await context.close();
  return results;
}

async function main() {
  let allResults = [];

  // Load existing results
  if (fs.existsSync(RESULTS_FILE)) {
    try { allResults = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')); } catch(e) {}
  }

  const existingUrls = new Set(allResults.map(r => r.url));

  const browser = await chromium.launch({ headless: true });
  let batchCount = 0;

  for (const site of SITES) {
    for (const pagePath of site.pages) {
      const fullUrl = site.baseUrl + pagePath;
      if (existingUrls.has(fullUrl)) continue;

      batchCount++;
      const result = await auditPage(browser, site.name, pagePath, site.baseUrl, true);
      if (result) {
        allResults.push(result);
        // Save incrementally
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(allResults, null, 2));
        const status = result.issues.length === 0 ? '✅' : `⚠️ ${result.issues.length}`;
        console.log(`  ${status} ${fullUrl}`);
        if (result.issues.length) result.issues.forEach(i => console.log(`    → ${i}`));
      }

      // Save every 3 pages
      if (batchCount % 3 === 0) {
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(allResults, null, 2));
        // Small GC pause
        await sleep(500);
      }
    }
  }

  await browser.close();

  // Generate report
  generateReport(allResults);
  console.log(`\n✅ Done. ${allResults.length} pages, report: ${OUTPUT_DIR}/brand-audit-report.md`);
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
    const bc = r.brandChecks;
    md += `| ${r.siteName} | \`${r.pagePath}\` | ${bc.logo?.found ? '✅' : '❌'} | ${(bc.pageTitle||'').substring(0,35)||'❌'} | ${bc.navigation?.found ? `✅(${bc.navigation.linkCount})` : '⚠️'} | ${bc.footer?.found ? '✅' : '❌'} | ${bc.footer?.hasCopyright ? '✅' : '⚠️'} | \`${bc.colors?.bodyBg||'N/A'}\` | \`${(bc.colors?.fontFamily||'N/A').substring(0,20)}\` |\n`;
  }

  // Functional table
  md += `\n## 二、功能状态表\n\n`;
  md += `| 站点 | 页面 | HTTP | JS 错误 | 移动端 | 暗色模式 | 多语言 |\n`;
  md += `|------|------|------|---------|--------|----------|--------|\n`;
  for (const r of results) {
    const fc = r.functionalChecks;
    md += `| ${r.siteName} | \`${r.pagePath}\` | ${fc.error ? '❌err' : (fc.responseOk ? `✅${r.statusCode||200}` : `⚠️${r.statusCode}`)} | ${fc.jsErrors?.length ? `❌${fc.jsErrors.length}` : '✅'} | ${fc.mobileOverflow?.overflow ? '❌溢出' : '✅'} | ${fc.darkMode||'N/A'} | ${r.brandChecks.multiLanguage?.found ? '✅' : '⚠️'} |\n`;
  }

  // Issues
  md += `\n## 三、问题列表\n\n`;
  const p0=[], p1=[], p2=[];
  for (const r of results) {
    for (const issue of r.issues) {
      if (issue.includes('not accessible') || issue.includes('Page error')) p0.push(`**P0** [${r.siteName}] \`${r.pagePath}\`: ${issue}`);
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
  md += `- **Logo 一致性**: ${logos.length}/${results.length} 页面检测到 Logo\n`;
  md += `- **页脚一致性**: ${footers.length}/${results.length} 页面有页脚，其中 ${footers.filter(f=>f.brandChecks.footer?.hasCopyright).length} 有版权信息\n`;
  md += `- **暗色主题**: ${darks.length}/${results.length} 页面支持暗色模式\n`;
  md += `- **多语言**: ${langs.length}/${results.length} 页面检测到多语言入口\n\n`;

  // Summary
  const issues = results.reduce((s,r) => s + r.issues.length, 0);
  md += `## 五、总结\n\n`;
  md += `- **总页面数**: ${results.length}\n`;
  md += `- **正常页面**: ${results.filter(r => !r.issues.length).length}\n`;
  md += `- **有问题页面**: ${results.filter(r => r.issues.length).length}\n`;
  md += `- **问题总数**: ${issues}\n\n`;
  md += `> 📸 截图目录: \`${OUTPUT_DIR}\`\n`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'brand-audit-report.md'), md, 'utf8');
}

main().catch(err => { console.error('Failed:', err); process.exit(1); });
