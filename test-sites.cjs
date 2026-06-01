// Test sites using pnpm exec
const { chromium } = require('./node_modules/.pnpm/playwright@1.60.0/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const sites = [
  { name: 'Cinacoin Main', url: 'https://cinacoin.com' },
  { name: 'Cinacoin Demo', url: 'https://demo.cinacoin.com' },
  { name: 'Cinacoin Dashboard', url: 'https://dash.cinacoin.com' },
  { name: 'Cinacoin Docs', url: 'https://docs.cinacoin.com' },
  { name: 'Cinacoin Health Status', url: 'https://status.cinacoin.com' },
];

async function run() {
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
      
      const screenshotDir = path.join(process.cwd(), '../screenshots');
      if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
      const screenshotPath = path.join(screenshotDir, `${site.name.toLowerCase().replace(/\s+/g, '-')}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      const content = await page.evaluate(() => ({
        bodyLength: document.body?.innerText?.length || 0,
        hasImages: document.querySelectorAll('img').length,
        hasScripts: document.querySelectorAll('script').length,
        has404: document.body?.innerText?.includes('404') || false,
        hasError: document.body?.innerText?.includes('Error') || false,
        hasLoading: document.body?.innerText?.includes('Loading') || false,
        bodyPreview: document.body?.innerText?.substring(0, 200) || '',
      }));
      
      const issues = [];
      if (content.has404) issues.push('404 detected');
      if (content.hasLoading) issues.push('Still loading');
      if (content.bodyLength < 100) issues.push('Very short content');
      
      results.push({
        name: site.name,
        url: site.url,
        status,
        loadTime: `${loadTime}ms`,
        title,
        screenshot: screenshotPath,
        issues,
        bodyLength: content.bodyLength,
      });
      
      const statusIcon = issues.length > 0 ? '⚠️' : '✅';
      console.log(`  ${statusIcon} Status: ${status}, Load: ${loadTime}ms, Title: "${title}"`);
      if (issues.length > 0) console.log(`   Issues: ${issues.join(', ')}`);
      
    } catch (err) {
      console.log(`  ❌ Failed: ${err.message}`);
      results.push({
        name: site.name,
        url: site.url,
        status: 'ERROR',
        loadTime: 'N/A',
        title: 'N/A',
        issues: [err.message],
        bodyLength: 0,
      });
    }
    
    await page.close();
  }

  await browser.close();

  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(80));
  for (const r of results) {
    const icon = r.status === 'ERROR' ? '❌' : (r.issues.length > 0 ? '⚠️' : '✅');
    console.log(`${icon} ${r.name.padEnd(25)} | ${String(r.status).padEnd(8)} | ${r.loadTime.padStart(8)} | ${r.title?.substring(0, 40) || 'N/A'}`);
    if (r.issues.length > 0) console.log(`   Issues: ${r.issues.join(', ')}`);
  }

  const screenshotDir = path.join(process.cwd(), '../screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  fs.writeFileSync(path.join(screenshotDir, 'test-report.json'), JSON.stringify(results, null, 2));
  console.log('\n📝 Detailed report saved to screenshots/test-report.json');
  
  // Overall assessment
  const working = results.filter(r => r.status !== 'ERROR' && r.issues.length === 0).length;
  const issues = results.filter(r => r.issues.length > 0).length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  console.log(`\n📈 Overall: ${working}/${results.length} sites fully working, ${issues} with warnings, ${errors} errors`);
}

run().catch(e => { console.error(e); process.exit(1); });
