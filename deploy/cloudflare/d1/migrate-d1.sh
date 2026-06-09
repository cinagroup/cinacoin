#!/usr/bin/env bash
# ============================================================
# migrate-d1.sh
# Create and initialize the Cloudflare D1 database
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DB_NAME="cinacoin-auth"
MIGRATION_FILE="$SCRIPT_DIR/migrations/0001_init.sql"

echo "============================================"
echo " Cloudflare D1 Migration: $DB_NAME"
echo "============================================"
echo ""

# Check prerequisites
command -v wrangler >/dev/null 2>&1 || {
  echo "❌ wrangler CLI not found. Install: npm install -g wrangler"
  exit 1
}

# Verify migration file exists
if [[ ! -f "$MIGRATION_FILE" ]]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

# Step 1: Create D1 database (idempotent — fails gracefully if exists)
echo "📦 Step 1: Creating D1 database '$DB_NAME'..."
CREATE_OUTPUT=$(wrangler d1 create "$DB_NAME" 2>&1) || true
echo "$CREATE_OUTPUT"

# Extract database_id from wrangler output
DB_ID=$(echo "$CREATE_OUTPUT" | grep -oP 'database_id = "\K[^"]+' || echo "")

if [[ -n "$DB_ID" ]]; then
  echo ""
  echo "✅ Database created! ID: $DB_ID"
  echo ""
  echo "⚠️  IMPORTANT: Update wrangler.toml with this database_id:"
  echo "   database_id = \"$DB_ID\""
  echo ""

  # Auto-update wrangler.toml if the placeholder is still there
  WRANGLER_FILE="$PROJECT_ROOT/wrangler.toml"
  if [[ -f "$WRANGLER_FILE" ]]; then
    sed -i "s/database_id = \"\"  # ← Run \`wrangler d1 create cinacoin-auth\` then paste the ID here/database_id = \"$DB_ID\"/" "$WRANGLER_FILE" 2>/dev/null || true
    echo "📝 Updated wrangler.toml with database_id"
  fi
else
  echo ""
  echo "ℹ️  Database may already exist. Retrieving existing ID..."
  DB_ID=$(wrangler d1 info "$DB_NAME" 2>/dev/null | grep -oP 'database_id.*?= \K\S+' || echo "")
  if [[ -n "$DB_ID" ]]; then
    echo "   Found: $DB_ID"
    echo "   Update wrangler.toml manually if needed."
  else
    echo "   ⚠️  Could not retrieve database_id. Check wrangler.toml manually."
  fi
fi

echo ""

# Step 2: Run migrations
echo "🗄️  Step 2: Running migrations..."
echo "   File: $MIGRATION_FILE"
echo ""

wrangler d1 execute "$DB_NAME" --file="$MIGRATION_FILE" --remote

echo ""
echo "✅ Migration complete!"
echo ""

# Step 3: Verify
echo "🔍 Step 3: Verifying tables..."
wrangler d1 execute "$DB_NAME" --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" --remote

echo ""
echo "============================================"
echo " Migration finished successfully"
echo "============================================"
