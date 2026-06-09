# SDK/核心包审计报告

**项目:** Cinacoin (onux monorepo)  
**审计日期:** 2026-06-08  
**审计范围:** 19个SDK/核心包  
**审计人:** 000 (AI Security Auditor)

---

## 严重问题 (Critical)

### [K-001] HTLC AtomicSwap 使用非加密哈希函数作为回退
- **文件:** `packages/cross-chain-sync/src/AtomicSwap.ts`
- **行号:** L67-82
- **描述:** `simpleSHA256()` 函数是一个简单的滚动哈希（非密码学安全），在 Web Crypto 不可用时作为回退使用。攻击者可以轻易碰撞此哈希，导致 HTLC 的 hash lock 被破解，资金被盗。
- **风险:** 跨链原子交换的 hash lock 可被暴力破解，直接导致资金损失
- **修复建议:** 
  - 移除 `simpleSHA256` 回退，强制要求 `crypto.subtle` 或 Node.js `crypto` 模块
  - 使用 `@noble/hashes` 的 sha256 作为跨平台回退
  - 在环境不支持时抛出错误而非降级

### [K-002] 跨链消息签名使用非加密哈希
- **文件:** `packages/cross-chain-sync/src/message-validation.ts`
- **行号:** L28-35
- **描述:** `computeHash()` 使用 djb2 哈希算法（32位），这不是密码学安全的哈希函数。消息签名可以被伪造。
- **风险:** 跨链消息签名可被伪造，攻击者可以创建虚假的跨链转账消息
- **修复建议:**
  - 使用 `@noble/hashes` 的 sha256 或 keccak256
  - 集成 viem 的 `signMessage` / `verifyMessage` 进行真实 ECDSA 签名验证

### [K-003] Merkle Proof 使用非加密哈希验证
- **文件:** `packages/cross-chain-sync/src/messaging.ts`
- **行号:** L178-193
- **描述:** `simpleHash()` 使用 JavaScript 位运算的简单哈希，用于 L2→L1 Merkle proof 验证。攻击者可以伪造 Merkle proof，导致虚假的跨链消息被接受。
- **风险:** L2→L1 消息验证可被绕过，可能导致虚假资产铸造
- **修复建议:**
  - 使用 viem 的 `keccak256` 或 `@noble/hashes` 的 sha256
  - 在生产环境中集成链上 Merkle proof 验证

### [K-004] EIP-191 签名哈希格式错误
- **文件:** `packages/walletconnect-v2/src/signature-verification.ts`
- **行号:** L93-103
- **描述:** `hashPersonalMessage()` 生成的前缀格式为 `\x19Ethereum Message\n<length>`，但 EIP-191 标准要求格式为 `\x19Ethereum Signed Message:\n<length><message>`。当前实现与所有标准钱包不兼容。
- **风险:** 签名验证永远无法正确工作，可能导致合法签名被拒绝或伪造签名被接受
- **修复建议:**
  ```typescript
  const prefix = `\x19Ethereum Signed Message:\n${messageBytes.length}`;
  ```

### [K-005] QR Code 组件 XSS 漏洞
- **文件:** `packages/core-ui/src/components/qr-code.ts`
- **行号:** L165
- **描述:** 使用 `.innerHTML` 直接插入 SVG 内容：`html`<div class="qr-svg-wrapper" .innerHTML=${this._svgContent}></div>`。虽然 SVG 来自 `qrcode` 库，但如果 URI 包含特殊字符导致库输出异常，可能引入 XSS。
- **风险:** 如果 `qrcode` 库的 SVG 输出被污染，攻击者可以注入恶意脚本
- **修复建议:**
  - 使用 Lit 的 `unsafeHTML` 指令并明确标记风险
  - 或使用 `DOMParser` 解析 SVG 后使用 `importNode` 插入
  - 对 `this.uri` 进行严格验证和转义

---

## 高危问题 (High)

### [G-001] ERC-6492 签名验证不完整
- **文件:** `packages/erc6492/src/erc6492.ts`
- **行号:** L78-105
- **描述:** `validateSignature()` 函数对 ERC-6492 签名只检查格式，不进行实际的链上验证。注释承认"Full on-chain validation requires calling the ERC-6492 validation contract"，但当前实现直接返回 `isValid: true`。
- **风险:** 智能合约钱包的签名可以被伪造，因为未验证部署和签名
- **修复建议:**
  - 集成 viem 的 `call` 和 `encodeFunctionData` 进行链上验证
  - 在验证失败时返回明确的错误而非 indeterminate

### [G-002] 跨链消息签名验证宽松
- **文件:** `packages/cross-chain-sync/src/messaging.ts`
- **行号:** L139-164
- **描述:** `verifyMessageSignature()` 对签名验证非常宽松：
  - EVM 链：允许非标准长度的签名（`return msg.signature.length > 2`）
  - Solana 链：同样宽松
  - 只检查 nonce > 0，未进行实际的 ECDSA 恢复
- **风险:** 任何非空签名都可以通过验证，跨链消息可被伪造
- **修复建议:**
  - 集成 `@noble/curves` 的 secp256k1 进行真实签名验证
  - 对 Solana 使用 `@noble/curves` 的 ed25519
  - 实现 nonce 注册表防止重放攻击

### [G-003] Bridge 状态机 refund 逻辑错误
- **文件:** `packages/cross-chain-sync/src/bridge.ts`
- **行号:** L432-458
- **描述:** `refundBridgeTransfer()` 方法在退款成功后将状态转换为 `completed` 而非 `refunded`，这在语义上是错误的。退款成功应该标记为 `refunded`，而非 `completed`。
- **风险:** 退款状态混淆可能导致用户界面显示错误，或重复退款
- **修复建议:**
  ```typescript
  // 添加 "refunded" 状态到 VALID_TRANSITIONS
  updated = transitionBridgeState(updated, "refunded", {
    reason: "refund_completed",
    refundTxHash: `0xrefund_${transferId}`,
  });
  ```

### [G-004] PaymasterClient 事件监听器未限制数量
- **文件:** `packages/aa-sdk/src/paymaster.ts`
- **行号:** L432-445
- **描述:** `PaymasterClient.on()` 方法使用 `Set` 存储监听器，但没有最大数量限制。如果代码存在监听器泄漏（未调用 `off()`），可能导致内存泄漏。
- **风险:** 长期运行的应用可能因监听器累积而内存耗尽
- **修复建议:**
  - 添加最大监听器数量限制（默认 100）
  - 在超过限制时发出警告
  - 提供 `listenerCount()` 方法供监控

### [G-005] AtomicSwap 事件监听器泄漏
- **文件:** `packages/cross-chain-sync/src/AtomicSwap.ts`
- **行号:** L412-425
- **描述:** `AtomicSwapManager.on()` 为每个 swap 注册监听器，但在 swap 完成/退款后未自动清理。`pendingSecrets` 在 refund 时被清理，但 `eventListeners` Map 中的条目保留。
- **风险:** 大量 swap 操作后，内存中累积大量无用的监听器引用
- **修复建议:**
  - 在 swap 进入终态（completed/aborted/expired）时自动清理监听器
  - 提供 `removeAllListeners(swapId)` 方法

### [G-006] 跨链消息反序列化未验证
- **文件:** `packages/cross-chain-sync/src/messaging.ts`
- **行号:** L108-113
- **描述:** `deserializeMessage()` 直接 `JSON.parse()` 并转换为 `CrossChainMessage`，未验证字段类型和完整性。恶意中继可以发送畸形消息。
- **风险:** 类型混淆攻击，可能导致下游代码崩溃或逻辑错误
- **修复建议:**
  - 添加完整的字段验证（类型检查、必填字段）
  - 使用 zod 或类似库进行 schema 验证

### [G-007] LocalStorage 存储未加密
- **文件:** `packages/cross-chain-sync/src/storage.ts`
- **行号:** L48-72
- **描述:** `LocalStorage` 类将 session state 和 bridge transfers 以明文 JSON 存储在 localStorage 中，包括地址、交易哈希等敏感信息。
- **风险:** XSS 攻击可以读取所有存储的敏感数据
- **修复建议:**
  - 使用加密存储（如 `crypto.subtle.encrypt`）
  - 考虑使用 httpOnly cookie 或 IndexedDB 加密层
  - 对敏感字段进行加密后再存储

---

## 中等问题 (Medium)

### [Z-001] ERC-6492 解码假设固定签名长度
- **文件:** `packages/erc6492/src/erc6492.ts`
- **行号:** L52-65
- **描述:** `decodeValidation()` 假设签名固定为 65 字节（130 hex chars），但 ERC-6492 规范允许变长签名（多签、智能合约钱包等）。
- **风险:** 无法正确解码非标准签名
- **修复建议:**
  - 从编码中提取签名长度信息
  - 或要求调用者提供签名长度

### [Z-002] Bridge 使用 Math.random() 生成 ID
- **文件:** `packages/cross-chain-sync/src/bridge.ts`
- **行号:** L156
- **描述:** `createBridgeTransferRecord()` 使用 `Math.random()` 生成 bridgeId。虽然 ID 不用于安全目的，但在高并发场景下可能冲突。
- **风险:** 极低概率的 ID 冲突
- **修复建议:**
  - 使用 `crypto.randomUUID()` 或 `crypto.getRandomValues()`
  - 保持与 AtomicSwap 的一致性

### [Z-003] PaymasterClient 缓存未考虑链切换
- **文件:** `packages/aa-sdk/src/paymaster.ts`
- **行号:** L320-340
- **描述:** `checkDeposit()` 的缓存使用单一 `cachedDeposit` 变量，但多链场景下不同链的余额不同。切换链后可能返回错误的缓存值。
- **风险:** 多链应用可能获得错误的存款信息
- **修复建议:**
  - 使用 `Map<chainId, PaymasterDepositInfo>` 作为缓存
  - 或在 cache key 中包含 chainId

### [Z-004] React Hooks 缺少错误边界
- **文件:** `packages/react/src/hooks/useSendTransaction.ts`
- **行号:** L45-70
- **描述:** `sendTransaction` 函数在错误时设置 `error` 状态，但如果组件未处理此错误，可能导致未捕获的 Promise rejection。
- **风险:** 应用崩溃或未处理的异常
- **修复建议:**
  - 在文档中明确要求用户处理 error 状态
  - 考虑提供 `useErrorBoundary` 集成

### [Z-005] WalletConnect 签名验证未验证 domain
- **文件:** `packages/walletconnect-v2/src/signature-verification.ts`
- **行号:** L355-385
- **描述:** `verifySiweSignature()` 只提取地址并验证签名，但不验证 SIWE 消息中的 domain、URI、nonce 等字段。攻击者可以使用其他域的合法签名。
- **风险:** 跨域重放攻击
- **修复建议:**
  - 添加 `expectedDomain` 参数并验证
  - 验证 nonce 是否已使用（集成 NonceManager）
  - 验证 expirationTime 和 notBefore

### [Z-006] Chain Registry RPC URL 包含测试网
- **文件:** `packages/chain-registry/src/chains.ts`
- **行号:** L22
- **描述:** Ethereum Mainnet (chainId: 1) 的 RPC URL 列表中包含 `rpc.sepolia.org` 等测试网 URL。这是数据错误。
- **风险:** 主网交易可能被发送到测试网 RPC
- **修复建议:**
  - 修正数据，移除测试网 RPC
  - 添加验证脚本确保 testnet 标记与 RPC URL 一致

### [Z-007] i18n 插值未转义 HTML
- **文件:** `packages/core-ui/src/i18n/translator.ts`
- **行号:** L145-155
- **描述:** `_interpolate()` 函数直接将参数值插入翻译字符串，未进行 HTML 转义。如果翻译参数来自用户输入，可能导致 XSS。
- **风险:** 如果翻译模板用于 innerHTML，参数中的 `<script>` 会被执行
- **修复建议:**
  - 在插值前对参数进行 HTML 转义
  - 或在文档中明确说明参数不应包含用户输入

---

## 低危问题 (Low)

### [D-001] 类型导出不一致
- **文件:** 多个包的 `index.ts`
- **描述:** 部分包导出所有内部类型，部分包只导出公共 API。建议统一使用 `@internal` 标记或单独的 `types.ts` 导出。
- **修复建议:** 建立统一的导出策略

### [D-002] 缺少 JSDoc 的 @throws 标记
- **文件:** 多个文件
- **描述:** 许多会抛出错误的函数缺少 `@throws` JSDoc 标记，影响 IDE 提示和文档生成。
- **修复建议:** 为所有可能抛出错误的函数添加 `@throws` 标记

### [D-003] 硬编码的超时和重试值
- **文件:** `packages/aa-sdk/src/paymaster.ts`, `packages/cross-chain-sync/src/messaging.ts`
- **描述:** 超时（30s, 120s）和重试次数（3次）硬编码在代码中，无法通过配置覆盖。
- **修复建议:** 将这些值提取到配置中

### [D-004] 缺少单元测试
- **文件:** `packages/cross-chain-sync/src/AtomicSwap.ts`, `packages/cross-chain-sync/src/bridge.ts`
- **描述:** 关键跨链逻辑缺少单元测试覆盖。
- **修复建议:** 添加状态机转换、签名验证、边界条件的测试

### [D-005] 魔法数字
- **文件:** 多个文件
- **描述:** 代码中存在未解释的魔法数字，如 `130`（签名长度）、`3600`（TTL）、`1000`（毫秒转换）。
- **修复建议:** 提取为命名常量

### [D-006] console.warn 在生产环境
- **文件:** `packages/aa-sdk/src/paymaster.ts` L467
- **描述:** 事件监听器错误使用 `console.warn` 输出，在生产环境可能暴露敏感信息。
- **修复建议:** 使用可配置的日志系统

### [D-007] 依赖版本未锁定
- **文件:** 各包 `package.json`
- **描述:** 部分依赖使用 `^` 范围版本，可能导致不同环境安装不同版本。
- **修复建议:** 使用 pnpm lockfile 确保一致性

---

## 总结

### 问题统计
| 严重级别 | 数量 |
|---------|------|
| 严重 (Critical) | 5 |
| 高危 (High) | 7 |
| 中等 (Medium) | 7 |
| 低危 (Low) | 7 |
| **总计** | **26** |

### 主要风险领域

1. **密码学实现** (K-001, K-002, K-003, K-004)
   - 多处使用非密码学哈希函数作为回退
   - EIP-191 签名格式实现错误
   - **建议:** 统一使用 `@noble/hashes` 和 `@noble/curves`

2. **跨链安全** (K-002, K-003, G-002, G-006)
   - 消息签名验证形同虚设
   - Merkle proof 使用弱哈希
   - **建议:** 在生产部署前必须集成真实的 ECDSA 验证

3. **状态管理** (G-003, G-005, Z-003)
   - Bridge 状态机逻辑错误
   - 监听器泄漏
   - **建议:** 添加状态机测试，实现自动清理

4. **前端安全** (K-005, Z-007, G-007)
   - XSS 风险
   - 明文存储
   - **建议:** 使用安全的 DOM 操作和加密存储

### 优先修复建议

1. **立即修复 (P0):**
   - K-001: 替换 `simpleSHA256` 为 `@noble/hashes/sha256`
   - K-002: 替换 `computeHash` 为密码学哈希
   - K-003: 替换 `simpleHash` 为 `keccak256`
   - K-004: 修正 EIP-191 前缀格式

2. **高优先级 (P1):**
   - G-001: 实现 ERC-6492 链上验证
   - G-002: 实现真实的签名验证
   - G-003: 修正 bridge refund 状态
   - K-005: 修复 QR code XSS

3. **中优先级 (P2):**
   - Z-001 ~ Z-007: 改进验证和错误处理
   - 添加单元测试覆盖

### 架构建议

1. **统一密码学库:** 全项目使用 `@noble/hashes` 和 `@noble/curves`，移除自定义哈希实现
2. **类型安全:** 使用 zod 进行运行时验证，特别是跨链消息和外部输入
3. **安全存储:** 实现加密的 Storage 适配器
4. **测试覆盖:** 为关键路径（签名验证、状态机、跨链消息）添加 100% 测试覆盖

---

*报告生成时间: 2026-06-08 07:45 UTC*  
*审计工具: 静态代码分析 + 人工审查*
