# Cloudflare Pages 部署文档

## 概述

本文档说明如何将 8 个 Next.js 前端应用迁移到 Cloudflare Pages。

## 应用列表

| 应用名称 | Cloudflare 项目名 | 预期域名 |
|---------|------------------|---------|
| website | cinacoin-website | cinacoin-website.pages.dev |
| demo | cinacoin-demo | cinacoin-demo.pages.dev |
| backend-dashboard | cinacoin-backend-dashboard | cinacoin-backend-dashboard.pages.dev |
| analytics-dashboard | cinacoin-analytics-dashboard | cinacoin-analytics-dashboard.pages.dev |
| cloud-dashboard | cinacoin-cloud-dashboard | cinacoin-cloud-dashboard.pages.dev |
| health-status | cinacoin-health-status | cinacoin-health-status.pages.dev |
| wallet-explorer | cinacoin-wallet-explorer | cinacoin-wallet-explorer.pages.dev |
| unified-dashboard | cinacoin-unified-dashboard | cinacoin-unified-dashboard.pages.dev |

## 前置条件

1. **Cloudflare 账户**: 需要有效的 Cloudflare 账户
2. **API Token**: 创建 Cloudflare API Token（需要 Pages 权限）
3. **Account ID**: 从 Cloudflare Dashboard 获取
4. **Wrangler CLI**: `npm install -g wrangler`
5. **Node.js**: 版本 18+ 推荐

## 环境变量配置

### GitHub Secrets

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加：

- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID

### 本地环境变量

创建 `.env` 文件或导出到 shell：

```bash
export CLOUDFLARE_API_TOKEN="your-api-token-here"
export CLOUDFLARE_ACCOUNT_ID="your-account-id-here"
```

## 部署步骤

### 方法一：手动部署（单个应用）

```bash
# 1. 进入应用目录
cd apps/website

# 2. 安装依赖
npm install

# 3. 构建应用
npx next build

# 4. 部署到 Cloudflare Pages
npx wrangler pages deploy .vercel/output/static --project-name=cinacoin-website
```

### 方法二：使用部署脚本

```bash
# 部署单个应用
./scripts/deploy-pages.sh website

# 部署所有应用
./scripts/deploy-pages.sh --all
```

### 方法三：CI/CD 自动部署

推送代码到 `main` 分支会自动触发部署：

```bash
git add .
git commit -m "Update website"
git push origin main
```

GitHub Actions 会自动：
1. 检测变更的应用
2. 构建变更的应用
3. 部署到 Cloudflare Pages
4. 在 PR 中添加预览链接

## 首次部署

首次部署时，Cloudflare Pages 项目会自动创建：

```bash
# 登录 Cloudflare
npx wrangler login

# 验证登录
npx wrangler whoami

# 部署任意应用（项目会自动创建）
./scripts/deploy-pages.sh website
```

## 自定义域名配置

### 1. 在 Cloudflare Dashboard 添加域名

1. 进入 Cloudflare Pages 项目
2. 点击 "Custom domains"
3. 点击 "Set up a custom domain"
4. 输入域名（如 `www.cinacoin.com`）
5. 按照提示添加 DNS 记录

### 2. 推荐的域名映射

| 应用 | 自定义域名 |
|-----|-----------|
| website | www.cinacoin.com / cinacoin.com |
| demo | demo.cinacoin.com |
| backend-dashboard | admin.cinacoin.com |
| analytics-dashboard | analytics.cinacoin.com |
| cloud-dashboard | cloud.cinacoin.com |
| health-status | status.cinacoin.com |
| wallet-explorer | explorer.cinacoin.com |
| unified-dashboard | dashboard.cinacoin.com |

## Next.js 配置说明

所有应用的 `next.config.js` 已配置为静态导出：

```javascript
const nextConfig = {
  output: 'export',  // 静态导出
  images: {
    unoptimized: true,  // 禁用图片优化（Pages 不支持）
  },
  trailingSlash: true,  // URL 末尾添加斜杠
}
```

### 限制

- **不支持**: Server-side rendering (SSR)
- **不支持**: API Routes
- **不支持**: Next.js Image Optimization
- **支持**: Static Site Generation (SSG)
- **支持**: Client-side rendering

### 迁移注意事项

如果应用使用了 SSR 或 API Routes，需要：

1. 将数据获取改为客户端获取（`useEffect` + `fetch`）
2. 将 API Routes 迁移到独立的 API 服务
3. 使用 `getStaticProps` 或 `getStaticPaths` 替代 `getServerSideProps`

## Wrangler 配置说明

每个应用的 `wrangler.toml` 配置：

```toml
name = "cinacoin-{app-name}"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[vars]
NEXT_PUBLIC_API_URL = "https://api.cinacoin.com"
NEXT_PUBLIC_WS_URL = "wss://ws.cinacoin.com"
NEXT_PUBLIC_APP_NAME = "CinaCoin {App Name}"
```

## 故障排查

### 构建失败

```bash
# 检查 Next.js 版本
npx next --version

# 清理缓存重新构建
rm -rf .next .vercel node_modules
npm install
npx next build
```

### 部署失败

```bash
# 检查 Wrangler 版本
wrangler --version

# 重新登录
wrangler login

# 检查 API Token
wrangler whoami
```

### 页面 404

- 确认 `output: 'export'` 配置正确
- 确认构建输出目录存在：`.vercel/output/static`
- 检查 `trailingSlash: true` 配置

## 监控和日志

### Cloudflare Dashboard

1. 进入 Pages 项目
2. 查看 "Deployments" 标签
3. 查看构建日志和部署历史

### 分析

```bash
# 查看项目列表
wrangler pages project list

# 查看部署历史
wrangler pages deployment list --project-name=cinacoin-website
```

## 回滚部署

```bash
# 查看部署列表
wrangler pages deployment list --project-name=cinacoin-website

# 回滚到特定部署（通过 Dashboard）
# 1. 进入 Pages 项目
# 2. 点击 "Deployments"
# 3. 找到要回滚的部署
# 4. 点击 "Rollback to deployment"
```

## 性能优化建议

1. **启用缓存**: 在 `_headers` 文件中配置缓存策略
2. **压缩资源**: 使用 Brotli/Gzip 压缩
3. **优化图片**: 使用 WebP 格式，预压缩图片
4. **代码分割**: 使用动态导入减少初始包大小
5. **预加载关键资源**: 使用 `<link rel="preload">`

## 安全建议

1. **环境变量**: 不要在代码中硬编码敏感信息
2. **CSP 头**: 配置 Content Security Policy
3. **CORS**: 正确配置跨域策略
4. **HTTPS**: Cloudflare Pages 自动提供 HTTPS

## 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Next.js 静态导出](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)

## 支持

如有问题，请：
1. 查看 Cloudflare Dashboard 的构建日志
2. 检查 GitHub Actions 日志
3. 联系运维团队
