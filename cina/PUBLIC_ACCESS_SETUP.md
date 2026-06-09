# 🌐 cina 区块链 - 公网访问配置方案

## 📊 当前状态

| 组件 | 状态 |
|------|------|
| 区块链节点 | ✅ 正常运行 (高度：3600+) |
| 本地 RPC | ✅ http://localhost:26657 |
| 本地 API | ✅ http://localhost:1317 |
| Cloudflare Tunnel | ✅ 运行中 (4 个连接) |
| DNS 解析 | ✅ 正确 |
| 公网访问 | ❌ 需要配置 |

## 🔍 问题原因

Cloudflare Tunnel 需要**在 Dashboard 手动配置 Public Hostnames**，或者使用配置文件方式。

## ✅ 解决方案

### 方案 1: Cloudflare Dashboard 配置 (推荐)

**步骤**:

1. 登录 https://dash.cloudflare.com
2. 进入 **Zero Trust** → **Access** → **Tunnels**
3. 找到 `cina-rpc` tunnel
4. 点击 **Configure**
5. 点击 **Public Hostnames** 标签
6. 添加以下 hostname：

```
Subdomain: rpc
Domain: cinachain.com
Service: http://127.0.0.1:26657
```

```
Subdomain: api
Domain: cinachain.com
Service: http://127.0.0.1:1317
```

```
Subdomain: grpc
Domain: cinachain.com
Service: http://127.0.0.1:9090
```

7. 保存配置
8. 等待 1-2 分钟

### 方案 2: 使用配置文件 (已配置)

当前已使用配置文件方式，但需要确保配置正确加载：

```bash
# 检查配置文件
cat ~/.cloudflared/config.yml

# 重启 Tunnel
pkill -f cloudflared
cloudflared tunnel run a0448517-a975-4df0-9a4d-e7fd54377117
```

### 方案 3: 临时测试 URL

使用 Cloudflare Quick Tunnel 获取临时 URL：

```bash
# 停止当前 Tunnel
pkill -f cloudflared

# 启动临时 Tunnel
cloudflared tunnel --url http://localhost:26657

# 会返回类似：https://xxx-yyy-zzz.trycloudflare.com
```

## 🚀 立即测试

### 本地访问 (立即可用)

```bash
# RPC
curl http://localhost:26657/status

# API
curl http://localhost:1317/node_info

# 区块链浏览器
打开 http://localhost:5173
```

### 公网访问 (配置后)

```bash
# RPC
curl https://rpc.cinachain.com/status

# API
curl https://api.cinachain.com/node_info
```

## 📋 配置检查清单

- [x] 区块链节点运行中
- [x] API 服务器已启用
- [x] Cloudflare Tunnel 运行中
- [x] DNS 记录已配置
- [ ] **Cloudflare Dashboard Public Hostnames 配置** ← 需要完成

## 🔧 自动化脚本

创建自动配置脚本：

```bash
#!/bin/bash
# 检查 Tunnel 状态
if ! pgrep -f "cloudflared tunnel" > /dev/null; then
    echo "重启 Cloudflare Tunnel..."
    cloudflared tunnel run a0448517-a975-4df0-9a4d-e7fd54377117 &
fi

# 检查节点状态
if ! curl -s http://localhost:26657/status > /dev/null; then
    echo "重启区块链节点..."
    pkill cinad
    sleep 2
    cd /home/cina/.openclaw/workspace/cina && ./cinad start &
fi

echo "✅ 服务检查完成"
```

## 📞 获取帮助

如果配置后仍然无法访问：

1. 检查 Tunnel 日志：`tail -f /tmp/cloudflared_restart.log`
2. 检查节点日志：`tail -f /tmp/cinad.log`
3. 测试本地访问：`curl http://localhost:26657/status`

---

**更新时间**: 2026-03-27 01:22 UTC  
**下一步**: 在 Cloudflare Dashboard 配置 Public Hostnames
