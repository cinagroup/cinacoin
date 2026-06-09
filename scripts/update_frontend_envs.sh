#!/usr/bin/env bash
# =============================================================================
# CINAcoin Frontend Environment Update Script
# =============================================================================
# Purpose: Update all Pages apps to use new Cloudflare Workers API endpoints
# Backend migration:
#   - API Gateway:    api.cinacoin.com
#   - Auth Service:   auth.cinacoin.com
#   - User Service:   users.cinacoin.com
#
# Generated: 2026-06-09
# =============================================================================

set -euo pipefail

WORKSPACE="/home/cina/.openclaw/workspace"
APPS_DIR="$WORKSPACE/apps"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# =============================================================================
# 1. Update .env.production files for each Pages app
# =============================================================================

update_env() {
  local app_name="$1"
  local site_url="$2"
  local app_display="$3"
  local env_file="$APPS_DIR/$app_name/.env.production"

  log_info "Updating $app_name/.env.production ..."

  cat > "$env_file" << EOF
# Production Environment Variables - $app_display
# Deployed to Cloudflare Pages
# Updated: 2026-06-09 — Cloudflare Workers backend migration

# API Gateway (Cloudflare Worker)
NEXT_PUBLIC_API_URL=https://api.cinacoin.com

# Auth Service (Cloudflare Worker)
NEXT_PUBLIC_AUTH_URL=https://auth.cinacoin.com

# User Service (Cloudflare Worker)
NEXT_PUBLIC_USERS_URL=https://users.cinacoin.com

# WebSocket (via API Gateway)
NEXT_PUBLIC_WS_URL=wss://api.cinacoin.com

# App Config
NEXT_PUBLIC_APP_NAME=$app_display
NEXT_PUBLIC_SITE_URL=$site_url
EOF

  log_info "  ✓ Written $env_file"
}

# Update all 8 Pages apps
update_env "website"             "https://cinacoin.com"               "CinaCoin"
update_env "health-status"       "https://status.cinacoin.com"        "CinaCoin Health Status"
update_env "backend-dashboard"   "https://backend.cinacoin.com"       "CinaCoin Backend Dashboard"
update_env "wallet-explorer"     "https://wallet.cinacoin.com"        "CinaCoin Wallet Explorer"
update_env "cloud-dashboard"     "https://cloud.cinacoin.com"         "CinaCoin Cloud"
update_env "demo"                "https://demo.cinacoin.com"          "CinaCoin Demo"
update_env "unified-dashboard"   "https://app.cinacoin.com"           "CinaCoin Unified Dashboard"
update_env "analytics-dashboard" "https://data.cinacoin.com"          "CinaCoin Analytics"

echo ""
log_info "========================================="
log_info "All .env.production files updated!"
log_info "========================================="
echo ""

# =============================================================================
# 2. Fix hardcoded fallback URLs in onux monorepo source
# =============================================================================

log_info "Fixing hardcoded fallback URLs in onux source code..."

# backend-dashboard/src/lib/services.ts
FILE="$WORKSPACE/onux/apps/backend-dashboard/src/lib/services.ts"
if [ -f "$FILE" ]; then
  sed -i 's|"http://localhost:8787"|"https://api.cinacoin.com"|g' "$FILE"
  log_info "  ✓ Fixed $FILE"
fi

# cloud-dashboard/src/lib/api.ts
FILE="$WORKSPACE/onux/apps/cloud-dashboard/src/lib/api.ts"
if [ -f "$FILE" ]; then
  sed -i 's|"http://localhost:8787"|"https://api.cinacoin.com"|g' "$FILE"
  log_info "  ✓ Fixed $FILE"
fi

# unified-dashboard/src/providers/WebSocketProvider.tsx
FILE="$WORKSPACE/onux/apps/unified-dashboard/src/providers/WebSocketProvider.tsx"
if [ -f "$FILE" ]; then
  sed -i 's|"ws://localhost:8787/ws"|"wss://api.cinacoin.com/ws"|g' "$FILE"
  log_info "  ✓ Fixed $FILE"
fi

# unified-dashboard/.env.example
FILE="$WORKSPACE/onux/apps/unified-dashboard/.env.example"
if [ -f "$FILE" ]; then
  sed -i 's|ws://localhost:8787/ws|wss://api.cinacoin.com/ws|g' "$FILE"
  sed -i 's|http://localhost:8787|https://api.cinacoin.com|g' "$FILE"
  sed -i 's|http://localhost:8787/auth|https://auth.cinacoin.com|g' "$FILE"
  log_info "  ✓ Fixed $FILE"
fi

# user-service/src/lib/config.ts
FILE="$WORKSPACE/onux/apps/user-service/src/lib/config.ts"
if [ -f "$FILE" ]; then
  sed -i "s|'http://localhost:3200'|'https://auth.cinacoin.com'|g" "$FILE"
  sed -i "s|'http://localhost:8787'|'https://api.cinacoin.com'|g" "$FILE"
  log_info "  ✓ Fixed $FILE"
fi

echo ""
log_info "========================================="
log_info "All hardcoded URLs fixed!"
log_info "========================================="
echo ""

# =============================================================================
# 3. Summary
# =============================================================================

log_info "Next steps:"
log_info "  1. Review changes: git diff apps/ onux/apps/"
log_info "  2. Commit: git add -A && git commit -m 'chore: update frontend envs for CF Workers migration'"
log_info "  3. Redeploy all Pages apps"
log_info "  4. Verify each site loads correctly"
log_info ""
log_info "Endpoints:"
log_info "  API:    https://api.cinacoin.com"
log_info "  Auth:   https://auth.cinacoin.com"
log_info "  Users:  https://users.cinacoin.com"
log_info "  WS:     wss://api.cinacoin.com"
