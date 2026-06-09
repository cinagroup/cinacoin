# 无头 Ubuntu 服务器配置 Cloudflare Tunnel 指南

## 📋 前提条件

- Ubuntu 服务器（无 GUI）
- cloudflared 已安装
- Cloudflare 账号
- 域名 `cinachain.com` 已添加到 Cloudflare

## 🔑 方案一：API Token（推荐）

### 步骤 1：获取 API Token（在本地电脑操作）

1. 访问：https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
2. 点击 "Create Token"
3. 选择 "Custom Token"
4. 权限设置：
   ```
   Account -> Cloudflare Tunnel -> Edit
   Account -> DNS -> Edit
   ```
5. 复制 Token

### 步骤 2：在服务器上设置环境变量

```bash
# 编辑 ~/.bashrc 或 ~/.profile
echo 'export CLOUDFLARE_API_TOKEN="your-token-here"' >> ~/.bashrc
echo 'export CLOUDFLARE_ACCOUNT_ID="your-account-id"' >> ~/.bashrc
source ~/.bashrc

# 验证
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_ACCOUNT_ID
```

### 步骤 3：运行配置脚本

```bash
cd /home/cina/.openclaw/workspace/cina
chmod +x setup-cloudflared-headless.sh
./setup-cloudflared-headless.sh
```

---

## 📁 方案二：本地生成证书后上传

### 步骤 1：在本地电脑生成证书

```bash
# 在本地电脑（有浏览器）
cloudflared tunnel login
cloudflared tunnel create --name cina-rpc
```

### 步骤 2：复制证书文件到服务器

```bash
# 在本地电脑
scp ~/.cloudflared/*.json user@your-server:~/.cloudflared/
scp ~/.cloudflared/config.yml user@your-server:~/.cloudflared/
```

### 步骤 3：在服务器上运行

```bash
# 在服务器上
cloudflared tunnel run cina-rpc
```

---

## 🔧 方案三：手动配置（最灵活）

### 步骤 1：创建 Tunnel（使用 API）

```bash
# 设置变量
API_TOKEN="your-token"
ACCOUNT_ID="your-account-id"
TUNNEL_NAME="cina-rpc"

# 创建 Tunnel
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/cfd_tunnel" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"name\":\"$TUNNEL_NAME\",\"type\":\"cfd_tunnel\"}"

# 保存返回的 tunnel ID
```

### 步骤 2：创建配置文件

```bash
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: <tunnel-id>
credentials-file: /home/cina/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: rpc.cinachain.com
    service: http://127.0.0.1:26657
  - hostname: api.cinachain.com
    service: http://127.0.0.1:1317
  - hostname: grpc.cinachain.com
    service: http://127.0.0.1:9090
  - service: http_status:404
EOF
```

### 步骤 3：配置 DNS

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/cfd_tunnel_routes" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{
    \"tunnel_id\": \"<tunnel-id>\",
    \"cname\": \"rpc.cinachain.com\",
    \"name\": \"rpc\"
  }"
```

### 步骤 4：启动 Tunnel

```bash
cloudflared tunnel run <tunnel-id>
```

---

## 🔄 设置为系统服务（开机自启）

```bash
# 安装服务
cloudflared service install

# 启动服务
sudo systemctl start cloudflared

# 设置开机自启
sudo systemctl enable cloudflared

# 查看状态
sudo systemctl status cloudflared

# 查看日志
sudo journalctl -u cloudflared -f
```

---

## 📝 环境变量快捷设置

```bash
# 添加到 ~/.bashrc
cat >> ~/.bashrc << 'EOF'

# Cloudflare API
export CLOUDFLARE_API_TOKEN="your-token-here"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_TUNNEL_ID="your-tunnel-id"
EOF

# 重新加载
source ~/.bashrc
```

---

## 🧪 验证配置

```bash
# 检查 Tunnel 状态
cloudflared tunnel list

# 测试连接
curl https://rpc.cinachain.com/status

# 查看日志
cloudflared tunnel run --hostname rpc.cinachain.com http://localhost:26657
```

---

## ⚠️ 常见问题

### 1. "Cannot determine user's homedir"
```bash
export HOME=/home/your-username
```

### 2. "API token invalid"
- 检查 Token 是否正确复制
- 确认 Token 权限包含 Tunnel 和 DNS

### 3. "Tunnel already exists"
```bash
# 删除现有 Tunnel
cloudflared tunnel delete cina-rpc
# 重新创建
cloudflared tunnel create --name cina-rpc
```

### 4. DNS 记录不生效
- 等待 DNS 传播（通常几分钟）
- 检查 Cloudflare DNS 设置
- 确认域名已添加到 Cloudflare

---

## 📞 获取帮助

```bash
# 查看 cloudflared 帮助
cloudflared --help

# 查看 tunnel 命令帮助
cloudflared tunnel --help

# 查看日志级别
cloudflared tunnel run --loglevel debug
```
