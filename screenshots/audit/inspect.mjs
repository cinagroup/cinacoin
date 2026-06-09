import { chromium } from '/home/cina/.openclaw/workspace/onux/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core/index.mjs';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

await page.goto('https://demo.cinacoin.com', { waitUntil: 'domcontentloaded', timeout: 20000 });

await new Promise(r => setTimeout(r, 3000));

// Dump all buttons with their text content
const buttons = await page.evaluate(() => {
  const btns = document.querySelectorAll('button, [role="button"], a');
  const result = [];
  btns.forEach((b, i) => {
    const text = b.innerText?.trim().substring(0, 60);
    const cls = b.className;
    const aria = b.getAttribute('aria-label');
    const data = b.dataset;
    result.push({ idx: i, text, class: cls, ariaLabel: aria, tagName: b.tagName, dataset: data });
  });
  return result;
});

console.log('\n=== ALL BUTTONS/LINKS ===');
buttons.forEach(b => {
  if (b.text) console.log(`[${b.tagName}] "${b.text}" | class="${b.class}" | aria="${b.ariaLabel}"`);
});

// Check for any theme-related classes on body/html
const themeInfo = await page.evaluate(() => {
  return {
    htmlClass: document.documentElement.className,
    bodyClass: document.body.className,
    htmlStyle: document.documentElement.getAttribute('style'),
    bodyStyle: document.body.getAttribute('style'),
    computedBg: window.getComputedStyle(document.body).backgroundColor,
    computedColor: window.getComputedStyle(document.body).color,
    dataTheme: document.documentElement.getAttribute('data-theme'),
  };
});
console.log('\n=== THEME INFO ===');
console.log(JSON.stringify(themeInfo, null, 2));

// Check for any sun/moon/light/dark icons
const icons = await page.evaluate(() => {
  const els = document.querySelectorAll('svg, icon, [class*="icon"], [class*="theme"], [class*="dark"], [class*="light"], [class*="moon"], [class*="sun"]');
  const result = [];
  els.forEach(el => {
    const text = el.innerText?.trim().substring(0, 40);
    const cls = el.className;
    result.push({ tag: el.tagName, text, class: typeof cls === 'string' ? cls.substring(0, 100) : '' });
  });
  return result;
});
console.log('\n=== ICONS/THEME ELEMENTS ===');
icons.forEach(ic => console.log(`<${ic.tag}> class="${ic.class}" text="${ic.text}"`));

// Check for language selector
const langEls = await page.evaluate(() => {
  const els = document.querySelectorAll('select, [class*="lang"], [class*="locale"], [class*="i18n"]');
  const result = [];
  els.forEach(el => {
    result.push({ tag: el.tagName, text: el.innerText?.trim().substring(0, 40), class: typeof el.className === 'string' ? el.className.substring(0, 100) : '' });
  });
  return result;
});
console.log('\n=== LANGUAGE ELEMENTS ===');
langEls.forEach(l => console.log(`<${l.tag}> class="${l.class}" text="${l.text}"`));

await browser.close();
