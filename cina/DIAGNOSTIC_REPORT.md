# 🔧 cina 区块链 - 网络连接问题诊断报告

## 📊 问题分析

### 当前状态

| 组件 | 状态 | 说明 |
|------|------|------|
| **区块链节点** | ✅ 正常运行 | 高度：3565+ |
| **本地 RPC (26657)** | ✅ 正常监听 | 127.0.0.1:26657 |
| **本地 gRPC (9090)** | ✅ 正常监听 | 127.0.0.1:9090 |
| **Cloudflare Tunnel** | ✅ 运行中 | 4 个边缘节点连接 |
| **DNS 解析** | ✅ 正确 | 解析到 Tunnel |
| **公网访问** | ❌ 失败 | HTTPS 无法连接 |

### 问题原因

根据诊断，可能的原因：

1. **Cloudflare Tunnel 配置未同步** - Tunnel 的 ingress 配置可能未同步到 Cloudflare 边缘
2. **API 未启用** - API 服务器 (1317) 未在 app.toml 中启用
3. **防火墙/网络问题** - 某些网络可能阻止了 Cloudflare 连接

## 🔍 诊断步骤

### 1. 检查本地服务

```bash
# 检查 RPC 端口
curl http://localhost:26657/status

# 检查 API 端口 (可能未启用)
curl http://localhost:1317/node_info
```

### 2. 检查 Tunnel 连接

```bash
# 查看 Tunnel 日志
tail -f /tmp/cloudflared_new.log

# 应该看到 "Registered tunnel connection"
```

### 3. 检查 DNS

```bash
dig +short rpc.cinachain.com
# 应该返回：a0448517-a975-4df0-9a4d-e7fd54377117.cfargotunnel.com.
```

## ✅ 解决方案

### 方案 1：启用 API 服务器（必须）

编辑 `~/.cina/config/app.toml`：

```bash
# 找到 [api] 部分
vim ~/.cina/config/app.toml

# 修改：
[api]
enable = true  # 改为 true
```

然后重启区块链节点：

```bash
pkill cinad
cd /home/cina/.openclaw/workspace/cina && ./cinad start
```

### 方案 2：重新配置 Tunnel

```bash
# 停止 Tunnel
pkill -f cloudflared

# 重新启动
cloudflared tunnel run a0448517-a975-4df0-9a4d-e7fd54377117
```

### 方案 3：在 Cloudflare Dashboard 配置

1. 登录 https://dash.cloudflare.com
2. 进入 Zero Trust → Access → Tunnels
3. 找到 `cina-rpc` tunnel
4. 点击 "Configure"
5. 添加 Public Hostnames：
   - `rpc.cinachain.com` → `http://localhost:26657`
   - `api.cinachain.com` → `http://localhost:1317`
   - `grpc.cinachain.com` → `http://localhost:9090`

### 方案 4：使用临时测试 URL

Cloudflare 提供临时测试 URL：

```bash
# 获取 Tunnel URL
cloudflared tunnel list

# 访问：https://<tunnel-id>.trycloudflare.com
```

## 🚀 快速修复步骤

### 步骤 1：启用 API

```bash
# 修改配置
sed -i 's/enable = false/enable = true/' ~/.cina/config/app.toml

# 验证
grep "enable = true" ~/.cina/config/app.toml | head -3
```

### 步骤 2：重启服务

```bash
# 重启区块链节点
pkill cinad
sleep 2
cd /home/cina/.openclaw/workspace/cina && ./cinad start &

# 重启 Tunnel
pkill -f cloudflared
sleep 2
cloudflared tunnel run a0448517-a975-4df0-9a4d-e7fd54377117 &
```

### 步骤 3：等待并测试

等待 2-5 分钟后测试：

```bash
# 测试 RPC
curl https://rpc.cinachain.com/status

# 测试 API
curl https://api.cinachain.com/node_info
```

## 📋 检查清单

- [ ] API 服务器已启用 (`enable = true` in app.toml)
- [ ] 区块链节点正在运行
- [ ] Cloudflare Tunnel 已连接 (4 个边缘节点)
- [ ] DNS 记录正确配置
- [ ] 等待 Cloudflare 同步 (2-5 分钟)

## 🌐 替代访问方式

如果公网访问仍然失败，可以使用：

### 1. 本地访问
```bash
curl http://localhost:26657/status
curl http://localhost:1317/node_info
```

### 2. Cloudflare Quick Tunnels
```bash
cloudflared tunnel --url http://localhost:26657
# 会返回一个临时 URL
```

### 3. SSH 隧道
```bash
ssh -L 26657:localhost:26657 user@server
# 然后本地访问 http://localhost:26657
```

## 📞 需要帮助

如果问题持续，请提供：

1. Tunnel 日志：`tail -50 /tmp/cloudflared_new.log`
2. 节点日志：`tail -50 /tmp/cinad.log`
3. DNS 检查结果：`dig rpc.cinachain.com`

---

**诊断时间**: 2026-03-26 14:25 UTC  
**状态**: 🔍 诊断中  
**下一步**: 启用 API 服务器，重启服务
