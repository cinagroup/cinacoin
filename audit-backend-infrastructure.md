# 后端/基础设施审计报告

## 严重问题 (Critical)

### [B-001] Bundler JSON-RPC API 完全无认证
- **文件:** `packages/bundler/src/BundlerServer.ts`
- **行号:** L263–L280 (`handleJsonRpc`, `handleRpcMethod`)
- **描述:** BundlerServer 的 JSON-RPC 端点 (`POST /` 和 `POST /rpc`) 没有任何认证机制。任何人只要知道地址即可提交 `eth_sendUserOperation` 请求，将 UserOp 加入内存池。虽然 UserOpValidator 会验证 UserOp，但恶意方仍可发送大量无效请求消耗服务器计算资源（验证、模拟等），甚至可能导致 bundler 签署并广播恶意 UserOp 消耗 bundler 资金。
- **风险:** 攻击者可利用 bundler 签署和广播任意 UserOp，导致 bundler 资金损失；大量无效验证请求可导致 DoS。
- **修复建议:** 
  1. 在 `handleJsonRpc` 前增加 API Key 或 JWT 认证中间件
  2. 对敏感方法（如 `eth_sendUserOperation`）进行额外权限校验
  3. 添加 per-IP 速率限制

### [B-002] Push Server /health 端点无认证但暴露内部信息
- **文件:** `packages/push-server/src/index.ts`
- **行号:** L291–L293
- **描述:** `/health` 端点返回服务状态、时间戳等内部信息，且无需认证。虽然信息有限，但在生产环境中应限制访问。
- **风险:** 低级别信息泄露，可被用于服务发现。
- **修复建议:** 为 `/health` 端点添加内部网络访问限制或基本认证。

### [B-003] Push Server CORS 返回首个允许源而非拒绝
- **文件:** `packages/push-server/src/index.ts`
- **行号:** L47–L49
- **描述:** `corsHeaders` 函数在 Origin 不匹配允许列表时，默认返回 `ALLOWED_ORIGINS[0]`（即 `https://cinacoin.com`）。这意味着任何来源的请求都会收到 `Access-Control-Allow-Origin: https://cinacoin.com` 响应，这可能被恶意利用。
- **风险:** 如果攻击者能诱导浏览器发送请求，可能利用此 CORS 配置。
- **修复建议:** Origin 不匹配时应返回 `403 Forbidden` 或不设置 CORS headers。

### [B-004] BundlerServer `cinacoin_getBundlerConfig` 暴露 Beneficiary 地址
- **文件:** `packages/bundler/src/BundlerServer.ts`
- **行号:** L703–L711
- **描述:** `cinacoin_getBundlerConfig` RPC 方法返回 `beneficiary` 地址，该地址是 bundler 收取 gas 费用的目标地址。无需认证即可获取此信息。
- **风险:** 攻击者可利用此信息定位 bundler 的收款地址，可能进行针对性攻击。
- **修复建议:** 对此方法添加认证，或移除 beneficiary 信息返回。

---

## 高危问题 (High)

### [B-005] 错误处理泄露内部错误详情
- **文件:** `packages/bundler/src/BundlerServer.ts`
- **行号:** L352–L355
- **描述:** `handleRpcMethod` 中的 catch 块返回 `Internal error: ${message}`，其中 `message` 是原始错误的完整消息。这可能泄露内部堆栈信息、RPC 错误、链连接状态等敏感细节。
- **风险:** 错误消息可能泄露内部基础设施细节（如 RPC 端点、链状态、模拟错误等），为攻击者提供有用的攻击面信息。
- **修复建议:** 使用通用错误消息，将详细错误记录到服务器日志而非返回给客户端。

### [B-006] IndexerServer 错误处理泄露错误对象
- **文件:** `packages/tx-indexer/src/server.ts`
- **行号:** L230
- **描述:** `console.error('[IndexerServer] Error:', err)` 将完整错误对象输出到日志。在结构化日志系统中这可能没问题，但如果日志被暴露则存在风险。
- **风险:** 潜在的内部错误详情泄露。
- **修复建议:** 记录错误摘要而非完整对象，或使用结构化日志框架。

### [B-007] BundlerServer 无请求体大小限制
- **文件:** `packages/bundler/src/BundlerServer.ts`
- **行号:** L310–L317
- **描述:** JSON-RPC 请求体没有大小限制。攻击者可以发送超大请求体（如数十 MB），消耗服务器内存和 CPU。
- **风险:** DoS 攻击风险。
- **修复建议:** 设置 `Content-Length` 上限（如 1 MB），超过则返回 413 错误。

### [B-008] Push Server 批量发送无速率限制
- **文件:** `packages/push-server/src/index.ts`
- **行号:** L184–L225 (`handleSendBatch`)
- **描述:** `/send-batch` 端点限制批次大小为 100，但对发送请求的速率没有限制。攻击者可以持续发送批量请求，消耗服务器资源或导致通知泛滥。
- **风险:** DoS 或通知洪水攻击。
- **修复建议:** 实现 per-IP 或 per-API-key 的批量请求速率限制。

### [B-009] Wallet Explorer API CORS 使用通配符
- **文件:** `apps/wallet-explorer-api/src/index.ts`
- **行号:** L35
- **描述:** `cors({ origin: (origin) => origin })` 实现了反射型 CORS，即任何 Origin 都会被允许。这等同于 `Access-Control-Allow-Origin: *`。
- **风险:** 任何网站都可以向此 API 发送跨域请求并读取响应。
- **修复建议:** 使用明确的允许源列表，如其他服务已实现的那样。

### [B-010] Paymaster VerifyingPaymaster 零哈希签名
- **文件:** `packages/paymaster/src/VerifyingPaymaster.ts`
- **行号:** L281, L314
- **描述:** `getPaymasterData` 和 `sponsorTransaction` 方法使用零哈希 (`0x0000...`) 作为 userOpHash 进行签名。这意味着签名不是针对特定 UserOp 的，存在重放攻击风险。
- **风险:** 恶意方可以捕获 paymasterAndData 并重放到不同的 UserOp 中，导致 paymaster 为未授权的交易支付 gas。
- **修复建议:** 使用真实的 userOpHash 进行签名，或使用时间敏感的 nonce。

### [B-011] Paymaster VerifyingPaymaster 无去重/重放防护
- **文件:** `packages/paymaster/src/VerifyingPaymaster.ts`
- **行号:** L274–L319
- **描述:** Paymaster 的内存计数器 `opsInPeriod` 和 `periodStart` 是进程级别的，重启后丢失。这意味着服务重启后速率限制完全失效。
- **风险:** 服务重启后 paymaster 可能被滥用以大量赞助交易。
- **修复建议:** 使用持久化存储（如 Redis/KV）跟踪赞助计数器。

---

## 中等问题 (Medium)

### [B-012] NotifyServer 无持久化存储
- **文件:** `packages/notify-server/src/NotifyServer.ts`
- **行号:** L35
- **描述:** 所有订阅数据存储在内存 Map 中。服务重启后所有订阅数据丢失。
- **风险:** 服务重启后通知功能完全失效，影响用户体验。
- **修复建议:** 使用持久化存储（数据库或 KV）保存订阅数据。

### [B-013] NotifyServer 递送实现为空
- **文件:** `packages/notify-server/src/NotifyServer.ts`
- **行号:** L133–L152
- **描述:** `deliverPush`、`deliverEmail` 和 `deliverWebhook` 都是空实现（返回 `true`）。webhook 递送构建了请求体但没有实际发送 HTTP 请求。
- **风险:** 功能缺失，但更重要的是 webhook 功能声称已递送但实际未发送。
- **修复建议:** 实现真实的递送逻辑或在文档中明确标注。

### [B-014] Push Server NotificationDelivery APNs JWT 未实现
- **文件:** `packages/push-server/src/notification-delivery.ts`
- **行号:** L160–L165
- **描述:** APNs 递送使用硬编码的 `"Authorization": 'bearer <jwt-token>'`，JWT 令牌未动态生成。
- **风险:** 如果 APNs 配置完整但未实现 JWT 生成，APNs 递送必然失败。
- **修复建议:** 实现 JWT 令牌生成逻辑，使用 `APNS_PRIVATE_KEY`、`APNS_KEY_ID`、`APNS_TEAM_ID` 构建 ES256 签名 JWT。

### [B-015] Analytics Server API Key 明文比较
- **文件:** `packages/analytics-server/src/index.ts`
- **行号:** L44
- **描述:** `apiKey !== c.env.API_KEY` 使用普通字符串比较进行认证，存在时序攻击风险。
- **风险:** 理论上的时序攻击风险（但在实际中极难利用）。
- **修复建议:** 使用时序安全比较函数（如 push-server 中的 `constantTimeCompare`）。

### [B-016] Bundler 默认使用公共免费 RPC 端点
- **文件:** `packages/bundler/src/BundlerServer.ts`
- **行号:** L33–L84 (`KNOWN_CHAINS`)
- **描述:** 已知链配置使用公共免费 RPC（如 `eth.llamarpc.com`、`rpc.sepolia.org`）。这些 RPC 有严格的速率限制，且不适用于生产 bundler 操作。
- **风险:** 生产环境中 bundler 可能因 RPC 速率限制而无法正常工作；公共 RPC 可能不可靠或被篡改。
- **修复建议:** 配置专用/付费 RPC 端点，并通过环境变量注入。

### [B-017] Gas Estimator 使用 Solana 公共端点
- **文件:** `packages/gas-estimator/src/estimator.ts`
- **行号:** L45
- **描述:** Solana 估算器默认使用 `https://api.mainnet-beta.solana.com`，这是公共且可能受限的端点。
- **风险:** 公共端点可能被速率限制或不稳定。
- **修复建议:** 通过环境变量配置 RPC 端点。

### [B-018] Blockchain API 缓存键构造存在潜在冲突
- **文件:** `packages/blockchain-api/src/client.ts`
- **行号:** L32–L35
- **描述:** `_txCacheKey` 函数使用字符串拼接构造缓存键，如果地址包含 `:` 字符（虽然地址不应包含），可能导致缓存键冲突。
- **风险:** 理论上可能导致缓存污染。
- **修复建议:** 使用结构化键（如 JSON 序列化 + 哈希）代替字符串拼接。

### [B-019] TxIndexer 使用同步 better-sqlite3
- **文件:** `packages/tx-indexer/src/storage.ts`
- **行号:** L61
- **描述:** 使用 better-sqlite3 同步数据库操作。在高并发场景下，同步操作会阻塞事件循环。
- **风险:** 并发请求可能导致性能下降。
- **修复建议:** 考虑使用异步数据库或限制并发连接。

### [B-020] Analytics Server `/v1/overview` 无认证
- **文件:** `packages/analytics-server/src/index.ts`
- **行号:** L123–L194
- **描述:** `/v1/overview` 端点暴露聚合分析数据（活跃钱包数、交易量、转化率等），无需认证即可访问。
- **风险:** 商业敏感数据泄露。
- **修复建议:** 添加认证或使用内部网络限制。

---

## 低危问题 (Low)

### [B-021] 部署脚本错误消息泄露环境变量名
- **文件:** `packages/paymaster/deploy/deploy.ts`
- **行号:** L271
- **描述:** `console.error("Error: PRIVATE_KEY or --private-key is required")` 泄露了环境变量名 `PRIVATE_KEY`。
- **风险:** 低风险，但提供了攻击者可能尝试利用的线索。
- **修复建议:** 使用通用错误消息。

### [B-022] Indexer 日志使用 console.log 而非结构化日志
- **文件:** `packages/tx-indexer/src/indexer.ts`
- **行号:** L36–L49
- **描述:** 虽然已实现简单的结构化日志（JSON），但仍使用 `console.log` 而非专用日志库。错误级别没有区分输出流。
- **风险:** 低。
- **修复建议:** 使用 pino、winston 等日志库，错误输出到 stderr。

### [B-023] Push Server 速率限制器非原子操作
- **文件:** `packages/push-server/src/rate-limiter.ts`
- **行号:** L70–L103
- **描述:** Cloudflare KV 的 `getRateCount` 和 `incrementRate` 是非原子操作，在高并发下可能导致竞态条件，使速率限制不准确。
- **风险:** 高并发时可能允许超过限制的请求。
- **修复建议:** 使用 Cloudflare KV 的原子操作或考虑使用 Durable Objects。

### [B-024] RelayServer WebSocket 认证缺失
- **文件:** `packages/relay-server/src/RelayServer.ts`
- **行号:** L287–L348
- **描述:** WebSocket 连接没有认证机制，任何客户端都可以连接并收发任意 topic 的消息。对于 Cinacoin relay 这可能可接受，但缺少 topic 级别的访问控制。
- **风险:** 任何用户可以向任何 topic 发布消息。
- **修复建议:** 如果需要 topic 隔离，实现基于令牌的 topic 访问控制。

### [B-025] Blockchain API 硬编码 IPFS 网关
- **文件:** `packages/blockchain-api/src/client.ts`
- **行号:** L117–L131
- **描述:** IPFS 网关列表是硬编码的，无法通过配置更改。
- **风险:** 如果网关不可用，需要修改代码才能切换。
- **修复建议:** 将网关列表作为配置项注入。

### [B-026] Bundler 最大 UserOp 数 128 但未验证
- **文件:** `packages/bundler/src/BundlerServer.ts`
- **行号:** L96 (`maxOpsPerBundle: 128`)
- **描述:** 虽然配置了 `maxOpsPerBundle: 128`，但在 `rpcSendUserOp` 中只验证了 UserOp 本身，没有检查内存池总数是否接近上限。
- **风险:** 可能导致构建的 bundle 超过区块 gas 限制。
- **修复建议:** 在 bundle 构建时验证总 gas 使用量。

---

## 总结

| 严重程度 | 数量 | 主要风险领域 |
|----------|------|-------------|
| Critical | 4 | 认证缺失、CORS 配置不当 |
| High | 7 | 错误信息泄露、DoS 防护不足、重放攻击 |
| Medium | 9 | 持久化缺失、公共端点依赖、认证实现 |
| Low | 6 | 日志、配置、边缘场景 |

### 优先修复建议

1. **立即修复**: Bundler JSON-RPC 端点添加认证 ([B-001])
2. **立即修复**: Paymaster 零哈希签名问题 ([B-010]) — 这可能导致资金损失
3. **高优先级**: 修复 Push Server CORS 行为 ([B-003])
4. **高优先级**: Wallet Explorer API 通配符 CORS ([B-009])
5. **高优先级**: 为 Bundler 添加请求体大小限制 ([B-007])
6. **高优先级**: Paymaster 重放防护持久化 ([B-011])
7. **中优先级**: 错误信息通用化 ([B-005], [B-006])
8. **中优先级**: 替换公共 RPC 端点 ([B-016], [B-017])
