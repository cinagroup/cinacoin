# React Hooks API

> `@cinacoin/react` — React Hooks 参考文档。

## 概述

Cinacoin React 提供一组 Hooks，用于在 React 组件中访问钱包连接状态、执行签名和交易。所有 Hooks 必须在 `CinacoinProvider` 内部使用。

---

## useAccount

获取当前连接的账户信息。

```tsx
import { useAccount } from '@cinacoin/react'

const account = useAccount()
```

### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `address` | `string \| undefined` | 当前账户地址 |
| `addresses` | `string[]` | 所有已连接账户 |
| `chainId` | `number \| undefined` | 当前链 ID |
| `chainName` | `string \| undefined` | 当前链名称 |
| `chainSymbol` | `string \| undefined` | 链原生代币符号 |
| `balance` | `bigint \| undefined` | 账户余额（wei） |
| `formattedBalance` | `string \| undefined` | 格式化余额 |
| `isConnected` | `boolean` | 是否已连接 |
| `isConnecting` | `boolean` | 是否正在连接 |
| `isReconnecting` | `boolean` | 是否正在重新连接 |
| `isDisconnected` | `boolean` | 是否已断开 |
| `connector` | `Connector \| undefined` | 当前使用的连接器 |
| `status` | `'connected' \| 'connecting' \| 'reconnecting' \| 'disconnected'` | 连接状态 |

### 示例

```tsx
function AccountDisplay() {
  const account = useAccount()

  if (!account.address) {
    return <p>未连接钱包</p>
  }

  return (
    <div>
      <p>地址: {account.address}</p>
      <p>链: {account.chainName} ({account.chainId})</p>
      <p>余额: {account.formattedBalance} {account.chainSymbol}</p>
    </div>
  )
}
```

---

## useConnect

连接钱包。

```tsx
import { useConnect } from '@cinacoin/react'

const { connect, connectors, status, error } = useConnect()
```

### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `connect` | `(config: { connector: Connector }) => Promise<ConnectionResult>` | 连接钱包函数 |
| `connectors` | `Connector[]` | 可用连接器列表 |
| `status` | `'idle' \| 'connecting' \| 'error'` | 连接状态 |
| `error` | `Error \| null` | 连接错误 |
| `pendingConnector` | `Connector \| undefined` | 当前正在连接的连接器 |

### Connector 类型

每个连接器提供以下属性：

```typescript
interface Connector {
  id: string          // 唯一标识（如 'metamask', 'walletconnect'）
  name: string        // 显示名称
  icon: string        // 图标 URL（data URI 或 URL）
  installed: boolean  // 是否已安装（注入型钱包）
  type: string        // 'injected' | 'qr' | 'relay' | 'walletconnect'
  ready: boolean      // 是否准备好连接
}
```

### 示例

```tsx
function WalletList() {
  const { connect, connectors, status } = useConnect()

  return (
    <div>
      <h3>选择钱包</h3>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={status === 'connecting'}
        >
          <img src={connector.icon} alt={connector.name} width={24} />
          {connector.name}
          {connector.installed ? '' : ' (需要安装)'}
        </button>
      ))}
    </div>
  )
}
```

---

## useDisconnect

断开当前钱包连接。

```tsx
import { useDisconnect } from '@cinacoin/react'

const { disconnect, status } = useDisconnect()
```

### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `disconnect` | `() => Promise<void>` | 断开连接函数 |
| `status` | `'idle' \| 'disconnecting'` | 断开状态 |

### 示例

```tsx
function DisconnectButton() {
  const { disconnect, status } = useDisconnect()

  return (
    <button
      onClick={() => disconnect()}
      disabled={status === 'disconnecting'}
    >
      {status === 'disconnecting' ? '断开中...' : '断开连接'}
    </button>
  )
}
```

---

## useSwitchChain

切换区块链网络。

```tsx
import { useSwitchChain } from '@cinacoin/react'

const { chains, switchChain, status, error } = useSwitchChain()
```

### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `chains` | `Chain[]` | 已配置的所有链 |
| `switchChain` | `(config: { chainId: number }) => Promise<void>` | 切换链函数 |
| `status` | `'idle' \| 'switching'` | 切换状态 |
| `error` | `Error \| null` | 切换错误 |

### 示例

```tsx
function ChainSwitcher() {
  const account = useAccount()
  const { chains, switchChain } = useSwitchChain()

  return (
    <div>
      {chains.map((chain) => (
        <button
          key={chain.id}
          onClick={() => switchChain({ chainId: chain.id })}
          disabled={account.chainId === chain.id}
        >
          {chain.name}
          {account.chainId === chain.id && ' ✅'}
        </button>
      ))}
    </div>
  )
}
```

---

## useSignMessage

签名文本消息。

```tsx
import { useSignMessage } from '@cinacoin/react'

const {
  signMessage,
  data,       // 签名结果 (hex string)
  error,
  isPending,  // 是否正在等待钱包确认
  isSuccess,
  isError,
  reset,      // 重置状态
} = useSignMessage()
```

### 用法

```tsx
function SignMessageForm() {
  const { signMessage, isPending, isSuccess, data, error } = useSignMessage()
  const [message, setMessage] = useState('Hello Cinacoin!')

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="输入要签名的消息"
      />
      <button onClick={() => signMessage({ message })} disabled={isPending}>
        {isPending ? '签名中...' : '签名'}
      </button>
      {isSuccess && <code>{data}</code>}
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
    </div>
  )
}
```

---

## useSignTypedData

签名类型化数据（EIP-712）。

```tsx
import { useSignTypedData } from '@cinacoin/react'

const { signTypedData, data, isPending, isSuccess, error } = useSignTypedData()
```

### 用法

```tsx
function SignTypedData() {
  const { signTypedData, data } = useSignTypedData()

  const handleSign = () => {
    signTypedData({
      domain: {
        name: 'My dApp',
        version: '1',
        chainId: 1,
        verifyingContract: '0x...',
      },
      types: {
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
      },
      primaryType: 'Person',
      message: {
        name: 'Alice',
        wallet: '0x...',
      },
    })
  }

  return <button onClick={handleSign}>Sign EIP-712</button>
}
```

---

## useSendTransaction

发送交易。

```tsx
import { useSendTransaction } from '@cinacoin/react'

const {
  sendTransaction,
  data,       // 交易哈希
  isPending,
  isSuccess,
  error,
} = useSendTransaction()
```

### 用法

```tsx
function SendEth() {
  const { sendTransaction, isPending, isSuccess, data } = useSendTransaction()
  const account = useAccount()

  return (
    <button
      onClick={() =>
        sendTransaction({
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
          value: parseEther('0.1'),
        })
      }
      disabled={!account.address || isPending}
    >
      {isPending ? '发送中...' : '发送 0.1 ETH'}
    </button>
  )
}
```

---

## useReadContract

读取智能合约只读方法。

```tsx
import { useReadContract } from '@cinacoin/react'

const { data, isLoading, error, refetch } = useReadContract({
  address: '0x...',        // 合约地址
  abi: [...],              // 合约 ABI
  functionName: 'balanceOf',
  args: ['0x...'],         // 函数参数
})
```

---

## useWriteContract

写入智能合约（发送交易）。

```tsx
import { useWriteContract } from '@cinacoin/react'

const { writeContract, data, isPending, isSuccess, error } = useWriteContract()

// 调用合约方法
writeContract({
  address: '0x...',
  abi: [...],
  functionName: 'transfer',
  args: ['0x...', parseEther('1.0')],
})
```

---

## useBalance

查询账户余额。

```tsx
import { useBalance } from '@cinacoin/react'

const { data, isLoading, error, refetch } = useBalance({
  address: '0x...',  // 查询地址
  chainId: 1,        // 可选：指定链
})
```

### 返回值

```typescript
interface BalanceResult {
  value: bigint              // 余额 (wei)
  formatted: string           // 格式化余额
  symbol: string              // 代币符号
  decimals: number            // 小数位数
}
```

---

## useCinacoin

获取完整的 Cinacoin 实例。

```tsx
import { useCinacoin } from '@cinacoin/react'

const cinacoin = useCinacoin()

// 直接访问底层 SDK
const connectors = cinacoin.getConnectors()
await cinacoin.connect(connectors[0])
```

### 返回值

| 属性 | 说明 |
|------|------|
| `account` | 当前账户地址 |
| `chainId` | 当前链 ID |
| `status` | 连接状态 |
| `connectors` | 连接器列表 |
| `connect` | 连接函数 |
| `disconnect` | 断开连接函数 |

---

## 下一步

- [React SDK 完整 API](/api/react) — 组件和 Provider 参考
- [Core SDK API](/api/core-sdk) — 核心 SDK 参考
- [React 快速开始](/guides/quickstart-react) — 集成指南
- [React 集成示例](/examples/react-integration) — 完整代码示例
