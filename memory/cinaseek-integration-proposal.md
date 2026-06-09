# CinaSeek 整合 OpenClaw 记忆系统方案

> **版本**: v1.0  
> **日期**: 2026-04-04  
> **作者**: 000 (海内集团零号助理)

---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [整合目标](#2-整合目标)
3. [架构设计](#3-架构设计)
4. [整合方案](#4-整合方案)
5. [实施步骤](#5-实施步骤)
6. [API 设计](#6-api-设计)
7. [数据库设计](#7-数据库设计)
8. [前端集成](#8-前端集成)
9. [部署配置](#9-部署配置)
10. [时间规划](#10-时间规划)

---

## 1. 项目概述

### 1.1 CinaSeek 定位
**CinaSeek** 是自主品牌轻量级 Ubuntu 虚拟机远程管理工具，核心功能：
- 🚀 零配置远程访问（Cloudflare Tunnel）
- 🔧 OpenClaw 一键部署
- 💻 WebShell 在线终端
- 📊 实时监控（CPU/内存/磁盘）

### 1.2 OpenClaw 记忆系统
**记忆系统 v3.1.0** 提供三层记忆架构：
- **Layer 1**: 用户画像（memory-tdai/persona.md + scene_blocks）
- **Layer 2**: 长期记忆（MEMORY.md + longterm/）
- **Layer 3**: 工作记忆（memory/YYYY-MM-DD.md + working/）

核心能力：
- LLM 驱动的记忆提取
- 热度评分管理（时间衰减）
- 通知系统（QQBot/企业微信）
- 加密备份（AES-256）
- Cron 自动化

---

## 2. 整合目标

### 2.1 核心目标
| 目标 | 说明 | 优先级 |
|------|------|--------|
| **统一用户记忆** | 每个 CinaSeek 用户拥有独立记忆空间 | P0 |
| **会话历史持久化** | WebShell 会话自动保存为记忆 | P0 |
| **智能推荐** | 基于记忆的用户行为推荐 | P1 |
| **自动化运维** | Cron 定时备份 + 热度管理 | P1 |
| **可视化仪表板** | Web UI 查看/管理记忆 | P2 |

### 2.2 成功指标
- ✅ 用户记忆隔离率 100%
- ✅ 会话历史保存率 >99%
- ✅ 记忆检索延迟 <100ms
- ✅ 备份成功率 >99.9%

---

## 3. 架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        CinaSeek 用户                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Web 面板    │  │  WebShell   │  │  移动 App    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CinaSeek Backend (Go)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Auth 中间件  │  │ VM 管理 API  │  │ OpenClaw API │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌─────────────────────────────────────────────────┐            │
│  │         Memory Service (新增模块)                │            │
│  │  - 记忆存储/检索  - 热度管理  - 通知调度         │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    记忆存储层                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ PostgreSQL  │  │ 文件系统     │  │ Redis 缓存   │              │
│  │ (元数据)    │  │ (记忆内容)   │  │ (热度缓存)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 数据流

```
用户操作 → Backend API → Memory Service → 存储层
              │
              ▼
        CinaToken OAuth 验证
              │
              ▼
        用户 ID → 记忆空间隔离
```

---

## 4. 整合方案

### 4.1 用户记忆隔离

**方案**: 基于 CinaToken 用户 ID 创建独立记忆空间

```
/memory-store/
├── {user_id}/
│   ├── workspace/
│   │   ├── MEMORY.md              # 长期记忆索引
│   │   ├── memory/
│   │   │   ├── YYYY-MM-DD.md      # 每日日志
│   │   │   ├── longterm/          # 长期归档
│   │   │   ├── shortterm/         # 待审查
│   │   │   └── working/           # 临时任务
│   │   └── .memory-config.json    # 用户配置
│   └── memory-tdai/
│       ├── persona.md             # 用户画像
│       └── scene_blocks/          # 场景记忆
```

**实现**:
```go
// internal/memory/storage.go
func GetUserMemoryDir(userID string) string {
    return filepath.Join("/data/memory-store", userID)
}

func InitUserMemory(userID string) error {
    dir := GetUserMemoryDir(userID)
    // 创建目录结构
    // 复制模板文件
}
```

### 4.2 会话历史自动保存

**触发点**: WebShell 会话结束/用户切换标签页

```go
// internal/handler/websocket.go
func (h *WebSocketHandler) OnSessionEnd(sessionID, userID, content string) {
    // 提取关键信息
    memory := &Memory{
        UserID:    userID,
        Type:      "session",
        Content:   content,
        Heat:      1,
        CreatedAt: time.Now(),
    }
    
    // 调用记忆服务
    h.memoryService.Save(memory)
}
```

### 4.3 热度缓存（Redis）

**结构**:
```
memory:heat:{user_id}:{file_hash} -> score (integer)
memory:rank:{user_id} -> sorted set (score=file_heat)
```

**操作**:
```go
// 增加热度
func (r *RedisHeatStore) Increment(ctx context.Context, userID, fileHash string) error {
    key := fmt.Sprintf("memory:heat:%s:%s", userID, fileHash)
    return r.client.Incr(ctx, key).Err()
}

// 获取排名
func (r *RedisHeatStore) GetRanking(ctx context.Context, userID string, limit int64) ([]Memory, error) {
    key := fmt.Sprintf("memory:rank:%s", userID)
    return r.client.ZRevRangeWithScores(ctx, key, 0, limit-1).Result()
}
```

### 4.4 通知集成

**复用现有渠道**: 企业微信 + 邮件（与 CinaSeek 告警一致）

```go
// internal/memory/notify.go
func (n *Notifier) SendWeChat(ctx context.Context, userID, title, content string) error {
    // 调用现有企业微信告警接口
    return n.wechatClient.Send(ctx, &WeChatMessage{
        ToUser:  GetUserWeChatID(userID),
        Title:   title,
        Content: content,
    })
}
```

---

## 5. 实施步骤

### Phase 1: 后端基础（Week 1-2）

#### 5.1.1 创建 Memory Service 模块

```bash
cd backend
mkdir -p internal/memory/{service,repository,model,config}
```

**文件结构**:
```
internal/memory/
├── service/
│   ├── memory_service.go      # 核心服务
│   ├── heat_service.go        # 热度管理
│   └── notify_service.go      # 通知调度
├── repository/
│   ├── memory_repo.go         # 记忆存储
│   └── heat_repo.go           # 热度缓存
├── model/
│   ├── memory.go              # 数据模型
│   └── heat.go                # 热度模型
└── config/
    └── config.go              # 配置加载
```

#### 5.1.2 添加 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/cinaseek/v1/memory/list` | 获取记忆列表 |
| GET | `/api/cinaseek/v1/memory/:id` | 获取单条记忆 |
| POST | `/api/cinaseek/v1/memory/search` | 搜索记忆 |
| PUT | `/api/cinaseek/v1/memory/:id/heat` | 更新热度 |
| DELETE | `/api/cinaseek/v1/memory/:id` | 删除记忆 |
| GET | `/api/cinaseek/v1/memory/ranking` | 热度排名 |

#### 5.1.3 集成 CinaToken OAuth

```go
// internal/middleware/auth.go (已存在，需调整)
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        userInfo, err := cinatoken.ValidateToken(token)
        if err != nil {
            c.JSON(401, gin.H{"code": 401, "msg": "Token 无效"})
            c.Abort()
            return
        }
        
        // 注入用户 ID 到上下文
        c.Set("userID", userInfo.ID)
        c.Set("userEmail", userInfo.Email)
        c.Next()
    }
}
```

### Phase 2: 数据库设计（Week 2-3）

#### 5.2.1 创建 Schema

```sql
-- 在 PostgreSQL 主库执行
CREATE SCHEMA IF NOT EXISTS cinaseek;

-- 记忆元数据表
CREATE TABLE cinaseek.memories (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    type VARCHAR(32) NOT NULL,  -- user/feedback/project/reference/session
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_hash VARCHAR(64) UNIQUE NOT NULL,
    heat INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_user_type (user_id, type),
    INDEX idx_heat (user_id, heat DESC)
);

-- 记忆操作日志表
CREATE TABLE cinaseek.memory_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    memory_id INTEGER REFERENCES cinaseek.memories(id),
    action VARCHAR(32) NOT NULL,  -- create/update/delete/search
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户记忆配置表
CREATE TABLE cinaseek.memory_configs (
    user_id VARCHAR(64) PRIMARY KEY,
    enabled BOOLEAN DEFAULT true,
    backup_enabled BOOLEAN DEFAULT true,
    notify_enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME DEFAULT '23:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 3: 前端集成（Week 3-4）

#### 5.3.1 添加记忆管理页面

**文件**: `frontend/src/views/memory/MemoryList.vue`

```vue
<template>
  <div class="memory-list">
    <el-table :data="memories" style="width: 100%">
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="heat" label="热度" width="80" />
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="viewMemory(row)">查看</el-button>
          <el-button size="small" type="danger" @click="deleteMemory(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMemories } from '@/api/memory'

const memories = ref([])

onMounted(async () => {
  memories.value = await getMemories()
})
</script>
```

#### 5.3.2 添加路由

```typescript
// frontend/src/router/index.ts
{
  path: '/memory',
  name: 'Memory',
  component: () => import('@/views/memory/MemoryList.vue'),
  meta: { requiresAuth: true }
}
```

#### 5.3.3 添加 API 调用

```typescript
// frontend/src/api/memory.ts
import request from '@/utils/request'

export function getMemories() {
  return request({
    url: '/api/cinaseek/v1/memory/list',
    method: 'get'
  })
}

export function searchMemories(query: string) {
  return request({
    url: '/api/cinaseek/v1/memory/search',
    method: 'post',
    data: { query }
  })
}
```

### Phase 4: Cron 自动化（Week 4）

#### 5.4.1 创建定时任务

```go
// internal/memory/cron.go
func StartCronJobs(ctx context.Context, ms *MemoryService) {
    // 每日备份 (02:00)
    cron.AddFunc("0 2 * * *", func() {
        ms.BackupAllUsers(ctx)
    })
    
    // 每周热度衰减 (周日 03:00)
    cron.AddFunc("0 3 * * 0", func() {
        ms.ApplyHeatDecay(ctx)
    })
    
    // 每周摘要 (周一 09:00)
    cron.AddFunc("0 9 * * 1", func() {
        ms.SendWeeklyDigest(ctx)
    })
}
```

#### 5.4.2 Kubernetes CronJob

```yaml
# deploy/k8s/cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: memory-backup
  namespace: cinaseek
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: cinagroup/cinaseek:latest
            command:
            - /app/cinaseek
            - memory-backup
            env:
            - name: BACKUP_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: memory-secret
                  key: backup-password
          restartPolicy: OnFailure
```

---

## 6. API 设计

### 6.1 记忆管理 API

#### GET /api/cinaseek/v1/memory/list
```json
// Response
{
  "code": 0,
  "data": {
    "memories": [
      {
        "id": 1,
        "type": "session",
        "title": "WebShell 会话 - 2026-04-04",
        "heat": 5,
        "createdAt": "2026-04-04T03:00:00Z"
      }
    ],
    "total": 10
  }
}
```

#### POST /api/cinaseek/v1/memory/search
```json
// Request
{
  "query": "OpenClaw 部署",
  "type": "all",
  "limit": 20
}

// Response
{
  "code": 0,
  "data": {
    "results": [...],
    "total": 5
  }
}
```

### 6.2 热度管理 API

#### GET /api/cinaseek/v1/memory/ranking
```json
// Response
{
  "code": 0,
  "data": {
    "ranking": [
      {"id": 1, "title": "...", "heat": 10},
      {"id": 2, "title": "...", "heat": 8}
    ]
  }
}
```

---

## 7. 数据库设计

### 7.1 ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │  memories   │       │memory_logs  │
│─────────────│       │─────────────│       │─────────────│
│ id (PK)     │───┐   │ id (PK)     │   ┌───│ id (PK)     │
│ email       │   └──▶│ user_id     │   │   │ memory_id   │
│ created_at  │       │ type        │   │   │ action      │
└─────────────┘       │ title       │   │   │ metadata    │
                      │ file_path   │   │   │ created_at  │
                      │ heat        │   │   └─────────────┘
                      │ created_at  │
                      └─────────────┘
```

### 7.2 索引优化

```sql
-- 复合索引（常用查询）
CREATE INDEX idx_memories_user_type_heat ON cinaseek.memories(user_id, type, heat DESC);
CREATE INDEX idx_memories_user_created ON cinaseek.memories(user_id, created_at DESC);

-- 全文搜索索引
ALTER TABLE cinaseek.memories ADD COLUMN search_vector tsvector;
CREATE INDEX idx_memories_search ON cinaseek.memories USING GIN(search_vector);
```

---

## 8. 前端集成

### 8.1 页面结构

```
frontend/src/views/memory/
├── MemoryList.vue       # 记忆列表页
├── MemoryDetail.vue     # 记忆详情页
├── MemorySearch.vue     # 搜索页
└── MemorySettings.vue   # 设置页
```

### 8.2 组件复用

- 复用 `Element Plus` 表格、表单组件
- 复用现有 `xterm.js` 终端组件展示会话记忆
- 复用 `ECharts` 展示热度趋势

---

## 9. 部署配置

### 9.1 Docker Compose

```yaml
# deploy/docker-compose.yml
services:
  backend:
    image: cinagroup/cinaseek:latest
    volumes:
      - memory-store:/data/memory-store
    environment:
      - MEMORY_STORE_PATH=/data/memory-store
      - REDIS_HOST=redis
      - DATABASE_URL=postgres://...
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
  
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  memory-store:
  redis-data:
  postgres-data:
```

### 9.2 存储规划

```
/data/
├── memory-store/        # 用户记忆文件（主存储）
│   ├── {user_id}/
│   │   ├── workspace/
│   │   └── memory-tdai/
└── backups/             # 加密备份
    └── {user_id}/
        └── daily/
```

---

## 10. 时间规划

### 10.1 开发里程碑

| 阶段 | 时间 | 任务 | 交付物 |
|------|------|------|--------|
| **Phase 1** | Week 1-2 | 后端 Memory Service | API 接口、单元测试 |
| **Phase 2** | Week 2-3 | 数据库设计 | Schema、迁移脚本 |
| **Phase 3** | Week 3-4 | 前端集成 | 记忆管理页面 |
| **Phase 4** | Week 4 | Cron 自动化 | 定时任务、K8s CronJob |
| **Testing** | Week 5 | 集成测试 | 测试报告 |
| **Launch** | Week 6 | 生产部署 | 上线 |

### 10.2 依赖关系

```
Phase 1 (后端基础)
    │
    ▼
Phase 2 (数据库) ────▶ Phase 3 (前端)
    │                        │
    ▼                        ▼
Phase 4 (Cron)         Testing
    │                        │
    └────────────────────────┘
             ▼
          Launch
```

---

## 附录

### A. 现有技能复用

| 技能 | 位置 | 复用方式 |
|------|------|----------|
| 记忆系统 v3.1.0 | `~/.npm-global/lib/node_modules/openclaw/skills/memory-system/` | 脚本直接调用 |
| QQBot 通知 | `memory-notify.sh` | 改造为企业微信通知 |
| Cron 配置 | `crontab` | 迁移为 K8s CronJob |
| 备份脚本 | `memory-backup.sh` | Go 重写或 shell 调用 |

### B. 配置模板

**后端配置** (`backend/internal/memory/config/config.go`):
```go
type Config struct {
    StorePath      string `yaml:"store_path"`
    RedisAddr      string `yaml:"redis_addr"`
    DatabaseURL    string `yaml:"database_url"`
    BackupEnabled  bool   `yaml:"backup_enabled"`
    NotifyEnabled  bool   `yaml:"notify_enabled"`
}
```

**前端配置** (`frontend/src/config/memory.ts`):
```typescript
export const MEMORY_CONFIG = {
  API_BASE: '/api/cinaseek/v1/memory',
  PAGE_SIZE: 20,
  HEAT_DECAY_DAYS: 7,
}
```

---

*文档版本：v1.0 | 最后更新：2026-04-04*
