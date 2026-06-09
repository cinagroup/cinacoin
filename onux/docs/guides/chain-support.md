# 链支持矩阵

> Cinacoin 支持的区块链网络完整列表及功能对照。

## 支持的链

Cinacoin 支持以下区块链网络。各列说明：

| 列 | 说明 |
|----|------|
| **连接** | 钱包连接支持（注入 / QR / Deep Link） |
| **签名** | 消息签名和交易签名 |
| **交易** | 发送交易功能 |
| **余额** | 查询链上余额 |
| **Paymaster** | Gas 赞助支持 (ERC-4337) |
| **Bundler** | UserOp 打包提交 |

### EVM 链

| 链 | Chain ID | 连接 | 签名 | 交易 | 余额 | Paymaster | Bundler |
|----|----------|------|------|------|------|-----------|---------|
| Ethereum | 1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Polygon | 137 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Arbitrum One | 42161 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Optimism | 10 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Base | 8453 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| BNB Chain | 56 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Avalanche C-Chain | 43114 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| zkSync Era | 324 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Linea | 59144 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Scroll | 534352 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gnosis | 100 | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| Fantom | 250 | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| Celo | 42220 | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| Cronos | 25 | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| Moonbeam | 1284 | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ |

### 非 EVM 链

| 链 | Namespace | 连接 | 签名 | 交易 | 余额 | 备注 |
|----|-----------|------|------|------|------|------|
| Solana | solana | ✅ | ✅ | ✅ | ✅ | 原生支持 |
| Bitcoin | bip122 | ✅ | ✅ | ✅ | ✅ | UTXO 模式 |
| TON | ton | ✅ | ✅ | ✅ | ✅ | The Open Network |
| TRON | tron | ✅ | ✅ | ✅ | ✅ | TRC-20 支持 |
| Sui | sui | ✅ | ✅ | ✅ | ✅ | Move 语言 |
| Aptos | aptos | ✅ | ✅ | ✅ | ✅ | Move 语言 |
| Polkadot | polkadot | ✅ | ✅ | ✅ | ✅ | SS58 地址 |
| Cosmos Hub | cosmos | ✅ | ✅ | ✅ | ✅ | IBC 支持 |
| Near | near | ✅ | ✅ | ✅ | ✅ | Near 协议 |
| StarkNet | starknet | ✅ | ✅ | ✅ | ✅ | zkRollup |
| Hedera | hedera | ✅ | ✅ | ✅ | ✅ | HBAR 网络 |
| XRPL | xrpl | ✅ | ✅ | ✅ | ✅ | XRP Ledger |

---

## 添加自定义链

Cinacoin 支持通过配置添加任意自定义链。

### EVM 链配置

```typescript
import { CinacoinProvider } from '@cinacoin/react'

// 在 chains 数组中添加自定义链
<CinacoinProvider
  config={{
    projectId: 'your-project-id',
    relayUrl: 'wss://relay.yourdomain.com/v1',
    chains: [
      // 内置链
      { id: 1, name: 'Ethereum', /* ... */ },
      
      // 自定义链
      {
        id: 31337,                    // Chain ID
        name: 'Local Devnet',         // 显示名称
        nativeCurrency: {             // 原生代币
          name: 'LocalETH',
          symbol: 'LETH',
          decimals: 18,
        },
        rpcUrl: 'http://localhost:8545',  // RPC 端点
        explorerUrl: 'https://etherscan.io',  // 浏览器（可选）
        iconUrl: '/icons/localdev.svg',     // 链图标（可选）
      },
    ],
  }}
>
  <App />
</CinacoinProvider>
```

### 非 EVM 链配置

```typescript
{
  id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',  // CAIP-2 格式
  name: 'Solana',
  namespace: 'solana',
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  nativeCurrency: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
  },
  explorerUrl: 'https://explorer.solana.com',
  iconUrl: '/icons/solana.svg',
}
```

### 注册链适配器

```typescript
import { Cinacoin, createAdapter } from '@cinacoin/core-sdk'

const cinacoin = new Cinacoin(config)

// 注册 TON 适配器
const tonAdapter = await createAdapter({ type: 'ton' })
cinacoin.registerAdapter(tonAdapter)

// 注册 Solana 适配器
const solanaAdapter = await createAdapter({ type: 'solana' })
cinacoin.registerAdapter(solanaAdapter)
```

---

## 测试网支持

| 链 | Chain ID | 说明 |
|----|----------|------|
| Sepolia | 11155111 | Ethereum 测试网 |
| Holesky | 17000 | Ethereum 验证者测试网 |
| Polygon Amoy | 80002 | Polygon 测试网 |
| Arbitrum Sepolia | 421614 | Arbitrum 测试网 |
| Base Sepolia | 84532 | Base 测试网 |
| BNB Testnet | 97 | BNB Chain 测试网 |
| Solana Devnet | devnet | Solana 开发网 |

---

## 下一步

- [配置选项](/guide/configuration) — 完整链配置参考
- [Core SDK API](/api/core-sdk) — `createAdapter` 和链适配器参考
- [快速开始](/guides/quickstart-react) — React 集成指南
