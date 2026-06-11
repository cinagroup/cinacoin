#!/bin/bash
# deploy-with-token.sh
# Wrapper script that reads Cloudflare token from file and sets environment
# Usage: ./scripts/deploy-with-token.sh <original-deploy-script> [args...]

set -euo pipefail

TOKEN_FILE="/tmp/cf_token.txt"

if [ ! -f "$TOKEN_FILE" ]; then
  echo "❌ Error: Token file not found at $TOKEN_FILE"
  echo "Please create the file with your Cloudflare API token"
  exit 1
fi

# Read token from file
export CLOUDFLARE_API_TOKEN="$(cat "$TOKEN_FILE")"

echo "✅ Cloudflare API token loaded from $TOKEN_FILE"
echo ""

# Execute the original deploy script with all arguments
"$@"
