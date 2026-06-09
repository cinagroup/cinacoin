#!/bin/bash
# Backup all Cinacoin databases
# Usage: ./backup-databases.sh [output-dir]

set -e

OUTPUT_DIR="${1:-/tmp/cinacoin-backups}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$OUTPUT_DIR"

echo "💾 Cinacoin Database Backup"
echo "   Timestamp: $TIMESTAMP"
echo "   Output: $OUTPUT_DIR"
echo ""

ERRORS=0

# Auth Service
if [ -n "$AUTH_DATABASE_URL" ]; then
    FILE="$OUTPUT_DIR/auth-${TIMESTAMP}.sql.gz"
    echo "📦 Backing up auth database..."
    pg_dump "$AUTH_DATABASE_URL" | gzip > "$FILE"
    echo "   ✓ $(du -h "$FILE" | cut -f1)"
else
    echo "   ⚠ AUTH_DATABASE_URL not set, skipping"
fi

# User Service
if [ -n "$USER_DATABASE_URL" ]; then
    FILE="$OUTPUT_DIR/users-${TIMESTAMP}.sql.gz"
    echo "📦 Backing up users database..."
    pg_dump "$USER_DATABASE_URL" | gzip > "$FILE"
    echo "   ✓ $(du -h "$FILE" | cut -f1)"
else
    echo "   ⚠ USER_DATABASE_URL not set, skipping"
fi

# Gateway
if [ -n "$GATEWAY_DATABASE_URL" ]; then
    FILE="$OUTPUT_DIR/gateway-${TIMESTAMP}.sql.gz"
    echo "📦 Backing up gateway database..."
    pg_dump "$GATEWAY_DATABASE_URL" | gzip > "$FILE"
    echo "   ✓ $(du -h "$FILE" | cut -f1)"
else
    echo "   ⚠ GATEWAY_DATABASE_URL not set, skipping"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backup complete: $OUTPUT_DIR"
echo ""
ls -lh "$OUTPUT_DIR"/*${TIMESTAMP}*
