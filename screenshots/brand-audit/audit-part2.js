const { chromium } = require('/home/cina/.openclaw/workspace/onux/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/home/cina/.openclaw/workspace/screenshots/brand-audit';

const SITES = [
  {
    name: 'Dashboard',
    baseUrl: 'https://dash.cinacoin.com',
    pages: ['/push-server', '/relay-server', '/rpc-proxy', '/settings']
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

async function auditPage(browser, siteName, pagePath, baseUrl) {
  const fullUrl = baseUrl + pagePath;
  const pageLabel = pagePath === '/' ? 'home' : pagePath.replace(/^\//, '').replace(/\//g, '_');
  const siteLabel = siteName.toLowerCase().replace(/\s+/g, '_');
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
    const logoResult = await page.evaluate(() => {
      const selectors = ['img[alt*="logo" i]', 'img[alt*="Cinacoin" i]', '.logo img', '.logo', 'nav img:first-of-type', 'header a img:first-of-type', '.navbar-brand img', '[data-testid*="logo"]', 'a[class*="logo"]', '.header-logo', '.brand-logo'];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const rect = el.getBoundingClientRect();
          const src = el.tagName === 'IMG' ? el.src : '';
          const alt = el.alt || '';
          const text = el.textContent?.trim() || '';
          return { found: true, src: src.substring(0, 80), alt, text: text.substring(0,50), width: rect.width, height: rect.height, tag: el.tagName };
        }
      }
      const allText = document.body.textContent.substring(0, 500);
      if (allText.match(/cinacoin|cina coin/i)) {
        return { found: true, type: 'text', text: 'cinacoin text detected in page content' };
      }
      return { found: false };
    });
    results.brandChecks.logo = logoResult;

    // Page title
    const pageTitle = await page.title();
    results.brandChecks.pageTitle = pageTitle;

    // Navigation
    const navResult = await page.evaluate(() => {
      const navs = document.querySelectorAll('nav, [role="navigation"], .navbar, .nav, .menu, header');
      const links = [];
      for (const nav of navs) {
        const aTags = nav.querySelectorAll('a[href]');
        for (const a of aTags) {
          const href = a.getAttribute('href') || '';
          const text = a.textContent.trim();
          if (text && href && !href.startsWith('#')) {
            links.push({ text: text.substring(0, 40), href: href.substring(0, 100) });
          }
        }
      }
      return { found: navs.length > 0, linkCount: links.length, links: links.slice(0, 15) };
    });
    results.brandChecks.navigation = navResult;

    // Footer
    const footerResult = await page.evaluate(() => {
      const footers = document.querySelectorAll('footer, [role="contentinfo"], .footer, .site-footer');
      if (footers.length === 0) return { found: false };
      const text = Array.from(footers).map(f => f.textContent.trim().replace(/\s+/g, ' ').substring(0, 200)).join(' | ');
      const hasCopyright = /copyright|©|\d{4}/i.test(text);
      return { found: true, hasCopyright, textPreview: text.substring(0, 150) };
    });
    results.brandChecks.footer = footerResult;

    // Colors / Theme
    const colorResult = await page.evaluate(() => {
      const bg = window.getComputedStyle(document.body).backgroundColor;
      const font = window.getComputedStyle(document.body).fontFamily;
      return { bodyBg: bg, fontFamily: font.substring(0, 100) };
    });
    results.brandChecks.colors = colorResult;

    // Multi-language
    const langResult = await page.evaluate(() => {
      const langEls = document.querySelectorAll('[class*="lang" i], [class*="locale" i], [class*="i18n" i], .language-switcher, .locale-selector');
      if (langEls.length > 0) return { found: true, text: langEls[0].textContent.trim().substring(0, 50) };
      const allText = document.body.textContent;
      if (/中文|English|日本語|切换语言|Language/i.test(allText.substring(0, 3000))) return { found: true, hint: 'language text detected' };
      return { found: false };
    });
    results.brandChecks.multiLanguage = langResult;

    // Functional
    results.functionalChecks.jsErrors = jsErrors.length > 0 ? jsErrors.slice(0, 10) : [];
    results.functionalChecks.responseOk = resp ? resp.ok() : false;

    // Desktop screenshot
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_desktop.png`), fullPage: false });

    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await sleep(500);
    const mobileOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 5
    }));
    results.functionalChecks.mobileOverflow = mobileOverflow;
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_mobile.png`), fullPage: false });

    // Dark mode
    const darkSupported = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ||
             document.querySelector('[data-theme="dark"]') ||
             document.querySelector('.dark-mode-toggle, .theme-toggle, [class*="dark-mode"]');
    });

    if (darkSupported) {
      const darkContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
      const darkPage = await darkContext.newPage();
      try {
        await darkPage.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(2000);
        await darkPage.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_dark.png`), fullPage: false });
        results.functionalChecks.darkMode = 'screenshot captured';
      } catch (e) {
        results.functionalChecks.darkMode = `failed: ${e.message.substring(0, 100)}`;
      }
      await darkContext.close();
    } else {
      results.functionalChecks.darkMode = 'no dark mode detected';
    }

    // Issues
    if (!resp || !resp.ok()) results.issues.push(`HTTP ${results.statusCode} - page not accessible`);
    if (jsErrors.length > 0) results.issues.push(`JS errors: ${jsErrors.slice(0, 3).join('; ')}`);
    if (!logoResult.found) results.issues.push('No logo detected');
    if (!pageTitle) results.issues.push('Missing page title');
    if (!footerResult.found) results.issues.push('No footer element detected');
    if (mobileOverflow.overflow) results.issues.push(`Mobile horizontal overflow: scrollWidth=${mobileOverflow.scrollWidth}, clientWidth=${mobileOverflow.clientWidth}`);

  } catch (err) {
    results.functionalChecks.error = err.message.substring(0, 200);
    results.issues.push(`Page load error: ${err.message.substring(0, 150)}`);
    try { await page.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_desktop_error.png`), fullPage: false }); } catch(e2) {}
  }

  await context.close();
  return results;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const allResults = [];

  for (const site of SITES) {
    console.log(`\n🌐 Auditing: ${site.name} (${site.baseUrl})`);
    for (const pagePath of site.pages) {
      const result = await auditPage(browser, site.name, pagePath, site.baseUrl);
      allResults.push(result);
      const status = result.issues.length === 0 ? '✅' : `⚠️ ${result.issues.length} issue(s)`;
      console.log(`  ${status} ${result.url}`);
      if (result.issues.length > 0) {
        result.issues.forEach(i => console.log(`    → ${i}`));
      }
    }
  }

  await browser.close();

  // Load previous results if available
  const prevResults = [];
  try {
    const prev = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'audit-results-partial.json'), 'utf8'));
    prevResults.push(...prev);
  } catch(e) {}

  const allCombined = [...prevResults, ...allResults];
  generateReport(allCombined);
  console.log(`\n✅ Audit complete. Report: ${path.join(OUTPUT_DIR, 'brand-audit-report.md')}`);
}

function generateReport(results) {
  const reportPath = path.join(OUTPUT_DIR, 'brand-audit-report.md');
  const now = new Date().toISOString();

  // Save partial results for future merges
  fs.writeFileSync(path.join(OUTPUT_DIR, 'audit-results-partial.json'), JSON.stringify(results, null, 2));

  let md = `# Cinacoin 品牌审计报告 (Brand Audit Report)\n\n`;
  md += `> 审计时间: ${now}\n`;
  md += `> 审计范围: 5 个站点, ${results.length} 个页面\n\n`;

  // === Brand Elements Table ===
  md += `## 一、品牌元素状态表\n\n`;
  md += `| 站点 | 页面 | Logo | 页面标题 | 导航 | 页脚 | 版权 | 背景色 | 字体 |\n`;
  md += `|------|------|------|----------|------|------|------|--------|------|\n`;

  for (const r of results) {
    const bc = r.brandChecks;
    const logo = bc.logo?.found ? '✅' : '❌';
    const title = bc.pageTitle ? `${bc.pageTitle.substring(0, 35)}` : '❌ 缺失';
    const nav = bc.navigation?.found ? `✅ (${bc.navigation.linkCount} links)` : '⚠️ 未检测到';
    const footer = bc.footer?.found ? '✅' : '❌';
    const copyright = bc.footer?.hasCopyright ? '✅' : '⚠️';
    const colors = bc.colors?.bodyBg || 'N/A';
    const font = bc.colors?.fontFamily ? bc.colors.fontFamily.substring(0, 20) : 'N/A';
    md += `| ${r.siteName} | \`${r.pagePath}\` | ${logo} | ${title} | ${nav} | ${footer} | ${copyright} | \`${colors}\` | \`${font}\` |\n`;
  }

  // === Functional Table ===
  md += `\n## 二、功能状态表\n\n`;
  md += `| 站点 | 页面 | HTTP 状态 | JS 错误 | 移动端溢出 | 暗色模式 | 多语言 |\n`;
  md += `|------|------|-----------|---------|-----------|----------|--------|\n`;

  for (const r of results) {
    const fc = r.functionalChecks;
    const status = fc.error ? `❌ ${fc.error.substring(0, 40)}` : (fc.responseOk ? `✅ ${r.statusCode || 200}` : `⚠️ HTTP ${r.statusCode}`);
    const jsErr = fc.jsErrors?.length > 0 ? `❌ ${fc.jsErrors.length} 个` : '✅ 无';
    const mobile = fc.mobileOverflow?.overflow ? `❌ ${fc.mobileOverflow.scrollWidth}px` : '✅ 正常';
    const dark = fc.darkMode || 'N/A';
    const lang = r.brandChecks.multiLanguage?.found ? '✅ 有' : '⚠️ 未检测到';
    md += `| ${r.siteName} | \`${r.pagePath}\` | ${status} | ${jsErr} | ${mobile} | ${dark} | ${lang} |\n`;
  }

  // === Issues ===
  md += `\n## 三、问题列表（按优先级）\n\n`;
  const p0 = [], p1 = [], p2 = [];
  for (const r of results) {
    for (const issue of r.issues) {
      if (issue.includes('not accessible') || issue.includes('Page load error') || r.functionalChecks?.error) {
        p0.push(`**P0** [${r.siteName}] \`${r.pagePath}\`: ${issue}`);
      } else if (issue.includes('JS error') || issue.includes('horizontal overflow') || issue.includes('No logo')) {
        p1.push(`**P1** [${r.siteName}] \`${r.pagePath}\`: ${issue}`);
      } else {
        p2.push(`**P2** [${r.siteName}] \`${r.pagePath}\`: ${issue}`);
      }
    }
  }

  if (p0.length) { md += `### P0 — 严重\n\n`; p0.forEach(i => md += `- ${i}\n`); md += `\n`; }
  if (p1.length) { md += `### P1 — 重要\n\n`; p1.forEach(i => md += `- ${i}\n`); md += `\n`; }
  if (p2.length) { md += `### P2 — 建议\n\n`; p2.forEach(i => md += `- ${i}\n`); md += `\n`; }
  if (!p0.length && !p1.length && !p2.length) { md += `> 未发现显著问题 ✅\n\n`; }

  // === Brand Consistency ===
  md += `## 四、品牌一致性评估\n\n`;
  const logos = results.filter(r => r.brandChecks.logo?.found);
  const footersAll = results.filter(r => r.brandChecks.footer?.found);
  const darkPages = results.filter(r => r.functionalChecks.darkMode?.includes('screenshot'));
  const langPages = results.filter(r => r.brandChecks.multiLanguage?.found);

  md += `### Logo 一致性\n`;
  md += `- 检测到 Logo 的页面: ${logos.length}/${results.length}\n\n`;
  md += `### 页脚一致性\n`;
  md += `- 有页脚的页面: ${footersAll.length}/${results.length}\n`;
  md += `- 有版权信息的页面: ${footersAll.filter(f => f.brandChecks.footer?.hasCopyright).length}/${results.length}\n\n`;
  md += `### 暗色主题支持\n`;
  md += `- 支持暗色模式的页面: ${darkPages.length}/${results.length}\n\n`;
  md += `### 多语言支持\n`;
  md += `- 检测到多语言入口的页面: ${langPages.length}/${results.length}\n\n`;

  // Summary
  const issueCount = results.reduce((s, r) => s + r.issues.length, 0);
  md += `## 五、总结\n\n`;
  md += `- **总页面数**: ${results.length}\n`;
  md += `- **正常页面**: ${results.filter(r => r.issues.length === 0).length}\n`;
  md += `- **有问题页面**: ${results.filter(r => r.issues.length > 0).length}\n`;
  md += `- **问题总数**: ${issueCount}\n`;
  md += `- **截图总数**: 每个页面 2-3 张（桌面/移动端/暗色模式）\n\n`;

  md += `---\n\n`;
  md += `> 📸 所有截图已保存到: \`${OUTPUT_DIR}\`\n`;
  md += `> 报告生成时间: ${now}\n`;

  fs.writeFileSync(reportPath, md, 'utf8');
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
