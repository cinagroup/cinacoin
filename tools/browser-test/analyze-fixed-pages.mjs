import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const pages = [
  { url: 'https://cinacoin.com/login/', name: 'Website Login' },
  { url: 'https://cinacoin.com/register/', name: 'Website Register' },
  { url: 'https://6bd6ea29.cinacoin-cloud-dashboard.pages.dev/login/', name: 'Cloud Dashboard Login' },
];

for (const p of pages) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(p.url, { waitUntil: 'networkidle', timeout: 15000 });
  
  const analysis = await page.evaluate(() => {
    const body = document.body;
    const styles = getComputedStyle(body);
    
    // 检查主要元素
    const heading = document.querySelector('h1');
    const buttons = Array.from(document.querySelectorAll('button')).slice(0, 3);
    const inputs = Array.from(document.querySelectorAll('input')).slice(0, 3);
    
    // 检查颜色变量是否生效
    const rootStyles = getComputedStyle(document.documentElement);
    const ccInk = rootStyles.getPropertyValue('--cc-ink');
    const ccCanvas = rootStyles.getPropertyValue('--cc-canvas');
    const ccPrimary = rootStyles.getPropertyValue('--cc-primary');
    
    // 检查 cc- 类是否生效
    const ccCard = document.querySelector('.cc-card');
    const ccBtnPrimary = document.querySelector('.cc-btn-primary');
    const ccDisplayMd = document.querySelector('.cc-display-md');
    
    return {
      title: document.title,
      bodyBg: styles.backgroundColor,
      bodyColor: styles.color,
      heading: heading ? heading.innerText : 'No heading',
      headingColor: heading ? getComputedStyle(heading).color : 'N/A',
      buttonsCount: buttons.length,
      inputsCount: inputs.length,
      cssVars: {
        '--cc-ink': ccInk,
        '--cc-canvas': ccCanvas,
        '--cc-primary': ccPrimary,
      },
      ccClasses: {
        '.cc-card': ccCard ? 'Found' : 'Not found',
        '.cc-btn-primary': ccBtnPrimary ? 'Found' : 'Not found',
        '.cc-display-md': ccDisplayMd ? 'Found' : 'Not found',
      },
      cardBg: ccCard ? getComputedStyle(ccCard).backgroundColor : 'N/A',
      btnBg: ccBtnPrimary ? getComputedStyle(ccBtnPrimary).backgroundColor : 'N/A',
    };
  });
  
  console.log(`\n=== ${p.name} ===`);
  console.log(`Title: ${analysis.title}`);
  console.log(`Body BG: ${analysis.bodyBg}`);
  console.log(`Body Color: ${analysis.bodyColor}`);
  console.log(`Heading: ${analysis.heading}`);
  console.log(`Heading Color: ${analysis.headingColor}`);
  console.log(`Buttons: ${analysis.buttonsCount}, Inputs: ${analysis.inputsCount}`);
  console.log(`CSS Variables:`, analysis.cssVars);
  console.log(`CC Classes:`, analysis.ccClasses);
  console.log(`Card BG: ${analysis.cardBg}`);
  console.log(`Button BG: ${analysis.btnBg}`);
  
  // 检查问题
  if (!analysis.cssVars['--cc-ink']) {
    console.log(`⚠️ 问题: --cc-ink 变量未定义`);
  }
  if (analysis.ccClasses['.cc-card'] === 'Not found') {
    console.log(`⚠️ 警告: 未找到 .cc-card 元素`);
  }
  
  await page.close();
}

await browser.close();
