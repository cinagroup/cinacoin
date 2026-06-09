# Reown AppKit PAYMENTS 层深度分析

> 完成时间: 2026-05-17
> 来源: docs.reown.com (5 pages + 4 framework pages)

---

## 一、页面提取总结

### 1. Payments Overview (`/appkit/payments/overview.md`)

**定位**: Reown Payments 是面向 Web3 应用开发者的全栈 SDK，区别于 WalletConnect Pay（面向商户的独立支付基础设施）。

**四大模块**:
| 模块 | 描述 | 架构 |
|------|------|------|
| On-Ramps | 法币购买加密资产 | 嵌入模态框，Meld/Coinbase Pay 提供商 |
| Swaps | 代币间兑换 | 嵌入模态框，1inch 聚合器 |
| Pay with Self-Custodial Wallet | 非托管钱包直接支付 | 客户端发起，600+ 钱包支持 |
| Deposit with Exchange | 从 CEX 充值到钱包 | 已弃用（合规原因），可能并入 WalletConnect Pay |

**关键区别**:
- Reown = 客户端发起 (前端传参 → SDK → 模态框)
- WalletConnect Pay = 服务端权威 (创建支付意图 → 网关解析)
- Reown 无 KYC/AML/制裁筛查，WCP 有
- Reown 链支持: EVM, Solana, Bitcoin, Ton, Tron

### 2. Swaps (`/appkit/features/swaps.md`)

- **提供商**: 1inch
- **费率**: 0.85% 交易费
- **前提**: 必须通过 email/social login 登录
- **不支持测试网** (Sepolia 等)
- **启用**: 默认开启，`features.swaps: false` 可关闭
- **编程打开**: `open({ view: 'Swap', arguments: { amount, fromToken, toToken } })`

### 3. On-Ramp (`/appkit/features/onramp.md`)

- **提供商**: Meld (主要), Coinbase Pay (文档也提及)
- **支持**: 100+ 加密货币
- **流程**: Connect Wallet → "Buy Crypto" → 选提供商 (Meld) → 选资产/金额 → 完成购买
- **启用**: 默认开启，`features.onramp: false` 可关闭
- **编程打开**: `open({ view: 'OnRampProviders' })`
- **已支持 Solana**

### 4. Pay with Self-Custodial Wallets (`/appkit/payments/pay-with-self-custodial-wallets.md`)

**支持资产/网络**:
| 资产 | 网络 |
|------|------|
| USDC | Ethereum, Optimism, Arbitrum, Base, Polygon, Solana |
| USDT | Ethereum, Optimism, Arbitrum, Polygon, Solana |
| 原生 SOL | Solana |

**API 接口** (`@reown/appkit-pay`):
- `pay({ recipient, amount, paymentAsset })` → `PaymentResult { success, result, error }` — 完整支付流程
- `openPay()` — 仅打开支付 UI
- `usePay({ onSuccess, onError })` — React Hook，返回 `{ open, isPending, isSuccess, data, error }`
- 预配置资产: `baseETH`, `baseSepoliaETH`, `baseUSDC`, `ethereumUSDC`, `optimismUSDC`, `arbitrumUSDC`, `polygonUSDC`, `solanaUSDC`, `ethereumUSDT`, `optimismUSDT`, `arbitrumUSDT`, `polygonUSDT`, `solanaUSDT`
- 自定义资产: 创建 `paymentAssetDetails` 对象

**定价**: 基于处理金额 USD 价值的分层定价模型，按月结算。端用户承担 Gas 费。
**SLA**: 付费客户 99.9% 可用性
**本地测试**: 必须使用 localhost:3000

### 5. Deposit with Exchange (`/appkit/payments/deposit-with-exchange.md`)

⚠️ **已弃用** (合规原因)

**历史支持** (Binance):
| 资产 | 网络 |
|------|------|
| USDC | Ethereum, Optimism, Arbitrum, Base, Polygon, Solana |
| USDT | Ethereum, Optimism, Arbitrum, Polygon, Solana |
| 原生 SOL | Solana |

**API**: 同样通过 `@reown/appkit-pay` 的 `pay()` 函数
**Hooks** (向后兼容保留):
- `useAvailableExchanges()` — 获取可用交易所列表
- `usePayUrlActions()` — `{ getUrl, openUrl }` 获取/打开支付 URL
- `useExchangeBuyStatus()` — 轮询交易状态

---

## 二、@onchainux 模块实现指南

### 总体架构

```
@onchainux/core           # 基础：钱包连接、网络管理、账户状态
@onchainux/onramp         # 法币入金模块
@onchainux/swaps          # 代币兑换模块
@onchainux/pay            # 自托管钱包支付模块
@onchainux/deposit        # 交易所充值模块（已弃用，保留兼容）
```

所有模块依赖 `@onchainux/core` 提供的钱包连接和网络上下文。

---

### 模块 1: @onchainux/onramp

#### 包结构

```
packages/onramp/
├── package.json
├── src/
│   ├── index.ts              # 导出入口
│   ├── provider.ts           # Meld/Coinbase Pay 提供商抽象
│   ├── config.ts             # 默认配置和资产映射
│   ├── hooks/
│   │   ├── useOnramp.ts      # 主 Hook
│   │   └── useOnrampQuote.ts # 报价 Hook (可选)
│   ├── components/
│   │   ├── OnrampModal.tsx   # 模态框组件
│   │   └── OnrampButton.tsx  # 快捷按钮
│   └── types.ts              # TypeScript 类型定义
└── README.md
```

#### 支付流程代码

```typescript
// @onchainux/onramp/src/provider.ts
export type OnrampProvider = 'meld' | 'coinbase'

export interface OnrampConfig {
  projectId: string            // Reown Dashboard projectId
  provider?: OnrampProvider    // 默认 'meld'
  defaultAsset?: string        // 默认购买资产
  defaultFiat?: string         // 默认法币金额
  redirectUrl?: string         // 支付完成回调
}

export class OnrampService {
  constructor(private config: OnrampConfig) {}

  /** 打开入金模态框 */
  open(asset?: string, amount?: string): void {
    const { open } = useAppKit()
    open({ view: 'OnRampProviders' })
  }

  /** 获取支持资产列表 */
  async getSupportedAssets(): Promise<AssetInfo[]> {
    // Meld API 或缓存配置
    return ONRAMP_ASSETS
  }
}

// 预定义资产映射
const ONRAMP_ASSETS: AssetInfo[] = [
  { symbol: 'ETH', networks: ['ethereum', 'base', 'arbitrum'] },
  { symbol: 'USDC', networks: ['ethereum', 'base', 'polygon', 'solana'] },
  // ... 100+ 加密货币
]
```

```typescript
// @onchainux/onramp/src/hooks/useOnramp.ts
import { useAppKit } from '@reown/appkit/react'
import type { OnrampConfig } from '../provider'

export function useOnramp(config?: Partial<OnrampConfig>) {
  const { open } = useAppKit()
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = useCallback((asset?: string, fiatAmount?: string) => {
    setIsOpen(true)
    open({ view: 'OnRampProviders' })
  }, [open])

  return { open: handleOpen, isOpen }
}
```

#### 提供商集成模式 (Meld)

```typescript
// Meld 提供商配置
interface MeldProvider {
  name: 'meld'
  apiKey: string
  widgetUrl: string        // https://widget.meld.io
  supportedFiats: string[] // USD, EUR, GBP 等
  supportedCryptos: string[]
}

// 初始化
const meldProvider: MeldProvider = {
  name: 'meld',
  apiKey: process.env.MELD_API_KEY,
  widgetUrl: 'https://widget.meld.io',
  supportedFiats: ['USD', 'EUR', 'GBP'],
  supportedCryptos: ['ETH', 'USDC', 'USDT', 'BTC', 'SOL']
}
```

#### 依赖

```json
{
  "dependencies": {
    "@reown/appkit": "^1.x",
    "@reown/appkit/react": "^1.x",
    "@onchainux/core": "workspace:*"
  }
}
```

#### 与 @onchainux/core 集成

```typescript
// 从 core 获取钱包地址和网络状态
import { useOnchainContext } from '@onchainux/core'

function OnrampButton() {
  const { address, isConnected, activeNetwork } = useOnchainContext()
  const { open: openOnramp } = useOnramp()

  if (!isConnected) return <ConnectButton />

  return (
    <Button onClick={() => openOnramp('USDC', '100')}>
      Buy Crypto on {activeNetwork.name}
    </Button>
  )
}
```

#### 工作量估算: **2-3 天**
- 基础封装: 1 天
- Hook 和组件: 1 天
- 测试和文档: 0.5-1 天

---

### 模块 2: @onchainux/swaps

#### 包结构

```
packages/swaps/
├── package.json
├── src/
│   ├── index.ts
│   ├── provider.ts           # 1inch 提供商抽象
│   ├── config.ts             # 代币对映射、费率配置
│   ├── hooks/
│   │   ├── useSwap.ts        # 主 Hook
│   │   └── useSwapQuote.ts   # 报价查询 Hook
│   ├── components/
│   │   ├── SwapModal.tsx
│   │   └── SwapButton.tsx
│   └── types.ts
└── README.md
```

#### 支付流程代码

```typescript
// @onchainux/swaps/src/provider.ts
export interface SwapConfig {
  projectId: string
  slippage?: number           // 默认 0.5%
  fee?: number                // Reown 收取 0.85%
  disabled?: boolean          // 默认 false
}

export interface SwapParams {
  fromToken: string           // e.g. 'USDC'
  toToken: string             // e.g. 'ETH'
  amount: string              // 数量
}

export class SwapService {
  constructor(private config: SwapConfig) {}

  /** 打开兑换模态框 */
  open(params?: SwapParams): void {
    const { open } = useAppKit()
    open({
      view: 'Swap',
      arguments: params ? {
        amount: params.amount,
        fromToken: params.fromToken,
        toToken: params.toToken
      } : undefined
    })
  }

  /** 获取支持代币列表 */
  async getSupportedTokens(network: string): Promise<TokenInfo[]> {
    // 1inch API 或缓存
    return SUPPORTED_TOKENS[network] || []
  }
}
```

```typescript
// @onchainux/swaps/src/hooks/useSwap.ts
import { useAppKit } from '@reown/appkit/react'

export interface UseSwapOptions {
  onSuccess?: (txHash: string) => void
  onError?: (error: Error) => void
}

export function useSwap(options?: UseSwapOptions) {
  const { open } = useAppKit()

  const handleSwap = useCallback((params: {
    fromToken: string
    toToken: string
    amount: string
  }) => {
    open({
      view: 'Swap',
      arguments: {
        amount: params.amount,
        fromToken: params.fromToken,
        toToken: params.toToken
      }
    })
  }, [open])

  return { swap: handleSwap }
}
```

#### 提供商集成模式 (1inch)

```typescript
// 1inch 聚合器配置
interface OneInchProvider {
  name: '1inch'
  apiUrl: string            // https://api.1inch.dev
  feePercentage: 0.85       // Reown 固定费率
  requiresSocialLogin: true  // 必须 email/social login
}

// 代币对配置（按网络）
const TOKEN_PAIRS: Record<string, TokenPair[]> = {
  ethereum: [
    { from: 'USDC', to: 'ETH', minAmount: '10' },
    { from: 'ETH', to: 'USDC', minAmount: '0.01' },
  ],
  base: [
    { from: 'USDC', to: 'ETH', minAmount: '5' },
  ]
}
```

#### 依赖

```json
{
  "dependencies": {
    "@reown/appkit": "^1.x",
    "@reown/appkit/react": "^1.x",
    "@onchainux/core": "workspace:*"
  }
}
```

#### 与 @onchainux/core 集成

```typescript
function SwapCard() {
  const { address, isConnected, activeNetwork } = useOnchainContext()
  const { swap } = useSwap()

  // 检查登录方式 (Swap 需要 email/social login)
  const { loginMethod } = useAppKitAccount()
  const canSwap = isConnected && loginMethod !== 'wallet_connect'

  return (
    <Card>
      <h3>Swap on {activeNetwork.name}</h3>
      {!canSwap && <Notice>Swap requires email or social login</Notice>}
      <Button
        disabled={!canSwap}
        onClick={() => swap({ fromToken: 'USDC', toToken: 'ETH', amount: '100' })}
      >
        Swap USDC → ETH
      </Button>
    </Card>
  )
}
```

#### 工作量估算: **2-3 天**
- 基础封装: 1 天
- 1inch 集成: 0.5 天 (Reown 已处理)
- 测试和文档: 0.5-1 天
- 额外: 登录方式检查逻辑 0.5 天

---

### 模块 3: @onchainux/pay

#### 包结构

```
packages/pay/
├── package.json
├── src/
│   ├── index.ts
│   ├── assets.ts             # 预配置资产常量
│   ├── provider.ts           # 支付服务
│   ├── hooks/
│   │   ├── usePay.ts         # 主 Hook (封装 usePay from appkit-pay)
│   │   └── usePayStatus.ts   # 支付状态追踪
│   ├── components/
│   │   ├── PayButton.tsx
│   │   ├── PayModal.tsx
│   │   └── PaymentStatus.tsx
│   └── types.ts
└── README.md
```

#### 支付流程代码

```typescript
// @onchainux/pay/src/provider.ts
import { pay, openPay } from '@reown/appkit-pay'
import type { PaymentResult } from '@reown/appkit-pay'

export interface PaymentRequest {
  recipient: string           // 收款地址
  amount: number | bigint     // 支付数量
  paymentAsset: PaymentAsset  // 资产配置
  memo?: string               // 备注
  timeoutMs?: number          // 超时时间 (默认 300000 = 5min)
}

export interface PaymentAsset {
  network: string             // CAIP-2, e.g. 'eip155:8453'
  asset: string               // 合约地址或 'native'
  metadata: {
    name: string
    symbol: string
    decimals: number
  }
}

export class PayService {
  /** 完整支付流程 */
  async execute(request: PaymentRequest): Promise<PaymentResult> {
    return await pay({
      recipient: request.recipient,
      amount: request.amount,
      paymentAsset: request.paymentAsset
    })
  }

  /** 仅打开支付 UI */
  async openUI(request: PaymentRequest): Promise<void> {
    await openPay({
      recipient: request.recipient,
      amount: request.amount,
      paymentAsset: request.paymentAsset
    })
  }
}
```

```typescript
// @onchainux/pay/src/hooks/usePay.ts
import { usePay as useAppKitPay } from '@reown/appkit-pay/react'
import type { PaymentResult } from '@reown/appkit-pay'

export interface UsePayOptions {
  onSuccess?: (data: PaymentResult) => void
  onError?: (error: Error) => void
}

export function usePay(options?: UsePayOptions) {
  const { open, isPending, isSuccess, data, error } = useAppKitPay({
    onSuccess: options?.onSuccess,
    onError: options?.onError
  })

  const executePay = useCallback(async (
    recipient: string,
    amount: number | bigint,
    paymentAsset: PaymentAsset
  ) => {
    await open({ recipient, amount, paymentAsset })
  }, [open])

  return {
    pay: executePay,
    isPending,
    isSuccess,
    data,
    error
  }
}
```

#### 预配置资产

```typescript
// @onchainux/pay/src/assets.ts
export {
  baseETH,
  baseSepoliaETH,
  baseUSDC,
  ethereumUSDC,
  optimismUSDC,
  arbitrumUSDC,
  polygonUSDC,
  solanaUSDC,
  ethereumUSDT,
  optimismUSDT,
  arbitrumUSDT,
  polygonUSDT,
  solanaUSDT
} from '@reown/appkit-pay'

// 自定义资产工厂
export function createPaymentAsset(
  network: string,
  asset: string,
  metadata: { name: string; symbol: string; decimals: number }
): PaymentAsset {
  return { network, asset, metadata }
}
```

#### 依赖

```json
{
  "dependencies": {
    "@reown/appkit": "^1.x",
    "@reown/appkit/react": "^1.x",
    "@reown/appkit-pay": "^1.x",
    "@onchainux/core": "workspace:*"
  }
}
```

#### 与 @onchainux/core 集成

```typescript
function CheckoutButton({ amount, currency = 'USDC' }: CheckoutProps) {
  const { address, isConnected } = useOnchainContext()
  const { pay, isPending, isSuccess, error } = usePay({
    onSuccess: (data) => {
      console.log('支付成功:', data.result) // txHash
      // 通知后端确认
    },
    onError: (err) => {
      console.error('支付失败:', err)
    }
  })

  if (!isConnected) return <ConnectButton />

  const asset = currency === 'USDC' ? baseUSDC : baseETH

  return (
    <>
      <Button
        disabled={isPending}
        onClick={() => pay(address!, amount, asset)}
      >
        {isPending ? 'Processing...' : `Pay ${amount} ${currency}`}
      </Button>
      {isSuccess && <SuccessMsg>Payment confirmed!</SuccessMsg>}
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </>
  )
}
```

#### 工作量估算: **3-4 天**
- 基础封装: 1 天
- Hook/组件: 1 天
- 支付状态管理: 0.5 天
- 多网络/资产支持: 0.5 天
- 测试和文档: 1 天

---

### 模块 4: @onchainux/deposit

#### ⚠️ 已弃用警告

> "The Pay with exchange feature has been deprecated due to the evolving challenge of compliance for our partner centralized exchanges. In future, it may be added to WalletConnect Pay."

**建议**: 仅保留向后兼容层，不投入新开发资源。如果业务必须，考虑 WalletConnect Pay 替代方案。

#### 包结构 (最小化兼容)

```
packages/deposit/
├── package.json
├── src/
│   ├── index.ts              # 向后兼容导出
│   ├── deprecated.ts         # 弃用警告包装
│   ├── hooks/
│   │   ├── useDeposit.ts     # 封装 useAvailableExchanges 等
│   │   └── useDepositStatus.ts
│   └── types.ts
└── README.md                 # 显著标注已弃用
```

#### 代码 (兼容保留)

```typescript
// @onchainux/deposit/src/deprecated.ts
import { pay } from '@reown/appkit-pay'
import {
  useAvailableExchanges,
  usePayUrlActions,
  useExchangeBuyStatus
} from '@reown/appkit-pay/react'

// 弃用警告
function warnDeprecated(feature: string) {
  console.warn(
    `[DEPRECATED] @onchainux/deposit: ${feature} is deprecated. ` +
    'Consider migrating to WalletConnect Pay.'
  )
}

export function useDeposit() {
  warnDeprecated('useDeposit')

  const exchanges = useAvailableExchanges()
  const { getUrl, openUrl } = usePayUrlActions()
  const buyStatus = useExchangeBuyStatus

  return { exchanges, getUrl, openUrl, buyStatus }
}

// Deposit 使用相同的 pay() 函数
export const executeDeposit = async (params: {
  recipient: string
  amount: number
  paymentAsset: PaymentAsset
}) => {
  warnDeprecated('executeDeposit')
  return pay(params)
}
```

#### 工作量估算: **0.5-1 天**
- 仅兼容封装 + 弃用警告

---

## 三、各模块依赖汇总

| 模块 | 核心依赖 | 外部依赖 |
|------|----------|----------|
| @onchainux/core | — | @reown/appkit, viem/wagmi |
| @onchainux/onramp | @onchainux/core | @reown/appkit/react, Meld API |
| @onchainux/swaps | @onchainux/core | @reown/appkit/react, 1inch API |
| @onchainux/pay | @onchainux/core | @reown/appkit-pay, @reown/appkit-pay/react |
| @onchainux/deposit | @onchainux/core | @reown/appkit-pay (已弃用) |

---

## 四、与 @onchainux/core 集成模式

```typescript
// @onchainux/core 提供统一上下文
import { createContext, useContext } from 'react'
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'

interface OnchainContext {
  address: string | undefined
  isConnected: boolean
  activeNetwork: ChainInfo
  loginMethod: 'email' | 'social' | 'wallet_connect' | null
  openAppKit: (view?: string, args?: Record<string, any>) => void
}

const OnchainContext = createContext<OnchainContext | null>(null)

export function useOnchainContext(): OnchainContext {
  const ctx = useContext(OnchainContext)
  if (!ctx) throw new Error('useOnchainContext must be used within OnchainProvider')
  return ctx
}

// Provider 包装
export function OnchainProvider({ children, projectId, networks }: Props) {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()

  const value: OnchainContext = useMemo(() => ({
    address,
    isConnected,
    activeNetwork: getChainInfo(chainId),
    loginMethod: getLoginMethod(),
    openAppKit: open
  }), [address, isConnected, chainId, open])

  return (
    <OnchainContext.Provider value={value}>
      {children}
    </OnchainContext.Provider>
  )
}
```

---

## 五、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **Deposit 已弃用** | 高 | 仅保留兼容层，推荐迁移到 WalletConnect Pay |
| **Swap 仅限 email/social login** | 中 | 明确 UI 提示，提供引导流程 |
| **仅支持 localhost:3000 本地测试** | 中 | CI/CD 中配置端口映射，文档明确标注 |
| **支付功能需在 Dashboard 手动开启** | 低 | 初始化时检查并给出明确错误提示 |
| **分层定价 + 超额费用** | 中 | 实现用量监控和告警，设置费率上限 |
| **端用户承担 Gas 费** | 低 | 在 UI 中提前展示预估费用 |
| **不支持测试网 (Swap)** | 中 | 提供 mock 模式用于开发测试 |
| **99.9% SLA 仅付费客户** | 低 | 免费 tier 做好降级/超时处理 |
| **多链资产地址差异** | 低 | 统一 CAIP 格式，资产工厂函数封装 |

---

## 六、总工作量估算

| 模块 | 估算 (人天) | 优先级 |
|------|-------------|--------|
| @onchainux/core | 5-7 (基础) | P0 |
| @onchainux/onramp | 2-3 | P1 |
| @onchainux/swaps | 2-3 | P1 |
| @onchainux/pay | 3-4 | P0 |
| @onchainux/deposit | 0.5-1 | P3 (已弃用) |
| **总计** | **12.5-18** | |

---

## 七、关键注意事项

1. **Dashboard 配置**: 所有支付功能需先在 [Reown Dashboard](https://dashboard.reown.com) 开启 Payments 功能
2. ** projectId**: 所有模块共享同一个 projectId，由 core 统一管理
3. **本地开发**: 必须运行在 `localhost:3000`
4. **Solana 支持**: Onramp 和 Pay 均已支持 Solana，确保适配器配置正确
5. **跨链能力**: 支持的链包括 EVM (ETH, OP, ARB, Base, Polygon) + Solana
6. **Reown 与 WalletConnect Pay 选择**: 如果是加密货币应用开发者 → Reown；如果是电商/商户接受加密支付 → WalletConnect Pay
