#!/bin/bash
# =============================================================================
# CINAcoin OAuth Secrets Setup Script
# =============================================================================
# Usage:
#   cd workers/auth-service
#   bash ../../scripts/setup-oauth-secrets.sh
#
# Prerequisites:
#   - wrangler CLI installed and authenticated (wrangler login)
#   - Access to the cinacoin-cloudflare account
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTH_DIR="$SCRIPT_DIR/../workers/auth-service"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       CINAcoin OAuth Secrets Configuration Tool         ║${NC}"
echo -e "${CYAN}║       Auth Service: auth.cinacoin.com                   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check wrangler auth
if ! wrangler whoami &>/dev/null; then
    echo -e "${RED}❌ Not authenticated with Cloudflare.${NC}"
    echo "Run: wrangler login"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated with Cloudflare${NC}"
echo ""

# Navigate to auth service directory
if [ ! -d "$AUTH_DIR" ]; then
    echo -e "${RED}❌ Auth service directory not found: $AUTH_DIR${NC}"
    exit 1
fi

cd "$AUTH_DIR"
echo -e "${CYAN}📁 Working directory: $(pwd)${NC}"
echo ""

# ---------------------------------------------------------------------------
# Helper function to set a secret
# ---------------------------------------------------------------------------
set_secret() {
    local name="$1"
    local description="$2"
    local value="${3:-}"

    echo -e "${YELLOW}🔑 $name${NC} — $description"

    if [ -n "$value" ]; then
        echo "$value" | wrangler secret put "$name" 2>/dev/null
        echo -e "${GREEN}   ✅ Set successfully${NC}"
    else
        echo -e "   Enter value (input hidden):"
        wrangler secret put "$name"
        echo -e "${GREEN}   ✅ Set successfully${NC}"
    fi
    echo ""
}

# ---------------------------------------------------------------------------
# Check existing secrets
# ---------------------------------------------------------------------------
echo -e "${CYAN}📋 Current secrets:${NC}"
wrangler secret list 2>/dev/null || true
echo ""

# ---------------------------------------------------------------------------
# Interactive setup
# ---------------------------------------------------------------------------
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Step 1: JWT Secrets (Required)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

read -rp "Auto-generate JWT secrets? [Y/n]: " auto_jwt
auto_jwt="${auto_jwt:-Y}"

if [[ "$auto_jwt" =~ ^[Yy]$ ]]; then
    JWT_SEC=$(openssl rand -base64 48)
    JWT_REF=$(openssl rand -base64 48)
    set_secret "JWT_SECRET" "HMAC secret for access token signing" "$JWT_SEC"
    set_secret "JWT_REFRESH_SECRET" "HMAC secret for refresh token signing" "$JWT_REF"
else
    set_secret "JWT_SECRET" "HMAC secret for access token signing"
    set_secret "JWT_REFRESH_SECRET" "HMAC secret for refresh token signing"
fi

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Step 2: Google OAuth${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "   Console: https://console.cloud.google.com/apis/credentials"
echo -e "   Redirect URI: ${GREEN}https://auth.cinacoin.com/auth/oauth/google/callback${NC}"
echo ""

read -rp "Configure Google OAuth? [Y/n]: " conf_google
conf_google="${conf_google:-Y}"

if [[ "$conf_google" =~ ^[Yy]$ ]]; then
    set_secret "GOOGLE_CLIENT_ID" "Google OAuth 2.0 Client ID"
    set_secret "GOOGLE_CLIENT_SECRET" "Google OAuth 2.0 Client Secret"
else
    echo -e "${YELLOW}   ⏭ Skipped${NC}"
    echo ""
fi

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Step 3: GitHub OAuth${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "   Console: https://github.com/settings/developers"
echo -e "   Callback URL: ${GREEN}https://auth.cinacoin.com/auth/oauth/github/callback${NC}"
echo ""

read -rp "Configure GitHub OAuth? [Y/n]: " conf_github
conf_github="${conf_github:-Y}"

if [[ "$conf_github" =~ ^[Yy]$ ]]; then
    set_secret "GITHUB_CLIENT_ID" "GitHub OAuth App Client ID"
    set_secret "GITHUB_CLIENT_SECRET" "GitHub OAuth App Client Secret"
else
    echo -e "${YELLOW}   ⏭ Skipped${NC}"
    echo ""
fi

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Step 4: Discord OAuth${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "   Console: https://discord.com/developers/applications"
echo -e "   Redirect URI: ${GREEN}https://auth.cinacoin.com/auth/oauth/discord/callback${NC}"
echo ""

read -rp "Configure Discord OAuth? [Y/n]: " conf_discord
conf_discord="${conf_discord:-Y}"

if [[ "$conf_discord" =~ ^[Yy]$ ]]; then
    set_secret "DISCORD_CLIENT_ID" "Discord Application Client ID"
    set_secret "DISCORD_CLIENT_SECRET" "Discord Application Client Secret"
else
    echo -e "${YELLOW}   ⏭ Skipped${NC}"
    echo ""
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Final secrets list:${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
wrangler secret list 2>/dev/null || true
echo ""

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ OAuth secrets configuration complete!                ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Next steps:                                            ║${NC}"
echo -e "${GREEN}║  1. Deploy:  wrangler deploy                            ║${NC}"
echo -e "${GREEN}║  2. Test:    curl https://auth.cinacoin.com/health      ║${NC}"
echo -e "${GREEN}║  3. Verify:  curl -v .../auth/oauth/google (expect 302) ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
