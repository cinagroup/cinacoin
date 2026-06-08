#!/bin/bash
# Cinacoin 生产密钥生成脚本
# 用法: ./scripts/generate-secrets.sh [output-file]

set -e

OUTPUT_FILE="${1:-.env.production}"

echo "🔐 Cinacoin 生产密钥生成器"
echo "=========================="
echo ""

# 生成随机密钥函数
generate_key() {
    local length=${1:-32}
    openssl rand -hex "$length" 2>/dev/null || head -c "$((length * 2))" /dev/urandom | od -An -tx1 | tr -d ' \n'
}

# 生成 base64 编码密钥
generate_base64_key() {
    local length=${1:-32}
    openssl rand -base64 "$length" 2>/dev/null || head -c "$length" /dev/urandom | base64
}

# 生成以太坊私钥 (32 bytes = 64 hex chars)
generate_eth_private_key() {
    openssl rand -hex 32
}

echo "正在生成密钥..."
echo ""

# 核心密钥
ENCRYPTION_KEY=$(generate_key 32)
JWT_SECRET=$(generate_key 32)
SESSION_SECRET=$(generate_key 32)

# 数据库密钥
DB_PASSWORD=$(generate_base64_key 24)
REDIS_PASSWORD=$(generate_base64_key 24)

# API 密钥
BUNDLER_API_KEY=$(generate_key 24)
PAYMASTER_API_KEY=$(generate_key 24)

# 以太坊私钥 (用于 Bundler/Paymaster)
BUNDLER_PRIVATE_KEY=$(generate_eth_private_key)
PAYMASTER_PRIVATE_KEY=$(generate_eth_private_key)

# Webhook 密钥
WEBHOOK_SECRET=$(generate_key 24)

# 写入文件
cat > "$OUTPUT_FILE" << EOF
# Cinacoin 生产环境配置
# 生成时间: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# ⚠️ 请妥善保管此文件，不要提交到版本控制

# ===================
# 核心安全密钥
# ===================

# 密钥服务加密密钥 (用于加密用户私钥)
ENCRYPTION_KEY=$ENCRYPTION_KEY

# JWT 签名密钥
JWT_SECRET=$JWT_SECRET

# Session 签名密钥
SESSION_SECRET=$SESSION_SECRET

# ===================
# 数据库凭据
# ===================

# PostgreSQL 密码
DB_PASSWORD=$DB_PASSWORD

# Redis 密码
REDIS_PASSWORD=$REDIS_PASSWORD

# ===================
# API 密钥
# ===================

# Bundler JSON-RPC API 密钥
BUNDLER_API_KEY=$BUNDLER_API_KEY

# Paymaster API 密钥
PAYMASTER_API_KEY=$PAYMASTER_API_KEY

# ===================
# 区块链私钥
# ===================

# Bundler 执行私钥 (用于提交 UserOp)
BUNDLER_PRIVATE_KEY=$BUNDLER_PRIVATE_KEY

# Paymaster 签名私钥
PAYMASTER_PRIVATE_KEY=$PAYMASTER_PRIVATE_KEY

# ===================
# Webhook 密钥
# ===================

# Webhook 签名密钥
WEBHOOK_SECRET=$WEBHOOK_SECRET

# ===================
# 外部服务 (需要手动配置)
# ===================

# Cloudflare API Token (从 Cloudflare Dashboard 获取)
CF_API_TOKEN=your_cloudflare_api_token_here

# MoonPay API Key (从 MoonPay Dashboard 获取)
NEXT_PUBLIC_MOONPAY_API_KEY=pk_test_your_key_here

# WalletConnect Project ID (从 cloud.walletconnect.com 获取)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# ===================
# 环境配置
# ===================

NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production

# 允许的域名 (逗号分隔)
ALLOWED_ORIGINS=https://your-domain.com,https://app.your-domain.com

# Bundler 允许的 API 密钥 (逗号分隔，支持多个)
BUNDLER_API_KEYS=$BUNDLER_API_KEY

# 是否跳过 Bundler 认证 (生产环境必须为 false)
BUNDLER_SKIP_AUTH=false
EOF

# 设置文件权限
chmod 600 "$OUTPUT_FILE"

echo ""
echo "✅ 密钥已生成并保存到: $OUTPUT_FILE"
echo ""
echo "📋 生成的密钥:"
echo "   - ENCRYPTION_KEY: ${#ENCRYPTION_KEY} 字符"
echo "   - JWT_SECRET: ${#JWT_SECRET} 字符"
echo "   - SESSION_SECRET: ${#SESSION_SECRET} 字符"
echo "   - DB_PASSWORD: ${#DB_PASSWORD} 字符"
echo "   - REDIS_PASSWORD: ${#REDIS_PASSWORD} 字符"
echo "   - BUNDLER_API_KEY: ${#BUNDLER_API_KEY} 字符"
echo "   - BUNDLER_PRIVATE_KEY: ${#BUNDLER_PRIVATE_KEY} 字符"
echo ""
echo "⚠️  重要提示:"
echo "   1. 请将此文件保存到安全位置 (如 AWS Secrets Manager, Vault 等)"
echo "   2. 不要将此文件提交到 Git"
echo "   3. 确保 .env.production 在 .gitignore 中"
echo "   4. 手动配置外部服务密钥 (Cloudflare, MoonPay, WalletConnect)"
echo ""

# 检查 .gitignore
if ! grep -q ".env.production" .gitignore 2>/dev/null; then
    echo "📝 建议添加 .env.production 到 .gitignore"
    echo "   echo '.env.production' >> .gitignore"
fi
