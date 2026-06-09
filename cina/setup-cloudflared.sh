#!/bin/bash
# cina 区块链 Cloudflare Tunnel 自动配置脚本

set -e

CLOUDFLARED="$HOME/.local/bin/cloudflared"
CONFIG_DIR="$HOME/.cloudflared"
TUNNEL_NAME="cina-rpc"

echo "=== cina 区块链 Cloudflare Tunnel 配置 ==="

# 检查 cloudflared
if [ ! -x "$CLOUDFLARED" ]; then
    echo "错误：cloudflared 未安装"
    exit 1
fi

# 创建配置目录
mkdir -p "$CONFIG_DIR"

# 步骤 1: 登录
echo ""
echo "步骤 1: 登录 Cloudflare"
echo "即将打开浏览器，请点击授权..."
$CLOUDFLARED tunnel login

# 步骤 2: 创建 tunnel
echo ""
echo "步骤 2: 创建 Tunnel"
$CLOUDFLARED tunnel create --name "$TUNNEL_NAME"

# 步骤 3: 创建配置文件
echo ""
echo "步骤 3: 创建配置文件"
cat > "$CONFIG_DIR/config.yml" << EOF
tunnel: $TUNNEL_NAME
credentials-file: $CONFIG_DIR/${TUNNEL_NAME}.json

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

echo "配置文件已创建：$CONFIG_DIR/config.yml"

# 步骤 4: 显示 DNS 配置信息
echo ""
echo "步骤 4: 配置 DNS"
echo ""
echo "请在 Cloudflare DNS 设置中添加以下 CNAME 记录："
echo ""
echo "  类型    名称                    内容"
echo "  CNAME   rpc.cinachain.com       <tunnel-id>.cfargotunnel.com"
echo "  CNAME   api.cinachain.com       <tunnel-id>.cfargotunnel.com"
echo "  CNAME   grpc.cinachain.com      <tunnel-id>.cfargotunnel.com"
echo ""
echo "<tunnel-id> 可以从 $CONFIG_DIR/${TUNNEL_NAME}.json 中获取"
echo ""

# 步骤 5: 启动 tunnel
echo "步骤 5: 启动 Tunnel"
echo ""
echo "测试运行（按 Ctrl+C 停止）："
echo "  $CLOUDFLARED tunnel run $TUNNEL_NAME"
echo ""
echo "或安装为系统服务："
echo "  $CLOUDFLARED service install $TUNNEL_NAME"
echo "  $CLOUDFLARED service start"
echo ""

# 显示当前状态
echo "=== 当前区块链状态 ==="
curl -s http://localhost:26657/status | jq -r '.result.sync_info.latest_block_height' 2>/dev/null || echo "无法获取区块高度"
echo "区块高度"

echo ""
echo "配置完成！"
