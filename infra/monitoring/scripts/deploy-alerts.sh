#!/bin/bash
# Deploy monitoring configuration and alert rules
#
# Usage:
#   ./scripts/deploy-alerts.sh              # Deploy all
#   ./scripts/deploy-alerts.sh --dry-run    # Preview

set -euo pipefail

cd "$(dirname "$0")/.."

DRY_RUN="${1:-}"

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Cinacoin Relay Monitoring Deploy        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

# 1. Deploy monitoring worker
echo -e "${YELLOW}Deploying monitoring worker...${NC}"
if [[ -n "$DRY_RUN" ]]; then
  wrangler deploy --dry-run
else
  wrangler deploy
fi
echo -e "${GREEN}✓ Monitoring worker deployed${NC}"

# 2. Verify alert rules load
echo -e "${YELLOW}Verifying alert rules...${NC}"
ALERT_COUNT=$(grep -c "id:" rules/alert-config.ts 2>/dev/null || echo "0")
echo "  Found ${ALERT_COUNT} alert rules"

# 3. Test health check endpoints
echo -e "${YELLOW}Testing health check endpoints...${NC}"
for region in nam eur apac; do
  case "$region" in
    nam) url="https://cinacoin-wc-relay.workers.dev/health" ;;
    eur) url="https://cinacoin-wc-relay-eu.workers.dev/health" ;;
    apac) url="https://cinacoin-wc-relay-ap.workers.dev/health" ;;
  esac

  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [[ "$response" == "200" ]]; then
    echo -e "  ${GREEN}✓${NC} ${region^^}: healthy (HTTP ${response})"
  else
    echo -e "  ${RED}✗${NC} ${region^^}: unreachable (HTTP ${response})"
  fi
done

# 4. Verify cron trigger is configured
echo -e "${YELLOW}Verifying cron schedule...${NC}"
if wrangler trigger list 2>/dev/null | grep -q "monitoring"; then
  echo -e "${GREEN}✓ Cron trigger configured${NC}"
else
  echo -e "${YELLOW}⚠ Cron trigger not found — add to wrangler.toml:${NC}"
  echo ""
  echo "  [triggers]"
  echo "  crons = [\"* * * * *\"]  # Every minute"
fi

echo ""
echo -e "${GREEN}Deployment complete!${NC}"
