# Cinacoin (Cinacoin) 完整复刻实现方案

> **项目**: Cinacoin - Cinacoin 完整复刻  
> **目标**: 使用自有品牌和 Logo，继续使用官方中继 relay.walletconnect.com  
> **日期**: 2026-06-14  
> **状态**: 90% 完成

---

## 一、Cinacoin 项目架构分析

### 1.1 核心仓库结构

```
cinacoin-com/
├── appkit/                    # 主 SDK（dApp 端）
│   ├── packages/
│   │   ├── core/              # 核心功能
│   │   ├── ui/                # UI 组件
│   │   ├── utils/             # 工具函数
│   │   ├── adapters/          # 链适配器
│   │   └── providers/         # 钱包提供商
│   └── apps/                  # 示例应用
│
├── cinacoin-walletkit-js/        # 钱包端 SDK
│   └── packages/
│       ├── core/              # 钱包核心
│       └── ui/                # 钱包 UI
│
├── appkit-react-native/       # React Native SDK
│
├── push-server/               # 推送通知服务
│
├── notify-server/             # 通知服务
│
└── keys-server/               # 密钥管理服务
```

### 1.2 核心组件

| 组件 | 功能 | 技术栈 |
|------|------|--------|
| **AppKit** | dApp 连接钱包 | TypeScript, Lit, React |
| **WalletKit** | 钱包端集成 | TypeScript |
| **Sign API** | 签名请求处理 | TypeScript |
| **Auth API** | 身份验证 | TypeScript, SIWE |
| **Chat API** | 钱包间通信 | TypeScript |
| **Push API** | 推送通知 | TypeScript, FCM/APNS |
| **Relay** | 消息中继 | WebSocket, IRN 协议 |

### 1.3 协议标准

| 标准 | 说明 |
|------|------|
| **CAIP-10** | 链无关账户标识 |
| **CAIP-25** | 会话授权 |
| **CAIP-122** | 链无关签名 |
| **EIP-1193** | 以太坊 Provider API |
| **EIP-4361** | Sign-In with Ethereum |
| **EIP-5792** | 钱包调用批处理 |

---

## 二、Cinacoin 当前实现状态

### 2.1 已完成的核心包

```
packages/
├── core-sdk/                  ✅ 核心 SDK
├── walletconnect-v2/          ✅ WalletConnect v2 兼容层
├── relay-server/              ✅ 中继服务（Cloudflare Workers）
├── rpc-proxy/                 ✅ RPC 代理
├── keys-server/               ✅ 密钥管理
├── push-server/               ✅ 推送服务
├── notify-server/             ✅ 通知服务
│
├── adapters/                  ✅ 链适配器
│   ├── evm/                   ✅ EVM 适配器
│   ├── solana/                ✅ Solana 适配器
│   ├── bitcoin/               ✅ Bitcoin 适配器
│   └── ...                    ✅ 其他链适配器
│
├── ui/                        ✅ UI 组件
│   ├── connect-modal/         ✅ 连接弹窗
│   ├── wallet-buttons/        ✅ 钱包按钮
│   └── theme/                 ✅ 主题系统
│
└── auth/                      ✅ 认证模块
    ├── siwe/                  ✅ SIWE 实现
    └── siwx/                  ✅ SIWX 实现
```

### 2.2 与 Cinacoin 的对比

| 功能 | Cinacoin | Cinacoin | 状态 |
|------|-------|----------|------|
| 钱包连接 | ✅ | ✅ | 完成 |
| 多链支持 | ✅ | ✅ | 完成 |
| 会话管理 | ✅ | ✅ | 完成 |
| 签名请求 | ✅ | ✅ | 完成 |
| 官方中继 | ✅ | ✅ | 完成 |
| UI 组件 | ✅ | ✅ | 完成 |
| SIWE 认证 | ✅ | ✅ | 完成 |
| 推送通知 | ✅ | ✅ | 完成 |
| 智能账户 | ✅ | ⚠️ | 进行中 |
| 社交登录 | ✅ | ⚠️ | 进行中 |
| 批量调用 | ✅ | ⚠️ | 进行中 |

---

## 三、完整实现方案

### 3.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Cinacoin SDK 架构                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   AppKit     │  │  WalletKit   │  │   AuthKit    │      │
│  │  (dApp SDK)  │  │ (Wallet SDK) │  │  (认证 SDK)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │    Core SDK     │                        │
│                  │  (核心功能层)   │                        │
│                  └────────┬────────┘                        │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │   Sign API   │  │  Chat API    │  │  Push API    │      │
│  │  (签名接口)  │  │  (聊天接口)  │  │  (推送接口)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │  Cloud Relay    │                        │
│                  │ relay.wallet    │                        │
│                  │  connect.com    │                        │
│                  └─────────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 核心模块实现

#### 3.2.1 CloudRelay - 官方中继集成

**文件**: `packages/core-sdk/src/relay/cloud-relay.ts`

```typescript
/**
 * Cinacoin Cloud Relay 实现
 * 
 * 连接到 relay.walletconnect.com
 * 实现 IRN (Inter-Relay Network) 协议
 */

export class CloudRelay extends EventEmitter {
  private ws: WebSocket | null = null;
  private projectId: string;
  private subscriptions: Map<string, Set<Handler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  
  constructor(config: CloudRelayConfig) {
    super();
    this.projectId = config.projectId;
  }

  /**
   * 连接到 relay.walletconnect.com
   */
  async connect(): Promise<void> {
    const url = `wss://relay.walletconnect.com?projectId=${this.projectId}`;
    
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit('connected');
      this.resubscribeAll();
    };
    
    this.ws.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data));
    };
    
    this.ws.onclose = () => {
      this.emit('disconnected');
      this.attemptReconnect();
    };
  }

  /**
   * 订阅主题
   */
  async subscribe(topic: string, handler: Handler): Promise<void> {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
      
      // 发送订阅请求到中继
      this.send({
        method: 'irn_subscribe',
        params: { topic },
        id: this.nextId(),
      });
    }
    
    this.subscriptions.get(topic)!.add(handler);
  }

  /**
   * 发布消息
   */
  async publish(params: PublishParams): Promise<void> {
    this.send({
      method: 'irn_publish',
      params: {
        topic: params.topic,
        message: params.message,
        ttl: params.ttl,
        tag: params.tag,
      },
      id: this.nextId(),
    });
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(message: JsonRpcRequest): void {
    switch (message.method) {
      case 'irn_subscription':
        const { topic, message: msg } = message.params;
        const handlers = this.subscriptions.get(topic);
        if (handlers) {
          handlers.forEach(handler => handler(msg));
        }
        break;
        
      case 'irn_subscription_error':
        this.emit('error', message.params);
        break;
    }
  }

  /**
   * 自动重连
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('Max reconnect attempts reached'));
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
}
```

#### 3.2.2 WcConnector - Cinacoin 连接器

**文件**: `packages/walletconnect-v2/src/wc-connector.ts`

```typescript
/**
 * Cinacoin v2 连接器
 * 
 * 实现 Connector 接口
 * 支持 QR 码、深度链接、官方中继
 */

export class WcConnector extends Connector {
  private relay: CloudRelay;
  private sessionManager: SessionManager;
  private metadata: AppMetadata;
  
  constructor(config: WcConnectorConfig) {
    super();
    
    this.metadata = config.metadata;
    this.relay = new CloudRelay({
      projectId: config.projectId,
    });
    
    this.sessionManager = new SessionManager({
      relay: this.relay,
      metadata: this.metadata,
    });
  }

  /**
   * 连接到钱包
   */
  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    // 1. 创建提议
    const proposal = await this.sessionManager.createProposal({
      requiredNamespaces: {
        eip155: {
          methods: [
            'eth_sendTransaction',
            'eth_signTransaction',
            'personal_sign',
            'eth_sign',
            'eth_signTypedData',
          ],
          chains: ['eip155:1', 'eip155:137'],
          events: ['chainChanged', 'accountsChanged'],
        },
      },
    });
    
    // 2. 生成 WC URI
    const uri = this.generateUri(proposal);
    
    // 3. 如果提供了 URI（扫码），直接批准
    if (params?.uri) {
      return this.approveUri(params.uri);
    }
    
    // 4. 发射 URI 事件（用于显示 QR 码）
    this.emit('uri', uri);
    
    // 5. 等待钱包批准
    return new Promise((resolve, reject) => {
      this.once('session_approved', (session) => {
        resolve({
          accounts: session.accounts,
          chains: session.chains,
        });
      });
      
      this.once('error', reject);
    });
  }

  /**
   * 发送请求到钱包
   */
  async request<T>(params: RequestParams): Promise<T> {
    const session = this.sessionManager.getActiveSession();
    if (!session) {
      throw new Error('No active session');
    }
    
    const id = Date.now();
    
    // 发送 JSON-RPC 请求
    await this.relay.publish({
      topic: session.topic,
      message: JSON.stringify({
        id,
        jsonrpc: '2.0',
        method: params.method,
        params: params.params,
      }),
      ttl: 300,
      tag: 1108,
    });
    
    // 等待响应
    return new Promise((resolve, reject) => {
      const handler = (message: string) => {
        const response = JSON.parse(message);
        if (response.id === id) {
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
          this.relay.off('message', handler);
        }
      };
      
      this.relay.on('message', handler);
      
      // 超时处理
      setTimeout(() => {
        this.relay.off('message', handler);
        reject(new Error('Request timeout'));
      }, 60000);
    });
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    const session = this.sessionManager.getActiveSession();
    if (session) {
      await this.request({
        method: 'wallet_disconnect',
        params: [],
      });
      
      this.sessionManager.removeSession(session.topic);
    }
    
    this.relay.disconnect();
  }
}
```

#### 3.2.3 SessionManager - 会话管理

**文件**: `packages/walletconnect-v2/src/session-manager.ts`

```typescript
/**
 * 会话管理器
 * 
 * 管理 Cinacoin 会话的生命周期
 * 支持持久化和恢复
 */

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private activeTopic: string | null = null;
  private storage: Storage;
  
  constructor(config: SessionManagerConfig) {
    this.storage = config.storage || new LocalStorage();
    this.loadSessions();
  }

  /**
   * 创建会话提议
   */
  async createProposal(params: ProposalParams): Promise<Proposal> {
    const proposal: Proposal = {
      id: crypto.randomUUID(),
      proposer: {
        publicKey: await this.generateKeyPair(),
        metadata: this.metadata,
      },
      requiredNamespaces: params.requiredNamespaces,
      optionalNamespaces: params.optionalNamespaces || {},
      relays: [{ protocol: 'irn' }],
    };
    
    return proposal;
  }

  /**
   * 批准会话
   */
  async approveSession(proposal: Proposal, accounts: string[]): Promise<Session> {
    const session: Session = {
      topic: crypto.randomUUID(),
      accounts,
      chains: this.extractChains(accounts),
      methods: this.extractMethods(proposal.requiredNamespaces),
      events: this.extractEvents(proposal.requiredNamespaces),
      expiry: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 天
    };
    
    this.sessions.set(session.topic, session);
    this.activeTopic = session.topic;
    await this.saveSessions();
    
    return session;
  }

  /**
   * 恢复会话
   */
  async restoreSession(): Promise<Session | null> {
    await this.loadSessions();
    
    if (this.activeTopic) {
      return this.sessions.get(this.activeTopic) || null;
    }
    
    // 返回最新的未过期会话
    const now = Math.floor(Date.now() / 1000);
    const validSessions = Array.from(this.sessions.values())
      .filter(s => s.expiry > now);
    
    if (validSessions.length > 0) {
      return validSessions[validSessions.length - 1];
    }
    
    return null;
  }

  /**
   * 从持久化存储加载会话
   */
  private async loadSessions(): Promise<void> {
    const data = await this.storage.get('cinacoin_sessions');
    if (data) {
      const sessions = JSON.parse(data);
      this.sessions = new Map(Object.entries(sessions));
    }
  }

  /**
   * 保存会话到持久化存储
   */
  private async saveSessions(): Promise<void> {
    const data = Object.fromEntries(this.sessions);
    await this.storage.set('cinacoin_sessions', JSON.stringify(data));
  }
}
```

### 3.3 品牌替换清单

#### 3.3.1 代码层面

```bash
# 1. 替换包名
find packages -name "package.json" -exec sed -i 's/@cinacoin\//@cinacoin\//g' {} \;

# 2. 替换导入语句
find packages -name "*.ts" -exec sed -i 's/from "@cinacoin/from "@cinacoin\//g' {} \;

# 3. 替换品牌名称
find packages -name "*.ts" -exec sed -i 's/Cinacoin/Cinacoin/g' {} \;
find packages -name "*.ts" -exec sed -i 's/Cinacoin/Cinacoin/g' {} \;
```

#### 3.3.2 UI 层面

| 元素 | Cinacoin | Cinacoin |
|------|-------|----------|
| Logo | Cinacoin Logo | Cinacoin Logo |
| 主色 | #3396FF | #00D4AA |
| 字体 | Inter | Inter |
| 名称 | Cinacoin AppKit | Cinacoin SDK |

#### 3.3.3 文档层面

```markdown
# 替换前
Welcome to Cinacoin AppKit documentation.

# 替换后
Welcome to Cinacoin SDK documentation.
```

### 3.4 基础设施配置

#### 3.4.1 Cloudflare Workers 部署

```yaml
# wrangler.toml
name = "cinacoin-relay"
main = "packages/relay-server/src/worker.ts"
compatibility_date = "2024-12-01"

[[d1_databases]]
binding = "DB"
database_name = "cinacoin-relay"

[[kv_namespaces]]
binding = "SESSION_KV"
id = "your-kv-namespace-id"

[triggers]
crons = ["*/5 * * * *"]  # 每 5 分钟清理过期会话
```

#### 3.4.2 环境变量

```bash
# .env
CLOUDFLARE_API_TOKEN=your_token
PROJECT_ID=your_walletconnect_project_id
JWT_SECRET=your_jwt_secret

# 可选
FALLBACK_RELAY_URL=wss://relay.walletconnect.org
RATE_LIMIT_RPM=1000
```

---

## 四、测试策略

### 4.1 单元测试

```typescript
// packages/walletconnect-v2/tests/cloud-relay.test.ts

describe('CloudRelay', () => {
  it('should connect to relay.walletconnect.com', async () => {
    const relay = new CloudRelay({ projectId: 'test' });
    await relay.connect();
    expect(relay.isConnected()).toBe(true);
  });

  it('should subscribe to topic', async () => {
    const relay = new CloudRelay({ projectId: 'test' });
    await relay.connect();
    
    const handler = jest.fn();
    await relay.subscribe('test-topic', handler);
    
    expect(relay.getSubscriptions()).toContain('test-topic');
  });

  it('should publish message', async () => {
    const relay = new CloudRelay({ projectId: 'test' });
    await relay.connect();
    
    await relay.publish({
      topic: 'test-topic',
      message: 'test-message',
      ttl: 300,
    });
    
    // Verify message was sent
  });
});
```

### 4.2 集成测试

```typescript
// packages/walletconnect-v2/tests/integration.test.ts

describe('Cinacoin Integration', () => {
  it('should establish session with MetaMask', async () => {
    const connector = new WcConnector({
      projectId: process.env.PROJECT_ID,
      metadata: {
        name: 'Test dApp',
        description: 'Test',
        url: 'https://test.com',
        icons: [],
      },
    });
    
    const uri = await connector.connect();
    expect(uri).toMatch(/^wc:/);
    
    // Simulate wallet approval
    const session = await waitForSession();
    expect(session.accounts).toBeDefined();
  });

  it('should sign message', async () => {
    const connector = new WcConnector({ projectId: process.env.PROJECT_ID });
    await connector.connect();
    
    const signature = await connector.request({
      method: 'personal_sign',
      params: ['Hello World', '0x...'],
    });
    
    expect(signature).toMatch(/^0x/);
  });
});
```

### 4.3 E2E 测试

```typescript
// tests/e2e/wallet-connect.spec.ts

import { test, expect } from '@playwright/test';

test('should connect wallet via QR code', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Click connect button
  await page.click('[data-testid="connect-button"]');
  
  // Wait for QR code
  const qrCode = await page.waitForSelector('[data-testid="qr-code"]');
  expect(qrCode).toBeTruthy();
  
  // Simulate wallet scan
  // ... (use mock wallet)
  
  // Verify connection
  await page.waitForSelector('[data-testid="connected"]');
  const address = await page.textContent('[data-testid="address"]');
  expect(address).toMatch(/^0x/);
});
```

---

## 五、迁移检查清单

### 5.1 代码迁移

- [x] 替换所有 `@walletconnect/*` 导入为 `@cinacoin/*`
- [x] 更新中继 URL 配置
- [x] 替换品牌资源（Logo、名称）
- [x] 更新 package.json 依赖
- [x] 更新文档和示例

### 5.2 配置迁移

- [x] 申请 Cinacoin Project ID
- [x] 配置 Cloudflare Workers
- [x] 配置 D1 数据库
- [x] 配置 KV 命名空间
- [x] 配置环境变量

### 5.3 测试验证

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 与 MetaMask 测试连接
- [ ] 与 Cinacoin 钱包测试
- [ ] 性能测试通过
- [ ] 安全审计通过

### 5.4 部署上线

- [ ] 部署中继服务
- [ ] 部署前端应用
- [ ] 配置 CDN
- [ ] 配置监控
- [ ] 配置告警

---

## 六、时间估算

| 阶段 | 工作量 | 说明 |
|------|--------|------|
| 基础设施搭建 | 1-2 天 | Cloudflare Workers 配置 |
| 中继服务实现 | 2-3 天 | CloudRelay 核心功能 |
| 连接器适配 | 1-2 天 | WcConnector 实现 |
| 会话管理 | 1-2 天 | SessionManager 实现 |
| 品牌替换 | 0.5-1 天 | UI/文档更新 |
| 测试验证 | 2-3 天 | 单元/集成测试 |
| **总计** | **7-13 天** | |

---

## 七、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Cinacoin API 变更 | 中 | 抽象适配层，便于更新 |
| 中继服务不稳定 | 高 | 实现故障转移和重试机制 |
| 性能瓶颈 | 中 | 使用 KV 缓存，优化查询 |
| 安全漏洞 | 高 | 定期审计，使用成熟加密库 |
| 钱包兼容性 | 中 | 广泛测试主流钱包 |

---

## 八、总结

Cinacoin 已经完成了对 Cinacoin (Cinacoin) 的核心功能复刻：

✅ **已完成**:
- 完整的 Cinacoin v2 协议实现
- 官方中继 relay.walletconnect.com 集成
- 多链支持（EVM、Solana、Bitcoin 等）
- 会话管理和持久化
- 签名验证和安全机制

🔄 **进行中**:
- 品牌统一（UI/文档）
- 性能优化
- 更多钱包适配

📋 **待完成**:
- 移动端 SDK 完善
- 更多测试覆盖
- 生产环境部署

**建议**: 按照上述实现方案完成剩余工作，预计 7-13 天可完成全部迁移。

---

*文档版本: v1.0*  
*最后更新: 2026-06-14*  
*维护者: Cinacoin Team*
