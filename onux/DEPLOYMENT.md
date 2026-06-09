# Cinacoin 部署指南

## 环境要求

### Cloudflare API Token

部署 Worker 服务需要配置 Cloudflare API Token：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. 创建 API Token，选择 "Edit Cloudflare Workers" 模板
3. 添加以下权限：
   - Account:Cloudflare Workers:Edit
   - Zone:Cloudflare Workers:Edit
   - Zone:Zone:Read
   - Zone:DNS:Edit
4. 设置环境变量：

```bash
export CLOUDFLARE_API_TOKEN="your_token_here"
```

## 部署命令

### 1. RPC Proxy Worker

```bash
cd packages/rpc-proxy
npx wrangler deploy
```

### 2. Keys Server Worker

```bash
cd packages/keys-server
npx wrangler deploy
```

### 3. Relay Server Worker

```bash
cd packages/relay-server
npx wrangler deploy
```

### 4. Notify Server Worker

```bash
cd packages/notify-server
npx wrangler deploy
```

### 5. Push Server Worker

```bash
cd packages/push-server
npx wrangler deploy
```

## Vercel 部署

前端应用通过 Vercel 自动部署：

```bash
# 推送代码到 main 分支
git push origin main

# 或手动触发部署
cd apps/website
npx vercel --prod
```

## 部署后验证

### 验证 RPC Proxy

```bash
curl -X POST https://rpc.cinacoin.com \
  -H "Content-Type: application/json" \
  -H "X-Chain-Id: 1" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

应返回类似：
```json
{"jsonrpc":"2.0","id":1,"result":"0x..."}
```

### 验证其他 Worker

```bash
curl https://keys.cinacoin.com/health
curl https://relay.cinacoin.com/health
curl https://notify.cinacoin.com/health
curl https://push.cinacoin.com/health
```

所有应返回 `{"status":"ok",...}`

## 故障排查

### RPC Proxy 返回 "Not found"

**原因**: Worker 路由未正确配置

**解决**:
1. 检查 `wrangler.toml` 中的 `routes` 配置
2. 确保路由模式匹配域名：`{ pattern = "rpc.cinacoin.com/*", zone_name = "cinacoin.com" }`
3. 重新部署 Worker

### Website 显示旧内容

**原因**: CDN 缓存或部署未完成

**解决**:
1. 检查 Vercel 部署状态
2. 清除 Cloudflare CDN 缓存
3. 等待 5-10 分钟让缓存刷新

### Backend Dashboard 无法访问

**原因**: DNS 未配置或 Vercel 项目未关联

**解决**:
1. 检查 Vercel 项目域名配置
2. 确认 DNS 记录指向 Vercel
3. 检查 `backend.cinacoin.com` DNS 解析

## 监控

### Worker 健康检查

所有 Worker 都提供 `/health` 端点：

```bash
# 检查所有 Worker 状态
for service in rpc keys relay notify push; do
  echo "$service.cinacoin.com: $(curl -s https://$service.cinacoin.com/health | jq -r .status)"
done
```

### 日志查看

```bash
# 查看 Worker 实时日志
npx wrangler tail
```

## 回滚

如需回滚到上一个版本：

```bash
# 查看部署历史
npx wrangler deployments list

# 回滚到指定版本
npx wrangler deployments rollback <deployment_id>
```
