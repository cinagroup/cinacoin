# 安全审计报告模板

> OnChainUX 安全审计报告 — 审计周期、范围、发现和建议。

## 审计信息

| 项目 | 内容 |
|------|------|
| **审计方** | _(审计公司名称)_ |
| **审计日期** | _(YYYY-MM-DD)_ |
| **报告版本** | _(v1.0)_ |
| **项目版本** | _(OnChainUX v0.1.0)_ |

## 审计范围

### 审计组件

- [ ] **Relay Server** (`packages/relay-server`)
  - WebSocket 连接处理
  - NATS Pub/Sub 路由
  - X25519 + ChaCha20-Poly1305 加密
  - Session 管理

- [ ] **RPC Proxy** (`packages/rpc-proxy`)
  - 路由逻辑
  - 缓存层
  - 去重机制
  - 速率限制

- [ ] **Core SDK** (`packages/core-sdk`)
  - Connector 接口
  - 加密模块
  - 会话管理
  - EIP-6963 实现

- [ ] **Smart Account** (`packages/paymaster`)
  - Paymaster 合约 (Solidity)
  - Bundler (Rust)
  - UserOp 验证
  - Gas 赞助逻辑

- [ ] **SIWE** (`packages/siwe`)
  - EIP-4361 实现
  - Nonce 管理
  - 签名验证

### 不在审计范围内

- [ ] 前端 UI 组件（视觉层，无安全风险）
- [ ] 部署脚本和 CI/CD
- [ ] 监控和告警系统

## 审计方法

1. **静态分析**：Slither / Mythril (Solidity), cargo-audit (Rust), eslint (TS)
2. **手动审查**：代码逐行审查
3. **模糊测试**：Foundry / Echidna (Solidity)
4. **集成测试**：端到端安全测试
5. **形式化验证**：(如适用)

## 发现摘要

| 严重级别 | 数量 | 状态 |
|---------|------|------|
| 🔴 严重 (Critical) | _N_ | _(已修复 / 待修复)_ |
| 🟠 高 (High) | _N_ | _(已修复 / 待修复)_ |
| 🟡 中 (Medium) | _N_ | _(已修复 / 待修复)_ |
| 🟢 低 (Low) | _N_ | _(已修复 / 待修复)_ |
| 🔵 信息 (Informational) | _N_ | _(已修复 / 待修复)_ |

## 详细发现

### Critical — 编号 C-001

**标题**：_(发现标题)_

**组件**：_(组件名称)_

**描述**：
_(详细描述漏洞)_

**影响**：
_(潜在影响)_

**建议修复**：
_(建议的修复方案)_

**代码示例**：
```solidity
// ❌ 漏洞代码
// ...

// ✅ 修复后代码
// ...
```

**状态**：_(已修复 / 待修复 / 已接受风险)_

---

### High — 编号 H-001

_(同上格式)_

---

### Medium — 编号 M-001

_(同上格式)_

---

### Low — 编号 L-001

_(同上格式)_

---

### Informational — 编号 I-001

_(同上格式)_

## 依赖组件安全

| 依赖 | 版本 | 已知漏洞 | 状态 |
|------|------|---------|------|
| OpenZeppelin Contracts | 5.0.0 | 无 | ✅ |
| account-abstraction | 0.7.0 | 无 | ✅ |
| @noble/curves | 2.2.0 | 无 | ✅ |
| Actix-web | 4.x | _(检查 cargo-audit)_ | _(状态)_ |

## 总体评价

_(审计方对 OnChainUX 安全性的总体评价)_

## 结论

_(审计方最终结论和建议)_

---

**审计签名**：

| 角色 | 姓名 | 签名 | 日期 |
|------|------|------|------|
| 首席审计师 | | | |
| 高级审计师 | | | |
