# 从 WalletConnect 迁移到 Cinacoin

> 逐步迁移指南，从 `@walletconnect/` 迁移到 `@cinacoin/`。

## 概述

本指南提供从 WalletConnect 生态完整迁移到 Cinacoin 的逐步说明，包括：

- ✅ 依赖替换对照表
- ✅ 代码迁移：Before / After 对比
- ✅ API 映射表
- ✅ 功能对等性检查清单
- ✅ 基础设施迁移说明

**预计迁移时间：** 2-8 小时（取决于应用复杂度）

---

## 为什么迁移？

| 对比项 | WalletConnect / Reown | Cinacoin |
|--------|----------------------|----------|
| 月费 | $500–$5,000+ | $0（仅需自建基础设施成本） |
| MAU 限制 | 免费版 500 MAU | 无限制 |
| 品牌露出 | Reown 品牌不可控 | 完全白标 |
| 数据隐私 | Reown 可见连接数据 | 数据完全自有 |
| 可靠性 | 单点故障风险 | 多 Region 自建部署 |
| 可定制性 | 有限 | 完全开源可控 |

---

## 1. 依赖替换

### 卸载旧依赖

```bash
npm uninstall @walletconnect/ethereum-provider \
  @walletconnect/modal \
  @walletconnect/sign-client \
  @reown/appkit \
  @reown/appkit-adapter-wagmi
```

### 安装 Cinacoin

```bash
# Core SDK
npm install @cinacoin/core-sdk

# React 适配器（如使用 React）
npm install @cinacoin/react

# 可选：其他适配器
npm install @cinacoin/vue
npm install @cinacoin/react-native
```

---

## 2. 代码迁移对照

### 2.1 初始化

#### Before (WalletConnect v2)

```typescript
import { createWeb3Modal, defaultConfig } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon } from '@reown/appkit/networks'

const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
  networks: [mainnet, polygon],
})

createWeb3Modal({
  wagmiAdapter,
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',
  },
})
```

#### After (Cinacoin)

```typescript
import { CinacoinProvider } from '@cinacoin/react'

// 在应用入口包裹即可
<CinacoinProvider
  config={{
    projectId: process.env.NEXT_PUBLIC_CINACOIN_PROJECT_ID,
    relayUrl: 'wss://relay.yourdomain.com/v1',
    chains: [
      {
        id: 1,
        name: 'Ethereum',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrl: 'https://rpc.yourdomain.com/eth',
      },
      {
        id: 137,
        name: 'Polygon',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrl: 'https://rpc.yourdomain.com/polygon',
      },
    ],
    metadata: {
      name: 'My dApp',
      description: 'My dApp description',
      url: 'https://mydapp.com',
      icons: ['https://mydapp.com/icon.png'],
    },
  }}
>
  <App />
</CinacoinProvider>
```

---

### 2.2 连接钱包

#### Before

```typescript
import { useWeb3Modal } from '@reown/appkit/react'

const { open } = useWeb3Modal()

// 打开钱包连接弹窗
const handleConnect = () => {
  open({ view: 'Connect' })
}
```

#### After

```typescript
import { ConnectButton, useConnect } from '@cinacoin/react'

// 方案 A：使用内置按钮（推荐）
<ConnectButton />

// 方案 B：自定义触发
const { connect, connectors } = useConnect()

const handleConnect = () => {
  // 连接第一个可用连接器（通常是 MetaMask）
  connect({ connector: connectors[0] })
}
```

---

### 2.3 获取账户信息

#### Before

```typescript
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { useAccount } from 'wagmi'

const { address, isConnected } = useAppKitAccount()
const { walletProvider } = useAppKitProvider()
const { chainId } = useAccount()
```

#### After

```typescript
import { useAccount } from '@cinacoin/react'

const account = useAccount()

// 所有信息都在一个 hook 中
const { address, isConnected, chainId, balance, chainSymbol } = account
```

---

### 2.4 签名消息

#### Before

```typescript
import { useSignMessage } from 'wagmi'

const { signMessage, data, isSuccess } = useSignMessage()

signMessage({ message: 'Hello WalletConnect!' })
```

#### After

```typescript
import { useSignMessage } from '@cinacoin/react'

const { signMessage, data, isSuccess } = useSignMessage()

signMessage({ message: 'Hello Cinacoin!' })
```

---

### 2.5 发送交易

#### Before

```typescript
import { useSendTransaction } from 'wagmi'
import { parseEther } from 'viem'

const { sendTransaction } = useSendTransaction()

sendTransaction({
  to: '0x...',
  value: parseEther('0.1'),
})
```

#### After

```typescript
import { useSendTransaction } from '@cinacoin/react'
import { parseEther } from 'viem'

const { sendTransaction } = useSendTransaction()

sendTransaction({
  to: '0x...',
  value: parseEther('0.1'),
})
```

---

### 2.6 切换链

#### Before

```typescript
import { useSwitchChain } from 'wagmi'
import { useAppKitProvider } from '@reown/appkit/react'

const { switchChain } = useSwitchChain()

switchChain({ chainId: 137 })
```

#### After

```typescript
import { useSwitchChain } from '@cinacoin/react'

const { switchChain, chains } = useSwitchChain()

switchChain({ chainId: 137 })
```

---

## 3. API 映射表

| WalletConnect / Reown API | Cinacoin 替代 | 说明 |
|---------------------------|---------------|------|
| `@walletconnect/sign-client` | `@cinacoin/core-sdk` | 核心连接管理 |
| `@walletconnect/ethereum-provider` | `@cinacoin/core-sdk` (InjectedProvider) | EVM Provider |
| `@walletconnect/modal` | `@cinacoin/react` (ConnectButton) | 连接弹窗 |
| `@reown/appkit` | `@cinacoin/react` | React 适配器 |
| `@reown/appkit-adapter-wagmi` | `@cinacoin/react` (内置 wagmi 适配) | Wagmi 适配 |
| `createWeb3Modal()` | `<CinacoinProvider>` | 初始化方式 |
| `useAppKitAccount()` | `useAccount()` | 账户状态 |
| `useAppKitProvider()` | `useCinacoin()` | Provider 实例 |
| `Web3Modal.open()` | `ConnectButton` / `useConnect()` | 连接触发 |
| `WalletConnectProvider` | `Cinacoin + RelayTransport` | 底层传输 |
| `projectId` (WC) | `projectId` (Cinacoin) + `relayUrl` | 配置参数 |
| `showQrModal: true` | 内置 QR 码扫描 | 扫码连接 |
| `themeVariables` | `theme` 配置对象 | 主题定制 |
| `featuredWalletIds` | `preferredWallets` 数组 | 优先展示钱包 |
| `excludeWalletIds` | `excludedWallets` 数组 | 排除钱包 |

---

## 4. 功能对等性检查清单

迁移完成后，请确认以下功能均已等效替换：

### 钱包连接

- [ ] MetaMask / 注入钱包连接
- [ ] WalletConnect QR 扫码连接
- [ ] Coinbase Wallet 连接
- [ ] WalletConnect Deep Link（移动端）
- [ ] EIP-6963 钱包自动发现
- [ ] 自定义钱包列表配置

### UI 组件

- [ ] 连接按钮 / 弹窗
- [ ] 账户信息展示
- [ ] 余额显示
- [ ] 网络切换器
- [ ] 交易状态展示

### 链操作

- [ ] 多链配置
- [ ] 链切换
- [ ] RPC 端点配置
- [ ] 链图标显示

### 签名与交易

- [ ] `personal_sign` 消息签名
- [ ] `eth_sendTransaction` 交易发送
- [ ] `eth_signTypedData_v4` 类型化数据签名
- [ ] EIP-5792 批量交易（如需要）

### 高级功能

- [ ] SIWE 认证 (EIP-4361)
- [ ] 会话持久化
- [ ] 自定义主题
- [ ] 国际化 (i18n)
- [ ] 无障碍 (a11y)
- [ ] Analytics 集成

### 基础设施

- [ ] Relay 服务器部署
- [ ] RPC Proxy 配置
- [ ] 多 Region 部署
- [ ] 监控告警

---

## 5. 环境变量迁移

更新 `.env` 文件：

```diff
- NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123...
+ NEXT_PUBLIC_CINACOIN_PROJECT_ID=abc123...
+ NEXT_PUBLIC_CINACOIN_RELAY_URL=wss://relay.yourdomain.com/v1
+ NEXT_PUBLIC_CINACOIN_RPC_URL=https://rpc.yourdomain.com
```

---

## 6. 渐进式迁移策略

对于大型应用，建议分阶段迁移：

### Phase 1：并行运行（1-2 天）

- 安装 Cinacoin 依赖，与 WalletConnect 并行运行
- 使用 feature flag 控制新旧连接方式
- 在测试环境验证

### Phase 2：核心功能迁移（2-4 天）

- 替换连接按钮和钱包弹窗
- 迁移账户状态获取
- 迁移签名和交易功能

### Phase 3：UI 定制（1-2 天）

- 调整主题和样式
- 自定义钱包列表
- 配置国际化

### Phase 4：基础设施迁移（1-2 天）

- 部署 Relay 服务器
- 配置 RPC Proxy
- 更新 DNS 和 SSL

### Phase 5：清理（0.5 天）

- 移除 WalletConnect 依赖
- 清理旧代码
- 更新 CI/CD 配置

---

## 7. 常见迁移问题

### Q: 需要同时支持 WalletConnect 和 Cinacoin 吗？

过渡期可以，但建议尽快完全迁移。Cinacoin 支持标准的 WalletConnect 协议作为传输层。

### Q: 用户需要重新连接钱包吗？

是的，因为会话存储方式不同。建议在迁移前通知用户。

### Q: 自定义的钱包配置如何迁移？

Cinacoin 支持 `preferredWallets` 和 `excludedWallets` 配置，功能完全对等。

---

## 下一步

- [React 快速开始](/guides/quickstart-react) — Cinacoin React 指南
- [Core SDK API](/api/core-sdk) — 核心 SDK 参考
- [React Hooks API](/api/react-hooks) — Hooks 参考
- [配置选项](/guide/configuration) — 完整配置参考
- [Reown 迁移指南](/guide/migrate-from-reown) — 更详细的 Reown 迁移说明
