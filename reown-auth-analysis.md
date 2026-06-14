# Cinacoin AppKit AUTHENTICATION Layer 深度分析与 OnchainUX 实现指南

> 分析日期: 2026-05-17 | 基于 Cinacoin AppKit 官方文档 14 个页面

---

## 一、文档页面逐一分析

### 1. One-Click Auth (authentication/one-click-auth.md)

**核心概念:**
- 一键认证是 Cinacoin v2 内的关键增强，连接钱包 + 签署 SIWE 消息只需一次点击
- 支持 EIP-1271（智能账户签名验证）和 EIP-6492（未部署合约的签名验证）
- 使用 ReCaps (EIP-5573) 编码权限实现一次性认证
- 支持多链多账户同时签名

**认证流程:**
1. 用户点击连接钱包
2. 钱包连接后自动生成 SIWE/SIWX 消息
3. 用户在钱包中签名
4. 签名被发送到后端验证
5. 验证通过后建立会话

### 2. SIWX Default (authentication/siwx/default.md)

**核心概念:**
- SIWX (Sign In With X) 是 SIWE 的多链升级版，符合 CAIP-122 标准
- 链无关：支持 Ethereum、Solana、Bitcoin 等
- 三种实现方式：
  1. Cinacoin Authentication（云端管理）
  2. DefaultSIWX 类（快速集成）
  3. 自定义 SIWXConfig 接口

**预期行为:**
- 每次连接时提示签名验证身份
- 已有会话自动登录，跳过签名步骤
- 切换网络时重新签名
- 断开连接时撤销会话

**SIWE → SIWX 迁移:** v1.5.0+ 自动迁移，`siweConfig` 和 `siwx` 不能同时使用

### 3. Socials (authentication/socials.md)

**支持的提供商:**
- Email (OTP)、Google、X (Twitter)、GitHub、Discord、Apple、Facebook、Farcaster
- Facebook 不支持移动端

**支持的链:**
- 所有 Viem 中的 EVM 兼容链
- Solana、Solana Devnet、Solana Testnet

**Magic.link 依赖:**
- Cinacoin AppKit 使用 Magic.link 提供 Universal Wallets
- 私钥管理由 Magic 的专利密钥管理系统处理
- 参考: https://magic.link/docs/home/security/product-security#patented-key-management

### 4. Smart Accounts (features/smart-accounts.md)

**核心概念:**
- 符合 ERC-4337 标准的智能合约账户替代 EOA
- 无需私钥/助记词，由指定签名者密钥控制（passkeys、EOA 签名）
- 反事实地址：首次交易时部署，部署前使用 6492 签名
- 仅对嵌入式钱包用户（邮箱/社交登录）可用

**Pimlico 集成:**
- 支持的链列表由 Pimlico 提供
- 智能账户地址在所有支持的链上相同（跨链一致性）

**ENS 账户名:**
- 使用 ENS Resolvers 分配可读名称（如 johnsmith.cinacoin.id）
- 跨链通用

### 5. Smart Accounts Interaction (features/smart-accounts-interaction.md)

**EIP-5792 三个核心方法:**
1. `wallet_getCapabilities` — 查询钱包执行能力
2. `wallet_sendCalls` — 发送批量调用
3. `wallet_getCallsStatus` — 获取批量调用状态和收据

**atomic 能力值:**
- `supported` — 钱包支持原子批量执行
- `ready` — 钱包可升级支持（需用户批准）
- `unsupported` — 不支持原子执行，回退到 `eth_sendTransaction`

### 6-10. JavaScript Core 系列

与 React 版本逻辑一致，区别在于:
- 使用原生 JS API 而非 React hooks
- 使用 `createAppKit` + `appKit.subscribe` 而非 React Provider + hooks
- 所有认证、智能账户、社交登录配置相同

### 11-13. React Core 系列

**SIWE React 集成:**
```ts
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@cinacoin/appkit/react'
import { useSession, signIn, signOut } from '@cinacoin/appkit-siwe/react'
```

**SIWX React 集成:**
```ts
import { DefaultSIWX } from '@cinacoin/appkit-siwx'
const appkit = createAppKit({ siwx: new DefaultSIWX() })
```

**Smart Accounts React:**
- 默认启用，通过 features 配置控制
- 自动检测 EIP-1271/6492 签名类型

### 14. Switching to Send Calls (recipes/switching-to-send-calls.md)

**EIP-5792 迁移指南:**
- EOA 不支持 EIP-5792，需用 `getCapabilities` 检测
- `writeContractAsync` → `sendCalls` 需要预先编码 call data
- `waitForTransactionReceipt` → `useCallsStatus` + 轮询
- Paymaster 支持通过 ERC-7677 capabilities

---

## 二、OnchainUX 实现方案

### 整体架构

```
@onchainux/core              ← 核心：连接、网络、事件、状态
    │
    ├── @onchainux/siwe      ← SIWE (EIP-4361) 单链认证
    ├── @onchainux/siwx      ← SIWX (CAIP-122) 多链认证
    ├── @onchainux/auth       ← 统一认证入口 + Social Login + 会话管理
    └── @onchainux/smart-accounts  ← 智能账户 + EIP-5792 交互
```

---

### 包 1: `@onchainux/siwe`

#### 包结构
```
@onchainux/siwe/
├── src/
│   ├── index.ts              # 导出
│   ├── config.ts             # SIWEConfig 创建
│   ├── message.ts            # SIWE 消息生成/格式化
│   ├── verify.ts             # 签名验证（viem/siwe）
│   ├── session.ts            # 会话管理
│   ├── react.ts              # React hooks
│   └── types.ts              # 类型定义
├── package.json
└── tsconfig.json
```

#### 依赖
```json
{
  "peerDependencies": {
    "viem": "^2.x",
    "@onchainux/core": "workspace:*"
  },
  "dependencies": {
    "siwe": "^2.x"
  }
}
```

#### 核心接口
```typescript
import type { SiweMessage } from 'siwe';

export interface SIWESession {
  address: string;
  chainId: number;
}

export interface SIWECreateMessageArgs {
  nonce: string;
  address: string;
  chainId: number;
  domain: string;
  uri: string;
  statement?: string;
}

export interface SIWEVerifyMessageArgs {
  message: string;
  signature: string;
}

export interface SIWEConfig {
  getMessageParams: () => Promise<{
    domain: string;
    uri: string;
    chains: number[];
    statement: string;
  }>;
  createMessage: (args: SIWECreateMessageArgs) => string;
  getNonce: () => Promise<string>;
  verifyMessage: (args: SIWEVerifyMessageArgs) => Promise<boolean>;
  getSession: () => Promise<SIWESession | null>;
  signOut: () => Promise<boolean>;
  onSignIn?: (session?: SIWESession) => void;
  onSignOut?: () => void;
  signOutOnDisconnect?: boolean;  // default true
}
```

#### Auth 流程 (One-Click Auth)
```
1. 用户触发连接 → wallet.connect()
2. 连接成功后 → generateNonce() (后端)
3. 构建 SiweMessage → prepareMessage()
4. wallet.signMessage(message) → signature
5. POST /verify { message, signature } → 后端验证
   - getAddressFromMessage(message)
   - viem.verifyMessage({ message, address, signature })
6. 验证通过 → 存储会话 (address, chainId)
7. 触发 onSignIn 回调
```

#### 代码示例
```typescript
import { SiweMessage } from 'siwe';
import { createSIWEConfig, formatMessage } from './config';

export function createSIWEConfig(params: {
  domain: string;
  uri: string;
  chains: number[];
  statement: string;
  verifyEndpoint: string;
  sessionEndpoint: string;
  nonceEndpoint: string;
}): SIWEConfig {
  return {
    getMessageParams: async () => ({
      domain: params.domain,
      uri: params.uri,
      chains: params.chains,
      statement: params.statement,
    }),
    createMessage: ({ address, ...args }) => formatMessage(args, address),
    getNonce: async () => {
      const res = await fetch(params.nonceEndpoint);
      return res.text();
    },
    getSession: async () => {
      const res = await fetch(params.sessionEndpoint);
      return res.ok ? res.json() : null;
    },
    verifyMessage: async ({ message, signature }) => {
      const res = await fetch(params.verifyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      });
      return res.ok && (await res.json()) === true;
    },
    signOut: async () => {
      await fetch(`${params.sessionEndpoint}/signout`);
      return true;
    },
  };
}
```

#### 估计工作量: **3-4 天**

---

### 包 2: `@onchainux/siwx`

#### 包结构
```
@onchainux/siwx/
├── src/
│   ├── index.ts              # 导出
│   ├── config.ts             # DefaultSIWX / SIWXConfig
│   ├── messenger.ts          # SIWXMessenger (InformalMessenger)
│   ├── verifiers/
│   │   ├── eip155.ts         # EIP155Verifier (viem)
│   │   ├── solana.ts         # SolanaVerifier (@solana/web3.js)
│   │   └── bip122.ts         # BIP122Verifier (Bitcoin, 预留)
│   ├── storage/
│   │   ├── local.ts          # LocalStorage
│   │   └── memory.ts         # MemoryStorage
│   ├── session.ts            # 会话管理
│   ├── react.ts              # React hooks
│   └── types.ts              # SIWXSession, SIWXMessage, Cacao
├── package.json
└── tsconfig.json
```

#### 依赖
```json
{
  "peerDependencies": {
    "viem": "^2.x",
    "@onchainux/core": "workspace:*"
  },
  "optionalDependencies": {
    "@solana/web3.js": "^1.x"
  }
}
```

#### SIWXConfig 接口 (完全兼容 Cinacoin)
```typescript
export interface SIWXConfig {
  createMessage: (input: SIWXMessage.Input) => Promise<SIWXMessage>;
  addSession: (session: SIWXSession) => Promise<void>;
  revokeSession: (chainId: CaipNetworkId, address: string) => Promise<void>;
  setSessions: (sessions: SIWXSession[]) => Promise<void>;
  getSessions: (chainId: CaipNetworkId, address: string) => Promise<SIWXSession[]>;
  getRequired?: () => boolean;
  signOutOnDisconnect?: boolean;
}

export interface SIWXSession {
  data: SIWXMessage.Data;
  message: string;
  signature: string;
  cacao?: Cacao;
}

// CAIP-74 Cacao
export interface Cacao {
  h: { t: 'caip122' };
  p: {
    domain: string;
    aud: string;
    nonce: string;
    iss: string; // CAIP-10 格式: eip155:1:0x...
    version?: string;
    iat?: string;
    nbf?: string;
    exp?: string;
    statement?: string;
    requestId?: string;
    resources?: string[];
    type?: string;
  };
  s: {
    t: 'eip191' | 'eip1271';
    s: string;
    m?: string;
  };
}
```

#### SIWX 插件系统设计

```
┌─────────────────────────────────────────────┐
│              DefaultSIWX                     │
│  ┌───────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Messenger  │ │ Verifier │ │  Storage   │  │
│  │ (可替换)   │ │ (可组合) │ │  (可替换)  │  │
│  └───────────┘ └──────────┘ └────────────┘  │
│       │              │             │         │
│  ┌────▼────┐  ┌──────▼─────┐ ┌────▼───────┐ │
│  │Informal │  │EIP155Verif │ │ LocalStor  │ │
│  │Messenger│  │SolanaVerif │ │ Supabase   │ │
│  │Custom   │  │BIP122Verif │ │ Custom     │ │
│  └─────────┘  └────────────┘ └────────────┘ │
└─────────────────────────────────────────────┘
```

**SIWXMessenger** — 消息生成器
```typescript
export abstract class SIWXMessenger {
  protected abstract version: string;
  protected abstract stringify(params: SIWXMessage.Data): string;

  create(input: SIWXMessage.Input, metadata: SIWXMessage.Metadata): SIWXMessage {
    return {
      ...input,
      ...metadata,
      issuedAt: new Date().toISOString(),
      toString: () => this.stringify({ ...input, ...metadata }),
    };
  }
}
```

**SIWXVerifier** — 链特定验证器
```typescript
export abstract class SIWXVerifier {
  public abstract chainNamespace: string; // 'eip155', 'solana', 'bip122'

  public abstract verify(session: SIWXSession): Promise<boolean>;
}

// EIP155Verifier 实现
export class EIP155Verifier extends SIWXVerifier {
  public chainNamespace = 'eip155';

  public async verify(session: SIWXSession): Promise<boolean> {
    const { data, message, signature } = session;
    const client = createPublicClient({
      chain: getChain(Number(data.chainId)),
      transport: http(),
    });

    // 检测是否为智能合约地址
    const code = await client.getBytecode({ address: data.accountAddress as `0x${string}` });
    if (code) {
      // EIP-1271 / EIP-6492 验证
      return client.verifyMessage({
        message,
        address: data.accountAddress as `0x{string}`,
        signature: signature as `0x{string}`,
      });
    }

    // 标准 EIP-191 个人签名验证
    return client.verifyMessage({
      message,
      address: data.accountAddress as `0x{string}`,
      signature: signature as `0x{string}`,
    });
  }
}
```

**SIWXStorage** — 会话存储
```typescript
export interface SIWXStorage {
  add(session: SIWXSession): Promise<void>;
  set(sessions: SIWXSession[]): Promise<void>;
  get(chainId: CaipNetworkId, address: string): Promise<SIWXSession[]>;
  delete(chainId: string, address: string): Promise<void>;
}
```

#### 估计工作量: **5-7 天**

---

### 包 3: `@onchainux/auth`

#### 包结构
```
@onchainux/auth/
├── src/
│   ├── index.ts              # 统一导出
│   ├── provider.ts           # AuthProvider (统一入口)
│   ├── socials/
│   │   ├── config.ts         # 社交登录配置
│   │   ├── providers.ts      # 提供商枚举/类型
│   │   ├── magic.ts          # Magic.link 集成
│   │   └── react.ts          # SocialLogin hooks
│   ├── session.ts            # 会话管理/持久化
│   ├── email.ts              # Email/OTP 登录
│   └── types.ts              # AuthSession, SocialProvider
├── package.json
└── tsconfig.json
```

#### 依赖
```json
{
  "peerDependencies": {
    "viem": "^2.x",
    "@onchainux/core": "workspace:*",
    "@onchainux/siwx": "workspace:*"
  },
  "dependencies": {
    "@magic-sdk/auth": "^x.x"
  },
  "optionalDependencies": {
    "@solana/web3.js": "^1.x"
  }
}
```

#### Magic.link 集成细节

**Magic.link 在 Cinacoin 中的角色:**
- 提供 Universal Wallets（嵌入式钱包）
- 密钥由 Magic 专利密钥管理系统管理
- 支持 EVM 和 Solana
- OAuth 流程通过 Magic 代理

**集成方案:**
```typescript
// Magic SDK 封装
import { Magic } from '@magic-sdk/auth';

export class MagicAuthManager {
  private magic: Magic;

  constructor(apiKey: string, options?: { chainId?: number }) {
    this.magic = new Magic(apiKey, {
      network: {
        rpcUrl: `https://eth-${options?.chainId ?? 1}.g.alchemy.com/v2/YOUR_KEY`,
        chainId: options?.chainId ?? 1,
      },
    });
  }

  // 社交登录
  async loginWithSocial(provider: SocialProvider): Promise<AuthResult> {
    const didToken = await this.magic.oauth.loginWithRedirect({
      provider: mapProvider(provider), // 'google', 'github', etc.
      redirectURI: window.location.origin + '/auth/callback',
    });
    const { publicAddress } = await this.magic.user.getInfo();
    return { address: publicAddress, type: 'magic' };
  }

  // Email/OTP 登录
  async loginWithEmail(email: string): Promise<AuthResult> {
    const didToken = await this.magic.auth.loginWithEmailOTP({ email });
    const { publicAddress } = await this.magic.user.getInfo();
    return { address: publicAddress, type: 'magic' };
  }

  // 获取钱包地址
  async getAddress(): Promise<string> {
    const { publicAddress } = await this.magic.user.getInfo();
    return publicAddress;
  }

  // 登出
  async logout(): Promise<void> {
    await this.magic.user.logout();
  }

  // 签名 (用于 SIWX)
  async signMessage(message: string): Promise<string> {
    return await this.magic.rpcClient.signMessage(message);
  }
}
```

#### Auth Provider 统一入口
```typescript
export type AuthMethod = 'wallet' | 'email' | 'social';

export interface AuthConfig {
  // SIWX 配置
  siwx?: SIWXConfig;

  // 社交登录
  email?: boolean;
  socials?: SocialProvider[];
  emailShowWallets?: boolean;

  // Magic.link
  magicApiKey?: string;

  // 所有钱包显示控制
  allWallets?: 'SHOW' | 'HIDE' | 'ONLY_MOBILE';
}

export interface AuthSession {
  address: string;
  chainId: number;
  method: AuthMethod;
  provider?: SocialProvider;
  siwxSession?: SIWXSession;
  createdAt: Date;
}
```

#### 认证流程
```
Email/Social 登录:
1. 用户选择 Email 或 Social 登录
2. → Magic.link OAuth/OTP 流程
3. → Magic 返回 DID Token + 钱包地址
4. → 自动创建嵌入式 EOA 钱包
5. → SIWX createMessage() 生成认证消息
6. → Magic.signMessage() 签名
7. → addSession() 存储会话
8. → 触发 onSignIn

钱包直连登录:
1. 用户连接外部钱包 (Cinacoin, MetaMask等)
2. → SIWX createMessage() 生成认证消息
3. → wallet.signMessage() 签名
4. → 对应 Verifier 验证签名
5. → addSession() 存储会话
```

#### 估计工作量: **7-10 天**

---

### 包 4: `@onchainux/smart-accounts`

#### 包结构
```
@onchainux/smart-accounts/
├── src/
│   ├── index.ts              # 导出
│   ├── factory.ts            # 智能账户工厂/部署
│   ├── deploy.ts             # 部署流程
│   ├── eip5792.ts            # EIP-5792 方法封装
│   ├── capabilities.ts       # 能力检测
│   ├── paymaster.ts          # Paymaster 支持 (ERC-7677)
│   ├── counterfactual.ts     # 反事实地址计算
│   ├── ens.ts                # ENS 账户名
│   ├── react.ts              # React hooks
│   └── types.ts              # 类型定义
├── package.json
└── tsconfig.json
```

#### 依赖
```json
{
  "peerDependencies": {
    "viem": "^2.x",
    "@onchainux/core": "workspace:*",
    "@onchainux/auth": "workspace:*"
  },
  "dependencies": {
    "permissionless": "^0.x",
    "@pimlico/erc7677": "^x.x"
  }
}
```

#### 智能账户部署流程
```
1. 用户通过 Email/Social 登录 (Magic.link)
2. 检查是否已有智能账户:
   - 查询 counterfactual address
   - 检查链上是否已部署
3. 如果未部署:
   a. 计算反事实地址 (create2)
   b. 构建 UserOperation (ERC-4337)
   c. 通过 Bundler 发送 (Pimlico)
   d. 部署交易包含在第一个 UserOperation 中
   e. 用户支付 activation fee (可被 Paymaster 赞助)
4. 部署后:
   - 账户地址固定 (跨链一致)
   - 支持 EIP-1271/6492 签名
   - 可绑定 ENS 账户名
```

#### EIP-5792 交互实现
```typescript
export class EIP5792Manager {
  private provider: WalletProvider;

  constructor(provider: WalletProvider) {
    this.provider = provider;
  }

  // 检测能力
  async getCapabilities(): Promise<WalletCapabilities> {
    return this.provider.request({
      method: 'wallet_getCapabilities',
      params: [],
    });
  }

  // 检查是否支持原子批量
  isAtomicSupported(): boolean {
    const caps = this.getCapabilities();
    return caps?.atomic === 'supported' || caps?.atomic === 'ready';
  }

  // 发送批量调用
  async sendCalls(calls: Call[], atomicRequired: boolean = false): Promise<string> {
    const caps = await this.getCapabilities();
    const supported = caps?.atomic === 'supported';

    if (!supported) {
      // 回退到 eth_sendTransaction
      throw new Error('EIP-5792 not supported, fallback to eth_sendTransaction');
    }

    return this.provider.request({
      method: 'wallet_sendCalls',
      params: [{
        from: await this.getAddress(),
        chainId: await this.getChainId(),
        atomicRequired,
        calls: calls.map(c => ({
          to: c.to,
          value: c.value ?? '0x0',
          data: c.data ?? '0x',
        })),
      }],
    });
  }

  // 获取批量状态
  async getCallsStatus(batchId: string): Promise<CallsStatus> {
    return this.provider.request({
      method: 'wallet_getCallsStatus',
      params: [batchId],
    });
  }

  // 轮询直到完成
  async waitForCalls(batchId: string, pollMs: number = 2000): Promise<CallsStatus> {
    while (true) {
      const status = await this.getCallsStatus(batchId);
      if (status.status === 'CONFIRMED') return status;
      await new Promise(r => setTimeout(r, pollMs));
    }
  }
}
```

#### Pimlico 集成细节

**Bundler 集成:**
```typescript
import { createBundlerClient, createPaymasterClient } from 'viem/account-abstraction';
import { pimlicoBundlerActions } from '@pimlico/client/viem';

export function createSmartAccountClient(params: {
  bundlerUrl: string;
  paymasterUrl?: string;
  entryPoint: EntryPoint;
  signer: Signer;
}) {
  const bundlerClient = createBundlerClient({
    transport: http(params.bundlerUrl),
    entryPoint: params.entryPoint,
  }).extend(pimlicoBundlerActions);

  const paymasterClient = params.paymasterUrl
    ? createPaymasterClient({ transport: http(params.paymasterUrl) })
    : undefined;

  return { bundlerClient, paymasterClient };
}
```

#### 估计工作量: **8-12 天**

---

## 三、与 @onchainux/core 集成

### Core 包需要提供的接口
```typescript
// @onchainux/core 导出
export interface OnchainUXCore {
  // 钱包连接
  connect: (connector: ConnectorConfig) => Promise<Connection>;
  disconnect: () => Promise<void>;

  // 状态订阅
  subscribe: <T>(selector: (state: State) => T, callback: (value: T) => void) => () => void;

  // 当前状态
  getState: () => State;
}

export interface State {
  connection: Connection | null;
  chainId: number;
  address: string | null;
  isAuth: boolean;
  isSmartAccount: boolean;
}
```

### 集成点
| 包 | 依赖 Core 的什么 |
|---|---|
| @onchainux/siwe | 获取当前连接地址/链ID、连接状态 |
| @onchainux/siwx | 多链切换事件、连接状态 |
| @onchainux/auth | 钱包连接、Magic SDK 初始化 |
| @onchainux/smart-accounts | Provider 获取、链配置、能力检测 |

---

## 四、依赖清单

| 包 | 核心依赖 | 版本 |
|---|---|---|
| @onchainux/siwe | siwe, viem | siwe ^2.x, viem ^2.x |
| @onchainux/siwx | viem, @solana/web3.js(可选) | viem ^2.x |
| @onchainux/auth | @magic-sdk/auth, viem | @magic-sdk ^28.x |
| @onchainux/smart-accounts | viem, permissionless, @pimlico/client | permissionless ^0.x |

---

## 五、总工作量估算

| 包 | 工作量 | 复杂度 |
|---|---|---|
| @onchainux/siwe | 3-4 天 | 中 |
| @onchainux/siwx | 5-7 天 | 高 |
| @onchainux/auth | 7-10 天 | 高 |
| @onchainux/smart-accounts | 8-12 天 | 极高 |
| **总计** | **23-33 天** | |

---

## 六、风险与缓解

### Magic.link 集成风险 (高危)

| 风险 | 影响 | 缓解 |
|---|---|---|
| **供应商锁定** | Magic.link 是专有服务，迁移成本高 | 抽象 AuthProvider 接口，保留替换能力；同时支持 Cinacoin 直连 |
| **私钥不可导出** | Smart Account 无法导出，用户资产受限 | 保留 EOA 升级通道，用户可从 EOA 提取资产 |
| **服务中断** | Magic 宕机导致所有社交登录不可用 | 实现降级：Magic 失败时回退到钱包直连 |
| **成本** | Magic 按 MAU 收费，成本不可控 | 监控用量，设置阈值告警 |
| **验证限制** | verifySignature 对未部署智能账户不工作 | 使用 viem.verifyMessage 替代，支持 EIP-6492 |

### Pimlico 集成风险 (高危)

| 风险 | 影响 | 缓解 |
|---|---|---|
| **Bundler 单点** | Pimlico 是唯一支持的 Bundler | 支持多 Bundler 配置，实现故障切换 |
| **链覆盖** | 部分 EVM 链不在 Pimlico 支持列表 | 不支持的链自动回退到 EOA 模式 |
| **Gas 费波动** | Paymaster 赞助成本不可预测 | 设置每日/每用户预算上限 |
| **Entry Point 升级** | ERC-4337 规范持续演进 | 抽象 Entry Point 版本，保持向后兼容 |

### SIWX 多链验证风险 (中危)

| 风险 | 影响 | 缓解 |
|---|---|---|
| **CAIP-122 合规** | 不同链签名格式差异大 | 为每个链命名空间实现独立 Verifier |
| **Cacao 解析** | CAIP-74 Cacao 对象解析复杂 | 使用成熟的 cacao 解析库 |

### EIP-5792 兼容性风险 (中危)

| 风险 | 影响 | 缓解 |
|---|---|---|
| **钱包兼容性** | 多数钱包尚未支持 EIP-5792 | 始终提供 eth_sendTransaction 回退路径 |
| **标准演进** | EIP-5792 仍处于草稿阶段 | 抽象能力检测，标准变化时只需更新适配器 |

### 安全考虑

1. **Nonce 管理**: 必须使用密码学安全的随机数生成器，每次认证唯一
2. **CSRF 防护**: 使用 getNonce 作为 CSRF token 替代
3. **消息格式**: 严格遵循 EIP-4361 / CAIP-122 格式，防止消息篡改
4. **会话过期**: SIWXStorage 必须实现会话过期检查
5. **签名重放**: 每条消息必须包含 domain、uri、nonce 防止重放攻击

---

## 七、建议实施顺序

1. **Phase 1 (周 1-2)**: `@onchainux/siwe` — 基础 SIWE 认证，验证核心流程
2. **Phase 2 (周 2-4)**: `@onchainux/siwx` — 扩展多链，构建插件系统
3. **Phase 3 (周 4-6)**: `@onchainux/auth` — 集成 Magic.link，社交登录
4. **Phase 4 (周 6-9)**: `@onchainux/smart-accounts` — Pimlico + EIP-5792

每阶段完成后进行集成测试，确保向后兼容。
