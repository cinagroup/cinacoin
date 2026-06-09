# 🎉 cina 区块链 Tunnel 配置完成

## ✅ 当前状态

| 项目 | 状态 |
|------|------|
| Tunnel ID | `a0448517-a975-4df0-9a4d-e7fd54377117` |
| Tunnel 连接 | ✅ 运行中 (4 个边缘节点) |
| DNS 配置 | ✅ 已配置 |
| DNS 传播 | ⏳ 进行中 (1-5 分钟) |
| 区块高度 | 942+ |

## 🌐 DNS 记录

```
rpc.cinachain.com   CNAME   a0448517-a975-4df0-9a4d-e7fd54377117.cfargotunnel.com
api.cinachain.com   CNAME   a0448517-a975-4df0-9a4d-e7fd54377117.cfargotunnel.com
grpc.cinachain.com  CNAME   a0448517-a975-4df0-9a4d-e7fd54377117.cfargotunnel.com
```

## 🧪 验证连接

等待 1-5 分钟后测试：

```bash
# 测试 RPC
curl https://rpc.cinachain.com/status

# 测试 API (需启用 API 服务器)
curl https://api.cinachain.com/node_info

# 测试 gRPC
grpcurl -plaintext grpc.cinachain.com:443 list
```

## 📊 监控命令

```bash
# 查看 Tunnel 状态
cloudflared tunnel list

# 查看实时日志
tail -f /tmp/cloudflared.log

# 查看指标
curl http://localhost:2000/metrics

# 检查区块链高度
curl http://localhost:26657/status | python3 -c "import sys,json; d=json.load(sys.stdin); print('高度:', d['result']['sync_info']['latest_block_height'])"
```

## 🔧 管理服务

```bash
# 安装系统服务
cloudflared service install

# 启动服务
sudo systemctl start cloudflared

# 开机自启
sudo systemctl enable cloudflared

# 查看状态
sudo systemctl status cloudflared
```

## ⚠️ API 服务器

当前 API 服务器未启用，需要重启区块链节点：

```bash
# 停止当前节点 (Ctrl+C)
# 确保 ~/.cina/config/app.toml 中 enabled = true
# 重新启动
./cinad start
```

## 📱 访问地址

DNS 完全传播后，可以通过以下地址访问：

- **RPC**: https://rpc.cinachain.com/status
- **API**: https://api.cinachain.com/node_info
- **gRPC**: grpc.cinachain.com:443

---

**配置时间**: 2026-03-26 08:06 UTC
**最后更新**: 2026-03-26 08:11 UTC
