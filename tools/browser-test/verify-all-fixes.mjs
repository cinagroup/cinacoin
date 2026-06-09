import { chromium } from 'playwright';

console.log('=== 验证所有修复 ===\n');

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const results = [];

async function testPage(name, url, checks = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    const status = res?.status();
    const ok = status === 200;
    
    let details = [];
    
    if (checks.formMethod) {
      const forms = await page.$$('form');
      for (const form of forms) {
        const method = await form.getAttribute('method');
        details.push(`form method="${method || 'get (default)'}"`);
      }
    }
    
    if (checks.inputNames) {
      const inputs = await page.$$('input');
      const names = [];
      for (const input of inputs) {
        const name = await input.getAttribute('name');
        const type = await input.getAttribute('type');
        if (type !== 'checkbox' && type !== 'hidden') {
          names.push(`${type || 'text'}: name="${name || 'MISSING'}"`);
        }
      }
      details.push(`inputs: ${names.join(', ')}`);
    }
    
    if (checks.cssVars) {
      const vars = await page.evaluate(() => {
        const s = getComputedStyle(document.documentElement);
        return {
          ccInk: s.getPropertyValue('--cc-ink').trim(),
          ccPrimary: s.getPropertyValue('--cc-primary').trim(),
        };
      });
      details.push(`--cc-ink: ${vars.ccInk || 'MISSING'}, --cc-primary: ${vars.ccPrimary || 'MISSING'}`);
    }
    
    const icon = ok ? '✅' : '❌';
    console.log(`${icon} ${name}: ${status}`);
    if (details.length) details.forEach(d => console.log(`   ${d}`));
    
    results.push({ name, status, ok, details });
  } catch (err) {
    console.log(`❌ ${name}: ${err.message.slice(0, 80)}`);
    results.push({ name, status: 0, ok: false, details: [err.message.slice(0, 80)] });
  }
  await page.close();
}

// Website - 验证表单修复
await testPage('Website Login', 'https://cinacoin.com/login', { formMethod: true, inputNames: true, cssVars: true });
await testPage('Website Register', 'https://cinacoin.com/register', { formMethod: true, inputNames: true, cssVars: true });

// Cloud Dashboard - 验证新页面
await testPage('Cloud /projects', 'https://cloud.cinacoin.com/projects', { cssVars: true });
await testPage('Cloud /api-keys', 'https://cloud.cinacoin.com/api-keys', { cssVars: true });
await testPage('Cloud /billing', 'https://cloud.cinacoin.com/billing', { cssVars: true });
await testPage('Cloud /settings', 'https://cloud.cinacoin.com/settings', { cssVars: true });

// Wallet Explorer - 验证修复
await testPage('Wallet /send', 'https://wallet.cinacoin.com/send');
await testPage('Wallet /receive', 'https://wallet.cinacoin.com/receive');
await testPage('Wallet /swap', 'https://wallet.cinacoin.com/swap');
await testPage('Wallet /history', 'https://wallet.cinacoin.com/history');

console.log('\n=== 结果汇总 ===');
const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok).length;
console.log(`✅ 通过: ${passed} | ❌ 失败: ${failed} | 总计: ${results.length}`);

await browser.close();
