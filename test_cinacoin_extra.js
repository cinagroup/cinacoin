const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Check docs page language - it loaded in Chinese by default
  console.log('=== DOCS PAGE LANGUAGE ISSUE ===');
  await page.goto('https://cinacoin.com/docs', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  const docsLang = await page.evaluate(() => document.documentElement.lang);
  const docsBodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500));
  console.log(`Docs lang attr: ${docsLang}`);
  console.log(`Docs body starts with: ${docsBodyText.substring(0, 300)}`);
  
  // 2. Check if homepage language switches properly
  console.log('\n=== HOMEPAGE EN → ZH → EN ===');
  await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  let lang = await page.evaluate(() => document.documentElement.lang);
  console.log(`Initial lang: ${lang}`);
  let h1 = await page.evaluate(() => document.querySelector('h1')?.innerText?.trim());
  console.log(`Initial H1: ${h1}`);
  
  // Click language button to switch
  const langBtn = await page.$('button[aria-label="Select language"]');
  if (langBtn) {
    await langBtn.click();
    await page.waitForTimeout(800);
    
    // Check what options appear
    const menuItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], li, [data-lang], [data-locale]'));
      return items.map(el => ({ text: el.innerText?.trim(), tag: el.tagName, cls: el.className?.substring(0, 50) }));
    });
    console.log(`Language menu items: ${JSON.stringify(menuItems)}`);
    
    // Take screenshot of menu
    await page.screenshot({ path: '/home/cina/.openclaw/workspace/screenshots/lang_dropdown.png' });
    
    // Try clicking Chinese
    const zhItem = await page.$('text=中文');
    if (zhItem) {
      await zhItem.click();
      await page.waitForTimeout(1500);
      lang = await page.evaluate(() => document.documentElement.lang);
      h1 = await page.evaluate(() => document.querySelector('h1')?.innerText?.trim());
      console.log(`After ZH switch - lang: ${lang}, H1: ${h1}`);
      await page.screenshot({ path: '/home/cina/.openclaw/workspace/screenshots/home_zh.png' });
    }
    
    // Switch back to EN
    const langBtn2 = await page.$('button[aria-label="Select language"]');
    if (langBtn2) {
      await langBtn2.click();
      await page.waitForTimeout(800);
      const enItem = await page.$('text=EN');
      if (enItem) {
        await enItem.click();
        await page.waitForTimeout(1500);
        lang = await page.evaluate(() => document.documentElement.lang);
        h1 = await page.evaluate(() => document.querySelector('h1')?.innerText?.trim());
        console.log(`After EN switch back - lang: ${lang}, H1: ${h1}`);
        await page.screenshot({ path: '/home/cina/.openclaw/workspace/screenshots/home_en_restored.png' });
      }
    }
  }
  
  // 3. Check theme toggle more carefully
  console.log('\n=== THEME TOGGLE DETAILS ===');
  await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  let theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  let bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log(`Initial theme: ${theme}, bg: ${bgColor}`);
  
  const themeBtn = await page.$('button[aria-label*="dark" i], button[aria-label*="light" i]');
  if (themeBtn) {
    const ariaBefore = await themeBtn.getAttribute('aria-label');
    console.log(`Theme button aria-label before: ${ariaBefore}`);
    await themeBtn.click();
    await page.waitForTimeout(800);
    
    theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const ariaAfter = await themeBtn.getAttribute('aria-label');
    console.log(`After toggle - theme: ${theme}, bg: ${bgColor}, aria-label: ${ariaAfter}`);
    
    // Toggle back
    await themeBtn.click();
    await page.waitForTimeout(800);
    theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log(`After second toggle - theme: ${theme}`);
  }
  
  // 4. Check footer content
  console.log('\n=== FOOTER CONTENT ===');
  const footerText = await page.evaluate(() => document.querySelector('footer')?.innerText?.substring(0, 1000));
  console.log(`Footer: ${footerText?.substring(0, 500)}`);
  
  // 5. Check for broken internal links
  console.log('\n=== INTERNAL LINKS CHECK ===');
  const allLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    return links
      .filter(a => a.href.startsWith('https://cinacoin.com'))
      .map(a => ({ text: a.innerText?.trim()?.substring(0, 40), href: a.href }));
  });
  console.log(`Internal links: ${JSON.stringify(allLinks, null, 2)}`);
  
  // 6. Check for CTA buttons functionality
  console.log('\n=== CTA BUTTONS ===');
  const ctaButtons = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('a, button'));
    return buttons
      .filter(b => {
        const text = (b.innerText || '').toLowerCase();
        return text.includes('start') || text.includes('get started') || text.includes('github') || text.includes('view');
      })
      .map(b => ({ text: b.innerText?.trim()?.substring(0, 40), href: b.href || 'button', tag: b.tagName }));
  });
  console.log(`CTA buttons: ${JSON.stringify(ctaButtons, null, 2)}`);
  
  // 7. Check pricing page FAQ accordion
  console.log('\n=== PRICING FAQ ACCORDION ===');
  await page.goto('https://cinacoin.com/pricing', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  const faqButtons = await page.$$('button:has-text("What"), button:has-text("Can"), button:has-text("Is")');
  console.log(`FAQ accordion buttons found: ${faqButtons.length}`);
  if (faqButtons.length > 0) {
    const firstFaq = faqButtons[0];
    const text = await firstFaq.innerText();
    console.log(`Clicking first FAQ: "${text}"`);
    await firstFaq.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/home/cina/.openclaw/workspace/screenshots/pricing_faq_open.png' });
    console.log('FAQ accordion works ✅');
  }
  
  // 8. Check 404 page
  console.log('\n=== 404 PAGE ===');
  const resp = await page.goto('https://cinacoin.com/nonexistent-page-xyz', { waitUntil: 'networkidle', timeout: 30000 });
  console.log(`404 status: ${resp.status()}`);
  const notFoundTitle = await page.title();
  console.log(`404 title: ${notFoundTitle}`);
  await page.screenshot({ path: '/home/cina/.openclaw/workspace/screenshots/404.png' });
  
  // 9. Check loading speed more precisely
  console.log('\n=== PERFORMANCE METRICS ===');
  await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
  const metrics = await page.evaluate(() => {
    const perf = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    return {
      domInteractive: perf?.domInteractive,
      domComplete: perf?.domComplete,
      loadEvent: perf?.loadEventEnd,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      transferSize: perf?.transferSize,
    };
  });
  console.log(`Performance: ${JSON.stringify(metrics, null, 2)}`);
  
  // 10. Check mobile menu
  console.log('\n=== MOBILE MENU ===');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  const mobileMenuBtn = await page.$('button[aria-label*="menu" i], button[aria-label*="nav" i], .hamburger, [class*="mobile-menu"]');
  if (mobileMenuBtn) {
    console.log('Mobile menu button found ✅');
    await mobileMenuBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/home/cina/.openclaw/workspace/screenshots/mobile_menu_open.png' });
  } else {
    // Check if nav links are visible on mobile
    const navVisible = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return false;
      const style = getComputedStyle(nav);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    console.log(`Nav visible on mobile without toggle: ${navVisible}`);
    if (!navVisible) {
      console.log('⚠️ No mobile menu button found and nav is hidden!');
    }
  }
  
  await browser.close();
  console.log('\n=== EXTRA TESTS COMPLETE ===');
})();
