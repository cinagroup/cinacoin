const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
  // Test demo.cinacoin.com with 'load' instead of 'networkidle'
  console.log('=== Testing demo.cinacoin.com ===');
  const page1 = await context.newPage();
  try {
    await page1.goto('https://demo.cinacoin.com', { waitUntil: 'load', timeout: 30000 });
    // Wait a bit for JS to render
    await page1.waitForTimeout(5000);
    console.log('Final URL:', page1.url());
    console.log('Title:', await page1.title());
    await page1.screenshot({ path: '/home/cina/.openclaw/workspace/demo_cinacoin_full.png', fullPage: true });
    await page1.screenshot({ path: '/home/cina/.openclaw/workspace/demo_cinacoin_viewport.png' });
    console.log('Screenshots saved for demo.cinacoin.com');
    
    // Get page content for analysis
    const bodyText = await page1.evaluate(() => document.body.innerText);
    console.log('Page text (first 5000 chars):', bodyText.substring(0, 5000));
    
    // Look for interactive elements
    const buttons = await page1.$$eval('button, a[href], [role="button"], input, select', els => 
      els.slice(0, 50).map(el => ({
        tag: el.tagName,
        text: (el.innerText || el.value || '').trim().substring(0, 80),
        href: el.href || '',
        id: el.id || '',
        type: el.type || '',
        className: (el.className?.toString() || '').substring(0, 80)
      }))
    );
    console.log('\nInteractive elements:', JSON.stringify(buttons, null, 2));
    
    // Try clicking "Connect Wallet" if it exists
    const connectBtn = await page1.$('button:has-text("Connect"), button:has-text("connect")');
    if (connectBtn) {
      console.log('\nFound Connect button, clicking...');
      try {
        await connectBtn.click();
        await page1.waitForTimeout(2000);
        await page1.screenshot({ path: '/home/cina/.openclaw/workspace/demo_connect_clicked.png' });
        const modalText = await page1.evaluate(() => document.body.innerText);
        console.log('After click (first 2000 chars):', modalText.substring(0, 2000));
      } catch(e) {
        console.log('Click error:', e.message);
      }
    }
    
  } catch (e) {
    console.log('Error on demo.cinacoin.com:', e.message);
    await page1.screenshot({ path: '/home/cina/.openclaw/workspace/demo_cinacoin_error.png' }).catch(()=>{});
  }
  
  await browser.close();
  console.log('\nDone!');
})();
