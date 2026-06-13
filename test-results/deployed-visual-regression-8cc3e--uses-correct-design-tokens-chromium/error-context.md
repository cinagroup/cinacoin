# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: deployed-visual-regression.spec.ts >> Design System Compliance Check >> website uses correct design tokens
- Location: tests/deployed-visual-regression.spec.ts:128:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "#ffffff"
Received: "#fff"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - alert [ref=e3]
  - main [ref=e4]:
    - main [ref=e5]:
      - navigation "Main navigation" [ref=e6]:
        - generic [ref=e7]:
          - link "Cinacoin home" [ref=e8] [cursor=pointer]:
            - /url: /
            - img "Cinacoin logo" [ref=e9]
            - generic [ref=e10]: Cinacoin
          - generic [ref=e11]:
            - link "Home" [ref=e12] [cursor=pointer]:
              - /url: /
            - link "Pricing" [ref=e13] [cursor=pointer]:
              - /url: /pricing
            - link "About" [ref=e14] [cursor=pointer]:
              - /url: /about
            - link "Docs" [ref=e15] [cursor=pointer]:
              - /url: https://docs.cinacoin.com
          - generic [ref=e16]:
            - button "Open search (Cmd+K)" [ref=e17] [cursor=pointer]:
              - img [ref=e18]
              - generic [ref=e20]: Search...
              - generic [ref=e21]: ⌘K
            - button "Switch to dark mode" [ref=e22] [cursor=pointer]:
              - img [ref=e23]
            - button "Select language" [ref=e26] [cursor=pointer]:
              - text: EN
              - img [ref=e27]
            - generic [ref=e29]:
              - button "Log In" [ref=e30] [cursor=pointer]
              - button "Sign Up" [ref=e31] [cursor=pointer]
      - generic [ref=e34]:
        - heading "CinaCoin" [level=1] [ref=e35]
        - paragraph [ref=e36]: The future of digital currency.
        - paragraph [ref=e37]: Built for speed, security, and scalability. Experience the next generation of blockchain technology.
        - generic [ref=e38]:
          - link "Get Started" [ref=e39] [cursor=pointer]:
            - /url: /products/
          - link "Read the docs →" [ref=e40] [cursor=pointer]:
            - /url: /developers/
      - generic [ref=e42]:
        - paragraph [ref=e43]: Integrates with your stack
        - generic [ref=e44]:
          - generic [ref=e47]: MetaMask
          - generic [ref=e50]: Chainlink
          - generic [ref=e53]: The Graph
          - generic [ref=e56]: Uniswap
          - generic [ref=e59]: Aave
      - generic [ref=e61]:
        - generic [ref=e62]:
          - generic [ref=e63]:
            - paragraph [ref=e64]: Why CinaCoin
            - heading "Why choose CinaCoin?" [level=2] [ref=e65]
          - paragraph [ref=e67]: Built with proven, production-ready technology to deliver the best blockchain experience.
        - generic [ref=e68]:
          - link "Lightning fast. Transactions confirmed in seconds, not minutes. Built for real-world usage. Learn more →" [ref=e69] [cursor=pointer]:
            - /url: /solutions/#performance
            - img [ref=e70]
            - heading "Lightning fast." [level=3] [ref=e72]
            - paragraph [ref=e73]: Transactions confirmed in seconds, not minutes. Built for real-world usage.
            - generic [ref=e74]:
              - text: Learn more
              - generic [ref=e75]: →
          - generic [ref=e76]:
            - generic [ref=e77]:
              - heading "Market data" [level=3] [ref=e78]
              - generic [ref=e79]: Live
            - generic [ref=e81]:
              - generic [ref=e82]:
                - generic [ref=e83]: CINA/USDT
                - generic [ref=e84]: $0.0847
              - generic [ref=e85]:
                - generic [ref=e86]: 24h Volume
                - generic [ref=e87]: $12.4M
              - generic [ref=e88]:
                - generic [ref=e89]: Market Cap
                - generic [ref=e90]: $84.7M
              - generic [ref=e91]:
                - generic [ref=e92]: TVL
                - generic [ref=e93]: $31.2M
            - paragraph [ref=e94]: Aggregated from 14 chains, updated every 800ms.
          - link "Bank-level security. Advanced cryptography and decentralized consensus protect your assets. Learn more →" [ref=e95] [cursor=pointer]:
            - /url: /solutions/#security
            - img [ref=e96]
            - heading "Bank-level security." [level=3] [ref=e98]
            - paragraph [ref=e99]: Advanced cryptography and decentralized consensus protect your assets.
            - generic [ref=e100]:
              - text: Learn more
              - generic [ref=e101]: →
          - link "Global scale. Designed to handle millions of transactions per second worldwide. Learn more →" [ref=e102] [cursor=pointer]:
            - /url: /solutions/#scale
            - img [ref=e103]
            - heading "Global scale." [level=3] [ref=e106]
            - paragraph [ref=e107]: Designed to handle millions of transactions per second worldwide.
            - generic [ref=e108]:
              - text: Learn more
              - generic [ref=e109]: →
      - generic [ref=e111]:
        - generic [ref=e113]:
          - paragraph [ref=e114]: Developer experience
          - heading "Ship faster." [level=2] [ref=e115]
          - paragraph [ref=e116]: From wallet integration to cross-chain transfers, get to production in hours not weeks.
        - generic [ref=e117]:
          - generic [ref=e123]: ~/projects/my-dapp
          - code [ref=e126]: $ npx create-cinacoin-app@latest my-dapp ✔ Created project structure ✔ Installed dependencies (42 packages) ✔ Initialized wallet connection ✔ Configured testnet Ready! cd my-dapp && npm run dev
      - generic [ref=e128]:
        - generic [ref=e129]:
          - paragraph [ref=e130]: Products
          - heading "Our products." [level=2] [ref=e131]
        - generic [ref=e132]:
          - generic [ref=e133]:
            - link "CinaCoin wallet. Secure, fast, and easy-to-use digital wallet for managing your CinaCoin assets. Explore Wallet → →" [ref=e134] [cursor=pointer]:
              - /url: /products/#wallet
              - heading "CinaCoin wallet." [level=3] [ref=e135]
              - paragraph [ref=e136]: Secure, fast, and easy-to-use digital wallet for managing your CinaCoin assets.
              - generic [ref=e137]:
                - text: Explore Wallet →
                - generic [ref=e138]: →
            - link "CinaCoin exchange. Trade CinaCoin and other digital assets with low fees and high liquidity. Explore Exchange → →" [ref=e139] [cursor=pointer]:
              - /url: /products/#exchange
              - heading "CinaCoin exchange." [level=3] [ref=e140]
              - paragraph [ref=e141]: Trade CinaCoin and other digital assets with low fees and high liquidity.
              - generic [ref=e142]:
                - text: Explore Exchange →
                - generic [ref=e143]: →
            - link "Staking. Earn rewards by staking your CinaCoin and securing the network. Start Staking → →" [ref=e144] [cursor=pointer]:
              - /url: /products/#staking
              - heading "Staking." [level=3] [ref=e145]
              - paragraph [ref=e146]: Earn rewards by staking your CinaCoin and securing the network.
              - generic [ref=e147]:
                - text: Start Staking →
                - generic [ref=e148]: →
          - generic [ref=e150]:
            - generic [ref=e151]:
              - generic [ref=e152]: Wallet
              - generic [ref=e153]: Connected
            - generic [ref=e155]:
              - generic [ref=e156]:
                - generic [ref=e157]: CINA Balance
                - generic [ref=e158]: 12,450.00
              - generic [ref=e159]:
                - generic [ref=e160]: Staked
                - generic [ref=e161]: 8,200.00
              - generic [ref=e162]:
                - generic [ref=e163]: APY
                - generic [ref=e164]: +5.2%
        - 'link "Developer tools. Build powerful applications on the CinaCoin blockchain with our SDKs and APIs. View Docs → → cinacoin-sdk.ts import { CinaCoin } from ''@cinacoin/sdk''; const cc = new CinaCoin({ network: ''mainnet'', apiKey: process.env.CC_API_KEY, }); const balance = await cc.wallet.getBalance(); const tx = await cc.transfer({ to: ''0x742d...f83a'', amount: ''100.0'', token: ''CINA'', });" [ref=e165] [cursor=pointer]':
          - /url: /developers/
          - generic [ref=e166]:
            - generic [ref=e167]:
              - img [ref=e168]
              - heading "Developer tools." [level=3] [ref=e171]
              - paragraph [ref=e172]: Build powerful applications on the CinaCoin blockchain with our SDKs and APIs.
              - generic [ref=e173]:
                - text: View Docs →
                - generic [ref=e174]: →
            - generic [ref=e175]:
              - generic [ref=e181]: cinacoin-sdk.ts
              - code [ref=e183]: "import { CinaCoin } from '@cinacoin/sdk'; const cc = new CinaCoin({ network: 'mainnet', apiKey: process.env.CC_API_KEY, }); const balance = await cc.wallet.getBalance(); const tx = await cc.transfer({ to: '0x742d...f83a', amount: '100.0', token: 'CINA', });"
      - generic [ref=e186]:
        - generic [ref=e187]:
          - heading "Ready to join the revolution?" [level=2] [ref=e188]
          - paragraph [ref=e189]: Start using CinaCoin today and be part of the financial future.
        - generic [ref=e190]:
          - link "Create Your Wallet" [ref=e191] [cursor=pointer]:
            - /url: /products/
          - link "Read the Docs" [ref=e192] [cursor=pointer]:
            - /url: /developers/
      - generic [ref=e194]:
        - generic [ref=e195]:
          - generic [ref=e196]:
            - heading "Product" [level=4] [ref=e197]
            - list [ref=e198]:
              - listitem [ref=e199]:
                - link "Overview" [ref=e200] [cursor=pointer]:
                  - /url: /products/
              - listitem [ref=e201]:
                - link "Wallet" [ref=e202] [cursor=pointer]:
                  - /url: /products/#wallet
              - listitem [ref=e203]:
                - link "Exchange" [ref=e204] [cursor=pointer]:
                  - /url: /products/#exchange
              - listitem [ref=e205]:
                - link "Staking" [ref=e206] [cursor=pointer]:
                  - /url: /products/#staking
          - generic [ref=e207]:
            - heading "Solutions" [level=4] [ref=e208]
            - list [ref=e209]:
              - listitem [ref=e210]:
                - link "Enterprise" [ref=e211] [cursor=pointer]:
                  - /url: /solutions/#enterprise
              - listitem [ref=e212]:
                - link "DeFi" [ref=e213] [cursor=pointer]:
                  - /url: /solutions/#defi
              - listitem [ref=e214]:
                - link "Payments" [ref=e215] [cursor=pointer]:
                  - /url: /solutions/#payments
          - generic [ref=e216]:
            - heading "Developers" [level=4] [ref=e217]
            - list [ref=e218]:
              - listitem [ref=e219]:
                - link "Documentation" [ref=e220] [cursor=pointer]:
                  - /url: /developers/
              - listitem [ref=e221]:
                - link "API Reference" [ref=e222] [cursor=pointer]:
                  - /url: /developers/#api
              - listitem [ref=e223]:
                - link "SDKs" [ref=e224] [cursor=pointer]:
                  - /url: /developers/#sdks
              - listitem [ref=e225]:
                - link "GitHub" [ref=e226] [cursor=pointer]:
                  - /url: /developers/#github
          - generic [ref=e227]:
            - heading "Resources" [level=4] [ref=e228]
            - list [ref=e229]:
              - listitem [ref=e230]:
                - link "Blog" [ref=e231] [cursor=pointer]:
                  - /url: /resources/
              - listitem [ref=e232]:
                - link "Whitepaper" [ref=e233] [cursor=pointer]:
                  - /url: /resources/#whitepaper
              - listitem [ref=e234]:
                - link "Community" [ref=e235] [cursor=pointer]:
                  - /url: /resources/#community
              - listitem [ref=e236]:
                - link "Support" [ref=e237] [cursor=pointer]:
                  - /url: /resources/#support
          - generic [ref=e238]:
            - heading "Company" [level=4] [ref=e239]
            - list [ref=e240]:
              - listitem [ref=e241]:
                - link "About" [ref=e242] [cursor=pointer]:
                  - /url: /about/
              - listitem [ref=e243]:
                - link "Careers" [ref=e244] [cursor=pointer]:
                  - /url: /about/#careers
              - listitem [ref=e245]:
                - link "Contact" [ref=e246] [cursor=pointer]:
                  - /url: /about/#contact
        - generic [ref=e248]:
          - heading "Stay updated." [level=4] [ref=e249]
          - paragraph [ref=e250]: Get the latest news and updates
          - generic [ref=e251]:
            - generic [ref=e252]:
              - textbox "Name (optional)" [ref=e253]
              - textbox "Email address" [ref=e254]
            - button "Subscribe" [ref=e255] [cursor=pointer]
        - generic [ref=e256]:
          - generic [ref=e257]:
            - img [ref=e258]:
              - generic [ref=e260]: C
            - text: CinaCoin
          - paragraph [ref=e261]: © 2026 CinaCoin. All rights reserved.
```

# Test source

```ts
  45  |     });
  46  |   });
  47  | 
  48  |   test('wallet application loads correctly', async ({ page }) => {
  49  |     await page.goto(deployedApps.wallet);
  50  |     await expect(page).toHaveTitle(/Wallet|CINAcoin/i);
  51  |     
  52  |     const body = page.locator('body');
  53  |     await expect(body).toBeVisible();
  54  |     
  55  |     await expect(page).toHaveScreenshot('wallet-homepage.png', {
  56  |       fullPage: true,
  57  |       maxDiffPixelRatio: 0.05,
  58  |     });
  59  |   });
  60  | 
  61  |   test('learn platform loads correctly', async ({ page }) => {
  62  |     await page.goto(deployedApps.learn);
  63  |     await expect(page).toHaveTitle(/Learn|CINAcoin/i);
  64  |     
  65  |     const body = page.locator('body');
  66  |     await expect(body).toBeVisible();
  67  |     
  68  |     await expect(page).toHaveScreenshot('learn-homepage.png', {
  69  |       fullPage: true,
  70  |       maxDiffPixelRatio: 0.05,
  71  |     });
  72  |   });
  73  | 
  74  |   test('docs site loads correctly', async ({ page }) => {
  75  |     await page.goto(deployedApps.docs);
  76  |     await expect(page).toHaveTitle(/Docs|Documentation|CINAcoin/i);
  77  |     
  78  |     const body = page.locator('body');
  79  |     await expect(body).toBeVisible();
  80  |     
  81  |     await expect(page).toHaveScreenshot('docs-homepage.png', {
  82  |       fullPage: true,
  83  |       maxDiffPixelRatio: 0.05,
  84  |     });
  85  |   });
  86  | 
  87  |   test('cloud dashboard loads correctly', async ({ page }) => {
  88  |     await page.goto(deployedApps.cloudDashboard);
  89  |     await expect(page).toHaveTitle(/Cloud|Dashboard|CINAcoin/i);
  90  |     
  91  |     const body = page.locator('body');
  92  |     await expect(body).toBeVisible();
  93  |     
  94  |     await expect(page).toHaveScreenshot('cloud-dashboard.png', {
  95  |       fullPage: true,
  96  |       maxDiffPixelRatio: 0.05,
  97  |     });
  98  |   });
  99  | 
  100 |   test('health status page loads correctly', async ({ page }) => {
  101 |     await page.goto(deployedApps.healthStatus);
  102 |     await expect(page).toHaveTitle(/Health|Status|CINAcoin/i);
  103 |     
  104 |     const body = page.locator('body');
  105 |     await expect(body).toBeVisible();
  106 |     
  107 |     await expect(page).toHaveScreenshot('health-status.png', {
  108 |       fullPage: true,
  109 |       maxDiffPixelRatio: 0.05,
  110 |     });
  111 |   });
  112 | 
  113 |   test('demo application loads correctly', async ({ page }) => {
  114 |     await page.goto(deployedApps.demo);
  115 |     await expect(page).toHaveTitle(/Demo|CINAcoin/i);
  116 |     
  117 |     const body = page.locator('body');
  118 |     await expect(body).toBeVisible();
  119 |     
  120 |     await expect(page).toHaveScreenshot('demo-homepage.png', {
  121 |       fullPage: true,
  122 |       maxDiffPixelRatio: 0.05,
  123 |     });
  124 |   });
  125 | });
  126 | 
  127 | test.describe('Design System Compliance Check', () => {
  128 |   test('website uses correct design tokens', async ({ page }) => {
  129 |     await page.goto(deployedApps.website);
  130 |     
  131 |     const designTokens = await page.evaluate(() => {
  132 |       const styles = getComputedStyle(document.body);
  133 |       return {
  134 |         primary: styles.getPropertyValue('--cc-primary').trim(),
  135 |         canvas: styles.getPropertyValue('--cc-canvas').trim(),
  136 |         ink: styles.getPropertyValue('--cc-ink').trim(),
  137 |         error: styles.getPropertyValue('--cc-error').trim(),
  138 |         link: styles.getPropertyValue('--cc-link').trim(),
  139 |         roundedPill: styles.getPropertyValue('--cc-rounded-pill').trim(),
  140 |       };
  141 |     });
  142 | 
  143 |     // Verify design tokens match specification
  144 |     expect(designTokens.primary).toBe('#171717');
> 145 |     expect(designTokens.canvas).toBe('#ffffff');
      |                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  146 |     expect(designTokens.ink).toBe('#171717');
  147 |     expect(designTokens.error).toBe('#ee0000');
  148 |     expect(designTokens.link).toBe('#0070f3');
  149 |     expect(designTokens.roundedPill).toBe('100px');
  150 |   });
  151 | 
  152 |   test('buttons use pill shape (100px border-radius)', async ({ page }) => {
  153 |     await page.goto(deployedApps.website);
  154 |     
  155 |     const buttonRadius = await page.evaluate(() => {
  156 |       const buttons = Array.from(document.querySelectorAll('button, a.cc-btn'));
  157 |       if (buttons.length === 0) return null;
  158 |       
  159 |       const firstButton = buttons[0];
  160 |       return getComputedStyle(firstButton).borderRadius;
  161 |     });
  162 | 
  163 |     if (buttonRadius) {
  164 |       expect(buttonRadius).toBe('100px');
  165 |     }
  166 |   });
  167 | 
  168 |   test('font weight does not exceed 600', async ({ page }) => {
  169 |     await page.goto(deployedApps.website);
  170 |     
  171 |     const fontWeights = await page.evaluate(() => {
  172 |       const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b'));
  173 |       return elements.map(el => {
  174 |         const weight = getComputedStyle(el).fontWeight;
  175 |         return parseInt(weight);
  176 |       });
  177 |     });
  178 | 
  179 |     const invalidWeights = fontWeights.filter(w => w > 600);
  180 |     expect(invalidWeights.length).toBe(0);
  181 |   });
  182 | });
  183 | 
```