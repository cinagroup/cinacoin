# Cinacoin 全栈审计报告 & 整合优化 Checklist

> **审计日期**: 2026-06-15  
> **审计范围**: 5 大维度（SDK 核心 / 基础设施 / 前端框架 / DeFi 合规 / 移动原生）  
> **审计人**: 000 (AI Auditor)

---

## 📊 总览评分

| 维度 | 评分 | 状态 |
|------|:---:|------|
| SDK 核心层 | 6.6/10 | ⚠️ 安全风险高 |
| 基础设施层 | 7.8/10 | ✅ 基本成熟 |
| 前端框架 SDK | 7.0/10 | ✅ 可用，需优化 |
| DeFi/支付/合规 | ⚠️ 中等风险 | 🔴 需修复后上线 |
| 移动/原生平台 | 7.2/10 | 🔴 4 个致命问题 |

**总体评估**: 功能覆盖超越 Reown，但安全性和生产就绪度存在显著差距。

---

## 🔴 P0 — 致命问题（立即修复，阻塞上线）

共 10 项 Critical 级问题，跨 4 个维度：

### SDK 核心层 (3)

| ID | 模块 | 问题 | 影响 |
|---|---|---|---|
| C-001 | siwx | 所有加密验证为 stub，`recoverAddressEvm()` / `verifyEd25519()` / `verifyBip322()` 均 throw | 跨链签名验证完全不工作 |
| C-002 | core-sdk | Session 完整性用 djb2 非密码学哈希 | 可伪造 session 数据 |
| C-003 | social-login | HKDF info 参数为固定字符串，无服务端 secret | 已知 identity 可推导私钥 |

### DeFi/支付/合规 (3)

| ID | 模块 | 问题 | 影响 |
|---|---|---|---|
| SEC-01 | HTLC.sol | `emergencyWithdraw` 无权限控制 | 任何人可取走合约全部 ETH |
| SEC-02 | Paymaster | `_extractSender` 逻辑错误 | 赞助策略完全失效 |
| SEC-03 | VerifyingPaymaster | 签名重放标记时机错误 | 同 bundle 内可重放 |

### 移动/原生平台 (4)

| ID | 模块 | 问题 | 影响 |
|---|---|---|---|
| C-1 | iOS CryptoUtils | `keccak256()` 用 SHA3-256 代替 Keccak-256 | 所有 EVM 地址推导错误 |
| C-2 | iOS WCClient | 两份冲突的 `RelayHealth` enum | 无法编译 |
| C-3 | Android SignerManager | `recoverAddress()` 返回硬编码 `0x0...` | 签名验证永远失败 |
| C-4 | Unity SignerManager | `VerifySignature()` 对任意签名 return true | 完全不验证 |

---

## 🟠 P1 — 高风险（上线前必须修复）

共 16 项 High 级问题：

### SDK 核心层 (4)

| ID | 模块 | 问题 |
|---|---|---|
| H-001 | core-sdk | QR Transport 对称密钥明文暴露在 URI |
| H-002 | passkey-auth | 认证返回空签名数据，服务端无法验证 |
| H-003 | siwx | 使用 Node.js crypto 模块，浏览器不兼容 |
| H-004 | session-keys | 私钥明文存储在内存 Map |

### 基础设施层 (3)

| ID | 模块 | 问题 |
|---|---|---|
| INF-P1-1 | Blockchain API | 未迁移到 Workers，性能差成本高 |
| INF-P1-2 | TX Indexer | 未迁移到 Workers |
| INF-P1-3 | Keys Server | PBKDF2 100k 迭代可能超 Workers CPU 限制 |

### DeFi/合规 (7)

| ID | 模块 | 问题 |
|---|---|---|
| SEC-04 | BridgeRouter | completeTransfer 无重放保护 |
| SEC-05 | MultiSig | 治理函数无多签保护 |
| SEC-06 | Bundler | SKIP_AUTH 环境变量，生产未授权访问 |
| SEC-07 | Auth Service | middleware 未验证 token |
| SEC-08 | Bundler | Rate limiter 内存泄漏 + IP 伪造 |
| SEC-09 | Swap SDK | MEV nonce 默认 0 |
| TEST-01 | Travel Rule | 无测试 |

### 移动/原生 (2)

| ID | 模块 | 问题 |
|---|---|---|
| M-P1-1 | .NET | X25519 key generation 使用 P-256 而非 Curve25519 |
| M-P1-2 | Flutter | hashMessage 用 sha256 而非 keccak256 |

---

## 🟡 P2 — 中等风险（尽快修复）

### SDK 核心层 (4)

| ID | 问题 |
|---|---|
| M-001 | SESSION_SECRET 仅在模块加载时检查 |
| M-002 | SIWE 地址归一化未实现 EIP-55 checksum |
| M-003 | verify-sdk 危险函数检测使用字符串匹配 |
| M-004 | adapters 包零测试覆盖 |

### 基础设施层 (7)

| ID | 问题 |
|---|---|
| INF-P2-1 | 缺少统一 CI/CD 流水线 |
| INF-P2-2 | 缺少自动回滚策略 |
| INF-P2-3 | RPC Proxy 缺少熔断机制 |
| INF-P2-4 | Relay Server 广播通道容量有限 |
| INF-P2-5 | Push Server 批量推送顺序执行 |
| INF-P2-6 | Notify Server 同步投递阻塞请求 |
| INF-P2-7 | Blockchain API 无缓存 |

### 前端框架 (7)

| ID | 问题 |
|---|---|
| FE-C1 | Modal 组件 SSR hydration mismatch |
| FE-C2 | core-ui 使用 document 全局对象（SSR 不安全） |
| FE-H1 | Modal 缺少 ARIA 属性（a11y 不合规） |
| FE-H2 | React 缺少 WebSocket cleanup（内存泄漏） |
| FE-H3 | @cinacoin/ui bundle 过大（45KB gz） |
| FE-H4 | 缺少 RTL 布局支持 |
| FE-H5 | Vue 缺少 onUnmounted 清理 |

### DeFi/合规 (5)

| ID | 问题 |
|---|---|
| AA-01 | Paymaster validatePaymasterUserOp 签名不兼容 v0.7 |
| GAS-01 | Gas 估算使用 21,000 固定值 |
| ERC-01 | erc6492 编码格式不符合 ABI 标准 |
| CMP-01 | KYC 制裁名单仅 6 个硬编码地址 |
| CMP-02 | Travel Rule USD 估值使用硬编码价格 |

### 移动/原生 (5)

| ID | 问题 |
|---|---|
| M-P2-1 | Unity 替换 PlayerPrefs 为加密存储 |
| M-P2-2 | iOS 替换 BigInt struct（大余额溢出） |
| M-P2-3 | Android 补充 JUnit 单元测试 |
| M-P2-4 | 所有平台统一 API 命名规范 |
| M-P2-5 | Mini Apps 实现 personal_sign 支持 |

---

## 🟢 P3 — 低优先级（持续改进）

- SDK: EIP-6963 发现窗口硬编码 300ms、RelayTransport 重连无 jitter、代码重复
- 基础设施: 缺少分布式追踪、Keys Server 缺审计日志、Monitoring 未用 CF Analytics Engine
- 前端: Angular 未用 Signals、缺少 prefers-color-scheme、RN 无 Expo 适配
- DeFi: TokenPaymaster 无预言机、safe-decoder delegateCall 警告
- 移动: CI/CD 集成原生 build、Demo apps 功能补全、跨平台 e2e testing

---

## ✅ 整合优化 Checklist

### Phase 1: 安全修复（1-2 周）

- [ ] **SDK-01**: 实现 SIWX 真正的加密验证（@noble/curves + viem + bitcoinjs-lib）
- [ ] **SDK-02**: Session 完整性改用 SHA-256（crypto.subtle.digest）
- [ ] **SDK-03**: Social Login 添加服务端 secret 到 HKDF
- [ ] **SDK-04**: 修复 Passkey 签名数据提取（response.signature/authenticatorData/clientDataJSON）
- [ ] **SDK-05**: siwx 替换 Node.js crypto 为 globalThis.crypto
- [ ] **DEFI-01**: HTLC emergencyWithdraw 添加 onlyOwner
- [ ] **DEFI-02**: Paymaster 修复 _extractSender 从 UserOp 提取
- [ ] **DEFI-03**: VerifyingPaymaster 在 validate 中标记已用签名
- [ ] **DEFI-04**: BridgeRouter 添加 nonce 重放检查
- [ ] **MOB-01**: iOS 修复 keccak256（引入 CryptoSwift）
- [ ] **MOB-02**: iOS 合并 RelayHealth enum 冲突
- [ ] **MOB-03**: Android 修复 recoverAddress（集成真实 ECDSA recovery）
- [ ] **MOB-04**: Unity 集成 Nethereum.Sign 实现真实签名验证
- [ ] **MOB-05**: Android 修复 WC URI 格式 bug（$2 → ${2}）
- [ ] **MOB-06**: Android 移除 mock fallback connection

### Phase 2: 架构加固（2-4 周）

- [ ] **INF-01**: 迁移 Blockchain API 到 Cloudflare Workers
- [ ] **INF-02**: 迁移 TX Indexer 到 Cloudflare Workers
- [ ] **INF-03**: Keys Server 降低 PBKDF2 迭代或改用 HKDF
- [ ] **INF-04**: RPC Proxy 添加熔断机制（stale-while-revalidate）
- [ ] **INF-05**: Push Server 批量推送改用 Promise.all 并行
- [ ] **INF-06**: Notify Server 集成 Queues 异步投递
- [ ] **INF-07**: 建立统一 CI/CD（GitHub Actions + wrangler deploy + rollback）
- [ ] **DEFI-05**: MultiSig 治理函数通过 proposal 流程
- [ ] **DEFI-06**: Bundler 生产环境禁用 SKIP_AUTH
- [ ] **DEFI-07**: Auth Service middleware 添加 JWT 验证
- [ ] **DEFI-08**: Bundler rate limiter 修复内存泄漏 + IP 验证
- [ ] **FE-01**: 修复 SSR hydration（typeof window 守卫）
- [ ] **FE-02**: 添加 Modal ARIA 属性（role/aria-modal/aria-labelledby）
- [ ] **FE-03**: 添加 React/Vue WebSocket cleanup
- [ ] **FE-04**: 拆分 @cinacoin/ui 按需导入

### Phase 3: 质量提升（1-2 月）

- [ ] **SDK-06**: core-sdk tsconfig 启用 noImplicitAny
- [ ] **SDK-07**: 拆分 session.ts（SessionManager / Store / Types）
- [ ] **SDK-08**: adapters 包添加单元测试（目标覆盖率 > 80%）
- [ ] **SDK-09**: QR Transport 实现 ECDH 密钥交换
- [ ] **DEFI-09**: Paymaster 接口签名兼容 ERC-4337 v0.7
- [ ] **DEFI-10**: Gas 估算使用实际值替代 21,000 固定值
- [ ] **DEFI-11**: KYC 集成实时制裁名单数据源
- [ ] **DEFI-12**: Travel Rule 集成实时价格预言机
- [ ] **DEFI-13**: erc6492 修复编码 + 添加链上验证
- [ ] **FE-05**: 添加 RTL 布局支持
- [ ] **FE-06**: 添加 prefers-color-scheme 自动检测
- [ ] **FE-07**: Angular 迁移到 Signals
- [ ] **MOB-07**: .NET 替换 X25519 为 BouncyCastle Curve25519
- [ ] **MOB-08**: Flutter 修复 hashMessage（sha256 → keccak256）
- [ ] **MOB-09**: 统一跨平台 API 命名规范
- [ ] **MOB-10**: Mini Apps 实现 personal_sign 签名能力

### Phase 4: 生产就绪（2-3 月）

- [ ] **INF-08**: 添加分布式追踪（CF Analytics Engine / OpenTelemetry）
- [ ] **INF-09**: Keys Server 添加审计日志（D1 记录所有操作）
- [ ] **INF-10**: Monitoring 集成 CF Analytics Engine
- [ ] **INF-11**: CDN 添加使用统计
- [ ] **INF-12**: 跨区域高可用部署
- [ ] **DEFI-14**: TokenPaymaster 集成 Chainlink/Pyth 价格预言机
- [ ] **DEFI-15**: aa-sdk 添加 EIP-5792 支持
- [ ] **DEFI-16**: 补充 Travel Rule / erc6492 / bundler-service 完整测试
- [ ] **MOB-11**: React Native New Architecture (Fabric) 支持
- [ ] **MOB-12**: React Native Expo 适配器
- [ ] **MOB-13**: 跨平台 e2e testing（Maestro/Appium）
- [ ] **MOB-14**: 各 Demo apps 补全转账/NFT/Token 功能页
- [ ] **FE-08**: 完整 a11y 测试套件（axe-core + jest-axe）
- [ ] **FE-09**: 各框架 E2E 测试（Playwright / Maestro）
- [ ] **FE-10**: 日期格式化集成 Intl API

---

## 📁 详细报告索引

| 报告 | 路径 | 行数 |
|------|------|------|
| SDK 核心层 | audit/2026-06-15-sdk-core.md | 659 |
| 基础设施层 | audit/2026-06-15-infra.md | 859 |
| 前端框架 SDK | audit/2026-06-15-frontend.md | ~200 |
| DeFi/支付/合规 | audit/2026-06-15-defi-compliance.md | 656 |
| 移动/原生平台 | audit/2026-06-15-mobile-native.md | 593 |

---

*整合报告生成时间: 2026-06-15T04:50:00Z*
