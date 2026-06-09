#!/usr/bin/env bash
# ============================================================
# Generate new JWT secrets for CINAcoin Auth Service
# ============================================================
# Outputs secrets in various formats for convenience.
# Does NOT deploy anything - just generates cryptographically
# secure random strings suitable for HMAC-SHA256 signing.
# ============================================================

set -euo pipefail

echo "============================================"
echo " CINAcoin Auth - Secret Generation"
echo " $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "============================================"
echo ""

# Generate 64-byte (512-bit) secrets encoded as base64url
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n=' | tr '+/' '-_' | head -c 86)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n=' | tr '+/' '-_' | head -c 86)

echo "=== JWT_SECRET ==="
echo "$JWT_SECRET"
echo ""
echo "=== JWT_REFRESH_SECRET ==="
echo "$JWT_REFRESH_SECRET"
echo ""

# Also generate RSA 2048 key pair for optional RS256 upgrade
echo "=== RSA Key Pair (for optional RS256 migration) ==="
echo ""

TEMP_DIR=$(mktemp -d)
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$TEMP_DIR/private.pem" 2>/dev/null
openssl pkey -in "$TEMP_DIR/private.pem" -pubout -out "$TEMP_DIR/public.pem"

echo "--- RSA_PRIVATE_KEY ---"
cat "$TEMP_DIR/private.pem"
echo ""
echo "--- RSA_PUBLIC_KEY ---"
cat "$TEMP_DIR/public.pem"

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "============================================"
echo " Usage Examples"
echo "============================================"
echo ""
echo "# Set as Cloudflare Workers secrets:"
echo "echo -n '$JWT_SECRET' | wrangler secret put JWT_SECRET"
echo "echo -n '$JWT_REFRESH_SECRET' | wrangler secret put JWT_REFRESH_SECRET"
echo ""
echo "# For local development, create .dev.vars:"
echo "cat > .dev.vars << 'EOF'"
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "EOF"
echo ""
echo "# For staging environment:"
echo "echo -n '$JWT_SECRET' | wrangler secret put JWT_SECRET --env staging"
echo "echo -n '$JWT_REFRESH_SECRET' | wrangler secret put JWT_REFRESH_SECRET --env staging"
echo ""
echo "🔴 Store these secrets securely. They cannot be retrieved after deployment."
