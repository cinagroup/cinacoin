#!/usr/bin/env bash
# ============================================================
# seed-d1.sh
# Seed the Cloudflare D1 database with initial data
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_NAME="cinacoin-auth"
SEED_FILE="$SCRIPT_DIR/seed/seed.sql"

echo "============================================"
echo " Cloudflare D1 Seed: $DB_NAME"
echo "============================================"
echo ""

# Check prerequisites
command -v wrangler >/dev/null 2>&1 || {
  echo "❌ wrangler CLI not found. Install: npm install -g wrangler"
  exit 1
}

# Verify seed file exists
if [[ ! -f "$SEED_FILE" ]]; then
  echo "❌ Seed file not found: $SEED_FILE"
  exit 1
fi

# Confirm before seeding
echo "⚠️  This will insert seed data into '$DB_NAME'."
echo "   Seed file: $SEED_FILE"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "🌱 Seeding database..."
wrangler d1 execute "$DB_NAME" --file="$SEED_FILE" --remote

echo ""
echo "✅ Seed complete!"
echo ""

# Verify
echo "🔍 Verifying seed data..."
echo ""
echo "Users:"
wrangler d1 execute "$DB_NAME" --command="SELECT id, email, username, auth_type, status FROM users;" --remote
echo ""
echo "Teams:"
wrangler d1 execute "$DB_NAME" --command="SELECT id, name, owner_id FROM teams;" --remote
echo ""
echo "Permissions:"
wrangler d1 execute "$DB_NAME" --command="SELECT id, user_id, resource, action FROM permissions;" --remote

echo ""
echo "============================================"
echo " Seed finished successfully"
echo "============================================"
