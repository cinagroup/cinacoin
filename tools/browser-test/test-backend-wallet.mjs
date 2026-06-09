import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/cina/.openclaw/workspace/tools/browser-test/screenshots/test-backend-wallet';
const RESULTS = [];

const PAGES = [
  // Backend Dashboard
  { name: 'Backend - Login', url: 'https://backend.cinacoin.com/login', category: 'Backend Dashboard' },
  { name: 'Backend - Dashboard', url: 'https://backend.cinacoin.com/', category: 'Backend Dashboard' },
  { name: 'Backend - Analytics', url: 'https://backend.cinacoin.com/analytics', category: 'Backend Dashboard' },
  { name: 'Backend - Chains', url: 'https://backend.cinacoin.com/chains', category: 'Backend Dashboard' },
  { name: 'Backend - Keys Server', url: 'https://backend.cinacoin.com/keys-server', category: 'Backend Dashboard' },
  // Wallet Explorer
  { name: 'Wallet - Home', url: 'https://wallet.cinacoin.com/', category: 'Wallet Explorer' },
  { name: 'Wallet - Send', url: 'https://wallet.cinacoin.com/send', category: 'Wallet Explorer' },
  { name: 'Wallet - Receive', url: 'https://wallet.cinacoin.com/receive', category: 'Wallet Explorer' },
  { name: 'Wallet - Swap', url: 'https://wallet.cinacoin.com/swap', category: 'Wallet Explorer' },
  { name: 'Wallet - History', url: 'https://wallet.cinacoin.com/history', category: 'Wallet Explorer' },
];

async function testPage(browser, pageConfig) {
  const { name, url, category } = pageConfig;
  const slug = name.toLowerCase().replace(/[\s\/]+/g, '-').replace(/[^a-z0-9-]/g, '');
  const screenshotPath = path.join(SCREENSHOT_DIR, `${slug}.png`);
  
  const result = {
    name,
    url,
    category,
    screenshot: screenshotPath,
    status: 'unknown',
    httpStatus: null,
    rendered: false,
    cssLoaded: false,
    links: [],
    errors: [],
    warnings: [],
    title: '',
    bodyText: '',
    navItems: [],
  };

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Collect console errors
  const consoleErrors = [];
  const consoleWarnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });

  // Collect page errors
  page.on('pageerror', err => consoleErrors.push(err.message));

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    result.httpStatus = response?.status() || null;
    
    // Wait a bit for any dynamic content
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Check if page rendered (has body content)
    const bodyContent = await page.evaluate(() => {
      return document.body ? document.body.innerText.substring(0, 500) : '';
    });
    result.bodyText = bodyContent.trim();
    result.rendered = bodyContent.trim().length > 0;
    
    // Check title
    result.title = await page.title();
    
    // Check CSS - look for computed styles
    result.cssLoaded = await page.evaluate(() => {
      const styles = document.querySelectorAll('link[rel="stylesheet"], style');
      const body = document.body;
      if (!body) return false;
      const computedStyle = window.getComputedStyle(body);
      // If body has some styling or there are stylesheets
      return styles.length > 0 || computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
    });
    
    // Check links/navigation
    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a[href]');
      return Array.from(anchors).slice(0, 20).map(a => ({
        href: a.href,
        text: a.innerText.trim().substring(0, 50),
      }));
    });
    result.links = links;
    
    // Check nav items
    const navItems = await page.evaluate(() => {
      const navs = document.querySelectorAll('nav a, [role="navigation"] a, header a, .sidebar a, .nav a');
      return Array.from(navs).slice(0, 15).map(a => ({
        href: a.href,
        text: a.innerText.trim().substring(0, 50),
      }));
    });
    result.navItems = navItems;
    
    // Check for common UI elements
    const uiElements = await page.evaluate(() => {
      return {
        hasHeader: !!document.querySelector('header, [role="banner"], .header, nav'),
        hasMain: !!document.querySelector('main, [role="main"], .main, .content'),
        hasFooter: !!document.querySelector('footer, [role="contentinfo"], .footer'),
        hasSidebar: !!document.querySelector('.sidebar, [role="complementary"], aside'),
        hasForm: !!document.querySelector('form'),
        hasButton: !!document.querySelector('button, [role="button"], .btn'),
        hasInput: !!document.querySelector('input, textarea, select'),
        hasImages: document.querySelectorAll('img').length,
        bodyChildCount: document.body ? document.body.children.length : 0,
      };
    });
    result.uiElements = uiElements;
    
    result.errors = consoleErrors;
    result.warnings = consoleWarnings;
    result.status = 'success';
    
  } catch (err) {
    result.status = 'error';
    result.errors.push(err.message);
    // Try to take screenshot even on error
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    } catch {}
  } finally {
    await page.close();
  }
  
  return result;
}

async function main() {
  console.log('Starting CinaCoin Frontend Tests...\n');
  
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  for (const pageConfig of PAGES) {
    console.log(`Testing: ${pageConfig.name} (${pageConfig.url})`);
    const result = await testPage(browser, pageConfig);
    RESULTS.push(result);
    console.log(`  Status: ${result.status} | HTTP: ${result.httpStatus} | Rendered: ${result.rendered} | CSS: ${result.cssLoaded}`);
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length}`);
    }
  }
  
  await browser.close();
  
  // Write results as JSON for report generation
  const jsonPath = path.join(SCREENSHOT_DIR, 'test-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(RESULTS, null, 2));
  console.log(`\nResults saved to ${jsonPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
