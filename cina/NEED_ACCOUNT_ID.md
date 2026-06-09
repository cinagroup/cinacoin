# ⚠️ 需要 Account ID

您的 API Token 有效，但没有返回账号信息。

## 获取 Account ID

### 方法 1：从 Cloudflare Dashboard
1. 登录 https://dash.cloudflare.com
2. 右侧显示 **Account ID**

### 方法 2：使用 API
```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer REDACTED_CLOUDFLARE_TOKEN" \
  -H "Content-Type: application/json"
```

### 方法 3：检查 Token 权限
您的 Token 可能需要以下权限：
- `Account.Account Settings:Read`
- `Account.Cloudflare Tunnel:Edit`
- `Account.DNS:Edit`

## 重新创建 Token

1. 访问：https://dash.cloudflare.com/profile/api-tokens
2. 删除现有 Token
3. 创建新 Token：
   - 模板：**Custom Token**
   - 权限：
     ```
     Account → Account Settings → Read
     Account → Cloudflare Tunnel → Edit  
     Account → DNS → Edit
     ```
   - 区域：所有区域

## 配置命令

获取 Account ID 后运行：

```bash
export CLOUDFLARE_API_TOKEN="REDACTED_CLOUDFLARE_TOKEN"
export CLOUDFLARE_ACCOUNT_ID="你的-account-id"

cd /home/cina/.openclaw/workspace/cina
./setup-cloudflared-headless.sh
```

---

## 或者：手动创建 Tunnel

```bash
# 1. 创建 tunnel
cloudflared tunnel create cina-rpc

# 这会生成 credentials 文件在 ~/.cloudflared/

# 2. 创建配置
cat > ~/.cloudflared/config.yml << EOF
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

# 3. 启动
cloudflared tunnel run cina-rpc
```

然后在 Cloudflare Dashboard 手动添加 DNS 记录。
