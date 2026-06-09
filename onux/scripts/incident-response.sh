#!/bin/bash
# =============================================================================
# Cinacoin — Incident Response Quick Commands
# =============================================================================
# Usage: ./incident-response.sh <command> [args]
# =============================================================================

set -euo pipefail

CLOUDFLARE_ACCOUNT_ID="7ea8e46d8210bad342fa7595f7935fea"
ZONE_ID="9e9b0140baac8f501ded715128fa5415"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

usage() {
  echo "Usage: $0 <command> [args]"
  echo ""
  echo "Commands:"
  echo "  health-check              Check all service health"
  echo "  rollback <service>        Rollback last Worker deployment"
  echo "  cache-purge [url]         Purge cache (all or specific URL)"
  echo "  under-attack              Enable Under Attack mode"
  echo "  normal-security           Restore normal security level"
  echo "  ssl-check <domain>        Check SSL certificate status"
  echo "  dns-check [domain]        Check DNS resolution"
  echo "  status                    Show overall system status"
  echo ""
}

health_check() {
  echo "🔍 Running health checks..."
  echo ""

  SERVICES=(
    "api:api.cinacoin.io"
    "auth:auth.cinacoin.io"
    "users:users.cinacoin.io"
    "app:app.cinacoin.io"
    "dashboard:dashboard.cinacoin.io"
    "rpc:rpc.cinacoin.io"
    "keys:keys.cinacoin.io"
    "relay:relay.cinacoin.io"
    "notify:notify.cinacoin.io"
    "push:push.cinacoin.io"
    "monitor:monitor.cinacoin.io"
    "docs:docs.cinacoin.io"
    "status:status.cinacoin.io"
    "analytics:analytics.cinacoin.io"
    "wallet:wallet.cinacoin.io"
    "cloud:cloud.cinacoin.io"
    "demo:demo.cinacoin.io"
    "react:react.cinacoin.io"
    "dash:dash.cinacoin.io"
  )

  HEALTHY=0
  UNHEALTHY=0

  for service_entry in "${SERVICES[@]}"; do
    IFS=':' read -r name domain <<< "$service_entry"
    URL="https://${domain}/health"

    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$URL" 2>/dev/null || echo "000")

    if [ "$STATUS" == "200" ]; then
      echo -e "  ${GREEN}✅${NC} ${name} (${domain})"
      ((HEALTHY++))
    elif [ "$STATUS" == "301" ] || [ "$STATUS" == "302" ]; then
      echo -e "  ${GREEN}✅${NC} ${name} (${domain}) [redirect ${STATUS}]"
      ((HEALTHY++))
    else
      echo -e "  ${RED}❌${NC} ${name} (${domain}) [HTTP ${STATUS}]"
      ((UNHEALTHY++))
    fi
  done

  echo ""
  echo "Summary: ${HEALTHY} healthy, ${UNHEALTHY} unhealthy"

  if [ "$UNHEALTHY" -gt 0 ]; then
    return 1
  fi
}

rollback_service() {
  SERVICE=$1
  if [ -z "$SERVICE" ]; then
    echo "Usage: $0 rollback <service-name>"
    echo "Example: $0 rollback api-gateway"
    exit 1
  fi

  echo "⚠️  Rolling back cinacoin-${SERVICE}..."
  wrangler deployments rollback --name "cinacoin-${SERVICE}" 2>/dev/null && \
    echo -e "${GREEN}✅ Rollback successful${NC}" || \
    echo -e "${RED}❌ Rollback failed${NC}"
}

cache_purge() {
  URL=$1

  if [ -z "$URL" ]; then
    echo "Purging ALL cache..."
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"purge_everything": true}' | jq -r '.success' && \
      echo -e "${GREEN}✅ Cache purged${NC}" || \
      echo -e "${RED}❌ Cache purge failed${NC}"
  else
    echo "Purging cache for: ${URL}"
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"files\": [\"${URL}\"]}" | jq -r '.success' && \
      echo -e "${GREEN}✅ Cache purged for ${URL}${NC}" || \
      echo -e "${RED}❌ Cache purge failed${NC}"
  fi
}

under_attack() {
  echo "🛡️  Enabling Under Attack mode..."
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/security_level" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"value": "under_attack"}' | jq -r '.success' && \
    echo -e "${GREEN}✅ Under Attack mode enabled${NC}" || \
    echo -e "${RED}❌ Failed to enable Under Attack mode${NC}"
}

normal_security() {
  echo "Restoring normal security level..."
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/security_level" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"value": "medium"}' | jq -r '.success' && \
    echo -e "${GREEN}✅ Normal security restored${NC}" || \
    echo -e "${RED}❌ Failed to restore security level${NC}"
}

ssl_check() {
  DOMAIN=$1
  if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 ssl-check <domain>"
    exit 1
  fi

  echo "🔒 Checking SSL for ${DOMAIN}..."
  echo ""

  # Check certificate
  echo | openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>/dev/null | \
    openssl x509 -noout -subject -issuer -dates 2>/dev/null || \
    echo -e "${RED}❌ Could not connect to ${DOMAIN}:443${NC}"

  echo ""

  # Check HSTS
  HSTS=$(curl -sI "https://${DOMAIN}" 2>/dev/null | grep -i "strict-transport" || echo "Not found")
  echo "HSTS: ${HSTS}"

  # Check TLS version
  echo ""
  echo "TLS Version:"
  echo | openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>/dev/null | \
    grep "Protocol  :" || echo "Could not determine"
}

dns_check() {
  DOMAIN=${1:-cinacoin.io}

  echo "🌐 DNS check for ${DOMAIN}..."
  echo ""

  # Check multiple resolvers
  for resolver in "8.8.8.8" "1.1.1.1" "9.9.9.9"; do
    RESULT=$(dig +short "@${resolver}" "${DOMAIN}" 2>/dev/null || echo "failed")
    echo "  ${resolver}: ${RESULT}"
  done

  echo ""
  echo "Cloudflare resolution:"
  dig +short "${DOMAIN}" 2>/dev/null || echo "  Could not resolve"
}

show_status() {
  echo "============================================"
  echo "  Cinacoin System Status"
  echo "  $(date -Iseconds)"
  echo "============================================"
  echo ""

  # Cloudflare status
  echo "Cloudflare:"
  CF_STATUS=$(curl -s "https://www.cloudflarestatus.com/api/v2/status.json" | jq -r '.status.description' 2>/dev/null || echo "Unknown")
  echo "  ${CF_STATUS}"
  echo ""

  # Service health
  health_check
}

# Main
case "${1:-}" in
  health-check)
    health_check
    ;;
  rollback)
    rollback_service "${2:-}"
    ;;
  cache-purge)
    cache_purge "${2:-}"
    ;;
  under-attack)
    under_attack
    ;;
  normal-security)
    normal_security
    ;;
  ssl-check)
    ssl_check "${2:-}"
    ;;
  dns-check)
    dns_check "${2:-}"
    ;;
  status)
    show_status
    ;;
  -h|--help|*)
    usage
    ;;
esac
