import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // 1. Test Docs Navigation - Go to Guide
  console.log('--- Testing Guide page ---');
  await page.goto('https://cinacoin.com/docs/guide/quick-start', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/cina/.openclaw/workspace/docs_guide.png', fullPage: true });
  const guideContent = await page.evaluate(() => document.body.innerText);
  console.log('Guide content (first 2000 chars):');
  console.log(guideContent.substring(0, 2000));

  // Check for code examples on guide page
  const guideCode = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('pre, code, [class*="code"]'));
    return blocks.slice(0, 10).map(el => ({ tag: el.tagName, class: el.className, text: el.innerText?.substring(0, 200) || '' }));
  });
  console.log('\nGuide code blocks:', JSON.stringify(guideCode, null, 2));

  // Check sidebar navigation
  const sidebar = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.VPSidebar a, .sidebar a, nav.aside a, [class*="sidebar"] a'));
    return els.slice(0, 30).map(a => ({ text: a.innerText.trim(), href: a.href, isActive: a.classList.toString() }));
  });
  console.log('\nSidebar links:', JSON.stringify(sidebar, null, 2));

  // 2. Test API page
  console.log('\n--- Testing API page ---');
  await page.goto('https://cinacoin.com/docs/api/core-sdk', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/cina/.openclaw/workspace/docs_api.png', fullPage: true });
  const apiContent = await page.evaluate(() => document.body.innerText);
  console.log('API content (first 2000 chars):');
  console.log(apiContent.substring(0, 2000));

  // 3. Test search functionality
  console.log('\n--- Testing Search ---');
  await page.goto('https://cinacoin.com/docs/', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  // Try clicking search
  const searchBtn = await page.$('.VPNavBarSearch button, [class*="search"] button, .DocSearch-Button');
  if (searchBtn) {
    await searchBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/home/cina/.openclaw/workspace/docs_search.png' });
    console.log('Search opened');
    
    // Try typing
    const searchInput = await page.$('input[type="search"], .DocSearch-Input, [class*="search"] input');
    if (searchInput) {
      await searchInput.fill('wallet');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/home/cina/.openclaw/workspace/docs_search_results.png' });
      const searchResults = await page.evaluate(() => document.body.innerText.substring(0, 1000));
      console.log('Search results:', searchResults);
    } else {
      console.log('No search input found after clicking');
    }
  } else {
    console.log('No search button found');
    // Try keyboard shortcut
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/home/cina/.openclaw/workspace/docs_search_k.png' });
    console.log('Tried Ctrl+K');
  }

  // 4. Test theme toggle
  console.log('\n--- Testing Theme Toggle ---');
  // Look more broadly for theme toggle
  const allButtons = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    return btns.map(b => ({
      tag: b.tagName,
      class: b.className,
      ariaLabel: b.getAttribute('aria-label'),
      title: b.title,
      text: b.innerText?.trim()?.substring(0, 50),
      svg: b.querySelector('svg') ? 'has-svg' : 'no-svg'
    }));
  });
  console.log('All buttons:', JSON.stringify(allButtons, null, 2));

  // Try to find dark mode toggle in VitePress
  const themeToggle = await page.$('.VPSwitchAppearance, [class*="appearance"], [class*="dark-toggle"]');
  if (themeToggle) {
    await themeToggle.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/home/cina/.openclaw/workspace/docs_dark.png' });
    console.log('Theme toggled!');
  } else {
    console.log('No theme toggle found via class. Trying SVG icon buttons...');
    const iconBtns = await page.$$('button:has(svg)');
    for (const btn of iconBtns) {
      const label = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      console.log(`Icon button: aria-label="${label}", title="${title}"`);
    }
  }

  // 5. Test Examples page
  console.log('\n--- Testing Examples page ---');
  await page.goto('https://cinacoin.com/docs/api/react', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/cina/.openclaw/workspace/docs_examples.png', fullPage: true });
  const examplesContent = await page.evaluate(() => document.body.innerText);
  console.log('Examples content (first 2000 chars):');
  console.log(examplesContent.substring(0, 2000));

  await browser.close();
  console.log('\nDone!');
})();
