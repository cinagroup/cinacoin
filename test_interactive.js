const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
  // Test demo.cinacoin.com swap page interactions
  console.log('=== Testing demo swap page interactions ===');
  const swapPage = await context.newPage();
  try {
    await swapPage.goto('https://cinacoin.com/demo/swap', { waitUntil: 'load', timeout: 30000 });
    await swapPage.waitForTimeout(3000);
    
    // Check chain selector
    const chainButtons = await swapPage.$$('[class*="chain"], [class*="network"], button:has-text("Ethereum"), button:has-text("Polygon")');
    console.log('Chain buttons found:', chainButtons.length);
    
    // Check token selectors
    const tokenSelectors = await swapPage.$$('[class*="token"], select, [class*="dropdown"]');
    console.log('Token selectors found:', tokenSelectors.length);
    
    // Check amount input
    const amountInputs = await swapPage.$$('input[type="number"], input[type="text"], input[placeholder*="0"]');
    console.log('Amount inputs found:', amountInputs.length);
    
    // Try entering an amount
    if (amountInputs.length > 0) {
      await amountInputs[0].fill('1.0');
      await swapPage.waitForTimeout(1000);
      console.log('Entered amount: 1.0');
      await swapPage.screenshot({ path: '/home/cina/.openclaw/workspace/demo_swap_with_amount.png' });
    }
    
    // Check slippage buttons
    const slippageButtons = await swapPage.$$('button:has-text("0.1%"), button:has-text("0.5%"), button:has-text("1%")');
    console.log('Slippage buttons found:', slippageButtons.length);
    
    // Get full page HTML structure for analysis
    const html = await swapPage.content();
    console.log('Page HTML length:', html.length);
    
    // Check for console errors
    const errors = [];
    swapPage.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await swapPage.waitForTimeout(1000);
    console.log('Console errors:', errors.length);
    
  } catch (e) {
    console.log('Error:', e.message);
  }
  await swapPage.close();
  
  // Test react swap page interactions
  console.log('\n=== Testing react swap page interactions ===');
  const reactSwap = await context.newPage();
  try {
    await reactSwap.goto('https://react.cinacoin.com/swap', { waitUntil: 'load', timeout: 30000 });
    await reactSwap.waitForTimeout(3000);
    
    // Check for amount input
    const inputs = await reactSwap.$$('input');
    console.log('Inputs found:', inputs.length);
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder');
      const type = await inputs[i].getAttribute('type');
      console.log(`  Input ${i}: type=${type}, placeholder=${placeholder}`);
    }
    
    // Try entering amount
    if (inputs.length > 0) {
      await inputs[0].fill('1.5');
      await reactSwap.waitForTimeout(1000);
      await reactSwap.screenshot({ path: '/home/cina/.openclaw/workspace/react_swap_with_amount.png' });
      console.log('Entered 1.5 in first input');
    }
    
    // Check swap direction button
    const swapBtn = await reactSwap.$('button:has-text("⇅"), [aria-label*="swap"], [class*="swap-direction"]');
    console.log('Swap direction button found:', !!swapBtn);
    
    // Check token dropdowns
    const tokenBtns = await reactSwap.$$('button:has-text("ETH"), button:has-text("USDC"), [class*="token-select"]');
    console.log('Token buttons found:', tokenBtns.length);
    
  } catch (e) {
    console.log('Error:', e.message);
  }
  await reactSwap.close();
  
  // Test mobile responsiveness
  console.log('\n=== Testing mobile responsiveness ===');
  const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } }); // iPhone X
  const mobilePage = await mobileCtx.newPage();
  try {
    await mobilePage.goto('https://react.cinacoin.com/', { waitUntil: 'load', timeout: 30000 });
    await mobilePage.waitForTimeout(2000);
    await mobilePage.screenshot({ path: '/home/cina/.openclaw/workspace/react_mobile_home.png' });
    console.log('Mobile home screenshot saved');
    
    await mobilePage.goto('https://react.cinacoin.com/swap', { waitUntil: 'load', timeout: 30000 });
    await mobilePage.waitForTimeout(2000);
    await mobilePage.screenshot({ path: '/home/cina/.openclaw/workspace/react_mobile_swap.png' });
    console.log('Mobile swap screenshot saved');
    
  } catch (e) {
    console.log('Error:', e.message);
  }
  await mobilePage.close();
  
  // Check accessibility basics
  console.log('\n=== Checking accessibility ===');
  const a11yPage = await context.newPage();
  try {
    await a11yPage.goto('https://react.cinacoin.com/', { waitUntil: 'load', timeout: 30000 });
    await a11yPage.waitForTimeout(2000);
    
    // Check for alt text on images
    const imagesWithoutAlt = await a11yPage.$$eval('img:not([alt])', els => els.length);
    console.log('Images without alt text:', imagesWithoutAlt);
    
    // Check for aria labels on buttons
    const buttonsWithoutLabel = await a11yPage.$$eval('button:not([aria-label]):not([aria-labelledby])', els => els.length);
    console.log('Buttons without aria labels:', buttonsWithoutLabel);
    
    // Check heading hierarchy
    const headings = await a11yPage.$$eval('h1, h2, h3, h4, h5, h6', els => 
      els.map(el => ({ tag: el.tagName, text: el.innerText.trim().substring(0, 50) }))
    );
    console.log('Headings:', JSON.stringify(headings, null, 2));
    
  } catch (e) {
    console.log('Error:', e.message);
  }
  await a11yPage.close();
  
  await browser.close();
  console.log('\nDone!');
})();
