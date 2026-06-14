# 部署检查清单 — 安全修复后

**日期:** 2026-06-08  
**版本:** v2026.06.08-security-fix

---

## ✅ 已完成任务

### 1. 撤销暴露的 Cloudflare API Token
- [x] `.env` 中的 `CF_API_TOKEN` 已替换为占位符
- [x] 确认 `.env` 在 `.gitignore` 中
- [ ] **待执行:** 登录 Cloudflare Dashboard，撤销旧 Token 并生成新 Token

### 2. 轮换所有密钥
- [x] 创建 `scripts/generate-secrets.sh` 密钥生成脚本
- [x] 生成 `.env.production.new` 包含所有新密钥
- [ ] **待执行:** 将新密钥迁移到生产环境密钥管理系统 (AWS Secrets Manager / Vault)
- [ ] **待执行:** 更新所有服务的环境变量配置

### 3. 代码审查
- [x] 审查 `KeyManager.ts` — 移除硬编码 fallback，添加随机盐值
- [x] 审查 `cross-chain-sync/identity.ts` — 使用 SHA-256 替换 djb2
- [x] 审查 `VerifyingPaymaster.ts` — 使用真实 UserOp hash 替换零哈希
- [x] 审查 `authSession.ts` — 标记为 deprecated，使用 secureAuthSession
- [x] 审查 `siwe.ts` — 改用服务端签名验证

### 4. 部署到测试环境
- [ ] 构建 Docker 镜像
- [ ] 更新测试环境密钥
- [ ] 部署到测试环境
- [ ] 运行集成测试
- [ ] 验证安全修复生效

---

## 🚀 部署步骤

### Step 1: 准备密钥

```bash
# 1. 生成新密钥
./scripts/generate-secrets.sh .env.production

# 2. 手动配置外部服务密钥
# - CF_API_TOKEN (Cloudflare)
# - NEXT_PUBLIC_MOONPAY_API_KEY (MoonPay)
# - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (Cinacoin)

# 3. 上传到密钥管理系统
# AWS Secrets Manager:
aws secretsmanager create-secret \
  --name cinacoin/production \
  --secret-string file://.env.production

# 或 HashiCorp Vault:
vault kv put secret/cinacoin/production @.env.production
```

### Step 2: 构建镜像

```bash
# 构建所有应用镜像
docker build -t cinacoin/keys-server:latest -f packages/keys-server/Dockerfile .
docker build -t cinacoin/bundler:latest -f apps/bundler/Dockerfile .
docker build -t cinacoin/paymaster:latest -f apps/paymaster/Dockerfile .
docker build -t cinacoin/push-server:latest -f apps/push-server/Dockerfile .

# 推送到镜像仓库
docker push cinacoin/keys-server:latest
docker push cinacoin/bundler:latest
docker push cinacoin/paymaster:latest
docker push cinacoin/push-server:latest
```

### Step 3: 部署到测试环境

```bash
# 使用 docker-compose 部署测试环境
export NODE_ENV=production
export ENCRYPTION_KEY=<from-secrets-manager>
export JWT_SECRET=<from-secrets-manager>
# ... 其他环境变量

docker-compose up -d

# 检查服务状态
docker-compose ps
docker-compose logs -f
```

### Step 4: 验证部署

```bash
# 1. 验证密钥服务启动
curl -X POST http://localhost:3001/health

# 2. 验证 Bundler 认证
curl -X POST http://localhost:3002/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# 应该返回 401 Unauthorized

# 3. 验证带认证的请求
curl -X POST http://localhost:3002/rpc \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <BUNDLER_API_KEY>" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# 应该返回成功

# 4. 验证跨链哈希 (SHA-256)
# 检查日志确认使用 @noble/hashes

# 5. 验证 Paymaster 签名
# 检查日志确认不再使用零哈希
```

### Step 5: 运行集成测试

```bash
# 运行完整测试套件
pnpm test

# 运行特定包的测试
pnpm test --filter=@cinacoin/keys-server
pnpm test --filter=@cinacoin/cross-chain-sync
pnpm test --filter=@cinacoin/paymaster

# 运行 E2E 测试
pnpm test:e2e
```

---

## ⚠️ 回滚计划

如果部署出现问题，执行以下回滚：

```bash
# 1. 停止新服务
docker-compose down

# 2. 恢复旧镜像
docker pull cinacoin/keys-server:previous
docker tag cinacoin/keys-server:previous cinacoin/keys-server:latest

# 3. 重新启动
docker-compose up -d

# 4. 验证服务恢复
curl http://localhost:3001/health
```

---

## 📋 部署后检查

- [ ] 所有服务健康检查通过
- [ ] Bundler 认证生效 (无 API Key 返回 401)
- [ ] Paymaster 签名使用真实 hash
- [ ] 跨链同步使用 SHA-256
- [ ] 前端 SIWE 验证走服务端
- [ ] 日志中无安全警告
- [ ] 监控指标正常

---

## 🔐 密钥管理最佳实践

1. **定期轮换** — 每 90 天轮换所有密钥
2. **最小权限** — 每个服务只访问需要的密钥
3. **审计日志** — 记录所有密钥访问
4. **备份** — 密钥加密备份到多个位置
5. **测试** — 在测试环境验证密钥轮换流程

---

*部署检查清单 v1.0 — 2026-06-08*
