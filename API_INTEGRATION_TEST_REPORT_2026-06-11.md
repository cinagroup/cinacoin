# API 集成联调测试报告

**日期:** 2026-06-11 16:06-16:09 UTC  
**测试环境:** 生产环境 (cinacoin.com)  
**测试工具:** curl 8.5.0, jq  
**注意:** 使用测试 token (`test-token` / `bad`)，无有效认证凭据

---

## 1. 测试结果总览

| # | 服务 | 端点 | HTTP 状态 | 响应时间 | 结果 |
|---|------|------|-----------|----------|------|
| 1a | Users (Gateway) | `api.cinacoin.com/users/me` | 401 | 5,597ms | ⚠️ 认证拒绝（预期） |
| 1b | Users (Direct) | `users.cinacoin.com/api/users/me` | 401 | 3,467ms | ⚠️ 认证拒绝（预期） |
| 2a | Keys Server (GET) | `keys.cinacoin.com/api/keys` | 404 | 1,056ms | ❌ 端点不存在 |
| 2b | Keys Server (POST) | `keys.cinacoin.com/api/keys` | 404 | 804ms | ❌ 端点不存在 |
| 3a | RPC Proxy (JSON-RPC) | `rpc.cinacoin.com` | 404 | 1,089ms | ❌ 端点不存在 |
| 3b | RPC Proxy (Health) | `rpc.cinacoin.com/health` | 200 | 2,074ms | ✅ 正常 |
| 4a | Bundler (entryPoints) | `bundler.cinacoin.com` | 401 | 2,605ms | ⚠️ 认证拒绝 |
| 4b | Bundler (estimateGas) | `bundler.cinacoin.com` | 401 | 1,174ms | ⚠️ 认证拒绝 |
| 5 | Analytics | `analytics.cinacoin.com/api/v1/events` | 301→405 | 2,769ms | ❌ 重定向后方法不允许 |
| 6 | WebSocket | `api.cinacoin.com/ws` | 404 | 1,244ms | ❌ 端点不存在 |

---

## 2. 各服务详细测试

### 2.1 Users 服务

**通过 API Gateway:**
```
GET https://api.cinacoin.com/users/me
Authorization: Bearer test-token
→ HTTP 401 (5,597ms)
→ {"error":"Invalid token"}
```

**直接调用:**
```
GET https://users.cinacoin.com/api/users/me
Authorization: Bearer test-token
→ HTTP 401 (3,467ms)
→ {"error":"Invalid token"}
```

**分析:**
- ✅ 两个入口均正确拒绝无效 token
- ✅ 错误格式一致 (`{"error": "..."}`)
- ⚠️ Gateway 路径响应时间偏高 (5.6s vs 3.5s direct)，存在 ~2s 的额外延迟
- ⚠️ 无法验证有效 token 的路由正确性（缺少有效凭据）

### 2.2 Keys Server

**GET /api/keys:**
```
→ HTTP 404 (1,056ms)
→ {"error":"Not found"}
```

**POST /api/keys:**
```
→ HTTP 404 (804ms)
→ {"error":"Not found"}
```

**分析:**
- ❌ 两个端点均返回 404，API 路由可能未部署或未注册
- ⚠️ 注意：404 在认证检查之前返回，说明路由层先于中间件执行
- 需要确认 Keys Server 是否已上线

### 2.3 RPC Proxy

**JSON-RPC eth_blockNumber:**
```
POST https://rpc.cinacoin.com
{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}
→ HTTP 404 (1,089ms)
→ {"error":"Not found"}
```

**Health Check:**
```
GET https://rpc.cinacoin.com/health
→ HTTP 200 (2,074ms)
→ {
    "status": "ok",
    "timestamp": "2026-06-11T16:07:37.434Z",
    "supported_chains": ["1","10","56","137","8453","42161","solana","tron","ton","sui","cosmos","near"]
  }
```

**分析:**
- ✅ Health endpoint 正常，支持 12 条链
- ❌ JSON-RPC 根路径返回 404，可能需要特定路径前缀（如 `/rpc` 或 `/v1`）
- ⚠️ Health 响应时间 2s 偏高

### 2.4 Bundler

**eth_supportedEntryPoints:**
```
POST https://bundler.cinacoin.com
{"jsonrpc":"2.0","method":"eth_supportedEntryPoints","params":[],"id":1}
→ HTTP 401 (2,605ms)
→ {"jsonrpc":"2.0","error":{"code":-32000,"message":"Unauthorized: Invalid or missing API key"},"id":null}
```

**eth_estimateUserOperationGas:**
```
POST https://bundler.cinacoin.com
→ HTTP 401 (1,174ms)
→ {"jsonrpc":"2.0","error":{"code":-32000,"message":"Unauthorized: Invalid or missing API key"},"id":null}
```

**分析:**
- ✅ Bundler 服务在线，正确拒绝未认证请求
- ✅ 使用标准 JSON-RPC 错误格式
- ⚠️ 需要 API Key（非 Bearer token），认证机制与其他服务不同
- ⚠️ 首次请求 2.6s（可能冷启动），后续 1.2s

### 2.5 Analytics 服务

**POST /api/v1/events:**
```
→ HTTP 301 → 重定向到 https://cinacoin.com/analytics/api/v1/events
→ 跟随重定向后: HTTP 405 (2,769ms)
→ 空响应体
```

**分析:**
- ❌ 301 重定向到主域名的子路径，可能由 CDN/Cloudflare 规则触发
- ❌ 重定向后 POST 变为 GET（curl -L 行为），导致 405 Method Not Allowed
- ❌ Analytics 服务可能未正确部署或路由配置有误

### 2.6 WebSocket

**wss://api.cinacoin.com/ws:**
```
→ HTTP 404 (1,244ms)
→ {"error":"Not found"} (推断，content-length: 71)
```

**wss://analytics.cinacoin.com/ws:**
```
→ HTTP 301 → 重定向到 https://cinacoin.com/analytics/ws
```

**分析:**
- ❌ API Gateway 上 /ws 端点不存在
- ❌ Analytics WebSocket 同样被重定向
- ⚠️ 环境中无 websocat/wscat 工具，使用 curl HTTP 升级头探测
- WebSocket 端点可能未部署

---

## 3. 验证点检查

### ✅ API Gateway 路由
- 部分通过：Gateway 能路由到 Users 服务（401 证明后端存在）
- Keys Server、RPC JSON-RPC、WebSocket 路由失败（404）
- Analytics 被 CDN 重定向

### ⚠️ 认证 Token 通用性
- Users 服务使用 `Authorization: Bearer` 认证
- Bundler 使用 API Key 认证（不同机制）
- 无法完全验证 token 通用性（缺少有效凭据）
- **发现：认证机制不统一**

### ❌ 错误处理一致性
错误格式存在 **三种不同风格**：

| 服务 | 格式 | 示例 |
|------|------|------|
| Users | `{"error": "string"}` | `{"error":"Invalid token"}` |
| Keys/RPC | `{"error": "string"}` | `{"error":"Not found"}` |
| Bundler | JSON-RPC 2.0 错误 | `{"jsonrpc":"2.0","error":{"code":-32000,"message":"..."},"id":null}` |
| Analytics | 空响应体 | (301 重定向后无内容) |

**建议：** 统一为一种错误格式，或至少保证 REST 服务使用 `{"error": {"code": "...", "message": "..."}}` 结构。

### ✅ 速率限制
```
x-ratelimit-limit: 200          (per-endpoint)
x-ratelimit-remaining: 193
x-ratelimit-reset: 1781194197
x-global-ratelimit-limit: 1000  (global)
x-global-ratelimit-remaining: 986
x-global-ratelimit-reset: 1781197737
```
- ✅ 双层速率限制正常工作（per-endpoint + global）
- ✅ 5 次快速请求未触发限制
- 限制值：200 req/窗口（per-endpoint），1000 req/窗口（global）

### ✅ CORS 配置
```
access-control-allow-credentials: true
access-control-allow-headers: Content-Type,Authorization,X-CSRF-Token
access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
```
- ✅ OPTIONS 预检返回 204
- ✅ 允许标准方法和认证头
- ⚠️ 未看到 `access-control-allow-origin` 头（可能动态设置或需要特定 Origin）

### ❌ WebSocket 连接
- WebSocket 端点不可用（404）
- 无法测试连接稳定性

---

## 4. 响应时间统计

| 指标 | 值 |
|------|-----|
| 最快响应 | 804ms (Keys Server POST) |
| 最慢响应 | 5,597ms (Users via Gateway) |
| 平均响应时间 | 2,188ms |
| P50 (中位数) | ~1,244ms |
| P95 | ~5,597ms |

**按服务排序（快→慢）：**
1. Keys Server: ~930ms avg
2. RPC Proxy (JSON-RPC): 1,089ms
3. Bundler: ~1,890ms avg
4. WebSocket probe: 1,244ms
5. RPC Health: 2,074ms
6. Analytics: 2,769ms
7. Users (Direct): 3,467ms
8. Users (Gateway): 5,597ms

---

## 5. 发现的问题

### 🔴 严重 (Critical)

1. **Keys Server 端点不存在 (404)**
   - `/api/keys` GET 和 POST 均返回 404
   - 服务可能未部署或路由未配置

2. **RPC Proxy JSON-RPC 端点不存在 (404)**
   - 根路径 POST 返回 404
   - Health 端点正常，但 RPC 调用路径可能不正确

3. **Analytics 服务不可用**
   - 301 重定向到主域名，POST 请求无法完成
   - 可能 Cloudflare 规则干扰或服务未部署

4. **WebSocket 端点不存在**
   - `api.cinacoin.com/ws` 返回 404

### 🟡 中等 (Medium)

5. **错误格式不统一**
   - REST 服务: `{"error": "string"}`
   - Bundler: JSON-RPC 2.0 格式
   - Analytics: 空响应
   - 建议统一错误响应结构

6. **认证机制不统一**
   - Users: Bearer Token
   - Bundler: API Key
   - 增加集成复杂度

7. **Users 服务 Gateway 延迟高**
   - Gateway 路径 5.6s vs Direct 3.5s
   - 额外 2s 延迟可能来自认证中间件或网络链路

### 🟢 低 (Low)

8. **CORS allow-origin 头未明确**
   - 预检响应中未见 `access-control-allow-origin`
   - 可能是动态设置，但建议确认

9. **RPC Health 响应时间 2s**
   - 对于简单健康检查偏慢

---

## 6. 错误率

| 类别 | 数量 | 占比 |
|------|------|------|
| 成功 (2xx) | 1/11 | 9% |
| 认证失败 (401) | 4/11 | 36% |
| 未找到 (404) | 5/11 | 45% |
| 方法不允许 (405) | 1/11 | 9% |

**注意：** 401 中部分是预期行为（无效 token），真正异常的是 404 和 405。  
**有效端点成功率：** 1/6 = 17%（仅 RPC Health 正常响应）

---

## 7. 建议

### 立即修复
1. 确认 Keys Server 部署状态和路由配置
2. 确认 RPC Proxy 的 JSON-RPC 路径（是否需要 `/rpc` 前缀）
3. 检查 Analytics 服务的 Cloudflare 规则和部署状态
4. 部署或启用 WebSocket 端点

### 短期优化
5. 统一所有服务的错误响应格式
6. 统一认证机制（或至少在文档中明确说明各服务的认证方式）
7. 优化 Users 服务通过 Gateway 的延迟

### 长期改进
8. 添加 API 版本控制（`/v1/`前缀）
9. 实现统一的 API 监控和告警
10. 编写集成测试套件自动化这些检查

---

## 8. 附录

### 测试环境
- 测试时间: 2026-06-11 16:06-16:09 UTC
- 测试主机: Linux 6.8.0-124-generic (x64)
- curl 版本: 8.5.0 (OpenSSL/3.0.13)
- 网络: 经 Cloudflare CDN (SIN 节点)

### 原始响应头（Users Service via Gateway）
```
HTTP/2 401
content-type: application/json
x-ratelimit-limit: 200
x-ratelimit-remaining: 193
x-global-ratelimit-limit: 1000
x-global-ratelimit-remaining: 986
strict-transport-security: max-age=31536000; includeSubDomains
server: cloudflare
```

### 支持的区块链网络（RPC Health）
Ethereum (1), Optimism (10), BSC (56), Polygon (137), Base (8453), Arbitrum (42161), Solana, Tron, TON, Sui, Cosmos, NEAR

---

*报告生成时间: 2026-06-11T16:09:00Z*  
*测试执行者: OpenClaw Subagent (test_api_integration)*
