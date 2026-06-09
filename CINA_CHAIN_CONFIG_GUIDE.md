# Cina Chain 配置完整指南

**最后更新**: 2026-03-27  
**当前状态**: ✅ 正常运行 (高度：7412+)

---

## 📁 配置文件位置

```
/home/cina/.cina/config/
├── config.toml          # CometBFT 核心配置
├── app.toml             # 应用层配置 (Cosmos SDK)
├── client.toml          # CLI 客户端配置
├── genesis.json         # 创世块配置
├── node_key.json        # 节点身份密钥
└── priv_validator_key.json  # 验证者密钥
```

---

## 🔧 1. config.toml - CometBFT 配置

### 1.1 基础配置

```toml
# 节点名称 (可自定义)
moniker = "alice"

# 数据库后端 (推荐 goleveldb)
db_backend = "goleveldb"

# 日志级别 (debug|info|warn|error)
log_level = "info"

# ABCI 连接方式
abci = "socket"
proxy_app = "tcp://127.0.0.1:26658"
```

### 1.2 RPC 配置 ⚠️ 需要修改

```toml
[rpc]
# 当前：仅本地访问
laddr = "tcp://127.0.0.1:26657"

# 建议修改为 (允许公网访问):
laddr = "tcp://0.0.0.0:26657"

# CORS 配置 (公网访问必需):
cors_allowed_origins = ["*"]
cors_allowed_methods = ["HEAD", "GET", "POST", "OPTIONS"]
cors_allowed_headers = ["Origin", "Accept", "Content-Type", "X-Requested-With", "X-Server-Time"]
```

### 1.3 P2P 网络配置 ⚠️ 需要修改

```toml
[p2p]
# 监听地址 (当前正确)
laddr = "tcp://0.0.0.0:26656"

# 外部公告地址 (公网节点必需):
external_address = "YOUR_PUBLIC_IP:26656"

# 种子节点 (可选):
seeds = ""

# 持久连接节点 (可选):
persistent_peers = ""

# 地址簿严格模式 (私有网络设为 false):
addr_book_strict = false

# PEX 节点交换 (私有网络建议关闭):
pex = false
```

### 1.4 共识配置 ⚠️ 可优化

```toml
[consensus]
# 当前配置 (较慢):
timeout_propose = "3s"
timeout_prevote = "1s"
timeout_precommit = "1s"
timeout_commit = "5s"

# 建议优化 (更快出块):
timeout_propose = "1s"
timeout_prevote = "500ms"
timeout_precommit = "500ms"
timeout_commit = "3s"
```

### 1.5 Mempool 配置

```toml
[mempool]
# 最大交易数 (-1 = 无限制)
max-txs = -1

# 建议生产环境设置:
max-txs = 10000
```

---

## 🔧 2. app.toml - Cosmos SDK 配置

### 2.1 基础配置 ✅ 已优化

```toml
# 最低 gas 价格
minimum-gas-prices = "0stake"

# 修剪策略 (根据磁盘空间调整):
pruning = "default"  # 当前设置

# 可选方案:
# pruning = "nothing"    # 保存所有状态 (归档节点)
# pruning = "everything" # 仅保留最近 2 个状态
# pruning = "custom"     # 自定义
```

### 2.2 API 配置 ✅ 已完成

```toml
[api]
enable = true
swagger = true  # ✅ 已启用
address = "tcp://localhost:1317"
max-open-connections = 1000

# 如需公网访问:
enabled-unsafe-cors = true
```

### 2.3 gRPC 配置 ✅ 已完成

```toml
[grpc]
enable = true
address = "localhost:9090"

[grpc-web]
enable = true  # ✅ 已启用
```

### 2.4 状态同步配置 ⚠️ 可选

```toml
[state-sync]
# 当前禁用:
snapshot-interval = 0
snapshot-keep-recent = 2

# 如需支持快速同步:
snapshot-interval = 1000  # 每 1000 块创建快照
snapshot-keep-recent = 2  # 保留 2 个快照
```

### 2.5 遥测配置

```toml
[telemetry]
enabled = true
prometheus-retention-time = 0  # 0 = 禁用 Prometheus

# 如需监控:
prometheus-retention-time = 60  # 60 秒保留时间
```

---

## 🔧 3. client.toml - CLI 配置

```toml
# 当前配置
chain-id = ""           # ⚠️ 应设置为 "cina"
keyring-backend = "os"  # 使用系统密钥环
node = "tcp://localhost:26657"
broadcast-mode = "sync"
```

**建议修改**:
```toml
chain-id = "cina"
keyring-backend = "test"  # 测试环境用 test，生产用 os/file
```

---

## 🔧 4. genesis.json - 创世配置

### 4.1 链信息 ✅ 已配置

```json
{
  "chain_id": "cina",
  "genesis_time": "2026-03-26T06:53:29.465021727Z",
  "initial_height": 1
}
```

### 4.2 初始账户 ⚠️ 需确认

```json
{
  "auth": {
    "accounts": [
      {
        "address": "cosmos1psvqlxd0e4zfxhqmuhg3venykrrmzlf5qz0rrp",
        "account_number": "0"
      }
    ]
  },
  "bank": {
    "balances": [
      {
        "address": "cosmos1psvqlxd0e4zfxhqmuhg3venykrrmzlf5qz0rrp",
        "coins": [{"denom": "stake", "amount": "100000000"}]
      }
    ]
  }
}
```

### 4.3 验证者配置 ⚠️ 需确认

检查验证者是否正确配置：
```bash
./cinad query staking validators -o json | python3 -m json.tool
```

---

## 📋 配置修改清单

### 🔴 必须修改 (公网访问)

| 文件 | 配置项 | 当前值 | 建议值 | 说明 |
|------|--------|--------|--------|------|
| config.toml | `rpc.laddr` | `127.0.0.1:26657` | `0.0.0.0:26657` | 允许外部访问 RPC |
| config.toml | `rpc.cors_allowed_origins` | `[]` | `["*"]` | 允许跨域请求 |
| config.toml | `p2p.addr_book_strict` | `true` | `false` | 私有网络宽松模式 |
| config.toml | `p2p.pex` | `true` | `false` | 私有网络关闭 PEX |

### 🟡 建议修改 (性能优化)

| 文件 | 配置项 | 当前值 | 建议值 | 说明 |
|------|--------|--------|--------|------|
| config.toml | `consensus.timeout_commit` | `5s` | `3s` | 更快出块 |
| config.toml | `consensus.timeout_propose` | `3s` | `1s` | 减少提案延迟 |
| client.toml | `chain-id` | `""` | `"cina"` | 设置默认链 ID |
| app.toml | `minimum-gas-prices` | `0stake` | `0.025stake` | 防止垃圾交易 |

### 🟢 可选修改 (功能增强)

| 文件 | 配置项 | 说明 |
|------|--------|------|
| app.toml | `state-sync.snapshot-interval` | 启用状态同步快照 |
| app.toml | `telemetry.prometheus-retention-time` | 启用 Prometheus 监控 |
| config.toml | `p2p.external_address` | 公网 IP 公告 |
| config.toml | `p2p.seeds` | 添加种子节点 |

---

## 🚀 应用配置修改

### 方法 1: 手动编辑

```bash
# 编辑 config.toml
nano /home/cina/.cina/config/config.toml

# 编辑 app.toml
nano /home/cina/.cina/config/app.toml
```

### 方法 2: 使用 sed 批量修改

```bash
# 修改 RPC 监听地址
sed -i 's|^laddr = "tcp://127.0.0.1:26657"|laddr = "tcp://0.0.0.0:26657"|' /home/cina/.cina/config/config.toml

# 修改 CORS
sed -i 's|^cors_allowed_origins = \[\]|cors_allowed_origins = ["*"]|' /home/cina/.cina/config/config.toml

# 修改地址簿严格模式
sed -i 's|^addr_book_strict = true|addr_book_strict = false|' /home/cina/.cina/config/config.toml

# 修改 PEX
sed -i 's|^pex = true|pex = false|' /home/cina/.cina/config/config.toml
```

### 方法 3: 重启节点使配置生效

```bash
# 停止节点
ps aux | grep cinad | grep -v grep | awk '{print $2}' | xargs kill

# 等待 3 秒
sleep 3

# 启动节点
cd /home/cina/.openclaw/workspace/cina
nohup ./cinad start --home /home/cina/.cina > /home/cina/.openclaw/workspace/logs/cinad.log 2>&1 &

# 检查日志
tail -f /home/cina/.openclaw/workspace/logs/cinad.log
```

---

## ✅ 验证配置

### 检查 RPC 访问

```bash
# 本地访问
curl http://localhost:26657/status

# 公网访问 (修改后)
curl http://YOUR_SERVER_IP:26657/status
```

### 检查 API 访问

```bash
# Swagger UI
curl http://api.cinachain.com/swagger/

# API 端点
curl http://api.cinachain.com/cosmos/base/tendermint/v1beta1/node_info
```

### 检查 gRPC 访问

```bash
# gRPC 健康检查
curl http://grpc.cinachain.com/
```

---

## 📊 当前公网访问状态

| 服务 | 域名 | 状态 | 端口 |
|------|------|------|------|
| RPC | `rpc.cinachain.com` | ✅ 正常 | 80 (Cloudflare) |
| API | `api.cinachain.com` | ✅ 正常 | 80 (Cloudflare) |
| gRPC | `grpc.cinachain.com` | ✅ 正常 | 80 (Cloudflare) |
| P2P | - | ⚠️ 需配置 | 26656 |

---

## 🔐 安全建议

1. **防火墙配置**:
   ```bash
   # 允许 Cloudflare IP 范围
   # 允许特定 P2P 端口
   ```

2. **备份密钥**:
   ```bash
   cp /home/cina/.cina/config/priv_validator_key.json /secure/backup/
   cp /home/cina/.cina/config/node_key.json /secure/backup/
   ```

3. **监控告警**:
   - 启用 Prometheus 监控
   - 设置区块高度告警
   - 监控磁盘空间

---

_配置完成后请重启节点使更改生效！_
