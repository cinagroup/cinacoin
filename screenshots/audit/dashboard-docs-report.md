# Cinacoin Backend Dashboard & Docs — 浏览器功能审计报告

**生成时间:** 2026-06-04T23:18:19.157Z
**视口:** Desktop 1280x900 + Mobile 375x812 (暗色模式)
**工具:** Playwright (Chromium)

---

## 📊 总览

| 站点 | 页面数 | ✅ 正常 | ⚠️ 部分 | ❌ 异常 |
|------|--------|---------|---------|---------|
| Dashboard | 10 | 10 | 0 | 0 |
| Docs | 8 | 8 | 0 | 0 |

---

## 🖥️ Backend Dashboard (dash.cinacoin.com)

- ✅ 正常 **/** — Cinacoin — Backend Dashboard [HTTP 200]
  - Desktop: ![/](Dashboard-_-desktop.png)
  - Mobile: ![Mobile](Dashboard-_-mobile.png)

- ✅ 正常 **/login** — Cinacoin — Backend Dashboard [HTTP 200]
  - Desktop: ![/login](Dashboard-_login-desktop.png)
  - Mobile: ![Mobile](Dashboard-_login-mobile.png)

- ✅ 正常 **/analytics** — Cinacoin — Backend Dashboard [HTTP 200]
  - Desktop: ![/analytics](Dashboard-_analytics-desktop.png)
  - Mobile: ![Mobile](Dashboard-_analytics-mobile.png)

- ✅ 正常 **/chains** — Cinacoin — Backend Dashboard [HTTP 200]
  - Desktop: ![/chains](Dashboard-_chains-desktop.png)
  - Mobile: ![Mobile](Dashboard-_chains-mobile.png)

- ✅ 正常 **/notify-server** — Cinacoin — Backend Dashboard [HTTP 200]
  - Desktop: ![/notify-server](Dashboard-_notify-server-desktop.png)
  - Mobile: ![Mobile](Dashboard-_notify-server-mobile.png)

- ✅ 正常 **/project** — Cinacoin — Backend Dashboard [HTTP 200]
  - Desktop: ![/project](Dashboard-_project-desktop.png)
  - Mobile: ![Mobile](Dashboard-_project-mobile.png)

- ✅ 正常 **/push-server** — Cinacoin — Backend Dashboard [HTTP 200]
  - Desktop: ![/push-server](Dashboard-_push-server-desktop.png)
  - Mobile: ![Mobile](Dashboard-_push-server-mobile.png)

- ✅ 正常 **/relay-server** — Cinacoin — Backend Dashboard [HTTP 200]
  - Desktop: ![/relay-server](Dashboard-_relay-server-desktop.png)
  - Mobile: ![Mobile](Dashboard-_relay-server-mobile.png)

- ✅ 正常 **/rpc-proxy** — Cinacoin — Backend Dashboard [HTTP 200]
  - Desktop: ![/rpc-proxy](Dashboard-_rpc-proxy-desktop.png)
  - Mobile: ![Mobile](Dashboard-_rpc-proxy-mobile.png)

- ✅ 正常 **/settings** — Cinacoin — Backend Dashboard [HTTP 200]
  - Desktop: ![/settings](Dashboard-_settings-desktop.png)
  - Mobile: ![Mobile](Dashboard-_settings-mobile.png)

---

## 📖 Docs (docs.cinacoin.com)

- ✅ 正常 **/** — Cinacoin [HTTP 200]
  - Desktop: ![/](Docs-_-desktop.png)
  - Mobile: ![Mobile](Docs-_-mobile.png)

- ✅ 正常 **/guide/quick-start** — Quick Start | Cinacoin [HTTP 200]
  - Desktop: ![/guide/quick-start](Docs-_guide_quick-start-desktop.png)
  - Mobile: ![Mobile](Docs-_guide_quick-start-mobile.png)

- ✅ 正常 **/guide/installation** — Installation | Cinacoin [HTTP 200]
  - Desktop: ![/guide/installation](Docs-_guide_installation-desktop.png)
  - Mobile: ![Mobile](Docs-_guide_installation-mobile.png)

- ✅ 正常 **/guide/configuration** — Configuration | Cinacoin [HTTP 200]
  - Desktop: ![/guide/configuration](Docs-_guide_configuration-desktop.png)
  - Mobile: ![Mobile](Docs-_guide_configuration-mobile.png)

- ✅ 正常 **/api/core-sdk** — Core SDK | Cinacoin [HTTP 200]
  - Desktop: ![/api/core-sdk](Docs-_api_core-sdk-desktop.png)
  - Mobile: ![Mobile](Docs-_api_core-sdk-mobile.png)

- ✅ 正常 **/api/react** — React | Cinacoin [HTTP 200]
  - Desktop: ![/api/react](Docs-_api_react-desktop.png)
  - Mobile: ![Mobile](Docs-_api_react-mobile.png)

- ✅ 正常 **/zh/** — Cinacoin — 链上访问，化繁为简 | Cinacoin [HTTP 200]
  - Desktop: ![/zh/](Docs-_zh_-desktop.png)
  - Mobile: ![Mobile](Docs-_zh_-mobile.png)

- ✅ 正常 **/zh/guide/quick-start** — 快速开始 | Cinacoin [HTTP 200]
  - Desktop: ![/zh/guide/quick-start](Docs-_zh_guide_quick-start-desktop.png)
  - Mobile: ![Mobile](Docs-_zh_guide_quick-start-mobile.png)

---

## 🐛 发现的问题

_未发现问题_

---

## 💡 改进建议

_无重大改进建议。所有页面功能正常，暗色主题渲染正确，移动端响应式良好。_

### 备注

- Dashboard 为 SPA 单页应用，侧边栏导航在所有页面中正常工作
- Docs 站点中英文页面均正常渲染
- 未检测到 JavaScript 错误或控制台错误

---

*报告由 Playwright 自动生成*
