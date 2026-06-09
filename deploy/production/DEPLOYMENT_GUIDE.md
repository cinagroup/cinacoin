# Cinacoin Production Deployment Guide

> **Version**: 1.0.0  
> **Date**: 2026-06-08  
> **Environment**: Production

---

## 目录

1. [概述](#1-概述)
2. [环境准备清单](#2-环境准备清单)
3. [快速开始](#3-快速开始)
4. [详细部署步骤](#4-详细部署步骤)
5. [验证与测试](#5-验证与测试)
6. [故障排除](#6-故障排除)
7. [维护操作](#7-维护操作)

---

## 1. 概述

本文档提供 Cinacoin Auth Service 生产环境的完整部署指南。

### 1.1 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION ARCHITECTURE                    │
│                                                               │
│  Load Balancer (Cloudflare / AWS ALB)                        │
│         ↓                                                     │
│  Auth Service (Docker Container)                             │
│         ↓                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Redis     │  │   Monitoring │      │
│  │  (Primary +  │  │  (Primary +  │  │  (Prometheus │      │
│  │   Replica)   │  │   Replica)   │  │   + Grafana) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  Backup Service (Daily automated backups)                    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 组件清单

| 组件 | 版本 | 用途 | 端口 |
|------|------|------|------|
| Auth Service | 1.0.0 | 认证服务 | 3200 |
| PostgreSQL | 16 | 主数据库 | 5432 |
| PostgreSQL Replica | 16 | 只读副本 | 5433 |
| Redis | 7 | 缓存/会话 | 6379 |
| Redis Replica | 7 | 只读副本 | 6380 |
| Prometheus | 2.45.0 | 监控 | 9090 |
| Grafana | 10.0.0 | 可视化 | 3000 |
| Backup Service | Latest | 自动备份 | 8080 |

---

## 2. 环境准备清单

### 2.1 系统要求

- **操作系统**: Ubuntu 22.04 LTS / CentOS 8+ / Amazon Linux 2
- **Docker**: 24.0+
- **Docker Compose**: 2.20+
- **磁盘空间**: 最少 100GB (推荐 500GB)
- **内存**: 最少 16GB (推荐 32GB)
- **CPU**: 最少 8 核 (推荐 16 核)

### 2.2 网络要求

- 开放端口: 80, 443 (外部)
- 内部端口: 3200, 5432, 5433, 6379, 6380, 9090, 3000 (仅本地访问)
- DNS 记录已配置（见 DNS 验证脚本）
- SSL 证书已准备（见 SSL 准备脚本）

### 2.3 前置检查

```bash
# 检查 Docker 版本
docker --version  # 应 >= 24.0

# 检查 Docker Compose 版本
docker-compose --version  # 应 >= 2.20

# 检查磁盘空间
df -h  # 确保有足够空间

# 检查内存
free -h  # 确保有足够内存

# 检查 CPU
nproc  # 确保有足够 CPU 核心
```

---

## 3. 快速开始

### 3.1 一键部署（推荐）

```bash
# 1. 进入部署目录
cd /home/cina/.openclaw/workspace/deploy/production

# 2. 配置环境变量
cp config/.env.secrets.template config/.env.secrets
# 编辑 .env.secrets，填入实际的 OAuth 凭证和其他密钥
nano config/.env.secrets

# 3. 创建密码文件
echo "XLSNYE5SZLICfFrWCYQdQCCPMDWVzV1z" > secrets/db_password.txt
echo "ULwncxfztz8jCRIvKeQIe77xv4GdyNry" > secrets/redis_password.txt
echo "your-grafana-admin-password" > secrets/grafana_admin_password.txt
chmod 600 secrets/*.txt

# 4. 验证 DNS
./scripts/verify-dns.sh

# 5. 验证 SSL 证书
./scripts/prepare-ssl.sh check

# 6. 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 7. 执行数据库迁移
./scripts/migrate-database.sh up

# 8. 验证部署
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:3200/health
```

### 3.2 分步部署

如果需要更细粒度的控制，请按以下步骤操作。

---

## 4. 详细部署步骤

### 4.1 环境变量配置

#### 步骤 1: 创建 secrets 文件

```bash
cd /home/cina/.openclaw/workspace/deploy/production

# 创建数据库密码文件
echo "XLSNYE5SZLICfFrWCYQdQCCPMDWVzV1z" > secrets/db_password.txt

# 创建 Redis 密码文件
echo "ULwncxfztz8jCRIvKeQIe77xv4GdyNry" > secrets/redis_password.txt

# 创建 Grafana 管理员密码
echo "your-secure-grafana-password" > secrets/grafana_admin_password.txt

# 设置权限
chmod 600 secrets/*.txt
```

#### 步骤 2: 配置应用环境变量

```bash
# 复制模板
cp config/.env.secrets.template config/.env.secrets

# 编辑并填入实际值
nano config/.env.secrets
```

需要配置的 OAuth 凭证：
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`
- `SMTP_PASSWORD` (邮件服务)
- `SENTRY_DSN` (错误监控)

#### 步骤 3: 验证环境变量

```bash
# 加载环境变量
source config/.env.production
source config/.env.secrets

# 验证关键变量
echo "Database URL: $DATABASE_URL"
echo "Redis URL: $REDIS_URL"
echo "JWT Key ID: $JWT_KEY_ID"
```

### 4.2 数据库准备

#### 步骤 1: 启动 PostgreSQL

```bash
# 仅启动数据库服务
docker-compose -f docker-compose.prod.yml up -d db-primary

# 等待数据库就绪
sleep 10

# 验证连接
docker exec -it cinacoin-db-primary psql -U cinacoin -d cinacoin_auth -c "SELECT 1"
```

#### 步骤 2: 执行数据库迁移

```bash
# 执行迁移
./scripts/migrate-database.sh up

# 验证迁移状态
./scripts/migrate-database.sh status

# 验证关键表
docker exec -it cinacoin-db-primary psql -U cinacoin -d cinacoin_auth -c "\dt"
```

预期表：
- `users` - 用户表
- `sessions` - 会话表
- `oauth_accounts` - OAuth 账户表
- `mfa_secrets` - MFA 密钥表
- `api_keys` - API 密钥表
- `schema_migrations` - 迁移记录表

#### 步骤 3: 创建数据库备份

```bash
# 手动创建备份
./scripts/migrate-database.sh backup

# 验证备份文件
ls -lh backups/
```

#### 步骤 4: 启动数据库副本（可选）

```bash
# 启动只读副本
docker-compose -f docker-compose.prod.yml up -d db-replica

# 验证副本状态
docker exec -it cinacoin-db-replica psql -U cinacoin -d cinacoin_auth -c "SELECT pg_is_in_recovery()"
```

### 4.3 Redis 准备

#### 步骤 1: 启动 Redis

```bash
# 启动 Redis 主节点
docker-compose -f docker-compose.prod.yml up -d redis-primary

# 等待 Redis 就绪
sleep 5

# 验证连接
docker exec -it cinacoin-redis-primary redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry ping
```

#### 步骤 2: 验证 Redis 配置

```bash
# 检查 Redis 配置
docker exec -it cinacoin-redis-primary redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry CONFIG GET maxmemory
docker exec -it cinacoin-redis-primary redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry CONFIG GET appendonly

# 检查持久化状态
docker exec -it cinacoin-redis-primary redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry INFO persistence
```

#### 步骤 3: 启动 Redis 副本（可选）

```bash
# 启动 Redis 副本
docker-compose -f docker-compose.prod.yml up -d redis-replica

# 验证复制状态
docker exec -it cinacoin-redis-replica redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry INFO replication
```

### 4.4 启动应用服务

```bash
# 启动 Auth Service
docker-compose -f docker-compose.prod.yml up -d auth-service

# 等待服务启动
sleep 10

# 检查服务状态
docker-compose -f docker-compose.prod.yml ps

# 验证健康检查
curl http://localhost:3200/health
```

### 4.5 启动监控服务

```bash
# 启动 Prometheus 和 Grafana
docker-compose -f docker-compose.prod.yml up -d prometheus grafana

# 验证 Prometheus
curl http://localhost:9090/-/healthy

# 验证 Grafana
curl http://localhost:3000/api/health
```

### 4.6 域名和 DNS 验证

#### 步骤 1: 验证 DNS 记录

```bash
# 运行 DNS 验证脚本
./scripts/verify-dns.sh
```

#### 步骤 2: 验证 SSL 证书

```bash
# 检查现有证书
./scripts/prepare-ssl.sh check

# 如果需要生成 CSR（证书签名请求）
./scripts/prepare-ssl.sh csr

# 验证证书链
./scripts/prepare-ssl.sh chain

# 验证域名覆盖
./scripts/prepare-ssl.sh verify
```

---

## 5. 验证与测试

### 5.1 服务健康检查

```bash
# 检查所有服务状态
docker-compose -f docker-compose.prod.yml ps

# 检查 Auth Service
curl -v http://localhost:3200/health

# 检查数据库
docker exec -it cinacoin-db-primary pg_isready -U cinacoin -d cinacoin_auth

# 检查 Redis
docker exec -it cinacoin-redis-primary redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry ping
```

### 5.2 功能测试

```bash
# 测试用户注册
curl -X POST http://localhost:3200/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@cinacoin.com",
    "password": "SecurePass123!",
    "username": "testuser"
  }'

# 测试用户登录
curl -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@cinacoin.com",
    "password": "SecurePass123!"
  }'

# 测试 Token 验证（使用上一步返回的 token）
curl http://localhost:3200/api/auth/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5.3 性能测试

```bash
# 使用 Apache Bench 进行简单负载测试
ab -n 1000 -c 10 http://localhost:3200/health

# 使用 wrk 进行更详细的测试
wrk -t12 -c400 -d30s http://localhost:3200/health
```

### 5.4 安全测试

```bash
# 检查端口暴露
nmap -p 3200,5432,6379 localhost

# 验证 SSL/TLS
openssl s_client -connect auth.cinacoin.com:443 -tls1_3

# 检查安全头
curl -I https://auth.cinacoin.com
```

---

## 6. 故障排除

### 6.1 常见问题

#### 问题 1: 数据库连接失败

```bash
# 检查数据库状态
docker-compose -f docker-compose.prod.yml logs db-primary

# 验证密码文件
cat secrets/db_password.txt

# 手动测试连接
docker exec -it cinacoin-db-primary psql -U cinacoin -d cinacoin_auth
```

#### 问题 2: Redis 连接失败

```bash
# 检查 Redis 状态
docker-compose -f docker-compose.prod.yml logs redis-primary

# 验证密码
docker exec -it cinacoin-redis-primary redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry ping

# 检查内存使用
docker exec -it cinacoin-redis-primary redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry INFO memory
```

#### 问题 3: Auth Service 启动失败

```bash
# 查看详细日志
docker-compose -f docker-compose.prod.yml logs auth-service

# 检查环境变量
docker exec -it cinacoin-auth-prod env | grep -E "DATABASE_URL|REDIS_URL|JWT"

# 验证密钥文件
docker exec -it cinacoin-auth-prod ls -la /run/secrets/
```

#### 问题 4: 迁移失败

```bash
# 查看迁移日志
cat logs/migrate_*.log

# 检查迁移状态
./scripts/migrate-database.sh status

# 手动应用迁移（如果需要）
docker exec -i cinacoin-db-primary psql -U cinacoin -d cinacoin_auth < /path/to/migration.sql
```

### 6.2 日志查看

```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f auth-service
docker-compose -f docker-compose.prod.yml logs -f db-primary
docker-compose -f docker-compose.prod.yml logs -f redis-primary

# 查看最近 100 行
docker-compose -f docker-compose.prod.yml logs --tail=100 auth-service
```

### 6.3 性能问题

```bash
# 检查数据库性能
docker exec -it cinacoin-db-primary psql -U cinacoin -d cinacoin_auth -c "
  SELECT 
    schemaname,
    relname,
    seq_scan,
    idx_scan,
    n_live_tup
  FROM pg_stat_user_tables
  ORDER BY n_live_tup DESC
  LIMIT 10;
"

# 检查 Redis 性能
docker exec -it cinacoin-redis-primary redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry INFO stats

# 检查慢查询
docker exec -it cinacoin-db-primary psql -U cinacoin -d cinacoin_auth -c "
  SELECT query, calls, total_time, mean_time
  FROM pg_stat_statements
  ORDER BY mean_time DESC
  LIMIT 10;
"
```

---

## 7. 维护操作

### 7.1 数据库维护

```bash
# 创建备份
./scripts/migrate-database.sh backup

# 清理旧备份（保留 30 天）
find backups/ -type f -mtime +30 -delete

# 数据库优化
docker exec -it cinacoin-db-primary psql -U cinacoin -d cinacoin_auth -c "VACUUM ANALYZE;"

# 重建索引
docker exec -it cinacoin-db-primary psql -U cinacoin -d cinacoin_auth -c "REINDEX DATABASE cinacoin_auth;"
```

### 7.2 Redis 维护

```bash
# 清理过期键
docker exec -it cinacoin-redis-primary redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry --scan --pattern "cinacoin:prod:*" | xargs -r docker exec -i cinacoin-redis-primary redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry DEL

# 检查内存使用
docker exec -it cinacoin-redis-primary redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry INFO memory

# 手动触发 RDB 保存
docker exec -it cinacoin-redis-primary redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry BGSAVE
```

### 7.3 日志轮转

```bash
# 手动轮转日志
docker exec -it cinacoin-auth-prod sh -c "kill -USR1 1"

# 清理旧日志
find logs/ -type f -mtime +7 -delete
```

### 7.4 更新部署

```bash
# 拉取最新镜像
docker-compose -f docker-compose.prod.yml pull

# 滚动更新（零停机）
docker-compose -f docker-compose.prod.yml up -d --no-deps --build auth-service

# 验证更新
curl http://localhost:3200/health

# 如果需要回滚
docker-compose -f docker-compose.prod.yml up -d --no-deps auth-service:previous-version
```

### 7.5 灾难恢复

```bash
# 从备份恢复数据库
gunzip -c backups/20260608_120000/cinacoin_auth_backup.sql.gz | \
  docker exec -i cinacoin-db-primary psql -U cinacoin -d cinacoin_auth

# 恢复 Redis（如果需要）
docker exec -i cinacoin-redis-primary redis-cli -a ULwncxfztz8jCRIvKeQIe77xv4GdyNry < backups/redis-dump.rdb
```

---

## 附录

### A. 端口清单

| 服务 | 端口 | 协议 | 访问 |
|------|------|------|------|
| Auth Service | 3200 | HTTP | 本地/负载均衡器 |
| PostgreSQL Primary | 5432 | TCP | 本地/应用 |
| PostgreSQL Replica | 5433 | TCP | 本地/应用 |
| Redis Primary | 6379 | TCP | 本地/应用 |
| Redis Replica | 6380 | TCP | 本地/应用 |
| Prometheus | 9090 | HTTP | 本地 |
| Grafana | 3000 | HTTP | 本地 |
| Backup Service | 8080 | HTTP | 本地 |

### B. 文件结构

```
deploy/production/
├── config/
│   ├── .env.production          # 生产环境变量
│   ├── .env.secrets.template    # 密钥模板
│   ├── postgresql.conf          # PostgreSQL 配置
│   └── redis.conf               # Redis 配置
├── scripts/
│   ├── migrate-database.sh      # 数据库迁移脚本
│   ├── verify-dns.sh            # DNS 验证脚本
│   └── prepare-ssl.sh           # SSL 证书准备脚本
├── secrets/
│   ├── jwt-private.pem          # JWT 私钥
│   ├── jwt-public.pem           # JWT 公钥
│   ├── db_password.txt          # 数据库密码
│   ├── redis_password.txt       # Redis 密码
│   └── grafana_admin_password.txt
├── backups/                     # 数据库备份目录
├── logs/                        # 日志目录
├── certs/                       # SSL 证书目录
├── docker-compose.prod.yml      # 生产 Docker Compose 配置
└── DEPLOYMENT_GUIDE.md          # 本文档
```

### C. 安全建议

1. **定期轮换密钥**: 每 90 天轮换一次 JWT 密钥和数据库密码
2. **备份验证**: 定期测试备份恢复流程
3. **监控告警**: 配置 Prometheus/Grafana 告警规则
4. **访问控制**: 限制数据库和 Redis 的访问 IP
5. **SSL 证书**: 在到期前 30 天更新证书
6. **安全更新**: 定期更新 Docker 镜像和依赖

### D. 联系支持

- **技术支持**: support@cinacoin.com
- **紧急联系**: oncall@cinacoin.com
- **文档**: https://docs.cinacoin.com

---

**文档版本**: 1.0.0  
**最后更新**: 2026-06-08  
**维护者**: Cinacoin DevOps Team
