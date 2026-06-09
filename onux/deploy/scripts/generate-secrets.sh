#!/bin/bash
# Generate secure random secrets for Cinacoin production deployment
# Usage: ./generate-secrets.sh [output-file]

set -e

OUTPUT_FILE="${1:-deploy/env/.env.generated}"

echo "🔐 Generating Cinacoin production secrets..."
echo ""

# Generate hex string of specified length
gen_hex() {
    openssl rand -hex "$1"
}

# Generate base64 string
gen_base64() {
    openssl rand -base64 "$1" | tr -d '/+=' | head -c "$1"
}

cat > "$OUTPUT_FILE" <<EOF
# =============================================================================
# Cinacoin Production Secrets (AUTO-GENERATED)
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# ⚠️  KEEP THIS FILE SECURE. DO NOT COMMIT TO VERSION CONTROL.
# =============================================================================

# Security Keys
JWT_SECRET=$(gen_hex 32)
SESSION_SECRET=$(gen_hex 32)
ENCRYPTION_KEY=$(gen_hex 32)
SERVICE_API_KEY=$(gen_hex 16)

# Database Passwords
AUTH_DB_PASSWORD=$(gen_base64 32)
USER_DB_PASSWORD=$(gen_base64 32)
GATEWAY_DB_PASSWORD=$(gen_base64 32)

# Redis
REDIS_PASSWORD=$(gen_base64 32)

# Bundler (if needed)
BUNDLER_API_KEY=$(gen_hex 24)
BUNDLER_PRIVATE_KEY=$(gen_hex 32)

# Paymaster (if needed)
PAYMASTER_API_KEY=$(gen_hex 24)
PAYMASTER_PRIVATE_KEY=$(gen_hex 32)

# Webhook
WEBHOOK_SECRET=$(gen_hex 24)
EOF

echo "✅ Secrets generated: $OUTPUT_FILE"
echo ""
echo "⚠️  IMPORTANT:"
echo "  1. Store this file securely (e.g., in a password manager)"
echo "  2. Never commit this file to version control"
echo "  3. Use a secrets manager in production (Vault, AWS Secrets Manager, etc.)"
echo ""
echo "Next steps:"
echo "  - Copy values to your K8s secrets: deploy/k8s/secrets-config.yaml"
echo "  - Or set as environment variables in your deployment platform"
