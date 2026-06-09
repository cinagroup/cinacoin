import { chromium } from '/home/cina/.openclaw/workspace/onux/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core/index.mjs';

const BASE = '/home/cina/.openclaw/workspace/screenshots';
const siteName = process.argv[2] || 'dash';
const siteMap = {
  dash: { url: 'https://backend-dashboard.pages.dev', pages: ['/','/login','/analytics','/chains','/keys-server','/notify-server','/project','/push-server','/relay-server','/rpc-proxy','/settings'] },
  health: { url: 'https://cinacoin-health-status.pages.dev', pages: ['/'] },
  docs: { url: 'https://cinacoin-docs.pages.dev', pages: ['/','/guide/quick-start','/guide/installation','/api/core-sdk','/api/react','/zh/','/zh/guide/quick-start'] },
};

const site = siteMap[siteName];
if (!site) { console.error('Unknown site:', siteName); process.exit(1); }

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
const results = [];

for (const p of site.pages) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  const jsErrors = [];
  pg.on('pageerror', e => jsErrors.push(e.message.slice(0, 200)));
  
  try {
    const resp = await pg.goto(site.url + p, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await pg.waitForTimeout(2000);
    
    const title = await pg.title();
    const safeName = (siteName + p).replace(/\//g, '-').replace(/--+/g, '-') || 'home';
    
    await pg.screenshot({ path: `${BASE}/${safeName}.png`, fullPage: false });
    await pg.emulateMedia({ colorScheme: 'dark' });
    await pg.waitForTimeout(500);
    await pg.screenshot({ path: `${BASE}/${safeName}-dark.png`, fullPage: false });
    
    console.log(`✅ ${siteName}${p} (${title.slice(0,50)}) | JS errors: ${jsErrors.length}`);
    results.push({ page: p, status: resp?.status(), title, jsErrors: jsErrors.length });
  } catch (e) {
    console.log(`❌ ${siteName}${p}: ${e.message.slice(0, 100)}`);
    results.push({ page: p, error: e.message.slice(0, 100) });
  }
  
  await pg.close();
  await ctx.close();
}

await browser.close();
console.log(`\n📊 ${siteName}: ${results.filter(r=>!r.error).length}/${results.length} OK`);
