import { chromium } from 'playwright-core';

const sites = [
  { name: 'demo-react', url: 'https://react.cinacoin.com' },
  { name: 'health-status', url: 'https://status.cinacoin.com' },
  { name: 'analytics-dashboard', url: 'https://cinacoin-analytics.pages.dev' },
];

// Use the existing headless shell
const browser = await chromium.launch({
  headless: true,
  executablePath: '/home/cina/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});

for (const site of sites) {
  console.log(`\n=== Loading: ${site.name} (${site.url}) ===`);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  });
  const page = await context.newPage();
  
  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  
  try {
    await page.goto(site.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Get page text content
    const text = await page.evaluate(() => document.body?.innerText?.slice(0, 4000));
    console.log(`Page text (first 4000 chars):\n${text}\n---END TEXT---`);
    
    // Get design metadata
    const designInfo = await page.evaluate(() => {
      const bodyStyles = window.getComputedStyle(document.body);
      
      // Check for nav
      const nav = document.querySelector('nav');
      const navText = nav ? nav.innerText.slice(0, 500) : 'No nav found';
      const footer = document.querySelector('footer');
      const footerText = footer ? footer.innerText.slice(0, 500) : 'No footer found';
      
      // Check for hero
      const hero = document.querySelector('header, [class*="hero"], [class*="Hero"]');
      const heroText = hero ? hero.innerText.slice(0, 500) : 'No hero found';
      
      // Check for logo
      const logo = document.querySelector('[class*="logo"], [class*="Logo"], img[alt*="logo" i]');
      const logoInfo = logo ? { 
        tag: logo.tagName, 
        src: logo.src || logo.href, 
        alt: logo.alt 
      } : 'No logo found';
      
      // Check for CTA buttons
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], a[class*="button"], a[class*="cta"]'));
      const buttonStyles = buttons.slice(0, 15).map(b => {
        const s = window.getComputedStyle(b);
        return {
          tag: b.tagName,
          text: (b.textContent || '').trim().slice(0, 30),
          borderRadius: s.borderRadius,
          backgroundColor: s.backgroundColor,
          color: s.color,
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          boxShadow: s.boxShadow,
        };
      });
      
      return {
        bodyBg: bodyStyles.backgroundColor,
        bodyFontFamily: bodyStyles.fontFamily,
        nav: navText,
        footer: footerText,
        hero: heroText,
        logo: logoInfo,
        buttons: buttonStyles,
      };
    });
    console.log(`Design info:\n${JSON.stringify(designInfo, null, 2)}`);
    
    if (consoleErrors.length > 0) {
      console.log(`Console errors: ${consoleErrors.slice(0, 10).join('\n')}`);
    }
    
    // Screenshot
    const path = `/home/cina/.openclaw/workspace/screenshots/${site.name}.png`;
    await page.screenshot({ path, fullPage: true });
    console.log(`Screenshot saved: ${path}`);
    
  } catch (err) {
    console.log(`ERROR loading ${site.name}: ${err.message}`);
    const path = `/home/cina/.openclaw/workspace/screenshots/${site.name}.png`;
    try {
      await page.screenshot({ path, fullPage: true });
      console.log(`Error page screenshot saved`);
    } catch (e2) {
      console.log(`Could not screenshot: ${e2.message}`);
    }
  }
  
  await context.close();
}

await browser.close();
console.log('\nDone.');
