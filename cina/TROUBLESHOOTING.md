# 🔧 连接问题排查

## 当前状态

- ✅ Tunnel 运行中 (4 个边缘节点连接)
- ✅ 本地节点正常 (高度：1166)
- ✅ DNS 记录已配置
- ⚠️ HTTPS 连接超时

## 可能原因

### 1. Cloudflare DNS 传播延迟
某些地区的 DNS 可能需要更长时间传播。

**解决方案：**
```bash
# 使用 Cloudflare DNS 测试
curl -s --resolve rpc.cinachain.com:443:1.1.1.1 https://rpc.cinachain.com/status
```

### 2. Tunnel 配置问题
检查 ingress 配置是否正确。

**验证配置：**
```bash
cat ~/.cloudflared/config.yml
```

### 3. 防火墙/网络问题
服务器可能阻止了出站连接。

**检查：**
```bash
# 查看 cloudflared 进程
ps aux | grep cloudflared

# 查看连接
netstat -tunlp | grep cloudflared
```

## 🔄 快速修复

### 方案 1：使用 Cloudflare 快速 DNS
```bash
# 在本地电脑修改 hosts 文件测试
echo "1.1.1.1 rpc.cinachain.com" | sudo tee -a /etc/hosts
```

### 方案 2：直接访问 Tunnel URL
```bash
curl https://a0448517-a975-4df0-9a4d-e7fd54377117.cfargotunnel.com/status
```

### 方案 3：重启 Tunnel
```bash
pkill -f cloudflared
sleep 2
cloudflared tunnel run a0448517-a975-4df0-9a4d-e7fd54377117 &
```

## 📊 诊断命令

```bash
# 检查 DNS 解析
dig rpc.cinachain.com

# 测试本地连接
curl http://localhost:26657/status

# 查看 Tunnel 日志
tail -f /tmp/cloudflared.log

# 检查 Cloudflare 状态
curl http://localhost:2000/metrics
```

## ⏳ 等待 DNS 完全传播

DNS 全球传播可能需要 5-15 分钟。请稍后再试。

---

**最后更新**: 2026-03-26 08:30 UTC
