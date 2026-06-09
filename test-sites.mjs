import { chromium } from 'playwright';

const sites = [
  { name: 'Cinacoin Main', url: 'https://cinacoin.com' },
  { name: 'Cinacoin Demo', url: 'https://demo.cinacoin.com' },
  { name: 'Cinacoin Dashboard', url: 'https://dash.cinacoin.com' },
  { name: 'Cinacoin Docs', url: 'https://docs.cinacoin.com' },
  { name: 'Cinacoin Health Status', url: 'https://status.cinacoin.com' },
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const site of sites) {
  console.log(`\n🔍 Testing: ${site.name} (${site.url})`);
  const page = await browser.newPage();
  
  try {
    const start = Date.now();
    const response = await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const loadTime = Date.now() - start;
    const status = response?.status() ?? 'N/A';
    const title = await page.title();
    
    // Check for errors
    const hasErrors = await page.evaluate(() => {
      const errors = [];
      // Check console errors
      window.addEventListener('error', (e) => errors.push(e.message));
      return errors;
    });
    
    // Take screenshot
    const screenshotPath = `screenshots/${site.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Check for key elements
    const content = await page.evaluate(() => {
      return {
        bodyLength: document.body?.innerText?.length || 0,
        hasImages: document.querySelectorAll('img').length > 0,
        hasScripts: document.querySelectorAll('script').length,
        has404: document.body?.innerText?.includes('404') || false,
        hasError: document.body?.innerText?.includes('Error') || false,
        hasLoading: document.body?.innerText?.includes('Loading') || false,
      };
    });
    
    results.push({
      name: site.name,
      url: site.url,
      status,
      loadTime: `${loadTime}ms`,
      title,
      screenshot: screenshotPath,
      ...content,
      issues: []
    });
    
    // Identify issues
    if (content.has404) results[results.length-1].issues.push('404 detected');
    if (content.hasLoading) results[results.length-1].issues.push('Still loading');
    if (content.bodyLength < 100) results[results.length-1].issues.push('Very short content');
    
    console.log(`  ✅ Status: ${status}, Load: ${loadTime}ms, Title: "${title}"`);
    
  } catch (err) {
    console.log(`  ❌ Failed: ${err.message}`);
    results.push({
      name: site.name,
      url: site.url,
      status: 'ERROR',
      loadTime: 'N/A',
      title: 'N/A',
      issues: [err.message]
    });
  }
  
  await page.close();
}

await browser.close();

console.log('\n📊 Test Results Summary:');
console.log('='.repeat(80));
for (const r of results) {
  const statusIcon = r.status === 'ERROR' ? '❌' : (r.issues.length > 0 ? '⚠️' : '✅');
  console.log(`${statusIcon} ${r.name.padEnd(25)} | ${String(r.status).padEnd(8)} | ${r.loadTime.padStart(8)} | ${r.title?.substring(0, 40) || 'N/A'}`);
  if (r.issues.length > 0) {
    console.log(`   Issues: ${r.issues.join(', ')}`);
  }
}

// Save detailed report
import { writeFileSync } from 'fs';
writeFileSync('screenshots/test-report.json', JSON.stringify(results, null, 2));
console.log('\n📝 Detailed report saved to screenshots/test-report.json');
