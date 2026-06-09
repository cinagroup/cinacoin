const { chromium } = require('/home/cina/.openclaw/workspace/onux/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/home/cina/.openclaw/workspace/screenshots/audit';

const pages = [
  // Backend Dashboard
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/', path: '/' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/login', path: '/login' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/analytics', path: '/analytics' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/chains', path: '/chains' },
  { site: 'Desktop', url: 'https://dash.cinacoin.com/keys-server', path: '/keys-server' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/notify-server', path: '/notify-server' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/project', path: '/project' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/push-server', path: '/push-server' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/relay-server', path: '/relay-server' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/rpc-proxy', path: '/rpc-proxy' },
  { site: 'Dashboard', url: 'https://dash.cinacoin.com/settings', path: '/settings' },
  // Docs
  { site: 'Docs', url: 'https://docs.cinacoin.com/', path: '/' },
  { site: 'Docs', url: 'https://docs.cinacoin.com/guide/quick-start', path: '/guide/quick-start' },
  { site: 'Docs', url: 'https://docs.cinacoin.com/guide/installation', path: '/guide/installation' },
  { site: 'Docs', url: 'https://docs.cinacoin.com/guide/configuration', path: '/guide/configuration' },
  { site: 'Docs', url: 'https://docs.cinacoin.com/api/core-sdk', path: '/api/core-sdk' },
  { site: 'Docs', url: 'https://docs.cinacoin.com/api/react', path: '/api/react' },
  { site: 'Docs', url: 'https://docs.cinacoin.com/zh/', path: '/zh/' },
  { site: 'Docs', url: 'https://docs.cinacoin.com/zh/guide/quick-start', path: '/zh/guide/quick-start' },
];

function sanitizeFilename(s) {
  return s.replace(/[\/\\?%*:|"<>]/g, '-');
}

async function auditPage(browser, pageConfig) {
  const { site, url, path: pagePath } = pageConfig;
  const prefix = sanitizeFilename(`${site}-${pagePath.replace(/\//g, '_') || 'root'}`);
  
  const context = await browser.newContext({
    colorScheme: 'dark',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  
  const result = {
    site,
    url,
    path: pagePath,
    title: '',
    status: '❌ 异常',
    issues: [],
    suggestions: [],
    screenshot: '',
    jsErrors: [],
    consoleErrors: [],
  };
  
  const consoleErrors = [];
  const jsErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    jsErrors.push(err.message);
  });
  
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    result.httpStatus = response ? response.status() : 'N/A';
    
    await page.waitForTimeout(2000);
    
    result.title = await page.title();
    result.screenshot = `${prefix}-desktop.png`;
    await page.screenshot({ path: path.join(OUTPUT_DIR, result.screenshot) });
    
    // Check for content
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasContent = bodyText.trim().length > 0;
    
    // Check if it's a blank/error page
    const has404 = bodyText.toLowerCase().includes('404') || bodyText.toLowerCase().includes('not found') || result.httpStatus === 404;
    const hasError = bodyText.toLowerCase().includes('error') && bodyText.toLowerCase().includes('page');
    const isBlank = bodyText.trim().length < 50;
    
    // Check for navigation elements
    const hasNav = await page.evaluate(() => {
      const nav = document.querySelector('nav, header, [class*="nav"], [class*="menu"], [class*="sidebar"]');
      return !!nav;
    });
    
    // Check for heading
    const hasHeading = await page.evaluate(() => {
      const h = document.querySelector('h1, h2, [class*="title"], [class*="heading"]');
      return !!h;
    });
    
    // Mobile responsive test
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);
    result.screenshotMobile = `${prefix}-mobile.png`;
    await page.screenshot({ path: path.join(OUTPUT_DIR, result.screenshotMobile) });
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 900 });
    
    // Determine status
    if (result.httpStatus >= 400 || isBlank) {
      result.status = '❌ 异常';
      if (isBlank) result.issues.push('页面内容为空或极少');
      if (result.httpStatus >= 400) result.issues.push(`HTTP 状态码: ${result.httpStatus}`);
    } else if (hasContent && (hasNav || hasHeading) && jsErrors.length === 0 && consoleErrors.length === 0) {
      result.status = '✅ 正常';
    } else if (hasContent) {
      result.status = '⚠️ 部分';
      if (jsErrors.length > 0) result.issues.push(`JS 错误 (${jsErrors.length}): ${jsErrors.slice(0, 3).join('; ')}`);
      if (consoleErrors.length > 0) result.issues.push(`控制台错误 (${consoleErrors.length}): ${consoleErrors.slice(0, 3).join('; ')}`);
      if (!hasNav) result.issues.push('缺少导航元素');
      if (!hasHeading) result.issues.push('缺少标题元素');
    } else {
      result.status = '⚠️ 部分';
    }
    
    // Suggestions
    if (!hasNav && result.status !== '❌ 异常') result.suggestions.push('添加导航菜单');
    if (!hasHeading && result.status !== '❌ 异常') result.suggestions.push('添加页面标题 (h1)');
    if (jsErrors.length > 0) result.suggestions.push('修复 JavaScript 错误');
    if (consoleErrors.length > 0) result.suggestions.push('检查并修复控制台错误');
    
  } catch (err) {
    result.status = '❌ 异常';
    result.issues.push(`访问失败: ${err.message}`);
    
    // Try to screenshot anyway
    try {
      result.screenshot = `${prefix}-desktop-error.png`;
      await page.screenshot({ path: path.join(OUTPUT_DIR, result.screenshot) });
    } catch (_) {}
  }
  
  result.jsErrors = jsErrors;
  result.consoleErrors = consoleErrors;
  
  await context.close();
  return result;
}

async function main() {
  console.log('Starting Cinacoin Browser Audit...\n');
  
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  for (const pageConfig of pages) {
    console.log(`Auditing: ${pageConfig.site} ${pageConfig.url}`);
    const result = await auditPage(browser, pageConfig);
    results.push(result);
    console.log(`  → ${result.status} (${result.title || 'no title'})`);
    if (result.issues.length > 0) {
      result.issues.forEach(i => console.log(`    ⚠ ${i}`));
    }
  }
  
  await browser.close();
  
  // Generate report
  const dashboardResults = results.filter(r => r.site === 'Dashboard');
  const docsResults = results.filter(r => r.site === 'Docs');
  
  const allIssues = results.flatMap(r => r.issues.map(i => ({ page: `${r.site} ${r.path}`, issue: i })));
  const allSuggestions = results.flatMap(r => r.suggestions.map(s => ({ page: `${r.site} ${r.path}`, suggestion: s })));
  
  function statusLine(r) {
    const icon = r.status;
    const title = r.title || '(无标题)';
    const http = r.httpStatus ? ` [HTTP ${r.httpStatus}]` : '';
    const issues = r.issues.length > 0 ? ` — ${r.issues.join('; ')}` : '';
    const desktopShot = r.screenshot ? `![${r.path}](${r.screenshot})` : '';
    const mobileShot = r.screenshotMobile ? `![Mobile](${r.screenshotMobile})` : '';
    return `- ${icon} **${r.path}** — ${title}${http}${issues}\n  - Desktop: ${desktopShot}\n  - Mobile: ${mobileShot}`;
  }
  
  let report = `# Cinacoin Backend Dashboard & Docs — 浏览器功能审计报告

**生成时间:** ${new Date().toISOString()}
**视口:** Desktop 1280x900 + Mobile 375x812 (暗色模式)
**工具:** Playwright (Chromium)

---

## 📊 总览

| 站点 | 页面数 | ✅ 正常 | ⚠️ 部分 | ❌ 异常 |
|------|--------|---------|---------|---------|
| Dashboard | ${dashboardResults.length} | ${dashboardResults.filter(r=>r.status==='✅ 正常').length} | ${dashboardResults.filter(r=>r.status==='⚠️ 部分').length} | ${dashboardResults.filter(r=>r.status==='❌ 异常').length} |
| Docs | ${docsResults.length} | ${docsResults.filter(r=>r.status==='✅ 正常').length} | ${docsResults.filter(r=>r.status==='⚠️ 部分').length} | ${docsResults.filter(r=>r.status==='❌ 异常').length} |

---

## 🖥️ Backend Dashboard (dash.cinacoin.com)

${dashboardResults.map(statusLine).join('\n\n')}

---

## 📖 Docs (docs.cinacoin.com)

${docsResults.map(statusLine).join('\n\n')}

---

## 🐛 发现的问题

${allIssues.length > 0 ? allIssues.map(i => `- **${i.page}:** ${i.issue}`).join('\n') : '_无问题_'}

---

## 💡 改进建议

${allSuggestions.length > 0 ? allSuggestions.map(s => `- **${s.page}:** ${s.suggestion}`).join('\n') : '_无建议_'}

---

*报告由 Playwright 自动生成*
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'dashboard-docs-report.md'), report);
  console.log('\n✅ Report written to dashboard-docs-report.md');
  console.log(`\nSummary: ${results.filter(r=>r.status==='✅ 正常').length} OK, ${results.filter(r=>r.status==='⚠️ 部分').length} Partial, ${results.filter(r=>r.status==='❌ 异常').length} Failed`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
