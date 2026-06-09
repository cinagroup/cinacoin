import { chromium } from 'playwright';

const pages = [
  { url: 'https://cinacoin.com/login', name: 'website-login' },
  { url: 'https://cinacoin.com/register', name: 'website-register' },
  { url: 'https://6bd6ea29.cinacoin-cloud-dashboard.pages.dev/login', name: 'cloud-login-fixed' },
  { url: 'https://6bd6ea29.cinacoin-cloud-dashboard.pages.dev/register', name: 'cloud-register-fixed' },
];

const browser = await chromium.launch({ 
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const dir = '/home/cina/.openclaw/workspace/tools/browser-test/screenshots';

for (const p of pages) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: `${dir}/${p.name}.png`, fullPage: false });
    console.log(`✅ ${p.name} → ${p.url}`);
  } catch (err) {
    console.log(`❌ ${p.name} → ${err.message.slice(0, 80)}`);
  }
  await page.close();
}

await browser.close();
console.log('\nDone! Screenshots saved to:', dir);
