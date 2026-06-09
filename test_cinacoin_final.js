const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Theme toggle details
  console.log('=== THEME TOGGLE ===');
  await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  let theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  let bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log(`Initial: theme=${theme}, bg=${bgColor}`);
  
  const themeBtn = await page.$('button[aria-label*="dark" i], button[aria-label*="light" i]');
  if (themeBtn) {
    const ariaBefore = await themeBtn.getAttribute('aria-label');
    await themeBtn.click();
    await page.waitForTimeout(800);
    theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const ariaAfter = await themeBtn.getAttribute('aria-label');
    console.log(`After toggle: theme=${theme}, bg=${bgColor}, aria="${ariaAfter}"`);
  }
  
  // 2. Footer content
  console.log('\n=== FOOTER ===');
  await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  const footerText = await page.evaluate(() => document.querySelector('footer')?.innerText?.substring(0, 800));
  console.log(footerText);
  
  // 3. Internal links
  console.log('\n=== INTERNAL LINKS ===');
  const allLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    return links
      .filter(a => a.href.startsWith('https://cinacoin.com') || a.href.startsWith('/'))
      .map(a => ({ text: a.innerText?.trim()?.substring(0, 40), href: a.href }));
  });
  console.log(JSON.stringify(allLinks, null, 2));
  
  // 4. Pricing FAQ
  console.log('\n=== PRICING FAQ ===');
  await page.goto('https://cinacoin.com/pricing', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  const faqCount = await page.evaluate(() => {
    const details = document.querySelectorAll('details');
    return details.length;
  });
  console.log(`FAQ items (details elements): ${faqCount}`);
  
  // Try clicking first FAQ
  const firstDetails = await page.$('details summary');
  if (firstDetails) {
    await firstDetails.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/home/cina/.openclaw/workspace/screenshots/pricing_faq_open.png' });
    console.log('FAQ accordion clicked ✅');
  }
  
  // 5. 404 page
  console.log('\n=== 404 PAGE ===');
  const resp = await page.goto('https://cinacoin.com/nonexistent-page-xyz', { waitUntil: 'networkidle', timeout: 30000 });
  console.log(`Status code: ${resp.status()}`);
  const title404 = await page.title();
  const body404 = await page.evaluate(() => document.body?.innerText?.substring(0, 500));
  console.log(`Title: ${title404}`);
  console.log(`Body: ${body404?.substring(0, 200)}`);
  await page.screenshot({ path: '/home/cina/.openclaw/workspace/screenshots/404.png' });
  
  // 6. Performance
  console.log('\n=== PERFORMANCE ===');
  await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    return {
      domInteractive: Math.round(nav?.domInteractive || 0),
      domComplete: Math.round(nav?.domComplete || 0),
      loadEvent: Math.round(nav?.loadEventEnd || 0),
      firstPaint: Math.round(paint.find(p => p.name === 'first-paint')?.startTime || 0),
      firstContentfulPaint: Math.round(paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0),
      transferSizeKB: Math.round((nav?.transferSize || 0) / 1024),
    };
  });
  console.log(JSON.stringify(metrics, null, 2));
  
  // 7. Mobile menu
  console.log('\n=== MOBILE MENU ===');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  // Check all buttons on mobile
  const mobileButtons = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.map(b => ({
      text: b.innerText?.trim()?.substring(0, 30),
      aria: b.getAttribute('aria-label'),
      cls: b.className?.substring(0, 80),
      visible: b.offsetParent !== null
    }));
  });
  console.log(`Mobile buttons: ${JSON.stringify(mobileButtons, null, 2)}`);
  
  // Check if nav is hidden on mobile
  const navDisplay = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return 'no nav';
    const style = getComputedStyle(nav);
    return { display: style.display, visibility: style.visibility, width: nav.offsetWidth };
  });
  console.log(`Nav on mobile: ${JSON.stringify(navDisplay)}`);
  
  // Try to find hamburger menu
  const hamburger = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const hamburger = btns.find(b => {
      const cls = (b.className || '').toLowerCase();
      const aria = (b.getAttribute('aria-label') || '').toLowerCase();
      return cls.includes('hamburger') || cls.includes('mobile') || cls.includes('menu') ||
             aria.includes('menu') || aria.includes('hamburger') || aria.includes('open');
    });
    return hamburger ? { text: hamburger.innerText, aria: hamburger.getAttribute('aria-label'), visible: hamburger.offsetParent !== null } : null;
  });
  console.log(`Hamburger button: ${JSON.stringify(hamburger)}`);
  
  await page.screenshot({ path: '/home/cina/.openclaw/workspace/screenshots/mobile_375_final.png' });
  
  // 8. Check docs language issue more carefully
  console.log('\n=== DOCS LANGUAGE ISSUE ===');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('https://cinacoin.com/docs/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  const docsHtml = await page.evaluate(() => {
    return {
      lang: document.documentElement.lang,
      title: document.title,
      firstHeading: document.querySelector('h1, h2')?.innerText?.trim()?.substring(0, 60),
      hasChineseContent: document.body?.innerText?.match(/[\u4e00-\u9fff]/) !== null,
      chineseCharCount: (document.body?.innerText?.match(/[\u4e00-\u9fff]/g) || []).length,
      totalTextLength: document.body?.innerText?.length || 0,
    };
  });
  console.log(JSON.stringify(docsHtml, null, 2));
  
  // 9. Check external links (GitHub, Twitter)
  console.log('\n=== EXTERNAL LINKS ===');
  await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  const extLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    return links
      .filter(a => !a.href.startsWith('https://cinacoin.com') && !a.href.startsWith('/') && !a.href.startsWith('#'))
      .map(a => ({ text: a.innerText?.trim()?.substring(0, 40), href: a.href, target: a.target }));
  });
  console.log(JSON.stringify(extLinks, null, 2));
  
  // 10. Accessibility quick check
  console.log('\n=== ACCESSIBILITY ===');
  const a11y = await page.evaluate(() => {
    const issues = [];
    // Check contrast-related: look for light text on light bg
    const allText = Array.from(document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button, li'));
    let lowContrastCount = 0;
    for (const el of allText.slice(0, 50)) {
      const style = getComputedStyle(el);
      const color = style.color;
      const bg = style.backgroundColor;
      if (color === bg && color !== 'rgba(0, 0, 0, 0)') lowContrastCount++;
    }
    
    // Check form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    const unlabelled = Array.from(inputs).filter(i => !i.labels?.length && !i.getAttribute('aria-label'));
    
    // Check focus indicators
    // Check skip links
    const skipLink = document.querySelector('a[href="#main-content"], .skip-link, [class*="skip"]');
    
    return {
      lowContrastElements: lowContrastCount,
      unlabelledInputs: unlabelled.length,
      hasSkipLink: !!skipLink,
      skipLinkText: skipLink?.innerText?.trim(),
      ariaLandmarks: {
        banner: document.querySelectorAll('[role="banner"]').length,
        main: document.querySelectorAll('[role="main"], main').length,
        contentinfo: document.querySelectorAll('[role="contentinfo"], footer').length,
        navigation: document.querySelectorAll('[role="navigation"], nav').length,
      }
    };
  });
  console.log(JSON.stringify(a11y, null, 2));
  
  await browser.close();
  console.log('\n=== ALL TESTS COMPLETE ===');
})();
