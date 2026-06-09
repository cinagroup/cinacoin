import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // 1. Test status page auto-refresh
  console.log('--- Testing Status Page Auto-Refresh ---');
  await page.goto('https://status.cinacoon.com', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.goto('https://status.cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(5000);

  // Check initial timestamp
  const initialTime = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText?.includes('Last checked'));
    return el?.innerText || 'not found';
  });
  console.log('Initial timestamp:', initialTime);

  // Check if auto-refresh toggle exists and its state
  const autoRefresh = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('button, [role="switch"], [role="button"], label'));
    return els.filter(e => e.innerText?.toLowerCase().includes('auto') || e.innerText?.toLowerCase().includes('refresh'))
      .map(e => ({ tag: e.tagName, class: e.className, text: e.innerText?.trim()?.substring(0, 100), ariaPressed: e.getAttribute('aria-pressed') }));
  });
  console.log('Auto-refresh controls:', JSON.stringify(autoRefresh, null, 2));

  // 2. Test manual refresh
  console.log('\n--- Testing Manual Refresh ---');
  const refreshBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const refresh = btns.find(b => b.innerText?.trim()?.toLowerCase() === 'refresh' || b.getAttribute('aria-label')?.toLowerCase().includes('refresh'));
    if (refresh) {
      return { found: true, text: refresh.innerText.trim(), class: refresh.className };
    }
    return { found: false };
  });
  console.log('Refresh button:', JSON.stringify(refreshBtn));

  // 3. Check incident details
  console.log('\n--- Checking Incidents ---');
  const incidents = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('[class*="incident"], [class*="event"], [class*="history"]'));
    return sections.map(s => ({ class: s.className, text: s.innerText?.substring(0, 500) }));
  });
  console.log('Incident sections:', JSON.stringify(incidents, null, 2));

  // Click on incident to expand if possible
  const incidentHeaders = await page.$$('text=Resolved Incidents');
  console.log('Resolved Incidents headers found:', incidentHeaders.length);

  // 4. Check responsive design hints
  console.log('\n--- Checking Meta Tags ---');
  const meta = await page.evaluate(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const desc = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const favicon = document.querySelector('link[rel="icon"]');
    return {
      viewport: viewport?.content || 'none',
      description: desc?.content || 'none',
      ogTitle: ogTitle?.content || 'none',
      ogDesc: ogDesc?.content || 'none',
      favicon: favicon?.href || 'none',
    };
  });
  console.log('Status page meta:', JSON.stringify(meta, null, 2));

  // Check docs meta
  await page.goto('https://cinacoin.com/docs/', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const docsMeta = await page.evaluate(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const desc = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const favicon = document.querySelector('link[rel="icon"]');
    const canonical = document.querySelector('link[rel="canonical"]');
    return {
      viewport: viewport?.content || 'none',
      description: desc?.content || 'none',
      ogTitle: ogTitle?.content || 'none',
      ogDesc: ogDesc?.content || 'none',
      favicon: favicon?.href || 'none',
      canonical: canonical?.href || 'none',
    };
  });
  console.log('\nDocs meta:', JSON.stringify(docsMeta, null, 2));

  // 5. Check accessibility issues on status page
  await page.goto('https://status.cinacoin.com', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  
  const a11yIssues = await page.evaluate(() => {
    const issues = [];
    // Check images without alt
    const imgs = Array.from(document.querySelectorAll('img'));
    imgs.forEach(img => {
      if (!img.alt) issues.push(`Image without alt: ${img.src?.substring(0, 100)}`);
    });
    // Check inputs without labels
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
    inputs.forEach(input => {
      const id = input.id;
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      const ariaLabel = input.getAttribute('aria-label');
      if (!label && !ariaLabel) issues.push(`Input without label: ${input.type || input.tagName}`);
    });
    // Check color contrast (basic)
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    headings.forEach(h => {
      const style = window.getComputedStyle(h);
      // Just report the colors for manual review
      issues.push(`Heading "${h.innerText?.substring(0, 50)}" color: ${style.color}, bg: ${style.backgroundColor}`);
    });
    // Check for skip-to-content link
    const skipLink = document.querySelector('a[href="#main"], a[href="#content"], [class*="skip"]');
    if (!skipLink) issues.push('No skip-to-content link found');
    // Check heading hierarchy
    const headingLevels = headings.map(h => parseInt(h.tagName[1]));
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i-1] > 1) {
        issues.push(`Heading hierarchy skip: h${headingLevels[i-1]} -> h${headingLevels[i]}`);
      }
    }
    return issues;
  });
  console.log('\nStatus page a11y:', JSON.stringify(a11yIssues, null, 2));

  // 6. Check for performance issues
  const perfStatus = await page.evaluate(() => {
    const perf = performance.getEntriesByType('resource');
    const totalSize = perf.reduce((acc, r) => acc + (r.transferSize || 0), 0);
    const jsFiles = perf.filter(r => r.name.endsWith('.js')).length;
    const cssFiles = perf.filter(r => r.name.endsWith('.css')).length;
    return {
      totalTransferBytes: totalSize,
      jsFiles,
      cssFiles,
      totalResources: perf.length,
      loadTime: performance.timing?.loadEventEnd - performance.timing?.navigationStart || 'N/A'
    };
  });
  console.log('\nStatus page perf:', JSON.stringify(perfStatus, null, 2));

  // 7. Check docs for broken links
  console.log('\n--- Checking for broken internal links on docs ---');
  await page.goto('https://cinacoin.com/docs/guide/quick-start', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  const internalLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href^="/"], a[href*="cinacoin.com"]'));
    return [...new Set(links.map(a => a.href))].slice(0, 30);
  });
  console.log('Internal links found:', internalLinks.length);

  // Test a few sidebar links
  const testLinks = [
    'https://cinacoin.com/docs/guide/installation',
    'https://cinacoin.com/docs/api/config',
    'https://cinacoin.com/docs/api/vue',
  ];
  
  for (const link of testLinks) {
    const resp = await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(e => ({ status: () => 0 }));
    console.log(`  ${link} → status ${resp.status()}`);
  }

  await browser.close();
  console.log('\nDone!');
})();
