import { chromium } from 'playwright';

const SCREENSHOT_DIR = '/home/cina/.openclaw/workspace/tools/browser-test/screenshots/test-docs';
const PAGES = [
  { name: 'Docs Home', url: 'https://cinacoin.com/docs/' },
  { name: 'Quick Start', url: 'https://cinacoin.com/docs/guide/quick-start' },
  { name: 'Installation', url: 'https://cinacoin.com/docs/guide/installation' },
  { name: 'API Core SDK', url: 'https://cinacoin.com/docs/api/core-sdk' },
];

async function testDocs() {
  console.log('🔍 Starting docs page tests...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const results = {
    timestamp: new Date().toISOString(),
    pages: {},
    issues: [],
  };

  for (const pageDef of PAGES) {
    const { name, url } = pageDef;
    console.log(`\n=== Testing ${name} (${url}) ===`);
    
    const page = await context.newPage();
    const pageResult = { url, status: null, title: null, screenshots: [], issues: [] };

    try {
      // Navigate and wait for network idle
      const response = await page.goto(url, { 
        waitUntil: 'networkidle', 
        timeout: 30000 
      });
      
      pageResult.status = response.status();
      pageResult.title = await page.title();
      
      console.log(`  Status: ${pageResult.status}`);
      console.log(`  Title: ${pageResult.title}`);

      // Take screenshot
      const screenshotPath = `${SCREENSHOT_DIR}/${name.toLowerCase().replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      pageResult.screenshots.push(screenshotPath);
      console.log(`  Screenshot: ${screenshotPath}`);

      // Check for error messages
      const errorTexts = ['error', '404', 'not found', 'failed to load'];
      const pageContent = await page.content();
      
      for (const errorText of errorTexts) {
        if (pageContent.toLowerCase().includes(errorText)) {
          pageResult.issues.push(`Found "${errorText}" in page content`);
          console.log(`  ⚠️  Issue: Found "${errorText}"`);
        }
      }

      // Check if page has main content
      const hasContent = await page.locator('main, article, .markdown, .docItemContainer').count() > 0;
      if (!hasContent) {
        pageResult.issues.push('No main content found');
        console.log(`  ⚠️  Issue: No main content found`);
      } else {
        console.log(`  ✓ Main content found`);
      }

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      pageResult.issues.push(`Load error: ${error.message}`);
      
      // Try to take screenshot even on error
      try {
        const screenshotPath = `${SCREENSHOT_DIR}/${name.toLowerCase().replace(/\s+/g, '-')}-error.png`;
        await page.screenshot({ path: screenshotPath });
        pageResult.screenshots.push(screenshotPath);
        console.log(`  Error screenshot: ${screenshotPath}`);
      } catch (screenshotError) {
        console.log(`  Could not take error screenshot`);
      }
    } finally {
      await page.close();
    }

    results.pages[name] = pageResult;
    if (pageResult.issues.length > 0) {
      results.issues.push(...pageResult.issues.map(i => `${name}: ${i}`));
    }
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`Total pages: ${PAGES.length}`);
  console.log(`Pages with issues: ${Object.values(results.pages).filter(p => p.issues.length > 0).length}`);
  
  if (results.issues.length > 0) {
    console.log('\n⚠️  Issues found:');
    results.issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('\n✅ All pages loaded successfully!');
  }

  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);
  
  return results;
}

testDocs().catch(console.error);
