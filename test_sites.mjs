import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // 1. Status Page
  console.log('--- Navigating to status.cinacoin.com ---');
  try {
    await page.goto('https://status.cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.log('Status page networkidle timeout, continuing...');
  }
  await page.waitForTimeout(3000); // let JS render
  await page.screenshot({ path: '/home/cina/.openclaw/workspace/status_page.png', fullPage: true });
  console.log('Status page screenshot saved');

  // Get page content for analysis
  const statusContent = await page.evaluate(() => document.body.innerText);
  console.log('--- Status Page Content ---');
  console.log(statusContent.substring(0, 3000));

  // 2. Docs Site
  console.log('\n--- Navigating to docs.cinacoin.com ---');
  try {
    await page.goto('https://docs.cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.log('Docs page networkidle timeout, continuing...');
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/cina/.openclaw/workspace/docs_page.png', fullPage: true });
  console.log('Docs page screenshot saved');

  const docsContent = await page.evaluate(() => document.body.innerText);
  console.log('--- Docs Page Content ---');
  console.log(docsContent.substring(0, 3000));

  // Check docs navigation elements
  const navLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('nav a, .sidebar a, [class*="nav"] a, [class*="sidebar"] a'));
    return links.slice(0, 20).map(a => ({ text: a.innerText.trim(), href: a.href }));
  });
  console.log('\n--- Docs Navigation Links ---');
  console.log(JSON.stringify(navLinks, null, 2));

  // Check for search functionality
  const searchElements = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('input[type="search"], [class*="search"], [placeholder*="search" i], [placeholder*="搜索"]'));
    return els.map(el => ({ tag: el.tagName, class: el.className, placeholder: el.placeholder || '' }));
  });
  console.log('\n--- Search Elements ---');
  console.log(JSON.stringify(searchElements, null, 2));

  // Check for theme toggle
  const themeElements = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('[class*="theme"], [class*="dark"], [class*="toggle"], button[aria-label*="theme" i], button[aria-label*="dark" i]'));
    return els.map(el => ({ tag: el.tagName, class: el.className, text: el.innerText?.trim() || '', ariaLabel: el.getAttribute('aria-label') || '' }));
  });
  console.log('\n--- Theme Elements ---');
  console.log(JSON.stringify(themeElements, null, 2));

  // Check for code examples
  const codeBlocks = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('pre, code, [class*="code"]'));
    return blocks.slice(0, 10).map(el => ({ tag: el.tagName, class: el.className, text: el.innerText?.substring(0, 100) || '' }));
  });
  console.log('\n--- Code Blocks ---');
  console.log(JSON.stringify(codeBlocks, null, 2));

  // Check status page for service items
  console.log('\n--- Checking Status Page Details ---');
  await page.goto('https://status.cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(5000); // extra wait for JS-heavy status page
  
  const statusItems = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('[class*="service"], [class*="status"], [class*="monitor"], [class*="incident"], [class*="uptime"]'));
    return all.slice(0, 20).map(el => ({ tag: el.tagName, class: el.className, text: el.innerText?.substring(0, 200) || '' }));
  });
  console.log('Status items:', JSON.stringify(statusItems, null, 2));

  // Final full page screenshot after extra wait
  await page.screenshot({ path: '/home/cina/.openclaw/workspace/status_page_final.png', fullPage: true });

  await browser.close();
  console.log('\nDone!');
})();
