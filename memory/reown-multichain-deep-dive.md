# Cinacoin AppKit 多链适配层 Deep-Dive 报告

> 生成时间: 2026-05-17T04:51 UTC
> 数据来源: Cinacoin 官方文档 (docs.cinacoin.com)

---

## 一、Cinacoin AppKit 多链架构概述

### 核心组件

| 组件 | 包名 | 职责 |
|------|------|------|
| **Ethereum Provider** | `@walletconnect/ethereum-provider` | EIP-1193 兼容的 EVM Provider |
| **Solana Adapter** | `@walletconnect/solana-adapter` | 与 `@solana/wallet-adapter` 集成 |
| **Universal Provider** | `@walletconnect/universal-provider` | 多链通用 Provider，支持所有命名空间 |
| **AppKit Core** | `@cinacoin/appkit` | 钱包连接 UI + 多链编排 |

### 多链支持模式

Cinacoin AppKit 使用 **CAIP-2 命名空间** 格式识别链:

```
<namespace>:<chainId>
```

已支持的命名空间:
- `eip155` - EVM 链 (Eth, Polygon, BSC, Arbitrum 等)
- `solana` / `solana:` - Solana 及 SVM 链
- `bip122` - Bitcoin
- `ton` - TON
- `tron` - TRON
- 其他: cosmos, near, polkadot, starknet, sui, tezos, xrpl, hedera, casper, stacks, stellar, everscale, dogecoin, litecoin

---

## 二、各链 RPC 方法摘要

### 2.1 EVM (eip155)

**核心 RPC 方法:**
| 方法 | 说明 |
|------|------|
| `personal_sign` | 以太坊个人签名 (带前缀) |
| `eth_sign` | 以太坊签名 |
| `eth_signTypedData` | EIP-712 结构化数据签名 |
| `eth_sendTransaction` | 发送交易 |
| `eth_signTransaction` | 签名交易 (稍后发送) |
| `eth_sendRawTransaction` | 发送已签名交易 |

**EIP-1193 事件:**
- `chainChanged` - 链切换
- `accountsChanged` - 账户切换
- `connect` / `disconnect` - 连接状态
- `display_uri` - Cinacoin URI
- `session_event` - 会话事件

**网络配置:** 通过 Viem `chains/index.ts` 自动支持，或使用 `defineChain()` 自定义

### 2.2 Solana

**核心 RPC 方法:**
| 方法 | 说明 |
|------|------|
| `solana_getAccounts` | 获取可用签名公钥列表 |
| `solana_requestAccounts` | 同上 (别名) |
| `solana_signMessage` | 签名消息 (base58 编码) |
| `solana_signTransaction` | 签名单笔交易 (base64 序列化) |
| `solana_signAllTransactions` | 批量签名交易 |
| `solana_signAndSendTransaction` | 签名并发送交易 |

**参数特点:**
- 交易使用 base64 编码序列化
- `sendOptions` 支持 skipPreflight, preflightCommitment, maxRetries, minContextSlot
- 支持 versioned transactions

### 2.3 Bitcoin (bip122)

**核心 RPC 方法:**
| 方法 | 说明 |
|------|------|
| `sendTransfer` | 签名并发送 BTC 转账 |
| `getAccountAddresses` | 获取账户所有地址 (含 derivation path) |
| `signPsbt` | 签名 PSBT (部分签名比特币交易) |
| `signMessage` | 签名消息 (ecdsa / bip322) |

**事件:**
- `bip122_addressesChanged` - 地址变更通知

**账户模型:**
- 使用 BIP44/BIP49/BIP84/BIP86 推导路径
- 默认使用 Native SegWit (purpose=84) 第一个外部地址作为账户标识
- CAIP-2 链 ID: `bip122:000000000019d6689c085ae165831e93` (mainnet)

### 2.4 TON

**核心 RPC 方法:**
| 方法 | 说明 |
|------|------|
| `ton_sendMessage` | 向 TON 网络提交交易消息 |
| `ton_signData` | 签名链下数据 (text/binary/cell) |

**网络信息:**
| CAIP-2 | Chain ID | Name | RPC Endpoint |
|--------|----------|------|--------------|
| `ton:-239` | `-239` | TON Mainnet | `https://toncenter.com/api/v2/jsonRPC` |
| `ton:-3` | `-3` | TON Testnet | `https://testnet.toncenter.com/api/v2/jsonRPC` |

**参数特点:**
- `ton_sendMessage` 支持多消息批量提交
- payload 使用 base64 BoC (Bag of Cells) 编码
- `ton_signData` 支持 text / binary / cell 三种类型

### 2.5 TRON

**核心 RPC 方法:**
| 方法 | 说明 | 必需? |
|------|------|-------|
| `tron_signTransaction` | 签名 Tron 交易 (不执行) | ✅ 必需 |
| `tron_signMessage` | 签名个人消息 | ✅ 必需 |
| `tron_sendTransaction` | 广播已签名交易 | ❌ 可选 |
| `tron_getBalance` | 查询 TRX 余额 | ❌ 可选 |

**Session Properties:**
- 钱包应在握手时设置 `tron_method_version: "v1"` 启用简化交易结构

**网络:** CAIP-2 格式 `tron:0xcd8690dc` (mainnet)

---

## 三、自定义网络注册

### defineChain API (统一方式)

```typescript
import { defineChain } from '@cinacoin/appkit/networks';

const customNetwork = defineChain({
  id: 123456789,                    // 链 ID
  caipNetworkId: 'eip155:123456789', // CAIP-2 格式
  chainNamespace: 'eip155',          // 命名空间
  name: 'Custom Network',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: { default: { http: ['https://rpc.custom.network'] } },
  blockExplorers: { default: { name: 'Explorer', url: 'https://explorer.custom.network' } },
  contracts: { /* 合约地址配置 */ }
});
```

**非 EVM 链:**
```typescript
const cantonMainnet = defineChain({
  id: 'canton:mainnet',
  caipNetworkId: 'canton:mainnet',
  chainNamespace: 'canton',
  name: 'Canton Mainnet',
  nativeCurrency: { name: 'Canton Coin', symbol: 'CC', decimals: 10 },
  rpcUrls: { default: { http: ['<validator-rpc-url>'] } },
  blockExplorers: { default: { name: 'Explorer', url: '<explorer-url>' } },
});
```

**自定义 RPC URL:**
```javascript
customRpcUrls: {
  'eip155:1': 'https://your.custom.rpc.url',
  'eip155:137': 'https://your.polygon.rpc.url'
}
```

---

## 四、@onchainux 多链适配器实现指南

### 4.1 ChainAdapter 接口设计

```typescript
// @onchainux/core/src/adapter.ts

/** CAIP-2 链标识 */
export type CaipChainId = `${string}:${string}`;

/** 通用链适配器接口 */
export interface ChainAdapter<Provider = unknown> {
  /** 链命名空间 (eip155, solana, bip122, ton, tron) */
  readonly namespace: string;

  /** 支持的链 ID 列表 (CAIP-2 格式) */
  readonly supportedChains: CaipChainId[];

  /** 内部 Provider 实例 */
  provider: Provider;

  /** 连接钱包 */
  connect(options?: ConnectOptions): Promise<ConnectionResult>;

  /** 断开连接 */
  disconnect(): Promise<void>;

  /** 发送链上请求 */
  request<T = unknown>(args: RequestArguments): Promise<T>;

  /** 获取当前账户 */
  getAccounts(): Promise<AccountInfo[]>;

  /** 获取余额 */
  getBalance(address: string, chainId?: CaipChainId): Promise<BalanceInfo>;

  /** 签名消息 */
  signMessage(params: SignMessageParams): Promise<SignatureResult>;

  /** 切换链 */
  switchChain?(chainId: CaipChainId): Promise<void>;

  /** 事件监听 */
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;

  /** 获取适配器元信息 */
  getMetadata(): AdapterMetadata;
}

export interface ConnectOptions {
  projectId: string;
  chains?: CaipChainId[];
  methods?: string[];
  events?: string[];
  metadata?: {
    name: string;
    description: string;
    url: string;
    icons?: string[];
  };
}

export interface ConnectionResult {
  accounts: AccountInfo[];
  chainId: CaipChainId;
  provider: unknown;
}

export interface AccountInfo {
  address: string;
  publicKey?: string;
  path?: string;       // Bitcoin derivation path
  namespace: string;
}

export interface BalanceInfo {
  value: string;        // 最小单位字符串
  decimals: number;
  symbol: string;
}

export interface RequestArguments {
  method: string;
  params?: unknown[] | Record<string, unknown>;
  chainId?: CaipChainId;
}

export interface SignMessageParams {
  message: string | Uint8Array;
  address?: string;
  chainId?: CaipChainId;
  protocol?: string;    // Bitcoin: "ecdsa" | "bip322"
}

export interface SignatureResult {
  signature: string;
  publicKey?: string;
  address?: string;
  messageHash?: string;
}

export interface AdapterMetadata {
  name: string;
  version: string;
  namespace: string;
  supportedMethods: string[];
  supportedEvents: string[];
}
```

### 4.2 @onchainux/core 包结构

```
@onchainux/core/
├── src/
│   ├── index.ts                  # 主入口
│   ├── adapter.ts                # ChainAdapter 接口定义
│   ├── registry.ts               # 适配器注册中心
│   ├── multichain-provider.ts    # 多链聚合 Provider
│   ├── caip.ts                   # CAIP-2/CAIP-10 工具函数
│   ├── events.ts                 # 统一事件系统
│   └── types.ts                  # 共享类型
├── package.json
└── tsconfig.json
```

### 4.3 @onchainux/adapter-ethereum

```
@onchainux/adapter-ethereum/
├── src/
│   ├── index.ts
│   ├── ethereum-adapter.ts      # 主适配器实现
│   ├── eip1193-provider.ts      # EIP-1193 Provider 包装
│   └── types.ts
├── package.json
└── tsconfig.json
```

**核心实现:**

```typescript
// adapter-ethereum/src/ethereum-adapter.ts

import {
  ChainAdapter,
  CaipChainId,
  ConnectOptions,
  ConnectionResult,
  RequestArguments,
  AccountInfo,
  BalanceInfo,
  SignMessageParams,
  SignatureResult,
  AdapterMetadata,
} from '@onchainux/core';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
// 或直接使用 @cinacoin/appkit 的 createAppKit
import type { Provider as Eip1193Provider } from 'eip1193-provider';

export class EthereumAdapter implements ChainAdapter<Eip1193Provider> {
  readonly namespace = 'eip155';
  readonly supportedChains: CaipChainId[];

  private provider: Eip1193Provider;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  static async init(options: ConnectOptions): Promise<EthereumAdapter> {
    const wcProvider = await EthereumProvider.init({
      projectId: options.projectId,
      metadata: options.metadata,
      optionalChains: options.chains?.map(c => parseInt(c.split(':')[1], 10)) || [1],
      optionalMethods: options.methods,
      optionalEvents: options.events,
    });

    const chains = options.chains?.length
      ? options.chains
      : (wcProvider as any).chains?.map((id: number) => `eip155:${id}`) || ['eip155:1'];

    return new EthereumAdapter(wcProvider, chains);
  }

  private constructor(provider: Eip1193Provider, chains: CaipChainId[]) {
    this.provider = provider;
    this.supportedChains = chains;
    this.bindEvents();
  }

  get provider() { return this._provider; }

  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    const accounts = await this.provider.request({
      method: 'eth_requestAccounts',
    }) as string[];

    const chainId = await this.provider.request({
      method: 'eth_chainId',
    }) as string;

    return {
      accounts: accounts.map(a => ({
        address: a,
        namespace: this.namespace,
      })),
      chainId: `eip155:${parseInt(chainId, 16)}`,
      provider: this.provider,
    };
  }

  async disconnect(): Promise<void> {
    await this.provider.disconnect?.();
  }

  async request<T = unknown>(args: RequestArguments): Promise<T> {
    return this.provider.request({
      method: args.method,
      params: args.params,
    }) as Promise<T>;
  }

  async getAccounts(): Promise<AccountInfo[]> {
    const accounts = await this.provider.request({
      method: 'eth_accounts',
    }) as string[];
    return accounts.map(a => ({ address: a, namespace: this.namespace }));
  }

  async getBalance(address: string, chainId?: CaipChainId): Promise<BalanceInfo> {
    const balance = await this.provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    }) as string;
    return {
      value: BigInt(balance).toString(),
      decimals: 18,
      symbol: 'ETH',
    };
  }

  async signMessage(params: SignMessageParams): Promise<SignatureResult> {
    const signature = await this.provider.request({
      method: 'personal_sign',
      params: [
        typeof params.message === 'string' ? params.message : bytesToHex(params.message),
        params.address,
      ],
    }) as string;
    return { signature, address: params.address };
  }

  async switchChain(chainId: CaipChainId): Promise<void> {
    const decimalChainId = parseInt(chainId.split(':')[1], 10);
    const hexChainId = `0x${decimalChainId.toString(16)}`;
    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added to wallet - would need wallet_addEthereumChain
        throw new Error(`Chain ${chainId} not recognized by wallet`);
      }
      throw error;
    }
  }

  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    (this.provider as any).on(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.eventHandlers.get(event)?.delete(handler);
    (this.provider as any).removeListener?.(event, handler);
  }

  getMetadata(): AdapterMetadata {
    return {
      name: '@onchainux/adapter-ethereum',
      version: '0.1.0',
      namespace: this.namespace,
      supportedMethods: [
        'eth_sendTransaction',
        'eth_signTransaction',
        'eth_sign',
        'personal_sign',
        'eth_signTypedData',
        'eth_signTypedData_v4',
        'wallet_switchEthereumChain',
        'wallet_addEthereumChain',
        'eth_requestAccounts',
        'eth_accounts',
        'eth_getBalance',
        'eth_chainId',
        'eth_blockNumber',
        'eth_call',
        'eth_estimateGas',
        'eth_getTransactionCount',
        'eth_getTransactionReceipt',
        'eth_sendRawTransaction',
      ],
      supportedEvents: [
        'chainChanged',
        'accountsChanged',
        'connect',
        'disconnect',
        'display_uri',
        'session_event',
      ],
    };
  }

  private bindEvents(): void {
    // Forward EIP-1193 events to unified event system
  }
}
```

### 4.4 @onchainux/adapter-solana

```
@onchainux/adapter-solana/
├── src/
│   ├── index.ts
│   ├── solana-adapter.ts        # 主适配器实现
│   ├── wallet-connect-adapter.ts # Cinacoin Solana Adapter 包装
│   └── types.ts
├── package.json
└── tsconfig.json
```

**核心实现:**

```typescript
// adapter-solana/src/solana-adapter.ts

import {
  ChainAdapter,
  CaipChainId,
  ConnectOptions,
  ConnectionResult,
  RequestArguments,
  AccountInfo,
  BalanceInfo,
  SignMessageParams,
  SignatureResult,
  AdapterMetadata,
} from '@onchainux/core';
import UniversalProvider from '@walletconnect/universal-provider';
import { Connection, PublicKey } from '@solana/web3.js';

// Solana CAIP-2: solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
export const SOLANA_MAINNET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
export const SOLANA_DEVNET = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
export const SOLANA_TESTNET = 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z';

export class SolanaAdapter implements ChainAdapter<UniversalProvider> {
  readonly namespace = 'solana';
  readonly supportedChains: CaipChainId[] = [
    SOLANA_MAINNET,
    SOLANA_DEVNET,
    SOLANA_TESTNET,
  ];

  private provider: UniversalProvider;
  private connection: Connection;
  private currentAccount: string | null = null;

  static async init(options: ConnectOptions): Promise<SolanaAdapter> {
    const wcProvider = await UniversalProvider.init({
      projectId: options.projectId,
      metadata: options.metadata,
    });

    await wcProvider.connect({
      optionalNamespaces: {
        solana: {
          methods: [
            'solana_signMessage',
            'solana_signTransaction',
            'solana_signAllTransactions',
            'solana_signAndSendTransaction',
          ],
          chains: options.chains || [SOLANA_MAINNET],
          events: ['accountsChanged', 'chainChanged'],
        },
      },
    });

    return new SolanaAdapter(wcProvider);
  }

  private constructor(provider: UniversalProvider) {
    this.provider = provider;
    this.connection = new Connection('https://api.mainnet-beta.solana.com');
  }

  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    const accounts = await this.provider.request({
      method: 'solana_getAccounts',
      params: {},
    }, this.supportedChains[0]) as { pubkey: string }[];

    this.currentAccount = accounts[0]?.pubkey || null;

    return {
      accounts: accounts.map(a => ({
        address: a.pubkey,
        namespace: this.namespace,
      })),
      chainId: this.supportedChains[0],
      provider: this.provider,
    };
  }

  async disconnect(): Promise<void> {
    await this.provider.disconnect();
    this.currentAccount = null;
  }

  async request<T = unknown>(args: RequestArguments): Promise<T> {
    return this.provider.request(args, args.chainId) as Promise<T>;
  }

  async getAccounts(): Promise<AccountInfo[]> {
    if (!this.currentAccount) return [];
    return [{ address: this.currentAccount, namespace: this.namespace }];
  }

  async getBalance(address: string, chainId?: CaipChainId): Promise<BalanceInfo> {
    const pubkey = new PublicKey(address);
    const lamports = await this.connection.getBalance(pubkey);
    return {
      value: lamports.toString(),
      decimals: 9,
      symbol: 'SOL',
    };
  }

  async signMessage(params: SignMessageParams): Promise<SignatureResult> {
    const message = typeof params.message === 'string'
      ? params.message
      : Buffer.from(params.message).toString('base64');

    const result = await this.provider.request({
      method: 'solana_signMessage',
      params: {
        message,
        pubkey: params.address || this.currentAccount,
      },
    }, params.chainId) as { signature: string };

    return { signature: result.signature };
  }

  async signTransaction(transaction: string): Promise<{ signature: string; transaction: string }> {
    return this.provider.request({
      method: 'solana_signTransaction',
      params: { transaction },
    }, this.supportedChains[0]);
  }

  async signAndSendTransaction(
    transaction: string,
    sendOptions?: { skipPreflight?: boolean; preflightCommitment?: string; maxRetries?: number }
  ): Promise<{ signature: string }> {
    return this.provider.request({
      method: 'solana_signAndSendTransaction',
      params: { transaction, sendOptions },
    }, this.supportedChains[0]);
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.provider.on(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.provider.removeListener(event, handler);
  }

  getMetadata(): AdapterMetadata {
    return {
      name: '@onchainux/adapter-solana',
      version: '0.1.0',
      namespace: this.namespace,
      supportedMethods: [
        'solana_getAccounts',
        'solana_requestAccounts',
        'solana_signMessage',
        'solana_signTransaction',
        'solana_signAllTransactions',
        'solana_signAndSendTransaction',
      ],
      supportedEvents: ['accountsChanged', 'chainChanged', 'session_event'],
    };
  }
}
```

### 4.5 @onchainux/adapter-bitcoin

```
@onchainux/adapter-bitcoin/
├── src/
│   ├── index.ts
│   ├── bitcoin-adapter.ts       # 主适配器实现
│   ├── psbt.ts                  # PSBT 工具
│   └── types.ts
├── package.json
└── tsconfig.json
```

**核心实现:**

```typescript
// adapter-bitcoin/src/bitcoin-adapter.ts

import {
  ChainAdapter,
  CaipChainId,
  ConnectOptions,
  ConnectionResult,
  RequestArguments,
  AccountInfo,
  BalanceInfo,
  SignMessageParams,
  SignatureResult,
  AdapterMetadata,
} from '@onchainux/core';
import UniversalProvider from '@walletconnect/universal-provider';

// Bitcoin CAIP-2
export const BITCOIN_MAINNET = 'bip122:000000000019d6689c085ae165831e93';
export const BITCOIN_TESTNET = 'bip122:000000000933ea01ad0ee984209779ba';

export interface BitcoinAddressInfo extends AccountInfo {
  publicKey?: string;
  path?: string;
  intention?: 'payment' | 'ordinal';
}

export interface SendTransferParams {
  account: string;
  recipientAddress: string;
  amount: string;      // satoshis
  changeAddress?: string;
  memo?: string;       // OP_RETURN hex (max 80 bytes)
}

export interface SignPsbtParams {
  account: string;
  psbt: string;        // base64
  signInputs: {
    address: string;
    index: number;
    sighashTypes?: number[];
  }[];
  broadcast?: boolean;
}

export class BitcoinAdapter implements ChainAdapter<UniversalProvider> {
  readonly namespace = 'bip122';
  readonly supportedChains: CaipChainId[] = [BITCOIN_MAINNET, BITCOIN_TESTNET];

  private provider: UniversalProvider;
  private accounts: BitcoinAddressInfo[] = [];

  static async init(options: ConnectOptions): Promise<BitcoinAdapter> {
    const wcProvider = await UniversalProvider.init({
      projectId: options.projectId,
      metadata: options.metadata,
    });

    await wcProvider.connect({
      optionalNamespaces: {
        bip122: {
          methods: [
            'sendTransfer',
            'getAccountAddresses',
            'signPsbt',
            'signMessage',
          ],
          chains: options.chains || [BITCOIN_MAINNET],
          events: ['bip122_addressesChanged'],
        },
      },
    });

    return new BitcoinAdapter(wcProvider);
  }

  private constructor(provider: UniversalProvider) {
    this.provider = provider;
    this.bindEvents();
  }

  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    const addresses = await this.provider.request({
      method: 'getAccountAddresses',
      params: {},
    }, this.supportedChains[0]) as BitcoinAddressInfo[];

    this.accounts = addresses;

    return {
      accounts: addresses.map(a => ({
        address: a.address,
        publicKey: a.publicKey,
        path: a.path,
        namespace: this.namespace,
      })),
      chainId: this.supportedChains[0],
      provider: this.provider,
    };
  }

  async disconnect(): Promise<void> {
    await this.provider.disconnect();
    this.accounts = [];
  }

  async request<T = unknown>(args: RequestArguments): Promise<T> {
    return this.provider.request(args, args.chainId) as Promise<T>;
  }

  async getAccounts(): Promise<BitcoinAddressInfo[]> {
    return this.accounts;
  }

  async getBalance(address: string): Promise<BalanceInfo> {
    // Bitcoin balance requires UTXO aggregation via indexer
    // Adapter should integrate with Blockbook/Bitcore API
    throw new Error('Use external indexer for Bitcoin balance (Blockbook/Bitcore)');
  }

  async sendTransfer(params: SendTransferParams): Promise<{ txid: string }> {
    return this.provider.request({
      method: 'sendTransfer',
      params,
    }, params.account) as Promise<{ txid: string }>;
  }

  async signPsbt(params: SignPsbtParams): Promise<{ psbt: string; txid?: string }> {
    return this.provider.request({
      method: 'signPsbt',
      params,
    }, params.account) as Promise<{ psbt: string; txid?: string }>;
  }

  async signMessage(params: SignMessageParams): Promise<SignatureResult> {
    return this.provider.request({
      method: 'signMessage',
      params: {
        account: params.address,
        message: typeof params.message === 'string' ? params.message : Buffer.from(params.message).toString('utf8'),
        protocol: params.protocol || 'ecdsa',
      },
    }, params.chainId || this.supportedChains[0]) as Promise<{
      address: string;
      signature: string;
      messageHash?: string;
    }>;
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.provider.on(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.provider.removeListener(event, handler);
  }

  getMetadata(): AdapterMetadata {
    return {
      name: '@onchainux/adapter-bitcoin',
      version: '0.1.0',
      namespace: this.namespace,
      supportedMethods: [
        'sendTransfer',
        'getAccountAddresses',
        'signPsbt',
        'signMessage',
      ],
      supportedEvents: ['bip122_addressesChanged'],
    };
  }

  private bindEvents(): void {
    this.provider.on('bip122_addressesChanged', ({ event, chainId }) => {
      this.accounts = event.data;
    });
  }
}
```

### 4.6 @onchainux/adapter-ton

```
@onchainux/adapter-ton/
├── src/
│   ├── index.ts
│   ├── ton-adapter.ts           # 主适配器实现
│   └── types.ts
├── package.json
└── tsconfig.json
```

**核心实现:**

```typescript
// adapter-ton/src/ton-adapter.ts

import {
  ChainAdapter,
  CaipChainId,
  ConnectOptions,
  ConnectionResult,
  RequestArguments,
  AccountInfo,
  BalanceInfo,
  SignMessageParams,
  SignatureResult,
  AdapterMetadata,
} from '@onchainux/core';
import UniversalProvider from '@walletconnect/universal-provider';
import { Address, beginCell, storeMessage, Message } from '@ton/ton';

export const TON_MAINNET = 'ton:-239';
export const TON_TESTNET = 'ton:-3';

export interface TonTransactionMessage {
  address: string;       // TEP-123 格式
  amount: number | string; // nanotons
  payload?: string;      // base64 BoC
  stateInit?: string;    // base64 BoC
}

export class TonAdapter implements ChainAdapter<UniversalProvider> {
  readonly namespace = 'ton';
  readonly supportedChains: CaipChainId[] = [TON_MAINNET, TON_TESTNET];

  private provider: UniversalProvider;
  private currentAccount: string | null = null;

  static async init(options: ConnectOptions): Promise<TonAdapter> {
    const wcProvider = await UniversalProvider.init({
      projectId: options.projectId,
      metadata: options.metadata,
    });

    await wcProvider.connect({
      optionalNamespaces: {
        ton: {
          methods: ['ton_sendMessage', 'ton_signData'],
          chains: options.chains || [TON_MAINNET],
          events: [],
        },
      },
    });

    return new TonAdapter(wcProvider);
  }

  private constructor(provider: UniversalProvider) {
    this.provider = provider;
  }

  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    // TON wallets don't have a direct "getAccounts" - address comes from session or sign
    // Use ton_signData with empty payload to get address, or extract from session
    const accounts = await this.provider.request({
      method: 'ton_signData',
      params: [{ type: 'text', text: '' }],
    }, this.supportedChains[0]) as { publicKey: string; signature: string };

    // Derive address from public key
    this.currentAccount = accounts.publicKey; // 实际需要用 @ton/crypto 转换

    return {
      accounts: [{ address: this.currentAccount!, namespace: this.namespace }],
      chainId: this.supportedChains[0],
      provider: this.provider,
    };
  }

  async disconnect(): Promise<void> {
    await this.provider.disconnect();
    this.currentAccount = null;
  }

  async request<T = unknown>(args: RequestArguments): Promise<T> {
    return this.provider.request(args, args.chainId) as Promise<T>;
  }

  async getAccounts(): Promise<AccountInfo[]> {
    if (!this.currentAccount) return [];
    return [{ address: this.currentAccount, namespace: this.namespace }];
  }

  async getBalance(address: string): Promise<BalanceInfo> {
    // Use TONCenter API or tonapi.io
    throw new Error('Use TONCenter API: https://toncenter.com/api/v2/getAddressBalance');
  }

  async sendMessage(
    messages: TonTransactionMessage[],
    options?: { valid_until?: number; from?: string }
  ): Promise<string> {
    // 返回 base64 编码的 BOC (external-in message)
    return this.provider.request({
      method: 'ton_sendMessage',
      params: [{ ...options, messages }],
    }, this.supportedChains[0]) as Promise<string>;
  }

  async signMessage(params: SignMessageParams): Promise<SignatureResult> {
    const text = typeof params.message === 'string' ? params.message : Buffer.from(params.message).toString('utf8');
    const result = await this.provider.request({
      method: 'ton_signData',
      params: [{ type: 'text', text, from: params.address || this.currentAccount }],
    }, params.chainId || this.supportedChains[0]) as {
      signature: string;
      publicKey: string;
      timestamp: number;
      domain: string;
    };

    return {
      signature: result.signature,
      publicKey: result.publicKey,
    };
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.provider.on(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.provider.removeListener(event, handler);
  }

  getMetadata(): AdapterMetadata {
    return {
      name: '@onchainux/adapter-ton',
      version: '0.1.0',
      namespace: this.namespace,
      supportedMethods: ['ton_sendMessage', 'ton_signData'],
      supportedEvents: [],
    };
  }
}
```

### 4.7 @onchainux/adapter-tron

```
@onchainux/adapter-tron/
├── src/
│   ├── index.ts
│   ├── tron-adapter.ts          # 主适配器实现
│   └── types.ts
├── package.json
└── tsconfig.json
```

**核心实现:**

```typescript
// adapter-tron/src/tron-adapter.ts

import {
  ChainAdapter,
  CaipChainId,
  ConnectOptions,
  ConnectionResult,
  RequestArguments,
  AccountInfo,
  BalanceInfo,
  SignMessageParams,
  SignatureResult,
  AdapterMetadata,
} from '@onchainux/core';
import UniversalProvider from '@walletconnect/universal-provider';

export const TRON_MAINNET = 'tron:0xcd8690dc';
export const TRON_NILE = 'tron:0x9299461c';   // nile testnet
export const TRON_SHASTA = 'tron:0xa8f7a6ca'; // shasta testnet

export interface TronTransaction {
  visible?: boolean;
  txID?: string;
  raw_data: {
    contract: Array<{
      parameter: {
        type_url: string;
        value: Record<string, unknown>;
      };
      type: string;
    }>;
    ref_block_bytes?: string;
    ref_block_hash?: string;
    expiration?: number;
    fee_limit?: number;
    timestamp?: number;
  };
  raw_data_hex?: string;
}

export class TronAdapter implements ChainAdapter<UniversalProvider> {
  readonly namespace = 'tron';
  readonly supportedChains: CaipChainId[] = [TRON_MAINNET, TRON_NILE, TRON_SHASTA];

  private provider: UniversalProvider;
  private currentAccount: string | null = null;

  static async init(options: ConnectOptions): Promise<TronAdapter> {
    const wcProvider = await UniversalProvider.init({
      projectId: options.projectId,
      metadata: options.metadata,
    });

    await wcProvider.connect({
      optionalNamespaces: {
        tron: {
          methods: [
            'tron_signTransaction',
            'tron_signMessage',
            'tron_sendTransaction',
            'tron_getBalance',
          ],
          chains: options.chains || [TRON_MAINNET],
          events: [],
        },
      },
      sessionProperties: {
        tron_method_version: 'v1', // 启用简化交易结构
      },
    });

    return new TronAdapter(wcProvider);
  }

  private constructor(provider: UniversalProvider) {
    this.provider = provider;
  }

  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    // Tron doesn't have explicit getAccounts - derive from session or request
    // Use tron_signMessage as probe or extract from session
    const session = this.provider.session;
    const accounts = session?.accounts?.[0]?.split(':')?.[2]; // eip191:tron:0x...:address

    if (accounts) {
      this.currentAccount = accounts;
    }

    return {
      accounts: this.currentAccount
        ? [{ address: this.currentAccount, namespace: this.namespace }]
        : [],
      chainId: this.supportedChains[0],
      provider: this.provider,
    };
  }

  async disconnect(): Promise<void> {
    await this.provider.disconnect();
    this.currentAccount = null;
  }

  async request<T = unknown>(args: RequestArguments): Promise<T> {
    return this.provider.request(args, args.chainId) as Promise<T>;
  }

  async getAccounts(): Promise<AccountInfo[]> {
    if (!this.currentAccount) return [];
    return [{ address: this.currentAccount, namespace: this.namespace }];
  }

  async getBalance(address: string): Promise<BalanceInfo> {
    const balance = await this.provider.request({
      method: 'tron_getBalance',
      params: { address },
    }, this.supportedChains[0]) as number;

    return {
      value: balance.toString(),
      decimals: 6, // TRX: 1 TRX = 1,000,000 SUN
      symbol: 'TRX',
    };
  }

  async signTransaction(transaction: TronTransaction, address: string): Promise<{
    txID: string;
    signature: string[];
    raw_data: object;
    raw_data_hex: string;
    visible: boolean;
  }> {
    return this.provider.request({
      method: 'tron_signTransaction',
      params: { address, transaction },
    }, this.supportedChains[0]);
  }

  async signMessage(params: SignMessageParams): Promise<SignatureResult> {
    const result = await this.provider.request({
      method: 'tron_signMessage',
      params: {
        address: params.address || this.currentAccount,
        message: typeof params.message === 'string' ? params.message : Buffer.from(params.message).toString('utf8'),
      },
    }, params.chainId || this.supportedChains[0]) as { signature: string };

    return { signature: result.signature };
  }

  async sendTransaction(signedTransaction: {
    txID: string;
    signature: string[];
    raw_data_hex: string;
  }): Promise<{ result: boolean; txid: string }> {
    return this.provider.request({
      method: 'tron_sendTransaction',
      params: { signedTransaction },
    }, this.supportedChains[0]);
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.provider.on(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.provider.removeListener(event, handler);
  }

  getMetadata(): AdapterMetadata {
    return {
      name: '@onchainux/adapter-tron',
      version: '0.1.0',
      namespace: this.namespace,
      supportedMethods: [
        'tron_signTransaction',
        'tron_signMessage',
        'tron_sendTransaction',
        'tron_getBalance',
      ],
      supportedEvents: [],
    };
  }
}
```

### 4.8 @onchainux/chains

```
@onchainux/chains/
├── src/
│   ├── index.ts
│   ├── chains/
│   │   ├── ethereum.ts        # EVM 链定义
│   │   ├── solana.ts          # Solana 链定义
│   │   ├── bitcoin.ts         # Bitcoin 链定义
│   │   ├── ton.ts             # TON 链定义
│   │   └── tron.ts            # TRON 链定义
│   ├── registry.ts            # 链注册表
│   └── types.ts
├── package.json
└── tsconfig.json
```

**链定义示例:**

```typescript
// chains/src/chains/ethereum.ts
import { ChainDefinition } from '../types';

export const ethereum: ChainDefinition = {
  id: 'eip155:1',
  name: 'Ethereum',
  namespace: 'eip155',
  rpcUrls: {
    default: { http: ['https://eth.llamarpc.com'] },
    public: { http: ['https://rpc.ankr.com/eth'] },
  },
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  blockExplorer: { name: 'Etherscan', url: 'https://etherscan.io' },
};

export const polygon: ChainDefinition = {
  id: 'eip155:137',
  name: 'Polygon',
  namespace: 'eip155',
  rpcUrls: {
    default: { http: ['https://polygon-rpc.com'] },
  },
  nativeCurrency: { name: 'Polygon', symbol: 'POL', decimals: 18 },
  blockExplorer: { name: 'PolygonScan', url: 'https://polygonscan.com' },
};

// chains/src/chains/solana.ts
export const solana: ChainDefinition = {
  id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  name: 'Solana',
  namespace: 'solana',
  rpcUrls: {
    default: { http: ['https://api.mainnet-beta.solana.com'] },
  },
  nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
  blockExplorer: { name: 'Solscan', url: 'https://solscan.io' },
};

// chains/src/types.ts
export interface ChainDefinition {
  id: string;              // CAIP-2
  name: string;
  namespace: string;
  rpcUrls: {
    default: { http: string[] };
    public?: { http: string[] };
  };
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer?: {
    name: string;
    url: string;
  };
  testnet?: boolean;
  adapterPackage?: string; // @onchainux/adapter-*
}
```

---

## 五、EIP-1193 兼容性

### Ethereum Adapter 完整 EIP-1193 实现

```typescript
// EIP-1193 Provider 包装
export class Eip1193ProviderWrapper {
  private adapter: EthereumAdapter;

  async request(args: { method: string; params?: unknown[] }): Promise<unknown> {
    switch (args.method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
      case 'eth_chainId':
      case 'eth_sendTransaction':
      case 'personal_sign':
      case 'eth_signTypedData_v4':
      case 'wallet_switchEthereumChain':
        return this.adapter.request(args);
      case 'eth_call':
      case 'eth_estimateGas':
      case 'eth_getBalance':
      case 'eth_getBlockByNumber':
      case 'eth_getTransactionReceipt':
        // Read-only: use built-in RPC endpoint
        return this.adapter.request(args);
      default:
        throw new Error(`Unsupported method: ${args.method}`);
    }
  }
}
```

**非 EVM 链:** 不提供 EIP-1193 兼容，使用各自的 RPC 方法命名。

---

## 六、各适配器依赖

| 适配器 | 核心依赖 | 可选依赖 |
|--------|----------|----------|
| `adapter-ethereum` | `@walletconnect/ethereum-provider`, `eip1193-provider` | `viem`, `ethers` |
| `adapter-solana` | `@walletconnect/universal-provider`, `@solana/web3.js` | `@solana/wallet-adapter-base` |
| `adapter-bitcoin` | `@walletconnect/universal-provider` | `bitcoinjs-lib`, `@scure/bip32` |
| `adapter-ton` | `@walletconnect/universal-provider` | `@ton/ton`, `@ton/crypto` |
| `adapter-tron` | `@walletconnect/universal-provider` | `tronweb` |
| `chains` | 无运行时依赖 | `viem/chains` (for EVM) |

---

## 七、与 @onchainux/core 集成

### MultiChainProvider 聚合器

```typescript
// core/src/multichain-provider.ts

import { ChainAdapter, CaipChainId, RequestArguments } from './types';

export class MultiChainProvider {
  private adapters: Map<string, ChainAdapter> = new Map();
  private defaultChain: CaipChainId;

  register(adapter: ChainAdapter): void {
    this.adapters.set(adapter.namespace, adapter);
  }

  async connect(options: { namespace: string; chains?: CaipChainId[] }): Promise<ConnectionResult> {
    const adapter = this.adapters.get(options.namespace);
    if (!adapter) throw new Error(`No adapter registered for namespace: ${options.namespace}`);
    return adapter.connect({ ...options, projectId: this.projectId });
  }

  async request<T>(args: RequestArguments): Promise<T> {
    const chainId = args.chainId || this.defaultChain;
    const namespace = chainId.split(':')[0];
    const adapter = this.adapters.get(namespace);
    if (!adapter) throw new Error(`No adapter for namespace: ${namespace}`);
    return adapter.request(args);
  }

  getAdapter(namespace: string): ChainAdapter | undefined {
    return this.adapters.get(namespace);
  }

  getConnectedAccounts(): Map<string, AccountInfo[]> {
    const result = new Map<string, AccountInfo[]>();
    for (const [ns, adapter] of this.adapters) {
      const accounts = adapter.getAccounts();
      if (accounts.length > 0) result.set(ns, accounts);
    }
    return result;
  }
}
```

### 使用示例

```typescript
import { MultiChainProvider } from '@onchainux/core';
import { EthereumAdapter } from '@onchainux/adapter-ethereum';
import { SolanaAdapter } from '@onchainux/adapter-solana';
import { BitcoinAdapter } from '@onchainux/adapter-bitcoin';
import { TonAdapter } from '@onchainux/adapter-ton';
import { TronAdapter } from '@onchainux/adapter-tron';

const provider = new MultiChainProvider({ projectId: 'YOUR_PROJECT_ID' });

// 注册适配器
provider.register(await EthereumAdapter.init({ projectId: '...', chains: ['eip155:1', 'eip155:137'] }));
provider.register(await SolanaAdapter.init({ projectId: '...' }));
provider.register(await BitcoinAdapter.init({ projectId: '...' }));
provider.register(await TonAdapter.init({ projectId: '...' }));
provider.register(await TronAdapter.init({ projectId: '...' }));

// 连接
await provider.connect({ namespace: 'eip155' });
await provider.connect({ namespace: 'solana' });

// 跨链请求
await provider.request({
  method: 'personal_sign',
  params: ['0x...', '0x...'],
  chainId: 'eip155:1',
});

await provider.request({
  method: 'solana_signMessage',
  params: { message: '...', pubkey: '...' },
  chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
});
```

---

## 八、工作量估算

| 适配器 | 估算工时 | 复杂度 | 说明 |
|--------|----------|--------|------|
| `adapter-ethereum` | 3-5 天 | 中 | EIP-1193 成熟，Cinacoin 提供完善 Provider |
| `adapter-solana` | 4-6 天 | 中高 | 需要处理 base64 序列化、versioned transactions |
| `adapter-bitcoin` | 5-7 天 | 高 | PSBT 复杂、UTXO 模型、需要外部索引器 |
| `adapter-ton` | 4-6 天 | 中高 | BoC 编码、TEP-123 地址格式 |
| `adapter-tron` | 3-5 天 | 中 | Protocol Buffers 交易结构 |
| `chains` | 2-3 天 | 低 | 纯类型定义和注册表 |
| `core` 整合 | 3-4 天 | 中 | MultiChainProvider + 事件系统 |
| **总计** | **24-36 天** | | 单人开发，含测试 |

---

## 九、风险与缓解措施

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **钱包方法支持不一致** | 高 - 不同钱包支持的方法子集不同 | 实现 MethodNotSupportedError 降级处理，提供能力检测 |
| **Bitcoin UTXO 查询** | 高 - 无内置余额查询 RPC | 集成 Blockbook/Blockchair API，允许用户自定义索引器 |
| **TON 地址获取** | 中 - 无直接 getAccounts | 通过 ton_signData 探测或从 session 提取 |
| **TRON 版本兼容** | 中 - v1 vs legacy 交易格式 | 自动检测 sessionProperties.tron_method_version 适配 |
| **Solana RPC 端点** | 中 - 公共 RPC 有速率限制 | 支持自定义 RPC URL，推荐付费节点 |
| **CAIP-2 标准变化** | 低 - 命名空间可能更新 | 抽象 CAIP 解析层，易于适配新标准 |
| **Universal Provider 版本** | 中 - @walletconnect 包更新频繁 | 锁定版本号，建立更新测试流程 |
| **跨链事件同步** | 中 - 多钱包同时连接时状态管理 | 使用独立状态机，namespace 隔离 |

---

## 十、关键设计决策

1. **统一使用 Universal Provider 作为非 EVM 链基础** - Cinacoin 官方模式，减少适配成本
2. **EVM 专用 Ethereum Provider** - EIP-1193 完整兼容，生态工具链支持好
3. **CAIP-2 作为统一链标识** - 跨适配器一致
4. **适配器按需注册，惰性初始化** - 减少 bundle size
5. **余额查询走外部 API** - Bitcoin/TON 无标准 RPC，通过可配置索引器解决

---

*报告完成。所有数据来自 Cinacoin 官方文档，截至 2026-05-17。*
