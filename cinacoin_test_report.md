# Cinacoin 主站测试报告

**测试日期:** 2026-06-08  
**测试 URL:** https://cinacoin.com  
**测试工具:** Playwright 1.60.0 (Chromium, headless)  
**测试环境:** Linux x64, Node v22.22.1

---

## 截图

已保存至 `/home/cina/.openclaw/workspace/screenshots/`:

| 截图 | 文件 | 描述 |
|------|------|------|
| 首页 (桌面亮色) | `home_desktop_light.png` | 1440×900，亮色主题，完整首页 |
| Pricing 页 | `pricing.png` | 三档定价卡片 (Free/$0, Pro/$49, Enterprise/Custom) + FAQ |
| About 页 | `about.png` | 团队介绍、原则、时间线 |
| Docs 页 | `docs.png` | 文档首页，显示中文内容 |
| 主题切换后 | `theme_toggled.png` | 暗色主题首页 |
| 中文模式 | `chinese.png` | 切换为中文后的首页 |
| 移动端 375px | `responsive_375x667.png` | 手机视口，存在水平溢出 |
| 平板 768px | `responsive_768x1024.png` | 平板视口，正常 |
| FAQ 展开 | `pricing_faq_open.png` | Pricing 页 FAQ 手风琴展开状态 |
| 404 页面 | `404.png` | 自定义 404 页面 |
| 移动端最终 | `mobile_375_final.png` | 移动端完整截图 |

---

## 功能测试

### ✅ 导航链接

| 链接 | 状态 | 标题 | 备注 |
|------|------|------|------|
| Home (`/`) | ✅ 200 | Cinacoin — Onchain Access, Simplified | 正常 |
| Pricing (`/pricing`) | ✅ 200 | Pricing — Cinacoin \| Cinacoin | 标题重复 "Cinacoin" |
| About (`/about`) | ✅ 200 | About — Cinacoin \| Cinacoin | 标题重复 "Cinacoin" |
| Docs (`/docs`) | ✅ 302→200 | Cinacoin | 重定向到 `/docs/`，外部站 docs.cinacoin.com |
| 404 页面 | ✅ 404 | Page Not Found — Cinacoin \| Cinacoin | 自定义 404 正常 |

**导航结构:**
- 顶部导航栏: Home, Pricing, About, Docs
- CTA 按钮: "Get Started" → docs.cinacoin.com
- Footer 四列: Products / Developers / Company / Legal
- Footer 社交链接: X (Twitter), GitHub, Discord

### ✅ 主题切换

- **切换按钮:** 存在，`aria-label="Switch to dark mode"` / `"Switch to light mode"`
- **初始状态:** `data-theme="light"`, body bg: `rgb(250, 250, 250)`
- **切换后:** `data-theme="dark"`, body bg: `rgb(5, 5, 5)`
- **aria-label 动态更新:** ✅ 正确
- **CSS 变量方案:** 使用 `var(--cc-body)`, `var(--cc-canvas-soft)` 等自定义属性
- **color-scheme meta:** `light dark` ✅
- **theme-color meta:** 分别针对 light/dark 设置了 `#ffffff` / `#0a0a0a` ✅

### ⚠️ 语言切换

- **切换按钮:** 存在，`aria-label="Select language"`, 显示 "EN"
- **支持语言:** English / 中文
- **EN → 中文:** ✅ 成功切换，H1 从 "Connect any wallet, to any chain." 变为 "连接任何钱包，到任何链。"
- **html lang 属性:** 正确更新 `en` → `zh`
- **⚠️ 问题:** 切换到中文后，语言按钮可能移出视口导致无法切回（布局偏移）

### ⚠️ 响应式设计

| 视口 | 状态 | 问题 |
|------|------|------|
| 375×667 (iPhone) | ⚠️ | **水平溢出** (scrollWidth > clientWidth) |
| 768×1024 (iPad) | ✅ | 正常 |
| 1440×900 (Desktop) | ✅ | 正常 |

- **移动端菜单:** 有汉堡按钮 (`aria-label="Open menu"`) ✅
- **移动端按钮可见:** 主题切换、语言选择、菜单按钮均可见 ✅

---

## 性能指标

| 指标 | 数值 | 评价 |
|------|------|------|
| DOM Interactive | 304ms | 🟢 优秀 |
| DOM Complete | 308ms | 🟢 优秀 |
| First Paint | 352ms | 🟢 优秀 |
| First Contentful Paint | 352ms | 🟢 优秀 |
| HTML Transfer Size | ~10KB | 🟢 极小 (Next.js SSR) |
| 总 DOM 元素 | 545 | 🟢 合理 |
| JS 脚本数 | 21 | 🟡 偏多但 async 加载 |
| 内联样式数 | 158 | 🟡 偏多 (Tailwind 生成) |
| 控制台错误 | 0 | 🟢 无错误 |

---

## SEO & Meta 信息

| 项目 | 状态 | 值 |
|------|------|-----|
| Title | ✅ | Cinacoin — Onchain Access, Simplified |
| Meta Description | ✅ | The onchain access layer for wallets, dApps, and chains... |
| OG Tags | ✅ | og:title, og:description, og:image (1200×630), og:url 完整 |
| Twitter Card | ✅ | summary_large_image, @cinacoin |
| Canonical | ✅ | https://cinacoin.com |
| Robots | ✅ | index, follow |
| Favicon | ✅ | /favicon.ico + /favicon.png (apple-touch-icon) |
| JSON-LD | ⚠️ | 存在但**重复输出两次** (Organization + WebSite schema) |
| Viewport | ✅ | width=device-width, initial-scale=1 |
| lang 属性 | ⚠️ | 初始为 "en"，切换后正确更新 |
| H1 | ✅ | 唯一 H1 标签 |
| 标题层级 | ✅ | H1 → H2 → H3 → H4 层级正确 |

---

## 无障碍 (Accessibility)

| 项目 | 状态 | 备注 |
|------|------|------|
| Skip Link | ✅ | "Skip to main content" |
| Main Landmark | ✅ | `<main>` 存在 |
| Navigation | ✅ | `<nav>` 存在 |
| Contentinfo | ✅ | `<footer>` 存在 |
| Banner Role | ⚠️ | 缺少 `<header>` 元素和 `role="banner"` |
| Alt Text | ✅ | 所有图片有 alt 文本 |
| Form Labels | ✅ | 无未标记的输入框 |
| Color Contrast | ✅ | 未检测到低对比度问题 |
| ARIA Labels | ✅ | 按钮均有 aria-label |

---

## 发现的问题

### 🔴 严重问题

1. **移动端水平溢出 (375px)**
   - `document.scrollWidth > document.clientWidth`
   - 影响 iPhone 等小屏设备的用户体验
   - 可能出现不必要的水平滚动条

2. **Docs 页面语言混乱**
   - `lang="en"` 但内容主要为中文（113个中文字符 / 总848字符）
   - 标题混合中英文："Cinacoin\n自有品牌链上 UX 工具包"
   - 副标题英文，功能描述全中文
   - 对 SEO 和屏幕阅读器不友好

### 🟡 中等问题

3. **页面标题重复品牌名**
   - Pricing: "Pricing — Cinacoin | Cinacoin" (Cinacoin 出现两次)
   - About: "About — Cinacoin | Cinacoin"
   - 应改为 "Pricing | Cinacoin" 格式

4. **语言切换后布局偏移**
   - 切换到中文后，语言按钮移出视口 (element is outside of the viewport)
   - 用户可能无法切回英文

5. **JSON-LD 结构化数据重复**
   - 相同的 Organization + WebSite schema 在 `<head>` 中出现两次
   - 可能导致搜索引擎解析混乱

6. **Footer "SDKs" 链接指向 GitHub**
   - 文字为 "SDKs" 但 href 指向 github.com/cinagroup/cinacoin
   - 应指向专门的 SDK 文档页面

### 🟢 轻微问题

7. **缺少 `<header>` 元素**
   - 顶部导航区域未使用语义化 `<header>` 标签
   - 缺少 `role="banner"` landmark

8. **部分外部链接缺少 `target="_blank"`**
   - "View on GitHub"、footer 社交链接等未设置新窗口打开
   - 不一致：部分 docs 链接有 `target="_blank"`，部分没有

9. **Footer 社交链接缺少可访问文本**
   - X (Twitter)、GitHub、Discord 链接的 `innerText` 为空
   - 仅靠图标，缺少 `aria-label` 验证（虽然可能有 SVG title）

10. **内联样式过多 (158个)**
    - 虽然 Tailwind 正常生成，但增加了 HTML 体积
    - 建议审计是否有冗余样式

---

## 改进建议

### 优先级 P0 (立即修复)

1. **修复移动端水平溢出**
   ```css
   /* 排查溢出元素，常见原因： */
   /* - 代码块 (pre/code) 未设置 overflow-x: auto */
   /* - 固定宽度元素超过视口 */
   /* - chain logo 滚动区域溢出 */
   body { overflow-x: hidden; } /* 临时方案 */
   /* 建议找到根因并修复 */
   ```

2. **修复 Docs 页面语言问题**
   - 根据用户浏览器语言或选择动态切换
   - 添加语言路由 (如 `/docs/zh/`, `/docs/en/`)
   - 或统一为英文（面向国际开发者）

### 优先级 P1 (尽快修复)

3. **修复页面标题格式**
   ```
   当前: "Pricing — Cinacoin | Cinacoin"
   建议: "Pricing | Cinacoin"
   ```

4. **修复语言切换后的布局偏移**
   - 确保语言按钮在视口内固定定位
   - 测试中文（较长文本）下的导航布局

5. **去除重复的 JSON-LD**
   - 只保留一份结构化数据

### 优先级 P2 (计划修复)

6. **添加语义化 `<header>` 标签**
   ```html
   <header role="banner">
     <!-- 导航栏内容 -->
   </header>
   ```

7. **统一外部链接行为**
   - 所有外部链接添加 `target="_blank" rel="noopener noreferrer"`

8. **Footer 社交链接添加 aria-label**
   ```html
   <a href="https://x.com/cinacoin" aria-label="Follow us on X (Twitter)">
   ```

9. **添加更多语言的 OG 标签**
   ```html
   <meta property="og:locale" content="en_US">
   <meta property="og:locale:alternate" content="zh_CN">
   ```

10. **考虑添加更多页面功能**
    - Blog/Changelog 页面（已有链接但可能未实现）
    - Contact 页面的表单
    - 搜索功能（Docs 站有搜索但主站没有）

---

## 总结

| 类别 | 评分 | 说明 |
|------|------|------|
| 功能完整性 | ⭐⭐⭐⭐ | 核心功能正常，导航/主题/语言均可用 |
| 视觉设计 | ⭐⭐⭐⭐ | 专业现代，暗色/亮色主题均美观 |
| 响应式设计 | ⭐⭐⭐ | 桌面/平板良好，移动端有溢出问题 |
| 性能 | ⭐⭐⭐⭐⭐ | 极快的加载速度 (<400ms FCP) |
| SEO | ⭐⭐⭐⭐ | Meta 信息完整，有小问题需修复 |
| 无障碍 | ⭐⭐⭐⭐ | 基础良好，缺少 header landmark |
| 国际化 | ⭐⭐⭐ | 中英双语可用，但 Docs 页语言混乱 |

**总体评价:** 网站整体质量较高，技术栈现代 (Next.js)，性能优秀。主要问题集中在移动端适配和 Docs 页面语言混乱。建议优先修复 P0 问题。
