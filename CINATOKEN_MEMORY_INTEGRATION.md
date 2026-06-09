# 🪙 CinaToken 记忆系统整合方案

> **版本**: v1.0  
> **日期**: 2026-04-04  
> **作者**: 000 (海内集团零号助理)  
> **状态**: 推荐方案

---

## 📋 目录

1. [项目背景](#1-项目背景)
2. [整合目标](#2-整合目标)
3. [架构设计](#3-架构设计)
4. [核心功能模块](#4-核心功能模块)
5. [实施路线图](#5-实施路线图)
6. [技术实现细节](#6-技术实现细节)
7. [部署方案](#7-部署方案)
8. [安全与合规](#8-安全与合规)

---

## 1. 项目背景

### 1.1 CinaToken 生态

**CinaToken** 是海内集团基于 Cosmos SDK 构建的区块链生态，包含：

| 组件 | 说明 | 状态 |
|------|------|------|
| **Cina Chain** | 公链基础设施 | ✅ 运行中 |
| **CinaToken** | 原生代币 (CINATOKEN) | ✅ 已发行 |
| **CinaSeek** | Ubuntu VM 管理工具 | 🚧 开发中 |
| **CinaName** | .cina 域名系统 | ✅ 已部署 |

### 1.2 整合动机

将 OpenClaw 记忆系统整合进 CinaToken 生态，实现：

- 🧠 **用户记忆资产化** - 记忆作为链上资产
- 🔐 **去中心化身份** - 基于 CinaName 的用户画像
- 💡 **智能推荐** - 基于记忆的行为分析
- 📊 **数据主权** - 用户完全控制自己的记忆数据

---

## 2. 整合目标

### 2.1 核心目标 (P0)

| 目标 | 说明 | 成功指标 |
|------|------|----------|
| **用户记忆隔离** | 每个 CinaToken 地址拥有独立记忆空间 | 隔离率 100% |
| **会话持久化** | WebShell 会话自动保存 | 保存率 >99% |
| **CinaName 集成** | 域名绑定用户画像 | 支持 alice.cina |
| **OAuth 认证** | CinaToken 钱包登录 | 支持 Keplr 钱包 |

### 2.2 扩展目标 (P1)

| 目标 | 说明 | 成功指标 |
|------|------|----------|
| **记忆 NFT 化** | 重要记忆铸造为 NFT | 支持 ERC-721 标准 |
| **跨链记忆** | IBC 传输记忆数据 | 支持 Cosmos 生态 |
| **智能合约调用** | 记忆触发链上操作 | 支持自动化 |
| **治理集成** | 记忆数据参与 DAO 治理 | 投票权重计算 |

---

## 3. 架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户层                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Keplr 钱包  │  │  CinaSeek Web │  │  移动 App    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CinaToken Backend (Go)                        │
│  ┌─────────────────────────────────────────────────┐            │
│  │              Auth Layer                          │            │
│  │  - CinaToken OAuth  - CinaName 解析  - JWT 签发   │            │
│  └─────────────────────────────────────────────────┘            │
│  ┌─────────────────────────────────────────────────┐            │
│  │              Memory Service                      │            │
│  │  - 记忆存储/检索  - 热度管理  - 通知调度          │            │
│  └─────────────────────────────────────────────────┘            │
│  ┌─────────────────────────────────────────────────┐            │
│  │              Blockchain Service                  │            │
│  │  - 记忆哈希上链  - NFT 铸造  - IBC 传输           │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      存储层                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ PostgreSQL  │  │ 文件系统     │  │ Redis 缓存   │              │
│  │ (元数据)    │  (记忆内容)     │  (热度缓存)     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Cina Chain                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  cinaname   │  │  cw-memory  │  │  cw-nft     │              │
│  │  域名合约    │  │  记忆合约    │  │  NFT 合约    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 数据流

```
1. 用户登录
   Keplr 钱包签名 → Backend 验证 → 生成 JWT → 注入用户上下文

2. 记忆写入
   用户操作 → Memory Service → 文件系统存储 → PostgreSQL 元数据 → Redis 热度

3. 记忆检索
   搜索请求 → Redis 缓存检查 → PostgreSQL 查询 → 文件系统读取 → 返回结果

4. 链上锚定
   记忆创建 → 计算哈希 → 调用智能合约 → 交易上链 → 返回 TX Hash
```

### 3.3 用户记忆空间结构

```
/data/memory-store/
├── {wallet_address}/
│   ├── workspace/
│   │   ├── MEMORY.md              # 长期记忆索引
│   │   ├── USER.md                # 用户信息 (绑定 CinaName)
│   │   ├── SOUL.md                # AI 人格配置
│   │   ├── memory/
│   │   │   ├── YYYY-MM-DD.md      # 每日日志
│   │   │   ├── longterm/          # 长期归档
│   │   │   ├── shortterm/         # 待审查
│   │   │   └── working/           # 临时任务
│   │   └── .memory-config.json    # 用户配置
│   └── memory-tdai/
│       ├── persona.md             # 用户画像
│       ├── scene_blocks/          # 场景记忆 (带热度)
│       ├── conversations/         # 对话记录
│       └── records/               # 事件记录
└── .index/
    └── wallet_to_user.json        # 钱包地址索引
```

---

## 4. 核心功能模块

### 4.1 认证模块 (Auth Service)

#### 4.1.1 CinaToken OAuth 流程

```go
// internal/auth/cinatoken_auth.go
type CinaTokenAuth struct {
    chainRPC      *chain.Client
    nameResolver  *cinaname.Resolver
    jwtSecret     []byte
}

// 钱包签名验证
func (a *CinaTokenAuth) VerifySignature(address, signature, message string) (*UserInfo, error) {
    // 1. 验证签名
    pubKey, err := crypto.RecoverPubKey([]byte(message), []byte(signature))
    if err != nil {
        return nil, ErrInvalidSignature
    }
    
    // 2. 验证地址匹配
    derivedAddr := sdk.AccAddress(pubKey).String()
    if derivedAddr != address {
        return nil, ErrAddressMismatch
    }
    
    // 3. 查询 CinaName (可选)
    cinaname, _ := a.nameResolver.ResolveByAddress(address)
    
    return &UserInfo{
        Address:  address,
        CinaName: cinaname,
        AuthTime: time.Now(),
    }, nil
}

// 生成 JWT
func (a *CinaTokenAuth) GenerateJWT(userInfo *UserInfo) (string, error) {
    claims := jwt.MapClaims{
        "sub":   userInfo.Address,
        "name":  userInfo.CinaName,
        "iat":   time.Now().Unix(),
        "exp":   time.Now().Add(24 * time.Hour).Unix(),
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(a.jwtSecret)
}
```

#### 4.1.2 中间件实现

```go
// internal/middleware/auth.go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{"code": 401, "msg": "缺少认证信息"})
            c.Abort()
            return
        }
        
        // 解析 JWT
        tokenString := strings.TrimPrefix(authHeader, "Bearer ")
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            return jwtSecret, nil
        })
        
        if err != nil || !token.Valid {
            c.JSON(401, gin.H{"code": 401, "msg": "Token 无效"})
            c.Abort()
            return
        }
        
        // 注入用户信息
        claims := token.Claims.(jwt.MapClaims)
        c.Set("userID", claims["sub"])
        c.Set("userCinaName", claims["name"])
        c.Next()
    }
}
```

### 4.2 记忆服务模块 (Memory Service)

#### 4.2.1 核心接口

```go
// internal/memory/service/memory_service.go
type MemoryService interface {
    // 用户空间管理
    InitUserSpace(walletAddr string) error
    GetUserSpace(walletAddr string) (string, error)
    
    // 记忆 CRUD
    SaveMemory(ctx context.Context, userID string, memory *Memory) error
    GetMemory(ctx context.Context, userID, memoryID string) (*Memory, error)
    DeleteMemory(ctx context.Context, userID, memoryID string) error
    
    // 搜索
    SearchMemories(ctx context.Context, userID, query string, limit int) ([]Memory, error)
    
    // 热度管理
    IncrementHeat(ctx context.Context, userID, memoryID string) error
    GetRanking(ctx context.Context, userID string, limit int64) ([]Memory, error)
    
    // 链上锚定
    AnchorToChain(ctx context.Context, userID, memoryID string) (string, error)
}
```

#### 4.2.2 记忆数据模型

```go
// internal/memory/model/memory.go
type MemoryType string

const (
    MemoryTypeUser      MemoryType = "user"       // 用户画像
    MemoryTypeFeedback  MemoryType = "feedback"   // 指导反馈
    MemoryTypeProject   MemoryType = "project"    // 项目动态
    MemoryTypeReference MemoryType = "reference"  // 外部指针
    MemoryTypeSession   MemoryType = "session"    // 会话状态
)

type Memory struct {
    ID          string     `json:"id"`
    UserID      string     `json:"user_id"`      // 钱包地址
    Type        MemoryType `json:"type"`
    Title       string     `json:"title"`
    Content     string     `json:"content"`
    FilePath    string     `json:"file_path"`
    FileHash    string     `json:"file_hash"`    // SHA-256
    ChainTxHash string     `json:"chain_tx_hash"` // 链上交易哈希
    Heat        int64      `json:"heat"`
    Metadata    JSONMap    `json:"metadata,omitempty"`
    CreatedAt   time.Time  `json:"created_at"`
    UpdatedAt   time.Time  `json:"updated_at"`
}

// 热度评分计算
func (m *Memory) CalculateHeat() int64 {
    baseHeat := m.Heat
    
    // 时间衰减 (每 7 天减半)
    age := time.Since(m.CreatedAt)
    decayFactor := math.Pow(0.5, float64(age.Hours())/(24*7))
    
    // 类型权重
    typeWeight := map[MemoryType]float64{
        MemoryTypeUser:     1.5,
        MemoryTypeFeedback: 1.3,
        MemoryTypeProject:  1.2,
        MemoryTypeSession:  1.0,
    }
    
    return int64(float64(baseHeat) * decayFactor * typeWeight[m.Type])
}
```

### 4.3 区块链服务模块 (Blockchain Service)

#### 4.3.1 记忆哈希上链

```go
// internal/blockchain/memory_anchor.go
type MemoryAnchor struct {
    chainClient *chain.Client
    contractAddr string
}

// 记忆上链
func (a *MemoryAnchor) Anchor(ctx context.Context, userID, memoryHash string) (string, error) {
    // 构建消息
    msg := &types.MsgAnchorMemory{
        Signer:     a.chainClient.GetAddress(),
        UserId:     userID,
        MemoryHash: memoryHash,
        Timestamp:  time.Now().Unix(),
    }
    
    // 发送交易
    txHash, err := a.chainClient.BroadcastTx(ctx, msg)
    if err != nil {
        return "", err
    }
    
    return txHash, nil
}

// 查询链上记录
func (a *MemoryAnchor) GetAnchor(ctx context.Context, userID, memoryHash string) (*AnchorRecord, error) {
    query := &types.QueryAnchorRequest{
        UserId:     userID,
        MemoryHash: memoryHash,
    }
    
    return a.chainClient.QueryAnchor(ctx, query)
}
```

#### 4.3.2 记忆 NFT 铸造

```go
// internal/blockchain/nft_mint.go
type NFTMinter struct {
    chainClient *chain.Client
    nftContract string
}

// 铸造记忆 NFT
func (m *NFTMinter) MintMemoryNFT(ctx context.Context, userID, memoryID, metadataURI string) (string, error) {
    msg := &nfttypes.MsgMint{
        Sender: m.chainClient.GetAddress(),
        Owner:  userID,
        TokenId: fmt.Sprintf("memory-%s", memoryID),
        Uri:    metadataURI,
    }
    
    txHash, err := m.chainClient.BroadcastTx(ctx, msg)
    if err != nil {
        return "", err
    }
    
    return txHash, nil
}
```

### 4.4 CinaName 集成

#### 4.4.1 域名解析用户画像

```go
// internal/cinaname/resolver.go
type NameResolver struct {
    chainClient *chain.Client
}

// 通过域名查询用户画像
func (r *NameResolver) GetPersonaByCinaName(cinaName string) (*Persona, error) {
    // 解析域名
    record, err := r.chainClient.ResolveName(cinaName + ".cina")
    if err != nil {
        return nil, err
    }
    
    // 查询关联的记忆空间
    personaPath := fmt.Sprintf("/data/memory-store/%s/memory-tdai/persona.md", record.Address)
    return r.loadPersona(personaPath)
}

// 通过地址查询域名
func (r *NameResolver) GetCinaNameByAddress(address string) (string, error) {
    names, err := r.chainClient.QueryNamesByOwner(address)
    if err != nil || len(names) == 0 {
        return "", ErrNoNameFound
    }
    
    return names[0], nil
}
```

---

## 5. 实施路线图

### 5.1 Phase 1: 基础架构 (Week 1-3)

| 任务 | 说明 | 交付物 |
|------|------|--------|
| **目录结构** | 创建 Memory Service 模块 | `internal/memory/` |
| **数据模型** | 定义 Memory 结构体 | `model/memory.go` |
| **存储库** | PostgreSQL + 文件系统 | `repository/memory_repo.go` |
| **API 接口** | RESTful API | `handler/memory.go` |
| **认证集成** | CinaToken OAuth | `middleware/auth.go` |

### 5.2 Phase 2: 区块链集成 (Week 3-5)

| 任务 | 说明 | 交付物 |
|------|------|--------|
| **智能合约** | 记忆锚定合约 | `contracts/cw-memory` |
| **上链服务** | 哈希上链功能 | `blockchain/memory_anchor.go` |
| **NFT 合约** | 记忆 NFT 标准 | `contracts/cw-nft` |
| **IBC 配置** | 跨链传输 | `ibc/memory_transfer.go` |

### 5.3 Phase 3: 前端集成 (Week 5-7)

| 任务 | 说明 | 交付物 |
|------|------|--------|
| **钱包连接** | Keplr 钱包集成 | `frontend/src/wallet/` |
| **记忆列表** | 记忆管理页面 | `views/memory/MemoryList.vue` |
| **搜索界面** | 全文搜索 UI | `views/memory/MemorySearch.vue` |
| **NFT 展示** | 记忆 NFT 画廊 | `views/memory/NFTGallery.vue` |

### 5.4 Phase 4: 自动化与优化 (Week 7-8)

| 任务 | 说明 | 交付物 |
|------|------|--------|
| **Cron 任务** | 定时备份/热度衰减 | `memory/cron.go` |
| **缓存优化** | Redis 缓存策略 | `cache/heat_cache.go` |
| **监控告警** | Prometheus + Grafana | `deploy/monitoring/` |
| **性能测试** | 负载测试报告 | `test/performance/` |

---

## 6. 技术实现细节

### 6.1 数据库 Schema

```sql
-- 创建 Schema
CREATE SCHEMA IF NOT EXISTS cinatoken;

-- 记忆元数据表
CREATE TABLE cinatoken.memories (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,          -- 钱包地址
    type VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    file_path VARCHAR(512) NOT NULL,
    file_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256
    chain_tx_hash VARCHAR(64),             -- 链上交易哈希
    heat INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_user_type (user_id, type),
    INDEX idx_user_heat (user_id, heat DESC),
    INDEX idx_user_created (user_id, created_at DESC)
);

-- 记忆操作日志表
CREATE TABLE cinatoken.memory_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    memory_id INTEGER REFERENCES cinatoken.memories(id),
    action VARCHAR(32) NOT NULL,
    metadata JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户配置表
CREATE TABLE cinatoken.memory_configs (
    user_id VARCHAR(64) PRIMARY KEY,
    enabled BOOLEAN DEFAULT true,
    backup_enabled BOOLEAN DEFAULT true,
    notify_enabled BOOLEAN DEFAULT true,
    chain_anchor_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '23:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CinaName 绑定表
CREATE TABLE cinatoken.cinaname_bindings (
    wallet_address VARCHAR(64) PRIMARY KEY,
    cinaname VARCHAR(64) UNIQUE,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 全文搜索索引
ALTER TABLE cinatoken.memories ADD COLUMN search_vector tsvector;
CREATE INDEX idx_memories_search ON cinatoken.memories USING GIN(search_vector);

-- 触发器：自动更新 search_vector
CREATE TRIGGER update_search_vector
    BEFORE INSERT OR UPDATE ON cinatoken.memories
    FOR EACH ROW
    EXECUTE FUNCTION tsvector_update_trigger(
        search_vector,
        'pg_catalog.simple',
        title, content
    );
```

### 6.2 API 设计

#### 记忆管理 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/memory/list` | 获取记忆列表 | ✅ |
| GET | `/api/v1/memory/:id` | 获取单条记忆 | ✅ |
| POST | `/api/v1/memory` | 创建记忆 | ✅ |
| PUT | `/api/v1/memory/:id` | 更新记忆 | ✅ |
| DELETE | `/api/v1/memory/:id` | 删除记忆 | ✅ |
| POST | `/api/v1/memory/search` | 搜索记忆 | ✅ |
| GET | `/api/v1/memory/ranking` | 热度排名 | ✅ |
| POST | `/api/v1/memory/:id/anchor` | 链上锚定 | ✅ |

#### 请求/响应示例

```json
// POST /api/v1/memory
// Request
{
  "type": "session",
  "title": "WebShell 会话 - 2026-04-04",
  "content": "...",
  "metadata": {
    "session_id": "abc123",
    "duration": 3600
  }
}

// Response
{
  "code": 0,
  "data": {
    "id": "mem_abc123",
    "user_id": "cosmos1psvqlxd0e4zfxhqmuhg3venykrrmzlf5qz0rrp",
    "type": "session",
    "title": "WebShell 会话 - 2026-04-04",
    "file_path": "/data/memory-store/cosmos1.../workspace/memory/2026-04-04.md",
    "file_hash": "sha256:...",
    "created_at": "2026-04-04T04:00:00Z"
  }
}
```

### 6.3 Redis 缓存设计

```
# 热度缓存
memory:heat:{user_id}:{memory_id} -> score (integer)

# 排名缓存 (Sorted Set)
memory:rank:{user_id} -> [(memory_id, score), ...]

# 会话缓存
memory:session:{user_id} -> JSON (当前活跃会话)

# 配置缓存
memory:config:{user_id} -> JSON (用户配置)

# 过期策略
- 热度缓存：24 小时
- 排名缓存：1 小时
- 会话缓存：30 分钟
- 配置缓存：永久 (手动失效)
```

### 6.4 智能合约 (CosmWasm)

```rust
// contracts/cw-memory/src/contract.rs
use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response, StdResult};
use cw_storage_plus::Map;

// 记忆锚定记录
pub const ANCHORS: Map<(&str, &str), AnchorRecord> = Map::new("anchors");

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct AnchorRecord {
    pub user_id: String,
    pub memory_hash: String,
    pub timestamp: u64,
    pub tx_hash: String,
}

#[entry_point]
pub fn execute_anchor(deps: DepsMut, env: Env, info: MessageInfo, user_id: String, memory_hash: String) -> StdResult<Response> {
    let record = AnchorRecord {
        user_id: user_id.clone(),
        memory_hash: memory_hash.clone(),
        timestamp: env.block.time.seconds(),
        tx_hash: info.sender.to_string(),
    };
    
    ANCHORS.save(deps.storage, (&user_id, &memory_hash), &record)?;
    
    Ok(Response::new()
        .add_attribute("action", "anchor_memory")
        .add_attribute("user_id", user_id)
        .add_attribute("memory_hash", memory_hash))
}

#[entry_point]
pub fn query_anchor(deps: Deps, user_id: String, memory_hash: String) -> StdResult<AnchorRecord> {
    ANCHORS.load(deps.storage, (&user_id, &memory_hash))
}
```

---

## 7. 部署方案

### 7.1 Docker Compose

```yaml
# deploy/docker-compose.yml
version: '3.8'

services:
  backend:
    image: cinagroup/cinatoken:latest
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    volumes:
      - memory-store:/data/memory-store
      - ./config:/app/config
    environment:
      - DATABASE_URL=postgres://cinatoken:${DB_PASSWORD}@postgres:5432/cinatoken?sslmode=disable
      - REDIS_URL=redis://redis:6379
      - CHAIN_RPC_URL=http://chain-rpc:26657
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=cinatoken
      - POSTGRES_USER=cinatoken
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

  chain-rpc:
    image: cinagroup/cina-chain:latest
    ports:
      - "26657:26657"
      - "26656:26656"
    volumes:
      - chain-data:/root/.cina

volumes:
  memory-store:
  postgres-data:
  redis-data:
  chain-data:
```

### 7.2 Kubernetes 部署

```yaml
# deploy/k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cinatoken-backend
  namespace: cinatoken
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cinatoken-backend
  template:
    metadata:
      labels:
        app: cinatoken-backend
    spec:
      containers:
      - name: backend
        image: cinagroup/cinatoken:v1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: cinatoken-secret
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: cinatoken-secret
              key: jwt-secret
        volumeMounts:
        - name: memory-store
          mountPath: /data/memory-store
      volumes:
      - name: memory-store
        persistentVolumeClaim:
          claimName: memory-store-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: cinatoken-backend
  namespace: cinatoken
spec:
  selector:
    app: cinatoken-backend
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cinatoken-ingress
  namespace: cinatoken
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.cinatoken.com
    secretName: cinatoken-tls
  rules:
  - host: api.cinatoken.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: cinatoken-backend
            port:
              number: 80
```

### 7.3 CronJob 配置

```yaml
# deploy/k8s/cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: memory-backup
  namespace: cinatoken
spec:
  schedule: "0 2 * * *"  # 每日 02:00
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: cinagroup/cinatoken:v1.0.0
            command:
            - /app/cinatoken
            - memory-backup
            env:
            - name: BACKUP_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: cinatoken-secret
                  key: backup-password
          restartPolicy: OnFailure
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: memory-heat-decay
  namespace: cinatoken
spec:
  schedule: "0 3 * * 0"  # 每周日 03:00
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: decay
            image: cinagroup/cinatoken:v1.0.0
            command:
            - /app/cinatoken
            - memory-heat-decay
          restartPolicy: OnFailure
```

---

## 8. 安全与合规

### 8.1 数据安全

| 措施 | 说明 |
|------|------|
| **加密存储** | 记忆文件 AES-256 加密 |
| **传输加密** | HTTPS + TLS 1.3 |
| **访问控制** | JWT + RBAC |
| **审计日志** | 所有操作记录到 memory_logs |
| **备份加密** | 备份文件使用独立密钥 |

### 8.2 隐私保护

| 措施 | 说明 |
|------|------|
| **数据隔离** | 每用户独立存储空间 |
| **匿名化** | 仅使用钱包地址标识 |
| **用户控制** | 用户可随时删除记忆 |
| **最小化收集** | 仅收集必要元数据 |
| **合规审计** | 定期安全审计 |

### 8.3 智能合约安全

| 措施 | 说明 |
|------|------|
| **代码审计** | 第三方安全审计 |
| **形式验证** | 关键逻辑形式化验证 |
| **漏洞赏金** | 设立漏洞赏金计划 |
| **升级机制** | 可升级合约模式 |
| **紧急暂停** | 紧急情况下暂停合约 |

---

## 附录

### A. 现有技能复用

| 技能 | 位置 | 复用方式 |
|------|------|----------|
| 记忆系统 v3.1.0 | `~/.npm-global/lib/node_modules/openclaw/skills/memory-system/` | 脚本直接调用 |
| CinaName 模块 | `/home/cina/.openclaw/workspace/cina/x/cinaname/` | 区块链集成 |
| CinaToken 配置 | `/home/cina/.cina/config/` | 链配置 |

### B. 配置模板

**后端配置** (`config/memory.yaml`):
```yaml
memory:
  store_path: /data/memory-store
  redis_addr: redis:6379
  database_url: postgres://cinatoken:xxx@postgres:5432/cinatoken
  
  backup:
    enabled: true
    schedule: "0 2 * * *"
    retention_days: 30
    
  notify:
    enabled: true
    channels:
      - wechat
      - email
      
  chain:
    enabled: true
    rpc_url: http://chain-rpc:26657
    contract_addr: cosmos1xxx
```

### C. 快速命令参考

```bash
# 后端开发
cd backend
go mod tidy
go build -o bin/cinatoken cmd/main.go
go test ./internal/memory/...

# 数据库迁移
psql -h localhost -U cinatoken -d cinatoken -f deploy/migrations/001_memory_schema.sql

# 部署
kubectl apply -f deploy/k8s/
kubectl rollout restart deployment/cinatoken-backend

# 监控
kubectl logs -f deployment/cinatoken-backend
kubectl top pods -n cinatoken
```

---

*文档版本：v1.0 | 最后更新：2026-04-04 | 状态：推荐方案*
