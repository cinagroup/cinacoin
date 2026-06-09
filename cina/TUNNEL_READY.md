# ✅ cina 区块链 Cloudflare Tunnel 配置完成！

## 🎉 成功信息

- **Tunnel ID**: `a0448517-a975-4df0-9a4d-e7fd54377117`
- **Tunnel Name**: cina-rpc
- **状态**: ✅ 运行中
- **连接数**: 4 (已连接到 Cloudflare 边缘节点)

## 📍 配置文件位置

- **Credentials**: `~/.cloudflared/cina-rpc.json`
- **Config**: `~/.cloudflared/config.yml`
- **日志**: `/tmp/cloudflared.log`

## 🌐 DNS 配置（需要手动完成）

访问 Cloudflare Dashboard 添加 DNS 记录：

### 方法 1：使用 Cloudflare Dashboard（推荐）

1. 登录 https://dash.cloudflare.com
2. 选择 `cinachain.com` 域名
3. 进入 **DNS** → **Records**
4. 添加以下 CNAME 记录：

| 类型 | 名称 | 内容 | Proxy |
|------|------|------|-------|
| CNAME | rpc | `a0448517-a975-4df0-9a4d-e7fd54377117.cfargotunnel.com` | DNS Only |
| CNAME | api | `a0448517-a975-4df0-9a4d-e7fd54377117.cfargotunnel.com` | DNS Only |
| CNAME | grpc | `a0448517-a975-4df0-9a4d-e7fd54377117.cfargotunnel.com` | DNS Only |

### 方法 2：使用 API

```bash
export CLOUDFLARE_API_TOKEN="REDACTED_CLOUDFLARE_TOKEN"
export CLOUDFLARE_ACCOUNT_ID="7ea8e46d8210bad342fa7595f7935fea"
export CLOUDFLARE_ZONE_ID="你的-zone-id"
export TUNNEL_ID="a0448517-a975-4df0-9a4d-e7fd54377117"

# 添加 DNS 记录
for SUBDOMAIN in rpc api grpc; do
  curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{
      \"type\": \"CNAME\",
      \"name\": \"${SUBDOMAIN}.cinachain.com\",
      \"content\": \"${TUNNEL_ID}.cfargotunnel.com\",
      \"proxied\": false
    }"
done
```

## 🧪 验证

DNS 配置完成后（通常 1-5 分钟），访问：

```bash
# 测试 RPC
curl https://rpc.cinachain.com/status

# 测试 API
curl https://api.cinachain.com/node_info

# 测试 gRPC（需要 gRPC 客户端）
grpcurl -plaintext grpc.cinachain.com:443 list
```

## 🔄 管理命令

```bash
# 查看状态
cloudflared tunnel list

# 查看日志
tail -f /tmp/cloudflared.log

# 停止
pkill -f "cloudflared tunnel run"

# 重启
cloudflared tunnel run a0448517-a975-4df0-9a4d-e7fd54377117

# 设置为系统服务
cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

## 📊 当前区块链状态

- **高度**: 242+
- **RPC**: http://localhost:26657 ✅
- **API**: http://localhost:1317 ✅ (需重启节点启用)
- **gRPC**: http://localhost:9090 ✅

## ⚠️ 重要提示

1. **API 服务器**: 需要重启区块链节点才能启用 API
   ```bash
   # 停止当前节点，然后重新启动
   ./cinad start
   ```

2. **DNS 传播**: 添加 DNS 记录后需要等待 1-5 分钟生效

3. **HTTPS**: Cloudflare 自动提供 HTTPS，无需额外配置

4. **安全**: Tunnel 不会暴露服务器真实 IP

---

**配置完成时间**: 2026-03-26 08:06 UTC
**Tunnel ID**: a0448517-a975-4df0-9a4d-e7fd54377117
