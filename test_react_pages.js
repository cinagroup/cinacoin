const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
  // Test react.cinacoin.com sub-pages
  const pages = [
    { name: 'home', url: 'https://react.cinacoin.com/' },
    { name: 'swap', url: 'https://react.cinacoin.com/swap' },
    { name: 'multichain', url: 'https://react.cinacoin.com/multichain' },
    { name: 'auth', url: 'https://react.cinacoin.com/auth' },
  ];
  
  for (const p of pages) {
    console.log(`\n=== Testing react.cinacoin.com/${p.name} ===`);
    const page = await context.newPage();
    try {
      await page.goto(p.url, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(3000);
      console.log('Final URL:', page.url());
      console.log('Title:', await page.title());
      await page.screenshot({ path: `/home/cina/.openclaw/workspace/react_${p.name}_viewport.png` });
      await page.screenshot({ path: `/home/cina/.openclaw/workspace/react_${p.name}_full.png`, fullPage: true });
      
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('Page text (first 3000 chars):', bodyText.substring(0, 3000));
      
      // Try clicking Connect Wallet
      if (p.name !== 'home') {
        const connectBtn = await page.$('button:has-text("Connect")');
        if (connectBtn) {
          console.log('\nFound Connect button, clicking...');
          await connectBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: `/home/cina/.openclaw/workspace/react_${p.name}_connect.png` });
          const afterText = await page.evaluate(() => document.body.innerText);
          console.log('After connect click:', afterText.substring(0, 2000));
        }
      }
      
    } catch (e) {
      console.log(`Error on ${p.name}:`, e.message);
    }
    await page.close();
  }
  
  // Now test demo.cinacoin.com sub-pages
  const demoPages = [
    { name: 'swap', url: 'https://cinacoin.com/demo/swap' },
    { name: 'multichain', url: 'https://cinacoin.com/demo/multichain' },
    { name: 'auth', url: 'https://cinacoin.com/demo/auth' },
    { name: 'tokens', url: 'https://cinacoin.com/demo/tokens' },
  ];
  
  for (const p of demoPages) {
    console.log(`\n=== Testing demo ${p.name} ===`);
    const page = await context.newPage();
    try {
      await page.goto(p.url, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(3000);
      console.log('Final URL:', page.url());
      console.log('Title:', await page.title());
      await page.screenshot({ path: `/home/cina/.openclaw/workspace/demo_${p.name}_viewport.png` });
      
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('Page text (first 2000 chars):', bodyText.substring(0, 2000));
      
    } catch (e) {
      console.log(`Error on demo ${p.name}:`, e.message);
    }
    await page.close();
  }
  
  await browser.close();
  console.log('\nDone!');
})();
