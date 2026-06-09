import { chromium } from 'playwright';

const SCREENSHOT_DIR = '/home/cina/.openclaw/workspace/tools/browser-test/screenshots/test-main';
const PAGES = [
  { name: 'Home', url: 'https://cinacoin.com' },
  { name: 'About', url: 'https://cinacoin.com/about' },
  { name: 'Products', url: 'https://cinacoin.com/products' },
  { name: 'Pricing', url: 'https://cinacoin.com/pricing' },
];

const results = {
  timestamp: new Date().toISOString(),
  pages: {},
  issues: [],
};

async function checkLink(url, context) {
  try {
    const resp = await context.request.head(url, { maxRedirects: 5, timeout: 10000 });
    if (resp.status() >= 400) {
      // Try GET if HEAD fails
      const getResp = await context.request.get(url, { maxRedirects: 5, timeout: 10000 });
      return { url, status: getResp.status(), ok: getResp.status() < 400 };
    }
    return { url, status: resp.status(), ok: true };
  } catch (e) {
    return { url, status: 'error', ok: false, error: e.message.slice(0, 200) };
  }
}

async function testPage(browser, pageDef) {
  const { name, url } = pageDef;
  console.log(`\n=== Testing ${name} (${url}) ===`);
  const pageResult = { url, screenshots: [], links: [], buttons: [], issues: [] };

  // Desktop viewport
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const context = page.context();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`  Loaded: ${name} - title: ${await page.title()}`);
  } catch (e) {
    console.log(`  Load warning: ${e.message.slice(0, 200)}`);
    pageResult.issues.push(`Page load warning: ${e.message.slice(0, 200)}`);
    // Try with domcontentloaded instead
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e2) {
      pageResult.issues.push(`Page failed to load: ${e2.message.slice(0, 200)}`);
      await page.close();
      results.pages[name] = pageResult;
      return;
    }
  }

  // Wait a bit for dynamic content
  await page.waitForTimeout(2000);

  // Desktop screenshot
  const desktopPath = `${SCREENSHOT_DIR}/${name.toLowerCase()}-desktop.png`;
  await page.screenshot({ path: desktopPath, fullPage: true });
  pageResult.screenshots.push({ type: 'desktop', path: desktopPath, viewport: '1440x900' });
  console.log(`  Screenshot: ${desktopPath}`);

  // Mobile screenshot
  const mobilePath = `${SCREENSHOT_DIR}/${name.toLowerCase()}-mobile.png`;
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: mobilePath, fullPage: true });
  pageResult.screenshots.push({ type: 'mobile', path: mobilePath, viewport: '375x812' });
  console.log(`  Screenshot: ${mobilePath}`);

  // Tablet screenshot
  const tabletPath = `${SCREENSHOT_DIR}/${name.toLowerCase()}-tablet.png`;
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: tabletPath, fullPage: true });
  pageResult.screenshots.push({ type: 'tablet', path: tabletPath, viewport: '768x1024' });
  console.log(`  Screenshot: ${tabletPath}`);

  // Reset to desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(500);

  // Extract all links
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    return anchors.map(a => ({
      href: a.href,
      text: (a.textContent || '').trim().slice(0, 80),
      target: a.target || '_self',
      hasOnclick: !!a.onclick,
      ariaLabel: a.getAttribute('aria-label') || '',
    }));
  });
  pageResult.links = links;
  console.log(`  Found ${links.length} links`);

  // Extract all buttons
  const buttons = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]'));
    return btns.map(b => ({
      tag: b.tagName,
      text: (b.textContent || '').trim().slice(0, 80),
      type: b.type || '',
      disabled: b.disabled || false,
      hasOnclick: !!b.onclick,
      ariaLabel: b.getAttribute('aria-label') || '',
      className: (b.className || '').toString().slice(0, 100),
    }));
  });
  pageResult.buttons = buttons;
  console.log(`  Found ${buttons.length} buttons`);

  // Check internal links accessibility
  const internalLinks = links.filter(l => l.href.startsWith('https://cinacoin.com') || l.href.startsWith('/'));
  const uniqueInternal = [...new Map(internalLinks.map(l => [l.href, l])).values()];
  console.log(`  Checking ${uniqueInternal.length} unique internal links...`);

  const linkChecks = [];
  for (const link of uniqueInternal.slice(0, 30)) { // limit to 30 to avoid excessive requests
    const result = await checkLink(link.href, context);
    linkChecks.push({ ...link, ...result });
    if (!result.ok) {
      pageResult.issues.push(`Broken link: ${link.href} (status: ${result.status})`);
      console.log(`  ❌ Broken: ${link.href} → ${result.status}`);
    }
  }
  pageResult.linkChecks = linkChecks;

  // Check external links
  const externalLinks = links.filter(l => l.href.startsWith('http') && !l.href.includes('cinacoin.com'));
  const uniqueExternal = [...new Map(externalLinks.map(l => [l.href, l])).values()];
  console.log(`  Checking ${uniqueExternal.length} unique external links...`);

  const extChecks = [];
  for (const link of uniqueExternal.slice(0, 15)) {
    const result = await checkLink(link.href, context);
    extChecks.push({ ...link, ...result });
    if (!result.ok) {
      pageResult.issues.push(`Broken external link: ${link.href} (status: ${result.status})`);
      console.log(`  ❌ Broken external: ${link.href} → ${result.status}`);
    }
  }
  pageResult.externalLinkChecks = extChecks;

  // Test dark mode toggle
  console.log(`  Testing dark mode toggle...`);
  const darkModeResult = await testDarkMode(page);
  pageResult.darkMode = darkModeResult;

  // Test i18n
  console.log(`  Testing i18n...`);
  const i18nResult = await testI18n(page, context);
  pageResult.i18n = i18nResult;

  // Check for common issues
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200));
  });

  // Check accessibility basics
  const a11y = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const imagesWithoutAlt = images.filter(img => !img.alt && !img.getAttribute('aria-label'));
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      tag: h.tagName, text: (h.textContent || '').trim().slice(0, 60)
    }));
    const h1Count = document.querySelectorAll('h1').length;
    return {
      totalImages: images.length,
      imagesWithoutAlt: imagesWithoutAlt.length,
      headings,
      h1Count,
      hasLang: !!document.documentElement.lang,
      lang: document.documentElement.lang || 'not set',
    };
  });
  pageResult.accessibility = a11y;
  if (a11y.h1Count === 0) pageResult.issues.push('No H1 heading found');
  if (a11y.h1Count > 1) pageResult.issues.push(`Multiple H1 headings (${a11y.h1Count})`);
  if (a11y.imagesWithoutAlt > 0) pageResult.issues.push(`${a11y.imagesWithoutAlt} images missing alt text`);
  if (!a11y.hasLang) pageResult.issues.push('HTML lang attribute not set');

  // Check meta tags
  const meta = await page.evaluate(() => {
    const title = document.title;
    const desc = document.querySelector('meta[name="description"]')?.content || 'not set';
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content || 'not set';
    const ogDesc = document.querySelector('meta[property="og:description"]')?.content || 'not set';
    const ogImage = document.querySelector('meta[property="og:image"]')?.content || 'not set';
    const canonical = document.querySelector('link[rel="canonical"]')?.href || 'not set';
    return { title, description: desc, ogTitle, ogDesc, ogImage, canonical };
  });
  pageResult.meta = meta;

  pageResult.pageTitle = await page.title();

  await page.close();
  results.pages[name] = pageResult;
}

async function testDarkMode(page) {
  const result = { found: false, works: false, method: '' };

  // Look for dark mode toggle button
  const toggleSelectors = [
    '[data-theme="dark"]',
    '.dark-mode-toggle',
    '.theme-toggle',
    'button[aria-label*="dark" i]',
    'button[aria-label*="theme" i]',
    '[class*="dark" i][class*="toggle" i]',
    '[class*="theme" i][class*="switch" i]',
    'button:has(svg[class*="moon"])',
    'button:has(svg[class*="sun"])',
  ];

  // Check if there's a color scheme preference
  const hasDarkClass = await page.evaluate(() => {
    return {
      htmlClass: document.documentElement.className,
      bodyClass: document.body.className,
      hasDarkMediaQuery: window.matchMedia('(prefers-color-scheme: dark)').matches,
    };
  });

  // Try to find and click dark mode toggle
  for (const selector of toggleSelectors) {
    try {
      const el = await page.$(selector);
      if (el) {
        result.found = true;
        result.method = selector;
        await el.click();
        await page.waitForTimeout(500);

        // Check if dark mode activated
        const afterClick = await page.evaluate(() => {
          const html = document.documentElement;
          return {
            class: html.className,
            hasDarkClass: html.classList.contains('dark') || html.classList.contains('dark-mode'),
            dataTheme: html.getAttribute('data-theme'),
          };
        });

        if (afterClick.hasDarkClass || afterClick.dataTheme === 'dark') {
          result.works = true;
        }
        break;
      }
    } catch (e) {
      // continue
    }
  }

  // Also try checking if the site uses Tailwind dark mode or CSS variables
  const darkModeInfo = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    const bgColor = styles.backgroundColor;
    const textColor = styles.color;
    return { bgColor, textColor, htmlClass: document.documentElement.className };
  });
  result.currentTheme = darkModeInfo;

  return result;
}

async function testI18n(page, context) {
  const result = { found: false, languages: [], switcherWorks: false, method: '' };

  // Look for language switcher
  const langSelectors = [
    '[class*="lang" i]',
    '[class*="locale" i]',
    '[class*="i18n" i]',
    'select[name*="lang" i]',
    '[data-lang]',
    '[aria-label*="language" i]',
    '[aria-label*="locale" i]',
  ];

  for (const selector of langSelectors) {
    try {
      const el = await page.$(selector);
      if (el) {
        result.found = true;
        result.method = selector;

        // If it's a select, get options
        const tag = await el.evaluate(e => e.tagName);
        if (tag === 'SELECT') {
          const options = await el.evaluate(e => Array.from(e.options).map(o => ({ value: o.value, text: o.textContent.trim() })));
          result.languages = options;
        }

        // Check for URL-based i18n
        const currentUrl = page.url();
        const hasLangPrefix = /\/[a-z]{2}\//.test(currentUrl);
        result.hasUrlPrefix = hasLangPrefix;

        break;
      }
    } catch (e) {
      // continue
    }
  }

  // Check for hreflang tags
  const hreflangs = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('link[hreflang]'));
    return links.map(l => ({ lang: l.hreflang, href: l.href }));
  });
  result.hreflangTags = hreflangs;

  // Check for i18n in URL patterns
  const currentUrl = page.url();
  result.currentUrl = currentUrl;

  // Try clicking language switcher if found
  if (result.found) {
    try {
      const langEl = await page.$(result.method);
      if (langEl) {
        await langEl.click();
        await page.waitForTimeout(1000);

        // Take screenshot of language menu if opened
        const langMenuPath = `${SCREENSHOT_DIR}/lang-menu-open.png`;
        await page.screenshot({ path: langMenuPath, fullPage: false });
        result.menuScreenshot = langMenuPath;
      }
    } catch (e) {
      result.clickError = e.message.slice(0, 200);
    }
  }

  return result;
}

// Main execution
async function main() {
  console.log('Starting CinaCoin website test...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  for (const pageDef of PAGES) {
    await testPage(browser, pageDef);
  }

  await browser.close();

  // Summary
  console.log('\n\n=== TEST SUMMARY ===');
  let totalIssues = 0;
  for (const [name, data] of Object.entries(results.pages)) {
    const issueCount = data.issues?.length || 0;
    totalIssues += issueCount;
    console.log(`${name}: ${data.links?.length || 0} links, ${data.buttons?.length || 0} buttons, ${issueCount} issues`);
    if (issueCount > 0) {
      data.issues.forEach(i => console.log(`  ⚠️  ${i}`));
    }
  }
  console.log(`\nTotal issues: ${totalIssues}`);

  // Write full results as JSON for report generation
  const fs = await import('fs');
  fs.writeFileSync('/home/cina/.openclaw/workspace/tools/browser-test/test-results-main.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to test-results-main.json');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
