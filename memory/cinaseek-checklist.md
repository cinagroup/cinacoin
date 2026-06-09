# CinaSeek 整合记忆系统 - 执行清单

> **创建日期**: 2026-04-04  
> **优先级**: P0 (核心功能)

---

## 📋 Phase 1: 后端基础 (Week 1-2)

### Week 1: Memory Service 模块

- [ ] **创建目录结构**
  ```bash
  cd /tmp/cinaseek/backend
  mkdir -p internal/memory/{service,repository,model,config}
  ```

- [ ] **实现数据模型** (`internal/memory/model/memory.go`)
  - [ ] Memory 结构体
  - [ ] MemoryType 枚举
  - [ ] HeatScore 结构体

- [ ] **实现存储库** (`internal/memory/repository/memory_repo.go`)
  - [ ] PostgreSQL 连接
  - [ ] CRUD 操作
  - [ ] 全文搜索

- [ ] **实现热度服务** (`internal/memory/service/heat_service.go`)
  - [ ] Redis 连接
  - [ ] 热度增减
  - [ ] 排名查询

- [ ] **实现核心服务** (`internal/memory/service/memory_service.go`)
  - [ ] 用户记忆空间初始化
  - [ ] 记忆保存/检索
  - [ ] 文件同步

### Week 2: API 接口

- [ ] **添加 API Handler** (`internal/handler/memory.go`)
  - [ ] `GET /memory/list`
  - [ ] `GET /memory/:id`
  - [ ] `POST /memory/search`
  - [ ] `PUT /memory/:id/heat`
  - [ ] `DELETE /memory/:id`
  - [ ] `GET /memory/ranking`

- [ ] **注册路由** (`cmd/server/main.go`)
  ```go
  api.GET("/memory/list", memoryHandler.List)
  api.POST("/memory/search", memoryHandler.Search)
  ```

- [ ] **集成 auth 中间件**
  - [ ] 从上下文获取 userID
  - [ ] 记忆空间隔离验证

- [ ] **编写单元测试**
  - [ ] `memory_service_test.go`
  - [ ] `memory_repo_test.go`

---

## 📋 Phase 2: 数据库设计 (Week 2-3)

### 数据库迁移

- [ ] **创建 Schema**
  ```sql
  CREATE SCHEMA IF NOT EXISTS cinaseek;
  ```

- [ ] **创建记忆表**
  ```sql
  CREATE TABLE cinaseek.memories (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      type VARCHAR(32) NOT NULL,
      title VARCHAR(255) NOT NULL,
      file_path VARCHAR(512) NOT NULL,
      file_hash VARCHAR(64) UNIQUE NOT NULL,
      heat INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **创建日志表**
  ```sql
  CREATE TABLE cinaseek.memory_logs (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      memory_id INTEGER REFERENCES cinaseek.memories(id),
      action VARCHAR(32) NOT NULL,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **创建配置表**
  ```sql
  CREATE TABLE cinaseek.memory_configs (
      user_id VARCHAR(64) PRIMARY KEY,
      enabled BOOLEAN DEFAULT true,
      backup_enabled BOOLEAN DEFAULT true,
      notify_enabled BOOLEAN DEFAULT true,
      quiet_hours_start TIME DEFAULT '23:00',
      quiet_hours_end TIME DEFAULT '08:00',
      created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **创建索引**
  ```sql
  CREATE INDEX idx_memories_user_type ON cinaseek.memories(user_id, type);
  CREATE INDEX idx_memories_user_heat ON cinaseek.memories(user_id, heat DESC);
  ```

- [ ] **编写迁移脚本** (`deploy/migrations/001_memory_schema.sql`)

---

## 📋 Phase 3: 前端集成 (Week 3-4)

### Week 3: 基础页面

- [ ] **创建视图目录**
  ```bash
  cd /tmp/cinaseek/frontend
  mkdir -p src/views/memory
  ```

- [ ] **记忆列表页** (`src/views/memory/MemoryList.vue`)
  - [ ] 表格组件
  - [ ] 分页
  - [ ] 类型筛选

- [ ] **记忆详情页** (`src/views/memory/MemoryDetail.vue`)
  - [ ] 内容展示
  - [ ] 元数据
  - [ ] 操作按钮

- [ ] **添加路由** (`src/router/index.ts`)
  ```typescript
  {
    path: '/memory',
    name: 'Memory',
    component: () => import('@/views/memory/MemoryList.vue'),
    meta: { requiresAuth: true }
  }
  ```

### Week 4: API 集成

- [ ] **创建 API 模块** (`src/api/memory.ts`)
  - [ ] `getMemories()`
  - [ ] `getMemoryById(id)`
  - [ ] `searchMemories(query)`
  - [ ] `deleteMemory(id)`

- [ ] **创建 Store** (`src/stores/memory.ts`)
  - [ ] 状态管理
  - [ ] 缓存策略

- [ ] **搜索页面** (`src/views/memory/MemorySearch.vue`)
  - [ ] 搜索框
  - [ ] 结果展示
  - [ ] 高亮匹配

- [ ] **设置页面** (`src/views/memory/MemorySettings.vue`)
  - [ ] 开关配置
  - [ ] 安静时间设置
  - [ ] 备份配置

---

## 📋 Phase 4: Cron 自动化 (Week 4)

### 定时任务

- [ ] **Go 实现 Cron 服务** (`internal/memory/cron.go`)
  - [ ] 每日备份 (02:00)
  - [ ] 每周热度衰减 (周日 03:00)
  - [ ] 每周摘要 (周一 09:00)

- [ ] **Kubernetes CronJob** (`deploy/k8s/cronjob.yaml`)
  - [ ] backup CronJob
  - [ ] decay CronJob
  - [ ] digest CronJob

- [ ] **Secret 配置**
  ```yaml
  apiVersion: v1
  kind: Secret
  metadata:
    name: memory-secret
  type: Opaque
  data:
    backup-password: <base64-encoded>
  ```

---

## 📋 Phase 5: 集成测试 (Week 5)

### 测试用例

- [ ] **单元测试**
  - [ ] Memory Service 测试
  - [ ] Repository 测试
  - [ ] Heat 缓存测试

- [ ] **集成测试**
  - [ ] API 端到端测试
  - [ ] 用户隔离验证
  - [ ] 并发访问测试

- [ ] **性能测试**
  - [ ] 检索延迟 <100ms
  - [ ] 并发 100+ 用户
  - [ ] 备份时间 <5min

- [ ] **E2E 测试**
  - [ ] 创建记忆流程
  - [ ] 搜索记忆流程
  - [ ] 删除记忆流程

---

## 📋 Phase 6: 生产部署 (Week 6)

### 部署准备

- [ ] **Docker 镜像构建**
  - [ ] 更新 Dockerfile
  - [ ] 多阶段构建
  - [ ] 推送镜像

- [ ] **K8s 配置**
  - [ ] Deployment 更新
  - [ ] Service 配置
  - [ ] Ingress 配置
  - [ ] HPA 自动扩缩容

- [ ] **监控配置**
  - [ ] Prometheus metrics
  - [ ] Grafana 仪表板
  - [ ] 告警规则

- [ ] **文档更新**
  - [ ] API 文档
  - [ ] 用户手册
  - [ ] 运维手册

---

## 🔧 快速命令参考

### 后端开发
```bash
cd backend
go mod tidy
go build -o bin/cinaseek cmd/server/main.go
go test ./internal/memory/...
```

### 前端开发
```bash
cd frontend
npm install
npm run dev
npm run build
```

### 数据库迁移
```bash
# 应用迁移
psql -h 43.156.66.122 -U cinaseek -d cinatoken -f deploy/migrations/001_memory_schema.sql

# 验证
psql -h 43.156.66.122 -U cinaseek -d cinatoken -c "SELECT * FROM cinaseek.memories LIMIT 10;"
```

### K8s 部署
```bash
kubectl apply -f deploy/k8s/namespace.yaml
kubectl apply -f deploy/k8s/deployment.yaml
kubectl apply -f deploy/k8s/cronjob.yaml
```

---

## 📊 进度追踪

| Phase | 开始日期 | 结束日期 | 状态 |
|-------|----------|----------|------|
| Phase 1 (后端基础) | 2026-04-07 | 2026-04-21 | ⏳ 待开始 |
| Phase 2 (数据库) | 2026-04-21 | 2026-04-28 | ⏳ 待开始 |
| Phase 3 (前端) | 2026-04-28 | 2026-05-12 | ⏳ 待开始 |
| Phase 4 (Cron) | 2026-05-12 | 2026-05-19 | ⏳ 待开始 |
| Testing | 2026-05-19 | 2026-05-26 | ⏳ 待开始 |
| Launch | 2026-05-26 | - | ⏳ 待开始 |

---

*最后更新：2026-04-04*
