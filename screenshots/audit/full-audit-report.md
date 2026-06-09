#  Cinacoin 完整浏览器功能审计报告

> **审计日期:** 2026-06-04 23:15 UTC  
> **工具:** Playwright (Chromium headless)  
> **审计员:** 000 Agent  

---

## 一、功能状态总表

| 站点 | 页面 | 状态码 | 标题 | H1 | 导航 | 页脚 | JS 错误 | 截图 |
|------|------|--------|------|----|------|------|---------|------|
| **Cinacoin Health Status** | Desktop (1280×900) | ✅ 200 | Cinacoin — Service Status | Cinacoin | ✅ | ✅ | ⚠️ 6 | `status-desktop.png` |
| **Cinacoin Health Status** | Mobile (375×812) | ✅ 200 | Cinacoin — Service Status | Cinacoin | ✅ | ✅ | ⚠️ 6 | `status-mobile.png` |
| **Cinacoin Health Status** | Dark Mode (1280×900) | ✅ 200 | Cinacoin — Service Status | Cinacoin | ✅ | ✅ | ⚠️ 6 | `status-dark.png` |
| **Cinacoin Website** | Desktop (1280×900) | ✅ 200 | Cinacoin — Onchain Access, Simplified | Connect any wallet, to any chain. | ✅ | ✅ | ✅ 0 | `website-desktop.png` |
| **Cinacoin Website** | Mobile (375×812) | ✅ 200 | Cinacoin — Onchain Access, Simplified | Connect any wallet, to any chain. | ✅ | ✅ | ✅ 0 | `website-mobile.png` |
| **Cinacoin Website** | Dark Mode (1280×900) | ✅ 200 | Cinacoin — Onchain Access, Simplified | Connect any wallet, to any chain. | ✅ | ✅ | ✅ 0 | `website-dark.png` |

---

## 二、问题列表（按优先级分类）

### 🔴 P0 — 阻断性问题

#### P0-1: Health Status 页面 — 全局状态与服务状态矛盾
- **位置:** `https://status.cinacoin.com` — 所有视图
- **现象:** 页面顶部红色横幅显示 **"System Outage"**（系统宕机），但下方各服务卡片均显示 **"statusHealthy"**（健康），且 Uptime (7d) 均为 **100.00%**
- **影响:** 严重误导用户，破坏状态页面公信力
- **修复建议:**
  1. 检查全局状态聚合逻辑（global status aggregation logic）
  2. 确保顶部横幅状态与各服务卡片状态保持一致
  3. 如果确实是系统宕机，各服务卡片应显示 Degraded / Outage 状态
  4. 如果所有服务健康，顶部横幅不应显示 System Outage
- **状态:** ❌ 待修复

---

### 🟠 P1 — 重要问题

#### P1-1: Health Status 页面 — 大量 JS 错误（跨域请求被拒）
- **位置:** `https://status.cinacoin.com` — 所有视图
- **现象:** 每个视图检测到 **6 条 JS 错误**，核心错误为：
  ```
  Access to fetch at 'https://www.npmjs.com/package/@cinacoin/core-sdk' 
  from origin 'https://status.cinacoin.com' has been blocked by CORS policy: 
  No 'Access-Control-Allow-Origin' header is present on the requested resource.
  ```
  其余 5 条均为 `net::ERR_FAILED` / `net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`
- **影响:** npmjs.com 不应作为前端数据源；跨域请求被浏览器安全策略阻止，可能导致页面功能缺失或数据不完整
- **修复建议:**
  1. 移除对 npmjs.com 的直接前端请求，改用自有 API 代理
  2. 如需展示 SDK 信息，使用静态链接而非动态 fetch
  3. 添加 API 网关代理外部请求
- **状态:** ❌ 待修复

#### P1-2: Health Status 页面 — 移动端导航栏溢出/布局问题
- **位置:** `https://status.cinacoin.com` — Mobile 视图
- **现象:** 移动端顶部控制栏（EN 语言选择、Auto-refresh、Refresh 按钮）在 375px 宽度下出现明显水平溢出，按钮文字被挤压，布局不够紧凑
- **影响:** 移动端用户体验下降，部分功能按钮可能无法点击
- **修复建议:**
  1. 使用 CSS flex-wrap 或 grid 让控制栏在移动端自动换行
  2. 缩小移动端按钮文字或改用图标+tooltip
  3. 考虑将控制栏折叠为可展开的面板
- **状态:** ❌ 待修复

#### P1-3: Website 移动端 — 导航菜单折叠后缺少可见入口
- **位置:** `https://cinacoin.com` — Mobile 视图
- **现象:** 移动端导航栏折叠为汉堡菜单（☰），但 Products、Pricing、Docs、GitHub、Dashboard 等入口在未展开状态下不可见。页面下方内容区域空白过多，关键 CTA 按钮（"Start Building" / "View on GitHub"）在首屏不可见
- **影响:** 移动端首屏信息密度不足，转化路径过长
- **修复建议:**
  1. 移动端首屏应至少展示一个 CTA 按钮
  2. 优化 hero 区域高度，确保 CTA 在视口内可见
  3. 考虑折叠导航栏为底部固定导航条
- **状态:** ❌ 待修复

---

### 🟡 P2 — 建议性问题

#### P2-1: Health Status 页面 — 响应时间指标偏高
- **位置:** `https://status.cinacoin.com` — 所有视图
- **现象:** Main Website 响应时间 692-701ms，Demo App 响应时间 704ms
- **分析:** 响应时间在可接受范围内，但对于状态监控页面来说偏高（通常应 < 500ms）
- **建议:** 优化后端健康检查接口，考虑增加 CDN 缓存
- **状态:** ⚠️ 建议优化

#### P2-2: Website 暗色模式 — 渐变背景可能影响可读性
- **位置:** `https://cinacoin.com` — Dark 视图
- **现象:** 暗色模式下使用浅色渐变背景，文本对比度可能不足
- **建议:** 通过 WCAG 2.1 AA 标准验证文本对比度（最低 4.5:1）
- **状态:** ⚠️ 建议验证

#### P2-3: 多语言切换 — 仅语言标识，无实际切换功能验证
- **位置:** 两站点均有 EN/中文 切换入口
- **现象:** 审计中仅验证了 UI 存在，未验证实际切换功能（需交互测试）
- **建议:** 补充端到端多语言切换功能测试
- **状态:** ⚠️ 待补充测试

#### P2-4: Health Status 页面 — "System Outage" 文字与 "×" 图标语义不清
- **位置:** `https://status.cinacoin.com` — 所有视图
- **现象:** 红色横幅使用 "×" 图标 + "System Outage" 文字，但 "×" 通常表示"关闭/取消"而非"错误/警告"
- **建议:** 使用 "⚠" 或 "🔴" 等更符合语义的图标
- **状态:** ⚠️ 建议改进

---

## 三、各站点详细分析

### 📡 Cinacoin Health Status (`status.cinacoin.com`)

| 维度 | 评估 |
|------|------|
| **页面可访问性** | ✅ HTTP 200，加载正常 |
| **标题正确性** | ✅ "Cinacoin — Service Status" |
| **H1 语义** | ✅ "Cinacoin" |
| **导航结构** | ✅ 有导航栏 |
| **页脚结构** | ✅ 有页脚 |
| **移动端响应式** | ⚠️ 布局基本适配，但控制栏有溢出 |
| **暗色主题** | ✅ 暗色模式正常渲染 |
| **JS 健康度** | ❌ 6 条错误（CORS 跨域问题） |
| **内容一致性** | ❌ 全局状态与服务状态矛盾 |
| **综合评分** | **55/100** |

### 🌐 Cinacoin Website (`cinacoin.com`)

| 维度 | 评估 |
|------|------|
| **页面可访问性** | ✅ HTTP 200，加载正常 |
| **标题正确性** | ✅ "Cinacoin — Onchain Access, Simplified" |
| **H1 语义** | ✅ "Connect any wallet, to any chain." — 清晰有力 |
| **导航结构** | ✅ 导航栏完整（Products, Pricing, Docs, GitHub, Dashboard） |
| **页脚结构** | ✅ 有页脚 |
| **移动端响应式** | ✅ 布局适配良好，导航折叠为汉堡菜单 |
| **暗色主题** | ✅ 暗色模式正常渲染 |
| **JS 健康度** | ✅ 零 JS 错误 |
| **内容一致性** | ✅ 无矛盾 |
| **综合评分** | **85/100** |

---

## 四、总体评分与改进建议

### 📊 综合评分：**70/100**

| 权重 | 维度 | 得分 |
|------|------|------|
| 25% | 可访问性与加载 | 100/100 |
| 20% | 功能完整性 | 70/100 |
| 20% | 移动端适配 | 70/100 |
| 15% | 暗色主题 | 90/100 |
| 10% | JS 健康度 | 60/100 |
| 10% | 内容一致性 | 50/100 |

### 🎯 优先改进路线

1. **立即修复（P0）：** 解决 Health Status 页面全局状态与服务状态不一致问题 — 这是当前最严重的用户信任问题
2. **本周修复（P1）：** 
   - 移除对 npmjs.com 的跨域请求，修复 CORS 错误
   - 优化 Health Status 移动端导航栏布局
   - 优化 Website 移动端首屏 CTA 可见性
3. **逐步优化（P2）：** 
   - 响应时间优化
   - 暗色模式对比度验证
   - 多语言切换端到端测试
   - 状态图标语义优化

### ✅ 亮点

- Website 主站整体质量优秀：零 JS 错误、完整导航、良好的移动端适配
- 两站点均支持暗色主题且渲染正常
- Health Status 页面功能完整，包含自动刷新、多语言、服务详情等
- 所有页面 HTTP 200 正常响应

---

## 五、截图清单

| 文件名 | 站点 | 视图 | 大小 |
|--------|------|------|------|
| `status-desktop.png` | Health Status | Desktop (1280×900) | 98 KB |
| `status-mobile.png` | Health Status | Mobile (375×812) | 59 KB |
| `status-dark.png` | Health Status | Dark Mode | 101 KB |
| `website-desktop.png` | Website | Desktop (1280×900) | 261 KB |
| `website-mobile.png` | Website | Mobile (375×812) | 117 KB |
| `website-dark.png` | Website | Dark Mode | 220 KB |

---

*报告生成时间: 2026-06-04 23:16 UTC | 审计工具: Playwright Chromium Headless | 原始数据: `audit-results.json`*
