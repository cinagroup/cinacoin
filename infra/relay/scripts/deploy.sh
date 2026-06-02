#!/bin/bash
# Deploy Cinacoin WalletConnect Relay to all regions
#
# Usage:
#   ./scripts/deploy.sh              # Deploy all regions
#   ./scripts/deploy.sh nam          # Deploy NA only
#   ./scripts/deploy.sh --dry-run    # Preview changes

set -euo pipefail

cd "$(dirname "$0")/.."

REGION="${1:-all}"
DRY_RUN=""
if [[ "${1:-}" == "--dry-run" || "${2:-}" == "--dry-run" ]]; then
  DRY_RUN="--dry-run"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

deploy_region() {
  local region=$1
  local env_name=""
  
  case "$region" in
    nam) env_name="default" ;;
    eur) env_name="eur" ;;
    apac) env_name="apac" ;;
    *) echo -e "${RED}Unknown region: $region${NC}"; return 1 ;;
  esac

  echo -e "${YELLOW}Deploying to ${region^^} region...${NC}"
  
  if [[ -n "$DRY_RUN" ]]; then
    wrangler deploy --env "$env_name" $DRY_RUN
  else
    wrangler deploy --env "$env_name"
  fi

  echo -e "${GREEN}✓ ${region^^} deployed successfully${NC}"
}

# Create D1 and KV if they don't exist
setup_storage() {
  echo -e "${YELLOW}Setting up storage...${NC}"
  
  # Create D1 database (idempotent)
  wrangler d1 create cinacoin-wc-relay-db 2>/dev/null || true
  
  # Create KV namespace (idempotent)
  wrangler kv:namespace create SESSION_CACHE 2>/dev/null || true
  
  # Run migrations
  local db_id
  db_id=$(wrangler d1 list --name cinacoin-wc-relay-db --json 2>/dev/null | jq -r '.[0].uuid')
  if [[ -n "$db_id" && "$db_id" != "null" ]]; then
    echo "Running D1 migrations..."
    wrangler d1 execute cinacoin-wc-relay-db --file=./terraform/migrations/001_init.sql --remote
    echo -e "${GREEN}✓ Storage setup complete${NC}"
  else
    echo -e "${RED}Failed to get D1 database ID${NC}"
  fi
}

# Health check
check_health() {
  local region=$1
  local url="https://cinacoin-wc-relay.workers.dev/health"
  
  if [[ "$region" == "eur" ]]; then
    url="https://cinacoin-wc-relay-eu.workers.dev/health"
  elif [[ "$region" == "apac" ]]; then
    url="https://cinacoin-wc-relay-ap.workers.dev/health"
  fi

  echo -e "${YELLOW}Checking health: $url${NC}"
  
  local response
  response=$(curl -s "$url" 2>/dev/null || echo '{"error":"unreachable"}')
  echo "$response" | jq . 2>/dev/null || echo "$response"
}

# Main
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Cinacoin WC Relay Deploy                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

setup_storage

if [[ "$REGION" == "all" ]]; then
  deploy_region "nam"
  deploy_region "eur"
  deploy_region "apac"
  
  echo ""
  echo -e "${GREEN}Running health checks...${NC}"
  check_health "nam"
  check_health "eur"
  check_health "apac"
else
  deploy_region "$REGION"
  echo ""
  check_health "$REGION"
fi
