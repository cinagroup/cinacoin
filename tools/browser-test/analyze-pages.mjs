import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const pages = [
  { url: 'https://cinacoin.com', name: 'Website Home' },
  { url: 'https://cinacoin.com/about', name: 'Website About' },
  { url: 'https://cinacoin.com/pricing', name: 'Website Pricing' },
  { url: 'https://backend.cinacoin.com/login', name: 'Backend Login' },
];

for (const p of pages) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(p.url, { waitUntil: 'networkidle', timeout: 15000 });
  
  const analysis = await page.evaluate(() => {
    const body = document.body;
    const styles = getComputedStyle(body);
    
    // 检查主要元素
    const nav = document.querySelector('nav');
    const hero = document.querySelector('section') || document.querySelector('main > div');
    const footer = document.querySelector('footer');
    
    // 检查内容完整性
    const mainContent = document.querySelector('main');
    const contentHeight = mainContent ? mainContent.scrollHeight : 0;
    const textContent = mainContent ? mainContent.innerText.trim() : '';
    
    // 检查按钮样式
    const buttons = Array.from(document.querySelectorAll('button, a.btn, [role="button"]')).slice(0, 5);
    const buttonStyles = buttons.map(b => {
      const s = getComputedStyle(b);
      return {
        text: b.innerText.slice(0, 30),
        bg: s.backgroundColor,
        color: s.color,
        border: s.border,
        borderRadius: s.borderRadius
      };
    });
    
    // 检查颜色变量
    const rootStyles = getComputedStyle(document.documentElement);
    const colors = {
      primary: rootStyles.getPropertyValue('--primary') || rootStyles.getPropertyValue('--cc-primary'),
      bg: rootStyles.getPropertyValue('--bg') || rootStyles.getPropertyValue('--cc-canvas'),
      text: rootStyles.getPropertyValue('--text') || rootStyles.getPropertyValue('--cc-ink'),
    };
    
    return {
      title: document.title,
      bodyBg: styles.backgroundColor,
      bodyColor: styles.color,
      hasNav: !!nav,
      hasFooter: !!footer,
      contentHeight,
      textLength: textContent.length,
      textPreview: textContent.slice(0, 200),
      buttonStyles,
      colors,
      issues: []
    };
  });
  
  console.log(`\n=== ${p.name} ===`);
  console.log(`Title: ${analysis.title}`);
  console.log(`Body BG: ${analysis.bodyBg}`);
  console.log(`Body Color: ${analysis.bodyColor}`);
  console.log(`Has Nav: ${analysis.hasNav}`);
  console.log(`Has Footer: ${analysis.hasFooter}`);
  console.log(`Content Height: ${analysis.contentHeight}px`);
  console.log(`Text Length: ${analysis.textLength} chars`);
  console.log(`Text Preview: ${analysis.textPreview.slice(0, 100)}...`);
  console.log(`Colors:`, analysis.colors);
  console.log(`Buttons:`, JSON.stringify(analysis.buttonStyles, null, 2));
  
  // 检测问题
  if (analysis.contentHeight < 500) {
    console.log(`⚠️ 问题: 内容高度过小 (${analysis.contentHeight}px)，可能内容缺失`);
  }
  if (analysis.textLength < 100) {
    console.log(`⚠️ 问题: 文本内容过少 (${analysis.textLength} chars)，可能页面为空`);
  }
  
  await page.close();
}

await browser.close();
