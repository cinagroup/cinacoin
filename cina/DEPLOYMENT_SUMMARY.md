# cina 区块链 - Cloudflare Tunnel 部署完成

## ✅ 已完成

1. **cloudflared 已安装**
   - 版本：2026.3.0
   - 路径：`/home/cina/.local/bin/cloudflared`

2. **cina 区块链运行中**
   - 当前高度：242+
   - RPC: `http://localhost:26657`
   - API: `http://localhost:1317` (已启用，需重启节点)
   - gRPC: `http://localhost:9090`

3. **配置文件已创建**
   - `/home/cina/.openclaw/workspace/cina/setup-cloudflared.sh` - 自动配置脚本
   - `/home/cina/.openclaw/workspace/cina/CLOUDFLARE_SETUP.md` - 详细指南

## 📋 下一步操作

### 方法一：自动配置（推荐）

```bash
cd /home/cina/.openclaw/workspace/cina
./setup-cloudflared.sh
```

这会：
1. 打开浏览器登录 Cloudflare
2. 创建 tunnel
3. 生成配置文件

### 方法二：手动配置

```bash
# 1. 登录 Cloudflare
cloudflared tunnel login

# 2. 创建 tunnel
cloudflared tunnel create --name cina-rpc

# 3. 创建配置
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: cina-rpc
credentials-file: /home/cina/.cloudflared/cina-rpc.json

ingress:
  - hostname: rpc.cinachain.com
    service: http://127.0.0.1:26657
  - hostname: api.cinachain.com
    service: http://127.0.0.1:1317
  - hostname: grpc.cinachain.com
    service: http://127.0.0.1:9090
  - service: http_status:404
EOF

# 4. 启动 tunnel
cloudflared tunnel run cina-rpc
```

## 🌐 DNS 配置

在 Cloudflare DNS 设置中添加 CNAME 记录：

| 类型 | 名称 | 内容 |
|------|------|------|
| CNAME | rpc | `<tunnel-id>.cfargotunnel.com` |
| CNAME | api | `<tunnel-id>.cfargotunnel.com` |
| CNAME | grpc | `<tunnel-id>.cfargotunnel.com` |

`tunnel-id` 在创建 tunnel 时显示，或从 `~/.cloudflared/cina-rpc.json` 获取。

## 🔄 重启区块链节点（启用 API）

```bash
# 停止当前节点（在运行节点的地方按 Ctrl+C）
# 然后重新启动
cd /home/cina/.openclaw/workspace/cina
./cinad start
```

## 🧪 验证

配置完成后，访问以下 URL 测试：

- https://rpc.cinachain.com/status
- https://api.cinachain.com/cosmos/bank/v1beta1/supply
- https://grpc.cinachain.com

## 📝 注意事项

1. **域名所有权**: 确保 `cinachain.com` 已添加到你的 Cloudflare 账号
2. **SSL/TLS**: Cloudflare 自动提供 HTTPS
3. **安全**: Tunnel 不暴露服务器公网 IP
4. **持久化**: 使用 `cloudflared service install` 设置为系统服务

## 🔧 常用命令

```bash
# 查看 tunnel 状态
cloudflared tunnel list

# 停止 tunnel
cloudflared service stop

# 启动 tunnel
cloudflared service start

# 查看日志
journalctl -u cloudflared -f

# 删除 tunnel
cloudflared tunnel delete cina-rpc
```
