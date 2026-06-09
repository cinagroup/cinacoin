const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
  // Test demo.cinacoin.com (redirects to /demo/)
  console.log('=== Testing demo.cinacoin.com ===');
  const page1 = await context.newPage();
  try {
    await page1.goto('https://demo.cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Final URL:', page1.url());
    console.log('Title:', await page1.title());
    await page1.screenshot({ path: '/home/cina/.openclaw/workspace/demo_cinacoin_full.png', fullPage: true });
    await page1.screenshot({ path: '/home/cina/.openclaw/workspace/demo_cinacoin_viewport.png' });
    console.log('Screenshots saved for demo.cinacoin.com');
    
    // Get page content for analysis
    const bodyText = await page1.evaluate(() => document.body.innerText);
    console.log('Page text (first 3000 chars):', bodyText.substring(0, 3000));
    
    // Look for interactive elements
    const buttons = await page1.$$eval('button, a[href], [role="button"]', els => 
      els.slice(0, 30).map(el => ({
        tag: el.tagName,
        text: el.innerText?.trim().substring(0, 80),
        href: el.href || '',
        id: el.id || '',
        className: el.className?.toString().substring(0, 80) || ''
      }))
    );
    console.log('\nInteractive elements:', JSON.stringify(buttons, null, 2));
    
  } catch (e) {
    console.log('Error on demo.cinacoin.com:', e.message);
  }
  
  // Test react.cinacoin.com
  console.log('\n=== Testing react.cinacoin.com ===');
  const page2 = await context.newPage();
  try {
    await page2.goto('https://react.cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Final URL:', page2.url());
    console.log('Title:', await page2.title());
    await page2.screenshot({ path: '/home/cina/.openclaw/workspace/react_cinacoin_full.png', fullPage: true });
    await page2.screenshot({ path: '/home/cina/.openclaw/workspace/react_cinacoin_viewport.png' });
    console.log('Screenshots saved for react.cinacoin.com');
    
    // Get page content for analysis
    const bodyText2 = await page2.evaluate(() => document.body.innerText);
    console.log('Page text (first 3000 chars):', bodyText2.substring(0, 3000));
    
    // Look for interactive elements
    const buttons2 = await page2.$$eval('button, a[href], [role="button"]', els => 
      els.slice(0, 30).map(el => ({
        tag: el.tagName,
        text: el.innerText?.trim().substring(0, 80),
        href: el.href || '',
        id: el.id || '',
        className: el.className?.toString().substring(0, 80) || ''
      }))
    );
    console.log('\nInteractive elements:', JSON.stringify(buttons2, null, 2));
    
  } catch (e) {
    console.log('Error on react.cinacoin.com:', e.message);
  }
  
  await browser.close();
  console.log('\nDone!');
})();
