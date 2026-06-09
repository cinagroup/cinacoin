# Cinacoin 优化修复报告

**日期**: 2026-05-31  
**状态**: ✅ 已完成

---

## 🔧 修复汇总

### 1. Worker URLs 安全修复
- **问题**: 客户端 bundle 中硬编码了 Worker 直接 URL
- **修复**: 改为相对路径 `/api/rpc`, `/api/keys` 等
- **文件**: 
  - `apps/backend-dashboard/src/lib/services.ts`
  - `apps/backend-dashboard/src/app/settings/page.tsx`

### 2. API 代理配置
- **新增**: `apps/backend-dashboard/public/_redirects`
- **作用**: 通过 Cloudflare Pages 代理 API 请求到 Workers
- **规则**:
  ```
  /api/rpc/*    → https://rpc.cinacoin.com/:splat
  /api/keys/*   → https://keys.cinacoin.com/:splat
  /api/relay/*  → https://relay.cinacoin.com/:splat
  /api/notify/* → https://notify.cinacoin.com/:splat
  /api/push/*   → https://push.cinacoin.com/:splat
  ```

### 3. 安全响应头
- **新增**: `_headers` 文件到所有 Pages 站点
- **站点**:
  - `apps/website/public/_headers`
  - `apps/demo/public/_headers`
  - `apps/backend-dashboard/public/_headers`
  - `apps/health-status/public/_headers`
  - `docs-site/docs/.vitepress/dist/_headers`
- **包含**:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy
  - Cross-Origin-Opener-Policy
  - Cross-Origin-Resource-Policy
  - HSTS (next.config.ts 已有)
  - CSP (next.config.ts 已有)

### 4. Workers CORS 配置
- **状态**: 所有 5 个 Workers 已包含 `https://dash.cinacoin.com`
- **Workers**:
  - rpc-proxy ✅
  - keys-server ✅
  - relay-server ✅
  - notify-server ✅
  - push-server ✅

### 5. 配置修复
- **push-server wrangler.toml**: 修复路由模式
- **notify-server wrangler.toml**: 移除验证警告

---

## 📊 最终状态

| 组件 | 状态 |
|------|------|
| rpc-proxy | ✅ Online |
| keys-server | ✅ Online |
| relay-server | ✅ Online |
| notify-server | ✅ Online |
| push-server | ✅ Online |
| cinacoin.com | ✅ 200 |
| demo.cinacoin.com | ✅ 200 |
| dash.cinacoin.com | ✅ 200 |
| docs.cinacoin.com | ⚠️ 530 (需重新部署) |
| status.cinacoin.com | ⚠️ 530 (需重新部署) |

---

## ⚠️ 剩余问题（需 API Token 部署）

1. **docs.cinacoin.com** - 返回 530，需要重建并部署 docs-site
2. **status.cinacoin.com** - 返回 530，需要重建并部署 health-status
3. **Workers 重新部署** - 代码修改需要 `CLOUDFLARE_API_TOKEN` 才能部署
4. **Dashboard 重建** - 需要重新构建以包含新的 _redirects 和 services.ts 更改

---

## 📝 部署命令（需要 API Token）

```bash
cd onux

# 重新构建 Dashboard
pnpm dashboard:build

# 部署 Workers
pnpm exec wrangler deploy -c packages/keys-server/wrangler.toml
pnpm exec wrangler deploy -c packages/relay-server/wrangler.toml
pnpm exec wrangler deploy -c packages/notify-server/wrangler.toml
pnpm exec wrangler deploy -c packages/push-server/wrangler.toml

# 部署 Pages
pnpm exec wrangler pages deploy docs-site/docs/.vitepress/dist --project-name=cinacoin-docs
pnpm exec wrangler pages deploy apps/health-status/out --project-name=cinacoin-health-status
```
