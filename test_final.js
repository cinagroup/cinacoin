const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
  // Test remaining demo pages
  const demoPages = [
    { name: 'home', url: 'https://cinacoin.com/demo/' },
    { name: 'batch', url: 'https://cinacoin.com/demo/batch' },
    { name: 'aa', url: 'https://cinacoin.com/demo/aa' },
    { name: 'onramp', url: 'https://cinacoin.com/demo/onramp' },
    { name: 'activity', url: 'https://cinacoin.com/demo/activity' },
    { name: 'profile', url: 'https://cinacoin.com/demo/profile' },
    { name: 'settings', url: 'https://cinacoin.com/demo/settings' },
  ];
  
  for (const p of demoPages) {
    console.log(`\n=== demo ${p.name} ===`);
    const page = await context.newPage();
    try {
      await page.goto(p.url, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(2000);
      console.log('URL:', page.url());
      console.log('Title:', await page.title());
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('Text (first 1500):', bodyText.substring(0, 1500));
    } catch (e) {
      console.log('Error:', e.message.substring(0, 200));
    }
    await page.close();
  }
  
  // Check performance / load times
  console.log('\n=== Performance check ===');
  const perfPage = await context.newPage();
  const start = Date.now();
  await perfPage.goto('https://react.cinacoin.com/', { waitUntil: 'load', timeout: 30000 });
  const loadTime = Date.now() - start;
  console.log(`react.cinacoin.com load time: ${loadTime}ms`);
  
  const start2 = Date.now();
  await perfPage.goto('https://cinacoin.com/demo/', { waitUntil: 'load', timeout: 30000 });
  const loadTime2 = Date.now() - start2;
  console.log(`cinacoin.com/demo/ load time: ${loadTime}ms`);
  
  // Check for broken links
  console.log('\n=== Checking links ===');
  await perfPage.goto('https://react.cinacoin.com/', { waitUntil: 'load', timeout: 30000 });
  await perfPage.waitForTimeout(2000);
  const links = await perfPage.$$eval('a[href]', els => els.map(el => el.href));
  console.log('Links on react home:', links.length);
  
  // Check external links
  const externalLinks = links.filter(l => !l.includes('react.cinacoin.com') && !l.startsWith('#'));
  console.log('External links:', externalLinks);
  
  await perfPage.close();
  await browser.close();
  console.log('\nDone!');
})();
