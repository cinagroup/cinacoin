import { chromium } from 'playwright';

const BASE_URL = 'https://cloud.cinacoin.com';
const SCREENSHOT_DIR = '/home/cina/.openclaw/workspace/tools/browser-test/screenshots/test-cloud';

const pages = [
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'projects', path: '/projects' },
  { name: 'api-keys', path: '/api-keys' },
  { name: 'billing', path: '/billing' },
  { name: 'settings', path: '/settings' },
];

const results = [];

async function testPage(browser, pageDef) {
  const { name, path } = pageDef;
  const url = `${BASE_URL}${path}`;
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const result = {
    name,
    url,
    status: 'unknown',
    httpStatus: null,
    screenshotPath: null,
    cssVars: { found: [], missing: [] },
    navigationLinks: [],
    forms: [],
    errors: [],
    consoleErrors: [],
  };

  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      result.consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    result.errors.push(err.message);
  });

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    result.httpStatus = response ? response.status() : null;

    // Wait a bit for any dynamic content
    await page.waitForTimeout(2000);

    // Take screenshot
    const screenshotPath = `${SCREENSHOT_DIR}/${name}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    // Check CSS variables (--cc-*)
    const cssVarsResult = await page.evaluate(() => {
      const rootStyles = getComputedStyle(document.documentElement);
      const allVars = [];
      const found = [];
      const missing = [];
      
      // Check for common --cc-* variables
      const expectedVars = [
        '--cc-primary', '--cc-secondary', '--cc-accent',
        '--cc-bg', '--cc-bg-secondary', '--cc-text', '--cc-text-secondary',
        '--cc-border', '--cc-success', '--cc-error', '--cc-warning',
        '--cc-primary-hover', '--cc-radius', '--cc-shadow',
      ];
      
      // Also scan stylesheets for any --cc-* variables
      try {
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule.style) {
                for (let i = 0; i < rule.style.length; i++) {
                  const prop = rule.style[i];
                  if (prop.startsWith('--cc-') && !allVars.includes(prop)) {
                    allVars.push(prop);
                  }
                }
              }
            }
          } catch (e) {
            // Cross-origin stylesheet, skip
          }
        }
      } catch (e) {}
      
      for (const v of expectedVars) {
        const val = rootStyles.getPropertyValue(v).trim();
        if (val) found.push({ name: v, value: val });
        else missing.push(v);
      }
      
      // Add any found in stylesheets that aren't in expected
      for (const v of allVars) {
        if (!expectedVars.includes(v)) {
          const val = rootStyles.getPropertyValue(v).trim();
          if (val) found.push({ name: v, value: val });
        }
      }
      
      return { found, missing };
    });
    result.cssVars = cssVarsResult;

    // Check navigation links
    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a[href]');
      return Array.from(anchors).map(a => ({
        text: a.textContent.trim().substring(0, 50),
        href: a.getAttribute('href'),
      })).filter(l => l.href && l.text);
    });
    result.navigationLinks = links;

    // Check forms
    const forms = await page.evaluate(() => {
      const formElements = document.querySelectorAll('form');
      return Array.from(formElements).map(form => ({
        action: form.getAttribute('action') || '',
        method: form.getAttribute('method') || 'GET',
        inputs: Array.from(form.querySelectorAll('input, select, textarea, button')).map(el => ({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type') || '',
          name: el.getAttribute('name') || '',
          placeholder: el.getAttribute('placeholder') || '',
          id: el.getAttribute('id') || '',
        })),
      }));
    });
    result.forms = forms;

    // Check if page title exists
    const title = await page.title();
    result.title = title;

    // Check for visible text content
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
    result.bodyTextPreview = bodyText;

    result.status = 'success';
  } catch (err) {
    result.status = 'error';
    result.errors.push(err.message);
    
    // Try to take screenshot even on error
    try {
      const screenshotPath = `${SCREENSHOT_DIR}/${name}-error.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshotPath = screenshotPath;
    } catch (e) {}
  } finally {
    await context.close();
  }

  return result;
}

async function main() {
  console.log('Starting Cloud Dashboard tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);
  console.log('---');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  for (const pageDef of pages) {
    console.log(`Testing: ${pageDef.name} (${pageDef.path})...`);
    const result = await testPage(browser, pageDef);
    results.push(result);
    console.log(`  Status: ${result.status} | HTTP: ${result.httpStatus} | CSS vars found: ${result.cssVars.found.length} | Links: ${result.navigationLinks.length} | Forms: ${result.forms.length}`);
    if (result.errors.length) console.log(`  Errors: ${result.errors.join('; ')}`);
    if (result.consoleErrors.length) console.log(`  Console errors: ${result.consoleErrors.length}`);
  }

  await browser.close();

  // Output JSON for report generation
  const outputPath = `${SCREENSHOT_DIR}/test-results.json`;
  const fs = await import('fs');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
