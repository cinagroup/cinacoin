import { chromium } from 'playwright';

const pages = [
  // Website
  { url: 'https://cinacoin.com', name: 'website-home' },
  { url: 'https://cinacoin.com/about', name: 'website-about' },
  { url: 'https://cinacoin.com/products', name: 'website-products' },
  { url: 'https://cinacoin.com/pricing', name: 'website-pricing' },
  { url: 'https://cinacoin.com/developers', name: 'website-developers' },
  { url: 'https://cinacoin.com/solutions', name: 'website-solutions' },
  { url: 'https://cinacoin.com/resources', name: 'website-resources' },
  // Backend Dashboard
  { url: 'https://backend.cinacoin.com/login', name: 'backend-login' },
  // Cloud Dashboard (Pages URL since custom domain redirects)
  { url: 'https://3fffba96.cinacoin-cloud-dashboard.pages.dev/login', name: 'cloud-login' },
  { url: 'https://3fffba96.cinacoin-cloud-dashboard.pages.dev/register', name: 'cloud-register' },
  // Wallet Explorer
  { url: 'https://e34760ad.cinacoin-wallet-explorer.pages.dev', name: 'wallet-home' },
  { url: 'https://e34760ad.cinacoin-wallet-explorer.pages.dev/send', name: 'wallet-send' },
  { url: 'https://e34760ad.cinacoin-wallet-explorer.pages.dev/receive', name: 'wallet-receive' },
];

const browser = await chromium.launch({ 
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const dir = '/home/cina/.openclaw/workspace/tools/browser-test/screenshots';
import { mkdir } from 'fs/promises';
await mkdir(dir, { recursive: true });

for (const p of pages) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: `${dir}/${p.name}.png`, fullPage: true });
    console.log(`✅ ${p.name} → ${p.url}`);
  } catch (err) {
    console.log(`❌ ${p.name} → ${err.message.slice(0, 80)}`);
  }
  await page.close();
}

await browser.close();
console.log('\nDone! Screenshots saved to:', dir);
