const { chromium } = require('playwright');

(async () => {
  const results = {
    screenshots: [],
    navigation: {},
    theme: {},
    language: {},
    responsive: {},
    issues: [],
    suggestions: []
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });
  const page = await context.newPage();

  // Helper
  async function safeScreenshot(page, name, path) {
    try {
      await page.screenshot({ path: `/home/cina/.openclaw/workspace/${path}`, fullPage: true });
      results.screenshots.push({ name, path });
      console.log(`✅ Screenshot: ${name}`);
    } catch (e) {
      console.log(`❌ Screenshot failed: ${name} - ${e.message}`);
    }
  }

  // 1. Homepage
  console.log('\n=== 1. HOMEPAGE ===');
  try {
    await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // let animations settle
    const title = await page.title();
    console.log(`Title: ${title}`);
    const url = page.url();
    console.log(`URL: ${url}`);
    await safeScreenshot(page, 'Homepage (Desktop, Light)', 'screenshots/home_desktop_light.png');
    
    // Get page content summary
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 3000) || 'EMPTY');
    console.log(`Body text preview:\n${bodyText.substring(0, 1500)}`);
    
    // Check for nav links
    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('nav a, header a, [role="navigation"] a'));
      return links.map(a => ({ text: a.innerText?.trim(), href: a.href }));
    });
    console.log(`\nNav links found: ${JSON.stringify(navLinks, null, 2)}`);
    
    // Check for theme toggle
    const themeButtons = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, [role="button"], a'));
      return candidates
        .filter(el => {
          const text = (el.innerText || '').toLowerCase();
          const aria = (el.getAttribute('aria-label') || '').toLowerCase();
          const cls = (el.className || '').toLowerCase();
          return text.includes('theme') || text.includes('dark') || text.includes('light') ||
                 text.includes('🌙') || text.includes('☀️') || text.includes('🌞') ||
                 aria.includes('theme') || aria.includes('dark') || aria.includes('light') ||
                 cls.includes('theme') || cls.includes('dark') || cls.includes('toggle');
        })
        .map(el => ({ tag: el.tagName, text: el.innerText?.trim()?.substring(0, 50), aria: el.getAttribute('aria-label'), cls: el.className?.substring(0, 100) }));
    });
    console.log(`\nTheme toggle candidates: ${JSON.stringify(themeButtons, null, 2)}`);
    
    // Check for language switcher
    const langButtons = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, [role="button"], a, select'));
      return candidates
        .filter(el => {
          const text = (el.innerText || '').toLowerCase();
          const aria = (el.getAttribute('aria-label') || '').toLowerCase();
          return text.match(/^(en|zh|中|英|lang|🌐)/) || text.includes('english') || text.includes('中文') ||
                 aria.includes('language') || aria.includes('lang');
        })
        .map(el => ({ tag: el.tagName, text: el.innerText?.trim()?.substring(0, 50), aria: el.getAttribute('aria-label') }));
    });
    console.log(`\nLanguage switcher candidates: ${JSON.stringify(langButtons, null, 2)}`);
    
    // Check meta tags
    const meta = await page.evaluate(() => {
      const viewport = document.querySelector('meta[name="viewport"]');
      const desc = document.querySelector('meta[name="description"]');
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDesc = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      return {
        viewport: viewport?.content,
        description: desc?.content,
        ogTitle: ogTitle?.content,
        ogDesc: ogDesc?.content,
        ogImage: ogImage?.content,
      };
    });
    console.log(`\nMeta tags: ${JSON.stringify(meta, null, 2)}`);
    
  } catch (e) {
    console.log(`❌ Homepage error: ${e.message}`);
    results.issues.push(`Homepage load error: ${e.message}`);
  }

  // 2. Navigation - Pricing
  console.log('\n=== 2. NAVIGATION: PRICING ===');
  try {
    await page.goto('https://cinacoin.com/pricing', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const title = await page.title();
    console.log(`Title: ${title}`);
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 2000) || 'EMPTY');
    console.log(`Body text:\n${bodyText.substring(0, 1000)}`);
    await safeScreenshot(page, 'Pricing Page', 'screenshots/pricing.png');
    results.navigation.pricing = { status: 'loaded', title };
  } catch (e) {
    console.log(`❌ Pricing error: ${e.message}`);
    results.navigation.pricing = { status: 'error', error: e.message };
    results.issues.push(`Pricing page error: ${e.message}`);
  }

  // 3. Navigation - About
  console.log('\n=== 3. NAVIGATION: ABOUT ===');
  try {
    await page.goto('https://cinacoin.com/about', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const title = await page.title();
    console.log(`Title: ${title}`);
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 2000) || 'EMPTY');
    console.log(`Body text:\n${bodyText.substring(0, 1000)}`);
    await safeScreenshot(page, 'About Page', 'screenshots/about.png');
    results.navigation.about = { status: 'loaded', title };
  } catch (e) {
    console.log(`❌ About error: ${e.message}`);
    results.navigation.about = { status: 'error', error: e.message };
    results.issues.push(`About page error: ${e.message}`);
  }

  // 4. Navigation - Docs
  console.log('\n=== 4. NAVIGATION: DOCS ===');
  try {
    await page.goto('https://cinacoin.com/docs', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const title = await page.title();
    console.log(`Title: ${title}`);
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 3000) || 'EMPTY');
    console.log(`Body text:\n${bodyText.substring(0, 1500)}`);
    await safeScreenshot(page, 'Docs Page', 'screenshots/docs.png');
    results.navigation.docs = { status: 'loaded', title };
  } catch (e) {
    console.log(`❌ Docs error: ${e.message}`);
    results.navigation.docs = { status: 'error', error: e.message };
    results.issues.push(`Docs page error: ${e.message}`);
  }

  // 5. Theme switching test
  console.log('\n=== 5. THEME SWITCHING ===');
  try {
    await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    
    // Try multiple selectors for theme toggle
    const themeSelectors = [
      'button[aria-label*="theme" i]',
      'button[aria-label*="dark" i]',
      'button[aria-label*="light" i]',
      '[class*="theme-toggle"]',
      '[class*="dark-toggle"]',
      '[id*="theme-toggle"]',
      'button:has(svg[class*="sun"])',
      'button:has(svg[class*="moon"])',
    ];
    
    let themeClicked = false;
    for (const sel of themeSelectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          console.log(`Found theme toggle with selector: ${sel}`);
          await el.click();
          await page.waitForTimeout(1000);
          themeClicked = true;
          await safeScreenshot(page, 'After Theme Toggle', 'screenshots/theme_toggled.png');
          break;
        }
      } catch (e) { /* skip */ }
    }
    
    if (!themeClicked) {
      // Try finding by text content
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        const text = await btn.innerText().catch(() => '');
        const aria = await btn.getAttribute('aria-label').catch(() => '');
        if ((text + ' ' + aria).match(/theme|dark|light|🌙|☀️/i)) {
          console.log(`Found theme button by text: "${text}" aria: "${aria}"`);
          await btn.click();
          await page.waitForTimeout(1000);
          themeClicked = true;
          await safeScreenshot(page, 'After Theme Toggle', 'screenshots/theme_toggled.png');
          break;
        }
      }
    }
    
    if (!themeClicked) {
      // Check if it uses system preference via class on html/body
      const htmlClass = await page.evaluate(() => document.documentElement.className);
      const bodyClass = await page.evaluate(() => document.body.className);
      console.log(`HTML class: ${htmlClass}`);
      console.log(`Body class: ${bodyClass}`);
      
      // Check for color-scheme CSS
      const colorScheme = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('color-scheme') || 
               document.documentElement.style.colorScheme;
      });
      console.log(`Color scheme: ${colorScheme}`);
      
      // Try toggling dark class manually
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await page.waitForTimeout(500);
      await safeScreenshot(page, 'Dark Mode (Manual)', 'screenshots/dark_mode_manual.png');
      
      results.theme = { status: 'no_toggle_found', manualDarkApplied: true };
      results.issues.push('No theme toggle button found on homepage');
    } else {
      results.theme = { status: 'toggled' };
    }
    
  } catch (e) {
    console.log(`❌ Theme test error: ${e.message}`);
    results.theme = { status: 'error', error: e.message };
  }

  // 6. Language switching test
  console.log('\n=== 6. LANGUAGE SWITCHING ===');
  try {
    await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    
    // Look for language switcher
    const langSelectors = [
      'button[aria-label*="language" i]',
      'button[aria-label*="lang" i]',
      '[class*="lang-switch"]',
      '[class*="locale"]',
      'select[name*="lang"]',
    ];
    
    let langClicked = false;
    for (const sel of langSelectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          console.log(`Found lang switcher: ${sel}`);
          await el.click();
          await page.waitForTimeout(1000);
          langClicked = true;
          break;
        }
      } catch (e) { /* skip */ }
    }
    
    if (!langClicked) {
      // Search all clickable elements for language indicators
      const allClickable = await page.$$('button, a, [role="button"]');
      for (const el of allClickable) {
        const text = await el.innerText().catch(() => '');
        if (text.match(/^(EN|English|中文|ZH|🌐|Lang)/i)) {
          console.log(`Found lang button: "${text.trim()}"`);
          await el.click();
          await page.waitForTimeout(1000);
          langClicked = true;
          await safeScreenshot(page, 'Language Menu Open', 'screenshots/lang_menu.png');
          break;
        }
      }
    }
    
    if (!langClicked) {
      console.log('No language switcher found');
      results.language = { status: 'not_found' };
      results.issues.push('No language switcher found on homepage');
    } else {
      // Try to find and click Chinese option
      try {
        const zhOption = await page.$('text=中文');
        if (zhOption) {
          await zhOption.click();
          await page.waitForTimeout(1500);
          await safeScreenshot(page, 'Chinese Mode', 'screenshots/chinese.png');
          results.language = { status: 'switched_to_zh' };
        } else {
          results.language = { status: 'menu_opened_no_zh' };
        }
      } catch (e) {
        results.language = { status: 'error', error: e.message };
      }
    }
    
  } catch (e) {
    console.log(`❌ Language test error: ${e.message}`);
    results.language = { status: 'error', error: e.message };
  }

  // 7. Responsive design test
  console.log('\n=== 7. RESPONSIVE DESIGN ===');
  const viewports = [
    { name: 'Mobile (375x667)', width: 375, height: 667 },
    { name: 'Tablet (768x1024)', width: 768, height: 1024 },
    { name: 'Desktop (1440x900)', width: 1440, height: 900 },
  ];
  
  for (const vp of viewports) {
    try {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      const filename = `screenshots/responsive_${vp.width}x${vp.height}.png`;
      await safeScreenshot(page, vp.name, filename);
      
      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      if (hasOverflow) {
        console.log(`⚠️  Horizontal overflow detected at ${vp.width}px`);
        results.issues.push(`Horizontal overflow at viewport ${vp.width}px`);
      }
      
      results.responsive[vp.name] = { status: 'ok', overflow: hasOverflow };
    } catch (e) {
      console.log(`❌ Responsive test error at ${vp.width}px: ${e.message}`);
      results.responsive[vp.name] = { status: 'error', error: e.message };
    }
  }

  // 8. Check for common issues
  console.log('\n=== 8. COMMON ISSUES CHECK ===');
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Check console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log(`Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log(consoleErrors.slice(0, 10).join('\n'));
      results.issues.push(`Browser console errors: ${consoleErrors.length} (${consoleErrors.slice(0, 3).join('; ')})`);
    }
    
    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
    });
    if (brokenImages.length > 0) {
      console.log(`Broken images: ${brokenImages.join(', ')}`);
      results.issues.push(`Broken images: ${brokenImages.length}`);
    }
    
    // Check for missing alt text
    const missingAlt = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => !img.alt || img.alt.trim() === '').length;
    });
    console.log(`Images missing alt text: ${missingAlt}`);
    if (missingAlt > 0) {
      results.issues.push(`${missingAlt} images missing alt text (accessibility)`);
    }
    
    // Check for heading hierarchy
    const headings = await page.evaluate(() => {
      const hs = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return hs.map(h => ({ tag: h.tagName, text: h.innerText?.trim()?.substring(0, 60) }));
    });
    console.log(`Headings: ${JSON.stringify(headings, null, 2)}`);
    
    // Check for multiple h1
    const h1Count = headings.filter(h => h.tag === 'H1').length;
    if (h1Count > 1) {
      results.issues.push(`Multiple H1 tags found (${h1Count})`);
    }
    if (h1Count === 0) {
      results.issues.push('No H1 tag found on homepage');
    }
    
    // Check links for broken hrefs
    const links = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a[href]'));
      return allLinks
        .filter(a => !a.href || a.href === '#' || a.href.endsWith('undefined'))
        .map(a => ({ text: a.innerText?.trim()?.substring(0, 40), href: a.href }));
    });
    if (links.length > 0) {
      console.log(`Suspicious links: ${JSON.stringify(links)}`);
      results.issues.push(`${links.length} suspicious links found (empty href, #, or undefined)`);
    }
    
    // Check page load performance
    const perf = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
      };
    });
    console.log(`Performance: DOMContentLoaded=${perf.domContentLoaded}ms, Load=${perf.loadComplete}ms`);
    
    // Check for favicon
    const favicon = await page.evaluate(() => {
      const link = document.querySelector('link[rel*="icon"]');
      return link?.href;
    });
    console.log(`Favicon: ${favicon || 'NOT FOUND'}`);
    if (!favicon) {
      results.issues.push('No favicon found');
    }
    
    // Check for SSL/security headers
    const securityInfo = await page.evaluate(() => {
      return {
        protocol: window.location.protocol,
        isSecure: window.location.protocol === 'https:',
      };
    });
    console.log(`Security: ${JSON.stringify(securityInfo)}`);
    
  } catch (e) {
    console.log(`❌ Issues check error: ${e.message}`);
  }

  // 9. Check all pages' full HTML structure
  console.log('\n=== 9. HTML STRUCTURE ANALYSIS ===');
  try {
    await page.goto('https://cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const htmlAnalysis = await page.evaluate(() => {
      const html = document.documentElement;
      return {
        lang: html.getAttribute('lang'),
        dir: html.getAttribute('dir'),
        hasDoctype: document.doctype !== null,
        charset: document.characterSet,
        totalElements: document.querySelectorAll('*').length,
        totalScripts: document.querySelectorAll('script').length,
        totalStylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
        totalInlineStyles: document.querySelectorAll('[style]').length,
        footerExists: document.querySelector('footer') !== null,
        headerExists: document.querySelector('header') !== null,
        mainExists: document.querySelector('main') !== null || document.querySelector('[role="main"]') !== null,
        navExists: document.querySelector('nav') !== null || document.querySelector('[role="navigation"]') !== null,
      };
    });
    console.log(`HTML Analysis: ${JSON.stringify(htmlAnalysis, null, 2)}`);
    
    if (!htmlAnalysis.lang) {
      results.issues.push('Missing lang attribute on <html>');
    }
    if (!htmlAnalysis.mainExists) {
      results.issues.push('Missing <main> element');
    }
    
  } catch (e) {
    console.log(`❌ HTML analysis error: ${e.message}`);
  }

  // 10. Get full page HTML for deeper analysis
  console.log('\n=== 10. FULL PAGE SOURCE (first 5000 chars) ===');
  try {
    const html = await page.content();
    console.log(html.substring(0, 5000));
  } catch (e) {
    console.log(`❌ Could not get page content: ${e.message}`);
  }

  await browser.close();
  
  // Summary
  console.log('\n\n========================================');
  console.log('=== TEST SUMMARY ===');
  console.log('========================================');
  console.log(`Screenshots taken: ${results.screenshots.length}`);
  console.log(`Issues found: ${results.issues.length}`);
  results.issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
  console.log(`\nNavigation: ${JSON.stringify(results.navigation)}`);
  console.log(`Theme: ${JSON.stringify(results.theme)}`);
  console.log(`Language: ${JSON.stringify(results.language)}`);
  console.log(`Responsive: ${JSON.stringify(results.responsive)}`);
})();
