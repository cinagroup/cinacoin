# Cloudflare 部署配置

Cinacoin 项目的 Cloudflare 基础设施配置，包括路由、KV 存储、R2 对象存储和 CI/CD。

## 架构概览

```
api.cinacoin.com      → cinacoin-api Worker (API Gateway)
auth.cinacoin.com     → cinacoin-auth Worker (Auth Service)
ws.cinacoin.com       → cinacoin-api Worker (WebSocket)
dash.cinacoin.com     → cinacoin-dashboard Pages
website.cinacoin.com  → cinacoin-website Pages
```

## 目录结构

```
deploy/cloudflare/
├── .env.production        # 生产环境变量模板
├── deploy.sh              # 一键部署脚本
└── README.md              # 本文档

workers/api-gateway/
├── wrangler.toml          # API Gateway Worker 配置
└── src/lib/
    └── rate-limit-kv.ts   # KV 速率限制实现

.github/workflows/
└── deploy-cloudflare-workers.yml  # CI/CD 配置
```

## 前置条件

1. Cloudflare 账户和 API Token（需要 Workers、KV、R2、D1 权限）
2. `wrangler` CLI v3+：`npm install -g wrangler`
3. 域名 `cinacoin.com` 已托管在 Cloudflare DNS

## 快速部署

### 1. 配置环境变量

```bash
cd deploy/cloudflare
cp .env.production .env.production.local
# 编辑 .env.production.local 填入实际值
```

### 2. 运行部署脚本

```bash
# 从项目根目录执行
./deploy/cloudflare/deploy.sh
```

### 3. 手动部署（可选）

```bash
# 创建 D1 数据库
wrangler d1 create cinacoin-auth
wrangler d1 create cinacoin-users

# 创建 KV 命名空间
wrangler kv:namespace create RATE_LIMIT_KV
wrangler kv:namespace create SESSION_KV

# 创建 R2 存储桶
wrangler r2 bucket create cinacoin-avatars
wrangler r2 bucket create cinacoin-backups

# 部署 Workers
cd workers/auth-service && wrangler deploy
cd ../user-service && wrangler deploy
cd ../api-gateway && wrangler deploy
```

## 组件说明

### API Gateway (`workers/api-gateway/wrangler.toml`)

- **路由**: `api.cinacoin.com/*`, `auth.cinacoin.com/*`, `ws.cinacoin.com/*`
- **服务绑定**: `AUTH_SERVICE` → cinacoin-auth, `USER_SERVICE` → cinacoin-users
- **KV 绑定**: `RATE_LIMIT_KV` (速率限制), `SESSION_KV` (会话存储)
- **R2 绑定**: `AVATARS` (用户头像), `BACKUPS` (数据库备份)

### KV 速率限制 (`workers/api-gateway/src/lib/rate-limit-kv.ts`)

基于 KV 的滑动窗口速率限制器：

```typescript
const limiter = new KVRateLimiter(env.RATE_LIMIT_KV);
const result = await limiter.checkLimit('user:123', 100, 60000); // 100 req/min

if (!result.allowed) {
  return new Response('Rate limited', { status: 429 });
}
```

### R2 存储桶

| 桶名 | 用途 | 绑定名 |
|------|------|--------|
| `cinacoin-avatars` | 用户头像存储 | `AVATARS` |
| `cinacoin-backups` | 数据库备份 | `BACKUPS` |

## CI/CD

GitHub Actions 工作流 `.github/workflows/deploy-cloudflare-workers.yml`：

- **触发条件**: push 到 `main` 分支
- **步骤**:
  1. 部署 Workers (auth-service, user-service, api-gateway)
  2. 构建并部署 Pages (website, dashboard 等前端应用)
- **Secrets**: 需要在 GitHub 仓库设置中配置：
  - `CF_API_TOKEN`: Cloudflare API Token
  - `CF_ACCOUNT_ID`: Cloudflare Account ID

## 自定义域名

在 Cloudflare Dashboard 中配置：

1. 进入 Workers & Pages → 选择 Worker → Settings → Domains & Routes
2. 添加自定义域名，Cloudflare 会自动配置 DNS 和 SSL

## 监控

部署后可通过以下方式验证：

```bash
# 检查 Worker 状态
curl -I https://api.cinacoin.com/health

# 检查速率限制头
curl -v https://api.cinacoin.com/api/v1/projects \
  | grep -i x-ratelimit
```

## 故障排除

### Worker 部署失败

```bash
# 验证 wrangler.toml
wrangler deploy --dry-run --outdir=dist

# 检查账户 ID
wrangler whoami
```

### KV/R2 绑定错误

确保在 `wrangler.toml` 中使用正确的 ID（不是名称）：

```bash
# 列出 KV 命名空间
wrangler kv:namespace list

# 列出 R2 存储桶
wrangler r2 bucket list
```

### 域名路由不生效

1. 确认 DNS 记录指向 `@` 或 Worker
2. 确认 Zone ID 与 `wrangler.toml` 中一致
3. 等待 DNS 传播（通常 < 5 分钟）

## 相关文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [KV 存储文档](https://developers.cloudflare.com/kv/)
- [R2 存储文档](https://developers.cloudflare.com/r2/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
