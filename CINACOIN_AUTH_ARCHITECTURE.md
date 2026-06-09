# Cinacoin 统一身份验证系统架构

> **Version**: 1.0.0  
> **Date**: 2026-06-08  
> **Author**: 000 (Cinacoin AI Assistant)  
> **Status**: Design Proposal

---

## 目录

1. [概述](#1-概述)
2. [系统架构](#2-系统架构)
3. [认证流程](#3-认证流程)
4. [安全机制](#4-安全机制)
5. [用户管理功能](#5-用户管理功能)
6. [权限模型 (RBAC)](#6-权限模型-rbac)
7. [集成方案](#7-集成方案)
8. [部署架构](#8-部署架构)
9. [监控与可观测性](#9-监控与可观测性)
10. [附录](#10-附录)

---

## 1. 概述

### 1.1 背景

Cinacoin 生态系统包含 7 个核心应用，部署在 Cloudflare Pages/Workers 和 Vercel 上：

| # | 应用 | URL | 部署平台 | 认证需求 |
|---|------|-----|----------|----------|
| 1 | Website | cinacoin.com | Vercel | 可选（文档/博客订阅） |
| 2 | Cloud Dashboard | cloud.cinacoin.com | Cloudflare Pages | 完整认证 + RBAC |
| 3 | Backend Dashboard | dash.cinacoin.com | Cloudflare Pages | 完整认证 + Admin |
| 4 | Analytics Dashboard | analytics.cinacoin.com | Cloudflare Pages | 只读/管理员 |
| 5 | Wallet Explorer | wallet.cinacoin.com | Cloudflare Pages | 可选（收藏/标注） |
| 6 | Demo | demo.cinacoin.com | Vercel | Wallet 连接（SIWE） |
| 7 | Health Status | status.cinacoin.com | Cloudflare Pages | 管理员（状态更新） |

### 1.2 设计目标

- **统一身份**: 一个账户访问所有 Cinacoin 应用
- **安全第一**: JWT + OAuth 2.0 + MFA + Passkey
- **渐进式迁移**: 不中断现有服务，逐步切换
- **高性能**: P99 < 50ms 认证验证
- **可扩展**: 支持未来应用快速接入

### 1.3 技术栈

| 组件 | 技术选型 | 理由 |
|------|----------|------|
| Auth Service | Node.js + Fastify (TypeScript) | 与 monorepo 技术栈一致 |
| 数据库 | PostgreSQL 16 | 成熟、可靠、JSON 支持 |
| 缓存 | Redis 7 (Valkey) | Session/Token 缓存、Rate Limiting |
| Token | JWT (RS256) | 非对称签名，服务间验证无需回调 |
| OAuth Provider | 自建 Authorization Server | 完全控制，兼容 OIDC |
| 部署 | Cloudflare Workers (边缘) + 中心节点 | 边缘验证 + 中心管理 |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Applications                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Website  │ │  Cloud   │ │ Backend  │ │ Analytics│ ...           │
│  │          │ │Dashboard │ │Dashboard │ │Dashboard │              │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘              │
│       │            │            │            │                      │
│       └────────────┴─────┬──────┴────────────┘                      │
│                          │                                          │
│                   ┌──────┴──────┐                                   │
│                   │ Auth SDK    │  @cinacoin/auth-sdk               │
│                   │ (Client)    │  Token管理/自动刷新/登录UI         │
│                   └──────┬──────┘                                   │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  API Gateway │  Cloudflare Worker (边缘)
                    │  / Edge Auth │  JWT验证 / Rate Limit / CORS
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────┴──────┐ ┌──┴───┐ ┌─────┴─────┐
       │ Auth Service │ │ Token│ │  User     │
       │ (Core API)   │ │Service│ │  Service  │
       │              │ │      │ │           │
       │ - /auth/*    │ │- issue│ │- CRUD     │
       │ - /oauth/*   │ │- revoke│ │- profile  │
       │ - /mfa/*     │ │- refresh│ │- team     │
       └──────┬──────┘ └──┬───┘ └─────┬─────┘
              │            │           │
       ┌──────┴────────────┴───────────┴──────┐
       │           Data Layer                  │
       │  ┌────────────┐  ┌────────────────┐  │
       │  │ PostgreSQL  │  │    Redis       │  │
       │  │ (Primary)   │  │ (Cache/Session)│  │
       │  └────────────┘  └────────────────┘  │
       └──────────────────────────────────────┘
```

### 2.2 微服务划分

| 服务 | 职责 | 端口 | 部署 |
|------|------|------|------|
| `auth-gateway` | API 网关、JWT 边缘验证、Rate Limiting | 8080 | Cloudflare Worker |
| `auth-core` | 核心认证逻辑（登录/注册/Token 管理） | 3001 | Node.js 集群 |
| `auth-oauth` | OAuth 2.0 / OIDC Provider | 3002 | Node.js 集群 |
| `auth-user` | 用户 CRUD、Profile、Team 管理 | 3003 | Node.js 集群 |
| `auth-mfa` | MFA (TOTP/WebAuthn/Email) 管理 | 3004 | Node.js 集群 |
| `auth-session` | Session 管理、Token 黑名单 | 3005 | Node.js 集群 |

### 2.3 Monorepo 集成

```
onux/
├── apps/
│   ├── auth-service/          # 新增：Auth 后端服务
│   │   ├── src/
│   │   │   ├── gateway/       # API Gateway (CF Worker)
│   │   │   ├── core/          # 核心认证
│   │   │   ├── oauth/         # OAuth Provider
│   │   │   ├── user/          # 用户管理
│   │   │   ├── mfa/           # MFA 模块
│   │   │   └── session/       # Session 管理
│   │   ├── migrations/        # DB Migrations
│   │   └── cloudflare/        # CF Worker 部署
│   └── ... (existing apps)
├── packages/
│   ├── auth-sdk/              # 新增：客户端 SDK
│   ├── auth-types/            # 新增：共享类型定义
│   └── ... (existing packages)
```

---

## 3. 认证流程

### 3.1 邮箱/密码认证

```
┌────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│ Client │         │ Gateway  │         │Auth Core │         │PostgreSQL│
└───┬────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
    │ POST /auth/login  │                    │                    │
    │ {email, password} │                    │                    │
    ├───────────────────>│                    │                    │
    │                    │ Rate limit check   │                    │
    │                    ├───────┐            │                    │
    │                    │       │            │                    │
    │                    │<──────┘            │                    │
    │                    │                    │                    │
    │                    │ Forward request    │                    │
    │                    ├───────────────────>│                    │
    │                    │                    │ Verify password    │
    │                    │                    ├───────────────────>│
    │                    │                    │<───────────────────│
    │                    │                    │                    │
    │                    │                    │ Check MFA          │
    │                    │                    │ (if enabled)       │
    │                    │                    │                    │
    │                    │                    │ Generate tokens    │
    │                    │                    │ - access_token(JWT)│
    │                    │                    │ - refresh_token    │
    │                    │                    │                    │
    │                    │<───────────────────│                    │
    │<───────────────────│                    │                    │
    │ {access_token,     │                    │                    │
    │  refresh_token,    │                    │                    │
    │  expires_in}       │                    │                    │
```

### 3.2 OAuth 2.0 Authorization Code Flow

```
Client App              Auth Service              Resource
    │                        │                       │
    │ 1. Redirect to         │                       │
    │    /oauth/authorize    │                       │
    │    ?client_id=xxx      │                       │
    │    &redirect_uri=xxx   │                       │
    │    &response_type=code │                       │
    │    &scope=openid       │                       │
    │    &state=random       │                       │
    │───────────────────────>│                       │
    │                        │                       │
    │ 2. User authenticates  │                       │
    │    (login/MFA)         │                       │
    │<───────────────────────│                       │
    │                        │                       │
    │ 3. Consent screen      │                       │
    │<───────────────────────│                       │
    │                        │                       │
    │ 4. Redirect back with  │                       │
    │    ?code=xxx&state=xxx │                       │
    │───────────────────────>│                       │
    │                        │                       │
    │ 5. Exchange code for   │                       │
    │    tokens (back-channel)                       │
    │    POST /oauth/token   │                       │
    │    {grant_type=        │                       │
    │     authorization_code}│                       │
    ├───────────────────────>│                       │
    │                        │                       │
    │ 6. {access_token,      │                       │
    │     refresh_token,     │                       │
    │     id_token}          │                       │
    │<───────────────────────│                       │
```

### 3.3 Web3 钱包认证 (SIWE)

```
Client App              Auth Service              Blockchain
    │                        │                       │
    │ 1. GET /auth/nonce     │                       │
    ├───────────────────────>│                       │
    │<───────────────────────│ {nonce}               │
    │                        │                       │
    │ 2. Sign SIWE message   │                       │
    │    with wallet         │                       │
    │                        │                       │
    │ 3. POST /auth/web3     │                       │
    │    {message, signature}│                       │
    ├───────────────────────>│                       │
    │                        │ 4. Verify signature   │
    │                        ├──────────────────────>│
    │                        │<──────────────────────│
    │                        │                       │
    │                        │ 5. Link/create user   │
    │                        │    issue tokens       │
    │<───────────────────────│                       │
    │ {tokens}               │                       │
```

### 3.4 Token 刷新流程

```
Client                  Auth Gateway              Auth Session            Redis
  │                          │                       │                    │
  │ Request (expired JWT)    │                       │                    │
  ├─────────────────────────>│                       │                    │
  │                          │ 401 + WWW-Authenticate│                    │
  │<─────────────────────────│                       │                    │
  │                          │                       │                    │
  │ POST /auth/refresh       │                       │                    │
  │ {refresh_token}          │                       │                    │
  ├─────────────────────────>│                       │                    │
  │                          │ Forward               │                    │
  │                          ├──────────────────────>│                    │
  │                          │                       │ Check blacklist    │
  │                          │                       ├───────────────────>│
  │                          │                       │<───────────────────│
  │                          │                       │                    │
  │                          │                       │ Rotate tokens      │
  │                          │                       │ (Refresh Token     │
  │                          │                       │  Rotation)         │
  │                          │<──────────────────────│                    │
  │<─────────────────────────│                       │                    │
  │ {new_access_token,       │                       │                    │
  │  new_refresh_token}      │                       │                    │
```

---

## 4. 安全机制

### 4.1 JWT Token 设计

**Access Token (JWT RS256)**
```json
{
  "sub": "usr_a1b2c3d4",
  "iss": "https://auth.cinacoin.com",
  "aud": ["cloud.cinacoin.com", "dash.cinacoin.com"],
  "exp": 1717862400,
  "iat": 1717858800,
  "jti": "tok_xyz789",
  "scope": "openid profile email",
  "roles": ["user"],
  "org_id": "org_x1y2z3",
  "mfa_verified": true,
  "amr": ["pwd", "otp"]
}
```

**Token 生命周期**
| Token | 有效期 | 存储位置 | 说明 |
|-------|--------|----------|------|
| Access Token | 15 min | Memory / httpOnly cookie | 短生命周期，减少泄露风险 |
| Refresh Token | 30 days | httpOnly Secure cookie | Token Rotation，使用即失效 |
| ID Token | 15 min | Memory | OIDC 用户信息 |

### 4.2 OAuth 2.0 安全配置

- **PKCE 强制**: 所有 client 必须使用 S256 code_challenge_method
- **State 参数**: 防止 CSRF，客户端生成随机 state
- **Redirect URI 严格匹配**: 预注册白名单，不支持通配符
- **Client 认证**: confidential clients 使用 client_secret_post
- **Scope 最小化**: 默认 scope = `openid profile email`

### 4.3 MFA (多因素认证)

| 方式 | 实现 | 安全级别 |
|------|------|----------|
| TOTP | RFC 6238 (Google Authenticator 兼容) | ⭐⭐⭐ |
| WebAuthn/Passkey | FIDO2 生物识别/硬件密钥 | ⭐⭐⭐⭐⭐ |
| Email OTP | 6位数字，5分钟过期 | ⭐⭐ |
| SMS OTP | 6位数字（备选） | ⭐⭐ |

**MFA 强制策略**
- Super Admin: 必须 MFA (WebAuthn 优先)
- Admin: 必须 MFA (任意方式)
- User: 推荐 MFA，访问敏感操作时要求
- Guest: 无 MFA

### 4.4 Rate Limiting

| 端点 | 限制 | 窗口 | 策略 |
|------|------|------|------|
| POST /auth/login | 5 次 | 1 min | IP + Email 组合 |
| POST /auth/register | 3 次 | 10 min | IP |
| POST /auth/refresh | 30 次 | 1 min | User ID |
| POST /auth/password-reset | 3 次 | 1 hour | Email |
| GET /oauth/authorize | 60 次 | 1 min | User ID |
| POST /oauth/token | 30 次 | 1 min | Client ID |
| 通用 API | 100 次 | 1 min | Access Token |

### 4.5 密码策略

- 最小长度: 12 字符
- 复杂度: 至少包含大写、小写、数字、特殊字符中的 3 种
- 泄露检查: 集成 Have I Been Pwned k-anonymity API
- 历史限制: 不能使用最近 12 次使用过的密码
- 加盐哈希: Argon2id (m=65536, t=3, p=4)

### 4.6 Session 安全

- **并发 Session 限制**: 最多 5 个活跃 Session
- **Session 绑定**: IP + User-Agent 指纹（宽松模式，仅告警不阻断）
- **异常检测**: 异地登录告警（地理距离 + 时间差）
- **自动登出**: 30 天无活动自动失效所有 Token

---

## 5. 用户管理功能

### 5.1 用户注册

**注册方式**
1. 邮箱 + 密码
2. OAuth 社交登录 (Google, GitHub, Discord)
3. Web3 钱包 (SIWE)
4. 邀请链接（团队邀请）

**注册流程**
```
1. 用户提交注册信息
2. 服务端验证 (邮箱格式、密码强度、重复检查)
3. 发送验证邮件 (含 6 位验证码 + 验证链接)
4. 用户验证邮箱
5. 创建用户记录 (status = active)
6. 分配默认角色 (user)
7. 创建默认个人 Organization
```

### 5.2 用户登录

**支持的登录方式**
- 邮箱 + 密码 (+ MFA if enabled)
- OAuth 社交 (Google / GitHub / Discord)
- Web3 钱包 (SIWE)
- Passkey (WebAuthn)
- Magic Link (邮箱无密码登录)

### 5.3 密码重置

```
1. 用户请求密码重置 → POST /auth/password-reset/request
2. 验证邮箱存在 → 发送重置链接 (有效期 15 分钟)
3. 用户点击链接 → 验证 token → 设置新密码
4. 所有现有 Session 失效 (安全考虑)
5. 发送密码变更通知邮件
```

### 5.4 账户恢复

- **恢复码**: 注册 MFA 时生成 10 个一次性恢复码
- **社交恢复**: 指定 3-5 个信任联系人（Shamir 秘密分享）
- **人工审核**: 最后手段，需提交身份证明

### 5.5 用户资料管理

| 功能 | 端点 | 说明 |
|------|------|------|
| 查看资料 | GET /users/me | 返回用户完整信息 |
| 更新资料 | PATCH /users/me | 更新姓名、头像、偏好 |
| 修改邮箱 | PUT /users/me/email | 需新旧邮箱双重验证 |
| 修改密码 | PUT /users/me/password | 需验证旧密码 |
| 删除账户 | DELETE /users/me | 30 天冷静期，软删除 |
| 导出资料 | POST /users/me/export | GDPR 数据可携带权 |

### 5.6 团队和成员管理

**Organization 模型**
```
Organization (团队/组织)
├── Members (成员)
│   ├── Owner (创建者，不可转让)
│   ├── Admin (管理成员、设置)
│   ├── Member (正常使用)
│   └── Viewer (只读)
├── Teams (子团队，可选)
│   └── Members (从 Organization 成员中选择)
├── Projects (项目)
│   └── 关联 Teams/Members
└── Settings
    ├── SSO 配置
    ├── MFA 策略
    └── 安全策略
```

---

## 6. 权限模型 (RBAC)

### 6.1 角色定义

#### 全局角色 (Global Roles)

| 角色 | 说明 | 权限范围 |
|------|------|----------|
| `super_admin` | 超级管理员 | 所有系统功能 + 用户管理 + 系统配置 |
| `admin` | 管理员 | 管理功能 + 用户审核 |
| `user` | 普通用户 | 标准用户功能 |
| `guest` | 访客 | 只读/有限访问 |

#### 应用角色 (App-specific Roles)

每个应用可以定义自己的角色，继承全局角色基础权限：

| 应用 | 角色 | 说明 |
|------|------|------|
| Cloud Dashboard | `project_admin`, `developer`, `viewer` | 项目级权限 |
| Backend Dashboard | `ops_admin`, `monitor` | 运维权限 |
| Analytics | `analyst`, `viewer` | 数据权限 |
| Wallet Explorer | `curator`, `viewer` | 标注权限 |
| Health Status | `status_manager` | 状态更新权限 |

### 6.2 权限定义

**权限格式**: `<resource>:<action>[:<qualifier>]`

```
# 用户管理
user:read
user:write
user:delete
user:impersonate

# 组织管理
org:read
org:write
org:delete
org:member:read
org:member:write
org:member:remove

# 项目管理
project:read
project:write
project:delete
project:api_key:manage

# 系统管理
system:config
system:audit_log:read
system:billing:manage

# 应用特定
analytics:report:read
analytics:report:export
wallet:curate
status:update
```

### 6.3 角色-权限映射

```
super_admin:
  inherits: [admin]
  permissions:
    - "system:*"
    - "user:impersonate"
    - "org:delete"

admin:
  inherits: [user]
  permissions:
    - "user:read"
    - "user:write"
    - "org:*"
    - "project:*"
    - "system:audit_log:read"

user:
  inherits: [guest]
  permissions:
    - "user:read:self"
    - "user:write:self"
    - "project:read:own"
    - "project:write:own"
    - "project:delete:own"

guest:
  permissions:
    - "user:read:self"
    - "project:read:shared"
```

### 6.4 权限继承和覆盖规则

1. **继承原则**: 高级角色自动继承低级角色的所有权限
2. **累加原则**: 一个用户可以拥有多个角色，权限取并集
3. **显式拒绝优先**: 如果有显式 deny 规则，即使其他角色允许也拒绝
4. **资源级限定**: 权限可以限定到具体资源 (`project:read:own` 只能读自己的项目)
5. **应用隔离**: 应用角色权限只在对应应用内生效
6. **时间限定**: 权限可以设置有效期 (临时权限提升)

### 6.5 权限检查流程

```typescript
// 伪代码
async function checkPermission(userId: string, permission: string, resourceId?: string): Promise<boolean> {
  // 1. 从缓存获取用户权限集
  const userPerms = await getUserPermissions(userId);
  
  // 2. 检查显式拒绝
  if (userPerms.denies.includes(permission)) return false;
  
  // 3. 检查精确匹配
  if (userPerms.allows.includes(permission)) return true;
  
  // 4. 检查通配符匹配 (system:* matches system:config)
  const [resource, action] = permission.split(':');
  if (userPerms.allows.includes(`${resource}:*`)) return true;
  if (userPerms.allows.includes(`*:*`)) return true;
  
  // 5. 检查资源级权限
  if (resourceId) {
    const resourceOwner = await getResourceOwner(resourceId);
    if (userPerms.allows.includes(`${permission}:own`) && resourceOwner === userId) return true;
  }
  
  return false;
}
```

---

## 7. 集成方案

### 7.1 客户端 SDK (@cinacoin/auth-sdk)

```typescript
import { createAuthClient } from '@cinacoin/auth-sdk';

const auth = createAuthClient({
  authDomain: 'https://auth.cinacoin.com',
  clientId: 'cloud-dashboard',
  redirectUri: 'https://cloud.cinacoin.com/callback',
  scopes: ['openid', 'profile', 'email'],
});

// 登录
await auth.loginWithRedirect();

// 获取用户
const user = await auth.getUser();

// Token 管理 (自动刷新)
const token = await auth.getAccessToken();

// 权限检查
if (auth.hasPermission('project:write')) {
  // show edit button
}

// 登出
await auth.logout();
```

### 7.2 服务端中间件

```typescript
import { createAuthMiddleware } from '@cinacoin/auth-sdk/server';

// Fastify/Express 中间件
const authMiddleware = createAuthMiddleware({
  authDomain: 'https://auth.cinacoin.com',
  audience: 'https://cloud.cinacoin.com',
  algorithms: ['RS256'],
});

// 使用
app.get('/api/projects', authMiddleware({ requiredScope: 'project:read' }), handler);
app.delete('/api/projects/:id', authMiddleware({ requiredPermission: 'project:delete' }), handler);
```

### 7.3 各应用集成策略

| 应用 | 集成方式 | 优先级 | 复杂度 |
|------|----------|--------|--------|
| Cloud Dashboard | Full OAuth + SDK | P0 | 高 |
| Backend Dashboard | Full OAuth + SDK | P0 | 高 |
| Analytics Dashboard | OAuth (read-only scope) | P1 | 中 |
| Wallet Explorer | Optional auth + SDK | P2 | 低 |
| Website | Optional (newsletter/login) | P2 | 低 |
| Demo | SIWE only (existing) | P3 | 低 |
| Health Status | Admin-only OAuth | P2 | 低 |

### 7.4 渐进式迁移计划

**Phase 0: 并行运行 (Week 1-2)**
- Auth Service 部署到 staging
- 新注册走 Auth Service
- 现有用户数据迁移脚本准备

**Phase 1: 新系统优先 (Week 3-4)**
- Cloud Dashboard 切换到 Auth Service
- 旧认证系统保留为 fallback
- 双写 Session（新旧系统同步）

**Phase 2: 逐步切换 (Week 5-8)**
- Backend Dashboard、Analytics 切换
- Wallet Explorer、Website 可选登录
- Health Status 切换

**Phase 3: 旧系统下线 (Week 9-10)**
- 移除旧认证代码
- 数据迁移完成确认
- 旧 Session 全部失效

### 7.5 回滚和兼容性

- **双写机制**: 迁移期间，认证事件同时写入新旧系统
- **Feature Flag**: 通过环境变量控制使用新/旧认证
- **回滚步骤**:
  1. 切换 Feature Flag 回旧系统
  2. 用户无感知（Session 在旧系统有效）
  3. 排查问题后重新切换
- **数据兼容**: 用户 ID 映射表（旧 ID ↔ 新 ID）保留 6 个月

---

## 8. 部署架构

### 8.1 生产环境

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ auth-gateway Worker                                   │   │
│  │ - JWT 验证 (JWKS 缓存)                               │   │
│  │ - Rate Limiting (KV counter)                         │   │
│  │ - CORS handling                                      │   │
│  │ - Request routing                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Origin Server (K8s / Docker)               │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ auth-core  │  │ auth-oauth │  │ auth-user  │  ...        │
│  │ (2 pods)   │  │ (2 pods)   │  │ (2 pods)   │             │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘             │
│        │               │               │                     │
│  ┌─────┴───────────────┴───────────────┴──────┐             │
│  │              Internal Network               │             │
│  └─────┬───────────────┬──────────────────────┘             │
│        │               │                                     │
│  ┌─────┴──────┐  ┌─────┴──────┐                             │
│  │ PostgreSQL  │  │   Redis    │                             │
│  │ (Primary +  │  │ (Sentinel) │                             │
│  │  Replica)   │  │            │                             │
│  └────────────┘  └────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 环境配置

| 环境 | 域名 | 用途 |
|------|------|------|
| Production | auth.cinacoin.com | 生产环境 |
| Staging | auth-staging.cinacoin.com | 预发布测试 |
| Development | localhost:3001 | 本地开发 |

### 8.3 JWKS 端点

```
GET https://auth.cinacoin.com/.well-known/jwks.json
GET https://auth.cinacoin.com/.well-known/openid-configuration
```

边缘 Worker 缓存 JWKS (TTL: 1h)，Token 验证无需回调中心服务。

---

## 9. 监控与可观测性

### 9.1 关键指标

| 指标 | 类型 | 告警阈值 |
|------|------|----------|
| auth.login.success | Counter | - |
| auth.login.failure | Counter | > 100/min |
| auth.login.latency_p99 | Histogram | > 500ms |
| auth.token.issue | Counter | - |
| auth.token.refresh | Counter | - |
| auth.token.revoked | Counter | > 50/min (异常) |
| auth.mfa.challenge | Counter | - |
| auth.register.success | Counter | - |
| auth.oauth.consent | Counter | - |
| auth.session.active | Gauge | - |

### 9.2 审计日志

所有认证事件记录审计日志：
```json
{
  "event": "user.login",
  "user_id": "usr_a1b2c3d4",
  "ip": "1.2.3.4",
  "user_agent": "Mozilla/5.0...",
  "method": "password",
  "mfa_used": true,
  "success": true,
  "timestamp": "2026-06-08T14:00:00Z",
  "request_id": "req_xyz789"
}
```

### 9.3 健康检查

```
GET /health          → 服务存活
GET /health/ready    → 就绪（DB + Redis 连接）
GET /health/deep     → 深度检查（DB query + Redis ping + JWKS 可用）
```

---

## 10. 附录

### 10.1 错误码定义

| 错误码 | HTTP Status | 说明 |
|--------|-------------|------|
| AUTH_001 | 400 | 请求参数无效 |
| AUTH_002 | 401 | 认证失败（密码错误） |
| AUTH_003 | 401 | Token 过期 |
| AUTH_004 | 401 | Token 无效 |
| AUTH_005 | 401 | Token 已撤销 |
| AUTH_006 | 403 | 权限不足 |
| AUTH_007 | 403 | 账户已禁用 |
| AUTH_008 | 403 | 邮箱未验证 |
| AUTH_009 | 404 | 用户不存在 |
| AUTH_010 | 409 | 邮箱已注册 |
| AUTH_011 | 429 | 请求频率超限 |
| AUTH_012 | 429 | 登录尝试过多 |
| AUTH_013 | 500 | 内部错误 |
| MFA_001 | 400 | MFA 验证码错误 |
| MFA_002 | 400 | MFA 验证码过期 |
| MFA_003 | 403 | MFA 必需但未启用 |
| OAUTH_001 | 400 | 无效的 redirect_uri |
| OAUTH_002 | 400 | 无效的 client_id |
| OAUTH_003 | 400 | 无效的 authorization_code |
| OAUTH_004 | 400 | 无效的 scope |
| OAUTH_005 | 401 | 无效的 client_secret |

### 10.2 环境变量

```bash
# Database
DATABASE_URL=postgresql://auth:***@localhost:5432/cinacoin_auth
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_PREFIX=cinacoin_auth:

# JWT
JWT_PRIVATE_KEY_PATH=/secrets/jwt-private.pem
JWT_PUBLIC_KEY_PATH=/secrets/jwt-public.pem
JWT_ACCESS_TTL=900        # 15 minutes
JWT_REFRESH_TTL=2592000   # 30 days

# OAuth
OAUTH_ISSUER=https://auth.cinacoin.com
OAUTH_AUTH_CODE_TTL=600   # 10 minutes

# Email
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=***
EMAIL_FROM=noreply@cinacoin.com

# Rate Limiting
RATE_LIMIT_REDIS=true
RATE_LIMIT_PREFIX=rl:

# Security
BCRYPT_ROUNDS=12
ARGON2_MEMORY=65536
ARGON2_ITERATIONS=3
ARGON2_PARALLELISM=4
CORS_ORIGINS=https://cinacoin.com,https://cloud.cinacoin.com,...

# Feature Flags
ENABLE_WEB3_AUTH=true
ENABLE_PASSKEY=true
ENABLE_MAGIC_LINK=true
MFA_REQUIRED_FOR_ADMIN=true
```

### 10.3 参考资料

- [RFC 6749 - OAuth 2.0](https://tools.ietf.org/html/rfc6749)
- [RFC 7636 - PKCE](https://tools.ietf.org/html/rfc7636)
- [RFC 7519 - JWT](https://tools.ietf.org/html/rfc7519)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/)
- [SIWE (EIP-4361)](https://eips.ethereum.org/EIPS/eip-4361)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
