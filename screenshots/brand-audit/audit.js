const { chromium } = require('/home/cina/.openclaw/workspace/onux/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/home/cina/.openclaw/workspace/screenshots/brand-audit';

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

    // === BRAND CHECKS ===
    // Logo
    const logoResult = await page.evaluate(() => {
      const selectors = ['img[alt*="logo" i]', 'img[alt*="Cinacoin" i]', '.logo img', '.logo', 'nav img:first-of-type', 'header a img:first-of-type', '.navbar-brand img', '[data-testid*="logo"]'];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const rect = el.getBoundingClientRect();
          const src = el.tagName === 'IMG' ? el.src : '';
          const alt = el.alt || '';
          const text = el.textContent?.trim() || '';
          return { found: true, src: src.substring(0, 80), alt, text, width: rect.width, height: rect.height, tag: el.tagName };
        }
      }
      // Check for text-based logo
      const logoText = document.querySelector('.logo, .brand, [class*="logo"]');
      if (logoText && logoText.textContent.trim().match(/cinacoin/i)) {
        return { found: true, type: 'text', text: logoText.textContent.trim().substring(0, 50) };
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

    // Colors / Theme detection
    const colorResult = await page.evaluate(() => {
      const bg = window.getComputedStyle(document.body).backgroundColor;
      const isDark = /rgb\(0,\s*0,\s*0\)|rgb\([0-2]\d,\s*[0-2]\d,\s*[0-2]\d\)/.test(bg) || parseInt(bg.replace(/[^0-9,]/g, '').split(',').reduce((s,v) => s + parseInt(v), 0) / 3) < 100;
      const font = window.getComputedStyle(document.body).fontFamily;
      const primaryColor = window.getComputedStyle(document.documentElement).getPropertyValue('--primary') || window.getComputedStyle(document.documentElement).getPropertyValue('--color-primary') || '';
      return { bodyBg: bg, isDark, fontFamily: font.substring(0, 100), primaryColor: primaryColor.substring(0, 50) };
    });
    results.brandChecks.colors = colorResult;

    // Multi-language
    const langResult = await page.evaluate(() => {
      const langEls = document.querySelectorAll('[class*="lang" i], [class*="locale" i], [class*="i18n" i], button[aria-label*="Language" i], a[href*="lang="], .language-switcher, .locale-selector');
      if (langEls.length > 0) {
        return { found: true, text: langEls[0].textContent.trim().substring(0, 50) };
      }
      // Check for language-related text
      const allText = document.body.textContent;
      const langPatterns = /中文|English|日本語|切换语言|Language/i;
      if (langPatterns.test(allText.substring(0, 3000))) {
        return { found: true, hint: 'language text detected in page content' };
      }
      return { found: false };
    });
    results.brandChecks.multiLanguage = langResult;

    // === FUNCTIONAL CHECKS ===
    results.functionalChecks.jsErrors = jsErrors.length > 0 ? jsErrors.slice(0, 10) : [];
    results.functionalChecks.responseOk = resp ? resp.ok() : false;

    // Screenshot: desktop light
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_desktop.png`), fullPage: false });

    // Screenshot: mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await sleep(500);
    // Check for horizontal overflow on mobile
    const mobileOverflow = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 5
      };
    });
    results.functionalChecks.mobileOverflow = mobileOverflow;
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_mobile.png`), fullPage: false });

    // Screenshot: dark mode (if supported)
    const darkSupported = await page.evaluate(() => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ||
             document.documentElement.classList.contains('dark') ||
             document.querySelector('[data-theme="dark"]') ||
             document.querySelector('.dark-mode-toggle, .theme-toggle, [class*="dark-mode"]');
    });

    if (darkSupported) {
      const darkContext = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        colorScheme: 'dark'
      });
      const darkPage = await darkContext.newPage();
      const darkErrors = [];
      darkPage.on('pageerror', err => darkErrors.push(err.message));
      try {
        await darkPage.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(2000);
        await darkPage.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_dark.png`), fullPage: false });
        results.functionalChecks.darkMode = 'screenshot captured';
        if (darkErrors.length > 0) {
          results.functionalChecks.jsErrors = [...results.functionalChecks.jsErrors, ...darkErrors.slice(0, 5)];
        }
      } catch (e) {
        results.functionalChecks.darkMode = `failed: ${e.message.substring(0, 100)}`;
      }
      await darkContext.close();
    } else {
      results.functionalChecks.darkMode = 'no dark mode detected';
    }

    // Issue detection
    if (!resp || !resp.ok()) {
      results.issues.push(`HTTP ${results.statusCode} - page not accessible`);
    }
    if (jsErrors.length > 0) {
      results.issues.push(`JS errors: ${jsErrors.slice(0, 3).join('; ')}`);
    }
    if (!logoResult.found) {
      results.issues.push('No logo detected');
    }
    if (!pageTitle) {
      results.issues.push('Missing page title');
    }
    if (!footerResult.found) {
      results.issues.push('No footer element detected');
    }
    if (mobileOverflow.overflow) {
      results.issues.push(`Mobile horizontal overflow: scrollWidth=${mobileOverflow.scrollWidth}, clientWidth=${mobileOverflow.clientWidth}`);
    }

  } catch (err) {
    results.functionalChecks.error = err.message.substring(0, 200);
    results.issues.push(`Page load error: ${err.message.substring(0, 150)}`);
    // Try to screenshot what loaded
    try {
      await page.screenshot({ path: path.join(OUTPUT_DIR, `${siteLabel}_${pageLabel}_desktop_error.png`), fullPage: false });
    } catch (e2) {}
  }

  await context.close();
  return results;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const allResults = [];
  let total = 0;

  for (const site of SITES) {
    console.log(`\n🌐 Auditing: ${site.name} (${site.baseUrl})`);
    for (const pagePath of site.pages) {
      total++;
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

  // Generate report
  generateReport(allResults);
  console.log(`\n✅ Audit complete. ${total} pages checked. Report: ${path.join(OUTPUT_DIR, 'brand-audit-report.md')}`);
}

function generateReport(results) {
  const reportPath = path.join(OUTPUT_DIR, 'brand-audit-report.md');
  const now = new Date().toISOString();

  let md = `# Cinacoin 品牌审计报告 (Brand Audit Report)\n\n`;
  md += `> 审计时间: ${now}\n`;
  md += `> 审计范围: ${SITES.length} 个站点, ${results.length} 个页面\n\n`;

  // === 1. Brand Elements Table ===
  md += `## 一、品牌元素状态表\n\n`;
  md += `| 站点 | 页面 | Logo | 页面标题 | 导航 | 页脚 | 版权 | 主色/背景 | 字体 |\n`;
  md += `|------|------|------|----------|------|------|------|----------|------|\n`;

  for (const r of results) {
    const bc = r.brandChecks;
    const logo = bc.logo?.found ? '✅' : '❌';
    const title = bc.pageTitle ? `${bc.pageTitle.substring(0, 30)}` : '❌ 缺失';
    const nav = bc.navigation?.found ? `✅ (${bc.navigation.linkCount} links)` : '⚠️ 未检测到';
    const footer = bc.footer?.found ? '✅' : '❌';
    const copyright = bc.footer?.hasCopyright ? '✅' : '⚠️';
    const colors = bc.colors?.bodyBg || 'N/A';
    const font = bc.colors?.fontFamily ? bc.colors.fontFamily.substring(0, 20) : 'N/A';
    md += `| ${r.siteName} | \`${r.pagePath}\` | ${logo} | ${title} | ${nav} | ${footer} | ${copyright} | \`${colors}\` | \`${font}\` |\n`;
  }

  md += `\n## 二、功能状态表\n\n`;
  md += `| 站点 | 页面 | 状态 | JS 错误 | 移动端溢出 | 暗色模式 | 多语言 |\n`;
  md += `|------|------|------|---------|-----------|----------|--------|\n`;

  for (const r of results) {
    const fc = r.functionalChecks;
    const status = fc.error ? `❌ ${fc.error.substring(0, 40)}` : (fc.responseOk ? '✅ 正常' : `⚠️ HTTP ${r.statusCode}`);
    const jsErr = fc.jsErrors?.length > 0 ? `❌ ${fc.jsErrors.length} 个` : '✅ 无';
    const mobile = fc.mobileOverflow?.overflow ? `❌ ${fc.mobileOverflow.scrollWidth}px` : '✅ 正常';
    const dark = fc.darkMode || 'N/A';
    const lang = r.brandChecks.multiLanguage?.found ? '✅ 有' : '⚠️ 未检测到';
    md += `| ${r.siteName} | \`${r.pagePath}\` | ${status} | ${jsErr} | ${mobile} | ${dark} | ${lang} |\n`;
  }

  // === 3. Issues by Priority ===
  md += `\n## 三、问题列表（按优先级）\n\n`;

  const p0Issues = [];
  const p1Issues = [];
  const p2Issues = [];

  for (const r of results) {
    for (const issue of r.issues) {
      if (issue.includes('not accessible') || issue.includes('Page load error') || (r.functionalChecks.error)) {
        p0Issues.push(`**P0** [${r.siteName}] \`${r.pagePath}\`: ${issue}`);
      } else if (issue.includes('JS error') || issue.includes('horizontal overflow') || issue.includes('No logo')) {
        p1Issues.push(`**P1** [${r.siteName}] \`${r.pagePath}\`: ${issue}`);
      } else {
        p2Issues.push(`**P2** [${r.siteName}] \`${r.pagePath}\`: ${issue}`);
      }
    }
  }

  if (p0Issues.length > 0) {
    md += `### P0 — 严重（页面不可访问）\n\n`;
    p0Issues.forEach(i => md += `- ${i}\n`);
    md += `\n`;
  }

  if (p1Issues.length > 0) {
    md += `### P1 — 重要（品牌或功能问题）\n\n`;
    p1Issues.forEach(i => md += `- ${i}\n`);
    md += `\n`;
  }

  if (p2Issues.length > 0) {
    md += `### P2 — 建议（体验优化）\n\n`;
    p2Issues.forEach(i => md += `- ${i}\n`);
    md += `\n`;
  }

  if (p0Issues.length === 0 && p1Issues.length === 0 && p2Issues.length === 0) {
    md += `> 未发现显著问题 ✅\n\n`;
  }

  // === 4. Brand Consistency Assessment ===
  md += `## 四、品牌一致性评估\n\n`;

  // Analyze cross-site consistency
  const logos = results.filter(r => r.brandChecks.logo?.found);
  const titles = results.filter(r => r.brandChecks.pageTitle);
  const footers = results.filter(r => r.brandChecks.footer?.found);

  const titlePatterns = [...new Set(results.map(r => {
    const t = r.brandChecks.pageTitle || '';
    if (t.match(/cinacoin/i)) return 'includes Cinacoin';
    if (t.match(/Cina/i)) return 'includes Cina';
    return t.substring(0, 20);
  }))];

  md += `### Logo 一致性\n`;
  md += `- 检测到 Logo 的页面: ${logos.length}/${results.length}\n`;
  md += `- 未检测到 Logo 的页面需要添加品牌标识\n\n`;

  md += `### 页面标题一致性\n`;
  md += `- 有标题的页面: ${titles.length}/${results.length}\n`;
  md += `- 标题模式: ${titlePatterns.join(', ')}\n\n`;

  md += `### 页脚一致性\n`;
  md += `- 有页脚的页面: ${footers.length}/${results.length}\n`;
  md += `- 有版权信息的页面: ${footers.filter(f => f.brandChecks.footer?.hasCopyright).length}/${results.length}\n\n`;

  md += `### 暗色主题支持\n`;
  const darkPages = results.filter(r => r.functionalChecks.darkMode?.includes('screenshot'));
  md += `- 支持暗色模式的页面: ${darkPages.length}/${results.length}\n\n`;

  md += `### 多语言支持\n`;
  const langPages = results.filter(r => r.brandChecks.multiLanguage?.found);
  md += `- 检测到多语言入口的页面: ${langPages.length}/${results.length}\n\n`;

  md += `---\n\n`;
  md += `> 📸 所有截图已保存到: \`${OUTPUT_DIR}\`\n`;
  md += `> 报告生成时间: ${now}\n`;

  fs.writeFileSync(reportPath, md, 'utf8');
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
