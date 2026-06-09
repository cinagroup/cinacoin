# Cina Chain 公网访问配置总结

## ✅ 配置完成时间
**2026-03-27 06:18 UTC**

---

## 📊 服务状态

| 服务 | 域名 | 端口 | 状态 | 说明 |
|------|------|------|------|------|
| **RPC** | `http://rpc.cinachain.com` | 26657 | ✅ 正常 | Tendermint RPC |
| **API** | `http://api.cinachain.com` | 1317 | ✅ 正常 | Cosmos REST API |
| **gRPC** | `http://grpc.cinachain.com` | 9090 | ✅ 正常 | gRPC (h2c) |

---

## 🔧 配置详情

### Cloudflare Tunnel
- **Tunnel ID**: `a0448517-a975-4df0-9a4d-e7fd54377117`
- **Tunnel Name**: `cina-rpc`
- **Account ID**: `7ea8e46d8210bad342fa7595f7935fea`
- **连接状态**: 4 个边缘节点 (LAX)

### DNS 配置
```
rpc.cinachain.com.    CNAME    a0448517-a975-4df0-9a4d-e7fd54377117.cfargotunnel.com
api.cinachain.com.    CNAME    a0448517-a975-4df0-9a4d-e7fd54377117.cfargotunnel.com
grpc.cinachain.com.   CNAME    a0448517-a975-4df0-9a4d-e7fd54377117.cfargotunnel.com
```
- **Proxy 状态**: 🟠 Proxied (橙色云朵)

### Tunnel Ingress 配置
```yaml
ingress:
  - hostname: rpc.cinachain.com
    service: http://127.0.0.1:26657
  - hostname: api.cinachain.com
    service: http://127.0.0.1:1317
  - hostname: grpc.cinachain.com
    service: h2c://127.0.0.1:9090  # HTTP/2 明文
  - service: http_status:404
```

### Page Rules
- ✅ 已删除全局重定向规则 (`*.cinachain.com` → `cinaseek.ai`)
- ✅ `*rpc.cinachain.com/*` → disable_security (优先级 2)
- ✅ `*grpc.cinachain.com/*` → disable_security (优先级 1)

---

## 🧪 测试命令

```bash
# 测试 RPC
curl http://rpc.cinachain.com/status

# 测试 API
curl http://api.cinachain.com/cosmos/base/tendermint/v1beta1/node_info

# 测试 gRPC (需要 grpcurl)
grpcurl -plaintext grpc.cinachain.com:80 list

# 或直接 HTTP 测试
curl http://grpc.cinachain.com/
```

---

## 📝 关键修复步骤

1. **重启 cloudflared Tunnel** - 确保配置生效
2. **删除全局重定向 Page Rule** - 防止 `*.cinachain.com` 重定向到 `cinaseek.ai`
3. **配置 gRPC 为 h2c://** - 启用 HTTP/2 明文传输
4. **添加 Page Rules 例外** - 禁用安全功能，允许 HTTP 访问

---

## 🔑 本地服务

- **cinad 进程**: 运行中 (PID 1102)
- **监听端口**:
  - `127.0.0.1:26657` (RPC)
  - `127.0.0.1:1317` (API)
  - `127.0.0.1:9090` (gRPC)

---

## 📄 相关文件

- **Tunnel 配置**: `/home/cina/.cloudflared/config.yml`
- **Tunnel 凭证**: `/home/cina/.cloudflared/cina-rpc.json`
- **运行日志**: `/home/cina/.openclaw/workspace/logs/cloudflared-rpc.log`
- **区块链数据**: `/home/cina/.openclaw/workspace/cina/`

---

## ⚠️ 注意事项

1. **gRPC 使用 HTTP/1.1 测试会返回 200**，但实际需要使用 gRPC 客户端（如 grpcurl）
2. **SSL/TLS**: 当前使用 HTTP 访问，如需 HTTPS 需在 Cloudflare 开启 SSL
3. **防火墙**: 确保本地防火墙允许 cloudflared 访问

---

_配置完成！所有服务现已通过 Cloudflare Tunnel 公开访问。_
