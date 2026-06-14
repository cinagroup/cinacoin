# P0 实施计划

**开始日期**: 2026-06-14  
**预计完成**: 2026-07-12（4 周）

---

## 📋 P0 任务清单

### Task 1: 统一认证中心（2 周）

**目标**: 建立 auth.cinacoin.com，实现统一登录/注册/OAuth/MFA

**子任务**:
1.1 架构设计（Day 1-2）
- [ ] 设计认证流程
- [ ] 设计数据库 Schema
- [ ] 设计 API 接口
- [ ] 设计安全策略

1.2 开发认证服务（Day 3-7）
- [ ] 创建 auth-service 应用
- [ ] 实现用户注册/登录
- [ ] 实现 OAuth 2.0 / OpenID Connect
- [ ] 实现 MFA（TOTP）
- [ ] 实现会话管理（JWT）
- [ ] 实现用户配置存储

1.3 集成到现有应用（Day 8-12）
- [ ] 集成到 website
- [ ] 集成到 wallet-explorer
- [ ] 集成到 developer-dashboard
- [ ] 集成到 cloud-dashboard
- [ ] 集成到 backend-dashboard

1.4 数据迁移（Day 13-14）
- [ ] 迁移现有用户数据
- [ ] 测试迁移完整性
- [ ] 部署到生产环境

### Task 2: 统一管理平台（4 周）

**目标**: 合并 4 个 Dashboard 为 1 个统一管理平台

**子任务**:
2.1 架构设计（Week 1, Day 1-2）
- [ ] 分析 4 个 Dashboard 的功能
- [ ] 设计统一管理平台架构
- [ ] 设计数据库 Schema
- [ ] 设计 API 接口

2.2 开发统一管理平台（Week 1-3）
- [ ] 创建 unified-admin 应用
- [ ] 实现项目管理模块（from cloud-dashboard）
- [ ] 实现资源管理模块（from cloud-dashboard）
- [ ] 实现数据分析模块（from analytics-dashboard）
- [ ] 实现监控告警模块（from backend-dashboard）
- [ ] 实现 Workers 管理模块（from backend-dashboard）
- [ ] 实现健康检查模块（from unified-dashboard + health-status）
- [ ] 实现用户管理模块
- [ ] 实现系统设置模块

2.3 集成统一认证（Week 3, Day 4-5）
- [ ] 集成 auth.cinacoin.com
- [ ] 实现权限控制（RBAC）

2.4 数据迁移（Week 4, Day 1-3）
- [ ] 迁移项目数据
- [ ] 迁移资源数据
- [ ] 迁移分析数据
- [ ] 迁移监控数据
- [ ] 测试迁移完整性

2.5 部署与测试（Week 4, Day 4-5）
- [ ] 部署到生产环境
- [ ] 功能测试
- [ ] 性能测试
- [ ] 安全测试
- [ ] 用户验收测试

2.6 删除旧应用（Week 4, Day 5）
- [ ] 删除 backend-dashboard
- [ ] 删除 cloud-dashboard
- [ ] 删除 analytics-dashboard
- [ ] 删除 unified-dashboard
- [ ] 删除 health-status

---

## 🏗️ 技术架构

### 统一认证中心

**技术栈**:
- Framework: Next.js 14 (App Router)
- Database: Cloudflare D1 (SQLite)
- Auth: JWT + Refresh Tokens
- MFA: TOTP (RFC 6238)
- OAuth: OAuth 2.0 + OpenID Connect
- Deployment: Cloudflare Pages + Workers

**核心功能**:
- 用户注册/登录（邮箱 + 密码）
- OAuth 2.0 授权（Google、GitHub）
- MFA（TOTP）
- 会话管理（JWT + Refresh Token）
- 用户配置存储
- API Key 管理

**API 接口**:
```
POST /auth/register          # 注册
POST /auth/login             # 登录
POST /auth/logout            # 登出
POST /auth/refresh           # 刷新 Token
POST /auth/mfa/setup         # 设置 MFA
POST /auth/mfa/verify        # 验证 MFA
GET  /auth/user              # 获取用户信息
PUT  /auth/user              # 更新用户信息
GET  /auth/user/settings     # 获取用户配置
PUT  /auth/user/settings     # 更新用户配置
```

### 统一管理平台

**技术栈**:
- Framework: Next.js 14 (App Router)
- UI: React + Tailwind CSS
- State: React Context + TanStack Query
- Charts: Recharts
- Deployment: Cloudflare Pages

**功能模块**:
```
/dashboard          # 概览（关键指标、最近活动）
/projects           # 项目管理
  /projects/[id]    # 项目详情
  /projects/new     # 创建项目
/resources          # 资源管理
  /resources/compute    # 计算资源
  /resources/storage    # 存储资源
  /resources/network    # 网络资源
/analytics          # 数据分析
  /analytics/overview   # 概览
  /analytics/users      # 用户分析
  /analytics/api        # API 分析
/monitoring         # 监控告警
  /monitoring/metrics   # 指标监控
  /monitoring/alerts    # 告警管理
  /monitoring/logs      # 日志查看
/workers            # Workers 管理
  /workers/[id]     # Worker 详情
  /workers/new      # 创建 Worker
/health             # 健康检查
  /health/services  # 服务状态
  /health/incidents # 事件记录
/settings           # 系统设置
  /settings/general     # 通用设置
  /settings/security    # 安全设置
  /settings/api         # API 设置
/users              # 用户管理（管理员）
  /users/list       # 用户列表
  /users/[id]       # 用户详情
```

---

## 📊 数据库设计

### 统一认证中心

**users 表**:
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  mfa_enabled INTEGER DEFAULT 0,
  mfa_secret TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**oauth_accounts 表**:
```sql
CREATE TABLE oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**sessions 表**:
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**user_settings 表**:
```sql
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY,
  theme TEXT DEFAULT 'dark',
  locale TEXT DEFAULT 'en',
  notifications_enabled INTEGER DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 统一管理平台

**projects 表**:
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**resources 表**:
```sql
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  config TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

**api_keys 表**:
```sql
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

**metrics 表**:
```sql
CREATE TABLE metrics (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value REAL NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

**alerts 表**:
```sql
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL,
  resolved INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

---

## 🔐 安全策略

### 认证安全

1. **密码存储**: 使用 bcrypt（cost factor 12）
2. **JWT**: 使用 RS256 算法，短期 Access Token（15 分钟）
3. **Refresh Token**: 长期有效（7 天），存储在 HttpOnly Cookie
4. **MFA**: 使用 TOTP（RFC 6238），支持 Google Authenticator
5. **OAuth**: 使用 PKCE 流程，防止授权码拦截攻击
6. **Rate Limiting**: 登录接口限制 5 次/分钟
7. **CORS**: 仅允许白名单域名

### API 安全

1. **认证**: 所有 API 需要 Bearer Token
2. **授权**: 基于角色的访问控制（RBAC）
3. **输入验证**: 使用 Zod 进行严格的输入验证
4. **SQL 注入**: 使用参数化查询
5. **XSS**: 使用 Content Security Policy
6. **CSRF**: 使用 SameSite Cookie + CSRF Token

---

## 📅 实施时间线

### Week 1: 认证中心开发

**Day 1-2**: 架构设计
- 设计认证流程
- 设计数据库 Schema
- 设计 API 接口

**Day 3-5**: 核心功能开发
- 创建 auth-service 应用
- 实现用户注册/登录
- 实现 JWT 认证

**Day 6-7**: 高级功能开发
- 实现 OAuth 2.0
- 实现 MFA
- 实现会话管理

### Week 2: 认证中心集成

**Day 8-10**: 集成到应用
- 集成到 website
- 集成到 wallet-explorer
- 集成到 developer-dashboard

**Day 11-12**: 继续集成
- 集成到 cloud-dashboard
- 集成到 backend-dashboard

**Day 13-14**: 数据迁移与测试
- 迁移现有用户数据
- 测试迁移完整性
- 部署到生产环境

### Week 3: 统一管理平台开发

**Day 15-16**: 架构设计
- 分析 4 个 Dashboard 的功能
- 设计统一管理平台架构
- 设计数据库 Schema

**Day 17-19**: 核心模块开发
- 创建 unified-admin 应用
- 实现项目管理模块
- 实现资源管理模块

**Day 20-21**: 高级模块开发
- 实现数据分析模块
- 实现监控告警模块

### Week 4: 统一管理平台完成

**Day 22-23**: 继续开发
- 实现 Workers 管理模块
- 实现健康检查模块
- 实现用户管理模块

**Day 24-25**: 集成与测试
- 集成统一认证
- 实现权限控制
- 功能测试

**Day 26-28**: 数据迁移与部署
- 迁移项目数据
- 迁移资源数据
- 部署到生产环境

**Day 29-30**: 测试与清理
- 性能测试
- 安全测试
- 删除旧应用

---

## 🎯 成功标准

### 统一认证中心

- [ ] 用户可以注册/登录
- [ ] 支持 OAuth 2.0（Google、GitHub）
- [ ] 支持 MFA（TOTP）
- [ ] 所有应用集成完成
- [ ] 用户数据迁移完成
- [ ] 性能测试通过（< 200ms 响应时间）
- [ ] 安全测试通过

### 统一管理平台

- [ ] 项目管理功能完整
- [ ] 资源管理功能完整
- [ ] 数据分析功能完整
- [ ] 监控告警功能完整
- [ ] Workers 管理功能完整
- [ ] 健康检查功能完整
- [ ] 用户管理功能完整
- [ ] 所有数据迁移完成
- [ ] 旧应用删除完成
- [ ] 性能测试通过（< 500ms 响应时间）
- [ ] 安全测试通过

---

## ⚠️ 风险与缓解

### 风险 1: 数据迁移丢失

**缓解措施**:
- 制定详细的迁移计划
- 进行多次迁移测试
- 保留旧系统备份
- 分阶段迁移

### 风险 2: 用户习惯改变

**缓解措施**:
- 提前通知用户
- 提供详细的迁移指南
- 保留旧系统一段时间（并行运行）
- 收集用户反馈并快速迭代

### 风险 3: 性能问题

**缓解措施**:
- 进行性能测试
- 使用 CDN 加速
- 优化数据库查询
- 使用缓存

### 风险 4: 安全漏洞

**缓解措施**:
- 进行安全审计
- 使用自动化工具检测漏洞
- 遵循安全最佳实践
- 定期进行安全测试

---

## 📝 下一步行动

### 立即开始（今天）

1. **创建 auth-service 应用**
   - 初始化 Next.js 项目
   - 配置 Cloudflare Pages
   - 设置数据库

2. **设计认证流程**
   - 绘制流程图
   - 设计 API 接口
   - 设计数据库 Schema

3. **开发核心功能**
   - 实现用户注册
   - 实现用户登录
   - 实现 JWT 认证

### 本周完成

- [ ] auth-service 应用创建
- [ ] 用户注册/登录功能完成
- [ ] JWT 认证完成
- [ ] 集成到 website 完成

---

**文档版本**: v1.0  
**最后更新**: 2026-06-14  
**负责人**: OpenClaw AI Assistant
