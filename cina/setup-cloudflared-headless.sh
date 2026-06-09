#!/bin/bash
# cina 区块链 - 无头服务器 Cloudflare Tunnel 配置脚本
# 使用 API Token，无需浏览器

set -e

CLOUDFLARED="$HOME/.local/bin/cloudflared"
CONFIG_DIR="$HOME/.cloudflared"
TUNNEL_NAME="cina-rpc"

echo "=== cina 区块链 Cloudflare Tunnel 配置（无头模式）==="
echo ""

# 检查环境变量
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "错误：请设置 CLOUDFLARE_API_TOKEN 环境变量"
    echo ""
    echo "获取 Token 步骤："
    echo "1. 访问：https://developers.cloudflare.com/fundamentals/api/get-started/create-token/"
    echo "2. 创建 Token，权限选择："
    echo "   - Cloudflare Tunnel: Edit"
    echo "   - DNS: Edit"
    echo "3. 复制 Token 到服务器："
    echo "   export CLOUDFLARE_API_TOKEN='your-token'"
    echo ""
    exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "错误：请设置 CLOUDFLARE_ACCOUNT_ID 环境变量"
    echo ""
    echo "获取 Account ID："
    echo "1. 登录 Cloudflare Dashboard"
    echo "2. 右侧显示 Account ID"
    echo "3. 或访问：https://api.cloudflare.com/client/v4/accounts"
    echo ""
    exit 1
fi

# 创建配置目录
mkdir -p "$CONFIG_DIR"

# 创建 Tunnel
echo "正在创建 Tunnel..."
TUNNEL_OUTPUT=$($CLOUDFLARED tunnel create --output json --name "$TUNNEL_NAME" 2>&1)
TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TUNNEL_ID" ]; then
    echo "创建 Tunnel 失败"
    echo "输出：$TUNNEL_OUTPUT"
    exit 1
fi

echo "✓ Tunnel 创建成功：$TUNNEL_ID"

# 创建配置文件
echo ""
echo "正在创建配置文件..."
cat > "$CONFIG_DIR/config.yml" << EOF
tunnel: $TUNNEL_ID
credentials-file: $CONFIG_DIR/${TUNNEL_NAME}.json

metrics: 0.0.0.0:2000

ingress:
  # RPC 端口 - Tendermint/CometBFT RPC
  - hostname: rpc.cinachain.com
    service: http://127.0.0.1:26657
    origin-config:
      connectTimeout: 30s
  # API 端口 - Cosmos SDK REST API
  - hostname: api.cinachain.com
    service: http://127.0.0.1:1317
    origin-config:
      connectTimeout: 30s
  # gRPC 端口
  - hostname: grpc.cinachain.com
    service: http://127.0.0.1:9090
    origin-config:
      connectTimeout: 30s
  # 默认拒绝
  - service: http_status:404
EOF

echo "✓ 配置文件已创建：$CONFIG_DIR/config.yml"

# 配置 DNS
echo ""
echo "正在配置 DNS 记录..."

# 使用 curl 配置 DNS
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/cfd_tunnel_routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{
    \"tunnel_id\": \"$TUNNEL_ID\",
    \"cname\": \"rpc.cinachain.com\",
    \"name\": \"rpc\"
  }" 2>/dev/null || echo "DNS 配置失败，请手动添加"

curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/cfd_tunnel_routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{
    \"tunnel_id\": \"$TUNNEL_ID\",
    \"cname\": \"api.cinachain.com\",
    \"name\": \"api\"
  }" 2>/dev/null || echo "DNS 配置失败，请手动添加"

curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/cfd_tunnel_routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{
    \"tunnel_id\": \"$TUNNEL_ID\",
    \"cname\": \"grpc.cinachain.com\",
    \"name\": \"grpc\"
  }" 2>/dev/null || echo "DNS 配置失败，请手动添加"

echo "✓ DNS 记录已配置"

# 启动 Tunnel
echo ""
echo "正在启动 Tunnel..."
$CLOUDFLARED tunnel run $TUNNEL_ID &
sleep 5

echo ""
echo "=== 配置完成 ==="
echo ""
echo "Tunnel ID: $TUNNEL_ID"
echo ""
echo "访问以下 URL 测试："
echo "  - https://rpc.cinachain.com/status"
echo "  - https://api.cinachain.com/node_info"
echo "  - https://grpc.cinachain.com"
echo ""
echo "后台运行中，PID: $!"
echo ""
echo "停止命令：pkill -f 'cloudflared tunnel run'"
