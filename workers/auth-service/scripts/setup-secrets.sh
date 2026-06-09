#!/usr/bin/env bash
# ============================================================
# CINAcoin Auth Service - Cloudflare Workers Secrets Setup
# ============================================================
# This script sets JWT secrets as Cloudflare Workers secrets.
# Requires: wrangler CLI authenticated (wrangler login)
#
# Usage:
#   chmod +x scripts/setup-secrets.sh
#   ./scripts/setup-secrets.sh [--env production|staging]
#
# IMPORTANT: Run this from the workers/auth-service directory.
# ============================================================

set -euo pipefail

ENV_FLAG=""
ENV_NAME="production"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env)
      ENV_NAME="$2"
      ENV_FLAG="--env $2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "============================================"
echo " CINAcoin Auth - Secrets Setup"
echo " Environment: ${ENV_NAME}"
echo "============================================"
echo ""

# Check wrangler authentication
if ! wrangler whoami &>/dev/null; then
  echo "❌ Not authenticated. Run 'wrangler login' first."
  exit 1
fi

echo "✅ Wrangler authenticated"
echo ""

# Generate secrets if not provided via environment variables
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 48 | tr -d '\n' | head -c 86)}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-$(openssl rand -base64 48 | tr -d '\n' | head -c 86)}"

echo "🔑 Secrets generated (or using env vars)"
echo ""

# Set JWT_SECRET
echo "📤 Setting JWT_SECRET..."
echo -n "$JWT_SECRET" | wrangler secret put JWT_SECRET $ENV_FLAG
echo "   ✅ JWT_SECRET set"

# Set JWT_REFRESH_SECRET
echo "📤 Setting JWT_REFRESH_SECRET..."
echo -n "$JWT_REFRESH_SECRET" | wrangler secret put JWT_REFRESH_SECRET $ENV_FLAG
echo "   ✅ JWT_REFRESH_SECRET set"

echo ""
echo "============================================"
echo " ✅ All secrets configured for ${ENV_NAME}"
echo "============================================"
echo ""
echo "Verify with: wrangler secret list $ENV_FLAG"
echo ""
echo "⚠️  Save these secrets in a secure vault:"
echo "   JWT_SECRET=${JWT_SECRET:0:10}...(${#JWT_SECRET} chars)"
echo "   JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET:0:10}...(${#JWT_REFRESH_SECRET} chars)"
echo ""
echo "🔴 These secrets will NOT be visible again from Workers."
echo "   Store them in your password manager / secrets vault now."
