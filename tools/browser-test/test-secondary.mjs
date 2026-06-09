import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/cina/.openclaw/workspace/tools/browser-test/screenshots/test-secondary';
const PAGES = [
  { name: 'Developers', url: 'https://cinacoin.com/developers' },
  { name: 'Solutions', url: 'https://cinacoin.com/solutions' },
  { name: 'Resources', url: 'https://cinacoin.com/resources' },
  { name: 'Contact', url: 'https://cinacoin.com/contact' },
];

const results = [];

async function testPage(browser, pageInfo) {
  const { name, url } = pageInfo;
  const result = { name, url, status: 'unknown', links: [], buttons: [], errors: [], screenshots: [] };
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    console.log(`\n=== Testing ${name} (${url}) ===`);
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    result.httpStatus = response?.status();
    result.status = response?.ok() ? 'loaded' : 'error';
    console.log(`  HTTP Status: ${result.httpStatus}`);

    // Full page screenshot
    const ssPath = path.join(SCREENSHOT_DIR, `${name.toLowerCase()}-full.png`);
    await page.screenshot({ path: ssPath, fullPage: true });
    result.screenshots.push(ssPath);
    console.log(`  Screenshot: ${ssPath}`);

    // Extract all links
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map(a => ({
        text: a.textContent?.trim().slice(0, 80) || '',
        href: a.href,
        target: a.target || '_self',
      }));
    });
    result.links = links;
    console.log(`  Found ${links.length} links`);

    // Extract all buttons
    const buttons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]'));
      return btns.map(b => ({
        text: b.textContent?.trim().slice(0, 80) || b.value || '',
        type: b.type || '',
        disabled: b.disabled || false,
      }));
    });
    result.buttons = buttons;
    console.log(`  Found ${buttons.length} buttons`);

    // Check link accessibility (sample up to 10 unique external links)
    const uniqueHrefs = [...new Set(links.map(l => l.href))].filter(h => h.startsWith('http')).slice(0, 10);
    const linkChecks = [];
    for (const href of uniqueHrefs) {
      try {
        const resp = await page.request.head(href, { timeout: 8000 }).catch(() => null);
        const respGet = resp || await page.request.get(href, { timeout: 8000 }).catch(() => null);
        linkChecks.push({ href, status: respGet?.status() || 'failed', ok: respGet?.ok() || false });
      } catch (e) {
        linkChecks.push({ href, status: 'error', ok: false, error: e.message?.slice(0, 100) });
      }
    }
    result.linkChecks = linkChecks;
    const broken = linkChecks.filter(l => !l.ok);
    console.log(`  Checked ${linkChecks.length} links, ${broken.length} broken`);

    // Contact page: check form
    if (name === 'Contact') {
      const forms = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('form')).map(f => ({
          action: f.action || '',
          method: f.method || 'GET',
          id: f.id || '',
          fields: Array.from(f.querySelectorAll('input, textarea, select')).map(i => ({
            name: i.name || '',
            type: i.type || i.tagName.toLowerCase(),
            required: i.required || false,
            placeholder: i.placeholder || '',
          })),
        }));
      });
      result.forms = forms;
      console.log(`  Found ${forms.length} forms`);
      if (forms.length > 0) {
        // Try to fill and submit the form
        try {
          const form = forms[0];
          for (const field of form.fields) {
            if (field.type === 'email') {
              await page.fill(`input[name="${field.name}"], input[type="email"]`, 'test@example.com').catch(() => {});
            } else if (field.type === 'text' || field.type === '') {
              await page.fill(`input[name="${field.name}"]`, 'Test User').catch(() => {});
            } else if (field.type === 'textarea') {
              await page.fill(`textarea[name="${field.name}"]`, 'This is a test message from automated testing.').catch(() => {});
            }
          }
          // Screenshot filled form
          const filledSs = path.join(SCREENSHOT_DIR, 'contact-form-filled.png');
          await page.screenshot({ path: filledSs, fullPage: true });
          result.screenshots.push(filledSs);
          console.log(`  Form filled, screenshot saved`);
        } catch (e) {
          result.formError = e.message?.slice(0, 200);
          console.log(`  Form fill error: ${e.message}`);
        }
      }
    }

    // Check page content completeness
    const contentCheck = await page.evaluate(() => {
      const h1 = document.querySelectorAll('h1').length;
      const h2 = document.querySelectorAll('h2').length;
      const sections = document.querySelectorAll('section').length;
      const bodyText = document.body?.innerText?.slice(0, 500) || '';
      return { h1Count: h1, h2Count: h2, sectionCount: sections, bodyPreview: bodyText };
    });
    result.content = contentCheck;
    console.log(`  Content: ${contentCheck.h1Count} h1, ${contentCheck.h2Count} h2, ${contentCheck.sectionCount} sections`);

  } catch (e) {
    result.status = 'error';
    result.errors.push(e.message?.slice(0, 300));
    console.log(`  ERROR: ${e.message}`);
    // Try error screenshot
    try {
      const errSs = path.join(SCREENSHOT_DIR, `${name.toLowerCase()}-error.png`);
      await page.screenshot({ path: errSs, fullPage: true });
      result.screenshots.push(errSs);
    } catch {}
  } finally {
    await page.close();
  }

  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  for (const pageInfo of PAGES) {
    const result = await testPage(browser, pageInfo);
    results.push(result);
  }

  await browser.close();

  // Write JSON results
  const jsonPath = path.join(SCREENSHOT_DIR, 'results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\n\nResults written to ${jsonPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
