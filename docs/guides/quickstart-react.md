# 快速开始 — React

> 5 分钟从零到钱包连接。适用于 React 18+ 和 Next.js。

## 概述

本指南帮助你在 React 应用中快速集成 Cinacoin SDK，实现：

- ✅ 钱包连接（MetaMask、WalletConnect、Coinbase 等）
- ✅ 账户状态管理
- ✅ 消息签名
- ✅ 多链切换

**预计完成时间：** 5 分钟

---

## 前置条件

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x / **pnpm** ≥ 8.x / **yarn** ≥ 1.22.x
- **React** ≥ 18.x（支持 Hooks）
- 已有 Vite / Next.js / CRA 项目，或准备从零创建

---

## 第一步：安装

```bash
# 新建项目（如已有项目则跳过）
npm create vite@latest my-dapp -- --template react-ts
cd my-dapp

# 安装核心 SDK 和 React 适配器
npm install @cinacoin/core-sdk @cinacoin/react

# 或使用 pnpm / yarn
# pnpm add @cinacoin/core-sdk @cinacoin/react
# yarn add @cinacoin/core-sdk @cinacoin/react
```

### 依赖说明

| 包名 | 说明 | 是否必选 |
|------|------|----------|
| `@cinacoin/core-sdk` | 核心 SDK，管理连接和链适配器 | ✅ 必选 |
| `@cinacoin/react` | React 适配层，提供 Hooks 和组件 | ✅ 必选 |
| `viem` | EVM 交易处理（peer dependency） | 推荐 |
| `wagmi` | React 链状态管理（peer dependency） | 推荐 |

---

## 第二步：配置 CinacoinProvider

在应用入口（或根布局）使用 `CinacoinProvider` 包裹整个应用：

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { CinacoinProvider } from '@cinacoin/react'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CinacoinProvider
      config={{
        // 项目标识 — 用于 analytics 和会话管理
        projectId: 'your-project-id',

        // 自建 Relay 服务器地址
        // 测试环境可使用公共节点: wss://relay-test.cinacoin.com/v1
        relayUrl: 'wss://relay.yourdomain.com/v1',

        // 支持的链列表
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
          {
            id: 10,
            name: 'Optimism',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrl: 'https://rpc.yourdomain.com/optimism',
          },
        ],

        // 应用元数据（展示在钱包连接界面）
        metadata: {
          name: 'My dApp',
          description: 'My awesome decentralized application',
          url: 'https://mydapp.com',
          icons: ['https://mydapp.com/icon.png'],
        },
      }}
    >
      <App />
    </CinacoinProvider>
  </React.StrictMode>,
)
```

### Next.js App Router 配置

```tsx
// app/providers.tsx
'use client'

import { CinacoinProvider } from '@cinacoin/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CinacoinProvider config={{
      projectId: 'your-project-id',
      relayUrl: 'wss://relay.yourdomain.com/v1',
      chains: [{
        id: 1, name: 'Ethereum',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrl: 'https://rpc.yourdomain.com/eth',
      }],
    }}>
      {children}
    </CinacoinProvider>
  )
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

---

## 第三步：添加连接按钮

`ConnectButton` 是开箱即用的钱包连接组件：

```tsx
// src/App.tsx
import { ConnectButton } from '@cinacoin/react'

function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>🔢 My dApp</h1>
      <ConnectButton />
    </div>
  )
}

export default App
```

运行应用：

```bash
npm run dev
```

打开 `http://localhost:5173`，点击 **Connect Wallet**，选择钱包即可连接。

---

## 第四步：使用 Hooks 管理状态

Cinacoin React 提供了一组 Hooks 用于访问连接状态：

```tsx
// src/WalletInfo.tsx
import { useAccount, useConnect, useDisconnect } from '@cinacoin/react'

export function WalletInfo() {
  const account = useAccount()
  const { connect, connectors, status } = useConnect()
  const { disconnect } = useDisconnect()

  if (!account.address) {
    return (
      <div>
        <h3>连接钱包</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => connect({ connector })}
              disabled={status === 'connecting'}
            >
              {connector.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3>✅ 已连接</h3>
      <p><strong>地址:</strong> <code>{account.address}</code></p>
      <p><strong>余额:</strong> {account.formattedBalance} {account.chainSymbol}</p>
      <p><strong>链:</strong> {account.chainName} (ID: {account.chainId})</p>
      <button onClick={() => disconnect()}>断开连接</button>
    </div>
  )
}
```

### 签名消息

```tsx
// src/SignMessage.tsx
import { useState } from 'react'
import { useAccount, useSignMessage } from '@cinacoin/react'

export function SignMessage() {
  const { address } = useAccount()
  const { signMessage, isPending, isSuccess, data } = useSignMessage()
  const [message, setMessage] = useState('Hello Cinacoin!')

  const handleSign = () => {
    signMessage({ message })
  }

  if (!address) return <p>请先连接钱包</p>

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter message to sign"
      />
      <button onClick={handleSign} disabled={isPending}>
        {isPending ? 'Signing...' : 'Sign Message'}
      </button>
      {isSuccess && (
        <div>
          <p>✅ 签名成功</p>
          <code style={{ wordBreak: 'break-all' }}>{data}</code>
        </div>
      )}
    </div>
  )
}
```

### 完整 Dashboard 示例

```tsx
// src/Dashboard.tsx
import {
  useAccount, useBalance, useConnect,
  useDisconnect, useSwitchChain,
} from '@cinacoin/react'

export function Dashboard() {
  const account = useAccount()
  const balance = useBalance({ address: account.address })
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { chains, switchChain } = useSwitchChain()

  if (!account.address) {
    return (
      <div>
        <h2>选择钱包</h2>
        {connectors.map((c) => (
          <button key={c.id} onClick={() => connect({ connector: c })}>
            {c.name}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div>
      <h2>账户信息</h2>
      <p>地址: {account.address}</p>
      <p>
        余额: {balance.data?.formatted ?? '...'} {balance.data?.symbol}
      </p>

      <h3>切换链</h3>
      {chains.map((chain) => (
        <button
          key={chain.id}
          onClick={() => switchChain({ chainId: chain.id })}
          disabled={account.chainId === chain.id}
        >
          {chain.name} {account.chainId === chain.id ? '✅' : ''}
        </button>
      ))}

      <button onClick={() => disconnect()} style={{ marginTop: '1rem' }}>
        断开连接
      </button>
    </div>
  )
}
```

---

## 常见问题排查

### "Cannot connect to relay server"

- 检查 `relayUrl` 是否正确（`wss://` 协议）
- 确认 Relay 服务器正在运行
- 检查防火墙/CORS 设置

### "No connectors available"

- 确保已安装 `@cinacoin/core-sdk` 和 `@cinacoin/react`
- 检查 `CinacoinProvider` 是否包裹了使用 Hooks 的组件
- 注入型钱包（MetaMask）需浏览器安装对应扩展

### "Chain not supported"

- 确认链在 `chains` 配置数组中
- 检查 `rpcUrl` 是否可达
- 使用 `useSwitchChain` 切换时确认目标链已注册

### Next.js SSR 报错

- `CinacoinProvider` 必须在客户端组件中使用（`'use client'`）
- 不要在服务端组件中调用 Hooks

---

## 下一步

- [安装指南](/guide/installation) — 各框架详细安装说明
- [配置选项](/guide/configuration) — 完整配置参考
- [React Hooks API](/api/react-hooks) — 全部 Hooks 参考
- [React SDK API](/api/react) — 组件参考
- [迁移指南](/guides/migration-from-walletconnect) — 从 @walletconnect/ 迁移
