#!/bin/bash
set -e

echo "🚀 Deploying Cinacoin to Cloudflare..."

# 1. 创建 D1 数据库
echo "📦 Creating D1 databases..."
wrangler d1 create cinacoin-auth || true
wrangler d1 create cinacoin-users || true

# 2. 运行数据库迁移
echo "🗃️ Running database migrations..."
wrangler d1 execute cinacoin-auth --file=d1/migrations/0001_init.sql

# 3. 创建 KV 命名空间
echo "🔑 Creating KV namespaces..."
wrangler kv:namespace create RATE_LIMIT_KV || true
wrangler kv:namespace create SESSION_KV || true

# 4. 创建 R2 存储桶
echo "📁 Creating R2 buckets..."
wrangler r2 bucket create cinacoin-avatars || true
wrangler r2 bucket create cinacoin-backups || true

# 5. 部署 Workers
echo "⚡ Deploying Workers..."
cd workers/auth-service && wrangler deploy
cd ../user-service && wrangler deploy
cd ../api-gateway && wrangler deploy

# 6. 部署 Pages
echo "📄 Deploying Pages..."
cd ../../apps/website && wrangler pages deploy .vercel/output/static --project-name=cinacoin-website
cd ../unified-dashboard && wrangler pages deploy .vercel/output/static --project-name=cinacoin-dashboard

echo "✅ Deployment complete!"
