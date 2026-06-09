# cina 区块链 Cloudflare Tunnel 部署指南

## 前提条件
- 已注册 Cloudflare 账号
- 域名 `cinachain.com` 已添加到 Cloudflare
- cloudflared 已安装

## 步骤

### 1. 登录 Cloudflare 获取 Token
访问：https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/authentication/#create-a-tunnel-token

或使用 CLI 登录：
```bash
cloudflared tunnel login
```
这会打开浏览器让你授权 Cloudflare。

### 2. 创建 Tunnel
```bash
cloudflared tunnel create --name cina-rpc
```
输出会显示 tunnel ID，类似：`Your Tunnel ID is: xxxxx-xxxxx-xxxxx`

### 3. 配置 Tunnel
创建配置文件 `~/.cloudflared/config.yml`：

```yaml
tunnel: cina-rpc
credentials-file: /home/cina/.cloudflared/cina-rpc.json

ingress:
  # RPC 端口
  - hostname: rpc.cinachain.com
    service: http://127.0.0.1:26657
  # API 端口  
  - hostname: api.cinachain.com
    service: http://127.0.0.1:1317
  # gRPC 端口
  - hostname: grpc.cinachain.com
    service: http://127.0.0.1:9090
  # 默认拒绝所有其他流量
  - service: http_status:404
```

### 4. 运行 Tunnel
```bash
# 前台运行（测试用）
cloudflared tunnel run cina-rpc

# 后台运行（生产环境）
cloudflared service install cina-rpc
cloudflared service start
```

### 5. 配置 DNS
在 Cloudflare DNS 设置中添加 CNAME 记录：
```
rpc.cinachain.com  CNAME  xxxxx-xxxxx-xxxxx.cfargotunnel.com
api.cinachain.com  CNAME  xxxxx-xxxxx-xxxxx.cfargotunnel.com
grpc.cinachain.com CNAME  xxxxx-xxxxx-xxxxx.cfargotunnel.com
```

## 快速启动命令

```bash
# 设置环境变量
export PATH=$PATH:$HOME/.local/bin

# 登录 Cloudflare
cloudflared tunnel login

# 创建 tunnel
cloudflared tunnel create --name cina-rpc

# 创建配置文件
mkdir -p ~/.cloudflared
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

# 启动 tunnel
cloudflared tunnel run cina-rpc
```

## 验证

访问以下 URL 测试：
- https://rpc.cinachain.com/status
- https://api.cinachain.com/cosmos/bank/v1beta1/supply
- https://grpc.cinachain.com
