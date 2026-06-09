#!/bin/bash
# =============================================================================
# Cinacoin Phase 2 — Master Infrastructure Deployment Script
# =============================================================================
# Version: 2.0.0
# Date: 2026-06-08
# Purpose: Automated setup of production infrastructure on Cloudflare
# Usage: ./setup-phase2-infrastructure.sh [--dry-run] [--skip-dns] [--skip-ssl]
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLOUDFLARE_ACCOUNT_ID="7ea8e46d8210bad342fa7595f7935fea"
PRIMARY_ZONE_ID="9e9b0140baac8f501ded715128fa5415"
PRIMARY_DOMAIN="cinacoin.com"
NEW_DOMAIN="cinacoin.io"
NEW_ZONE_ID=""  # Will be set after zone creation

# Flags
DRY_RUN=false
SKIP_DNS=false
SKIP_SSL=false
SKIP_BACKUP=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-dns)
      SKIP_DNS=true
      shift
      ;;
    --skip-ssl)
      SKIP_SSL=true
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--dry-run] [--skip-dns] [--skip-ssl] [--skip-backup]"
      echo ""
      echo "Options:"
      echo "  --dry-run      Show what would be done without making changes"
      echo "  --skip-dns     Skip DNS configuration"
      echo "  --skip-ssl     Skip SSL/TLS configuration"
      echo "  --skip-backup  Skip backup setup"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."

  # Check if wrangler is installed
  if ! command -v wrangler &> /dev/null; then
    log_error "Wrangler CLI not found. Install with: npm install -g wrangler"
    exit 1
  fi

  # Check if jq is installed
  if ! command -v jq &> /dev/null; then
    log_error "jq not found. Install with: apt-get install jq (or brew install jq)"
    exit 1
  fi

  # Check if Cloudflare API token is set
  if [ -z "${CF_API_TOKEN:-}" ]; then
    log_error "CF_API_TOKEN environment variable not set"
    log_info "Get your token from: https://dash.cloudflare.com/profile/api-tokens"
    exit 1
  fi

  # Check if AWS CLI is installed (for R2 operations)
  if ! command -v aws &> /dev/null; then
    log_warning "AWS CLI not found. R2 operations will be skipped."
  fi

  # Verify Cloudflare authentication
  if ! wrangler whoami &> /dev/null; then
    log_error "Wrangler authentication failed. Run: wrangler login"
    exit 1
  fi

  log_success "All prerequisites met"
}

# Create new zone for cinacoin.io
setup_new_zone() {
  log_info "Setting up zone for ${NEW_DOMAIN}..."

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would create zone for ${NEW_DOMAIN}"
    return
  fi

  # Check if zone already exists
  EXISTING_ZONE=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=${NEW_DOMAIN}" \
    -H "Authorization: Bearer $CF_API_TOKEN" | jq -r '.result[0].id // empty')

  if [ -n "$EXISTING_ZONE" ]; then
    log_info "Zone already exists: ${EXISTING_ZONE}"
    NEW_ZONE_ID="$EXISTING_ZONE"
  else
    # Create new zone
    RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"${NEW_DOMAIN}\",
        \"account\": {\"id\": \"${CLOUDFLARE_ACCOUNT_ID}\"},
        \"type\": \"full\"
      }")

    NEW_ZONE_ID=$(echo "$RESPONSE" | jq -r '.result.id')

    if [ "$NEW_ZONE_ID" = "null" ] || [ -z "$NEW_ZONE_ID" ]; then
      log_error "Failed to create zone: $(echo "$RESPONSE" | jq -r '.errors[0].message')"
      exit 1
    fi

    log_success "Zone created: ${NEW_ZONE_ID}"
  fi

  # Save zone ID for later use
  echo "$NEW_ZONE_ID" > .cinacoin-io-zone-id
  log_info "Zone ID saved to .cinacoin-io-zone-id"
}

# Configure DNS records
configure_dns() {
  if [ "$SKIP_DNS" = true ]; then
    log_info "Skipping DNS configuration (--skip-dns)"
    return
  fi

  log_info "Configuring DNS records for ${NEW_DOMAIN}..."

  if [ -z "$NEW_ZONE_ID" ]; then
    if [ -f .cinacoin-io-zone-id ]; then
      NEW_ZONE_ID=$(cat .cinacoin-io-zone-id)
    else
      log_error "Zone ID not found. Run setup_new_zone first or provide --skip-dns"
      exit 1
    fi
  fi

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would configure DNS records for ${NEW_DOMAIN}"
    return
  fi

  # Workers CNAME records
  declare -A WORKERS=(
    ["api"]="cinacoin-api-gateway-prod"
    ["auth"]="cinacoin-auth-service-prod"
    ["users"]="cinacoin-users-service-prod"
    ["rpc"]="cinacoin-rpc-proxy"
    ["keys"]="cinacoin-keys-server"
    ["relay"]="cinacoin-relay-server"
    ["notify"]="cinacoin-notify-server"
    ["push"]="cinacoin-push-server"
    ["monitor"]="cinacoin-monitoring"
  )

  for subdomain in "${!WORKERS[@]}"; do
    worker="${WORKERS[$subdomain]}"
    log_info "Creating DNS record: ${subdomain}.${NEW_DOMAIN} → ${worker}"

    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${NEW_ZONE_ID}/dns_records" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"type\": \"CNAME\",
        \"name\": \"${subdomain}.${NEW_DOMAIN}\",
        \"content\": \"${worker}.${CLOUDFLARE_ACCOUNT_ID}.workers.dev\",
        \"ttl\": 1,
        \"proxied\": true
      }" > /dev/null
  done

  # Pages CNAME records
  declare -A PAGES=(
    ["app"]="cinacoin-app"
    ["dashboard"]="cinacoin-unified-dashboard"
    ["docs"]="cinacoin-docs"
    ["status"]="cinacoin-health-status"
    ["analytics"]="cinacoin-analytics"
    ["wallet"]="cinacoin-wallet-explorer"
    ["cloud"]="cinacoin-cloud-dashboard"
    ["demo"]="cinacoin-demo"
    ["react"]="demo-react"
    ["dash"]="cinacoin-backend-dashboard"
  )

  for subdomain in "${!PAGES[@]}"; do
    project="${PAGES[$subdomain]}"
    log_info "Creating DNS record: ${subdomain}.${NEW_DOMAIN} → ${project}.pages.dev"

    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${NEW_ZONE_ID}/dns_records" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"type\": \"CNAME\",
        \"name\": \"${subdomain}.${NEW_DOMAIN}\",
        \"content\": \"${project}.pages.dev\",
        \"ttl\": 1,
        \"proxied\": true
      }" > /dev/null
  done

  log_success "DNS records configured"
}

# Configure SSL/TLS
configure_ssl() {
  if [ "$SKIP_SSL" = true ]; then
    log_info "Skipping SSL/TLS configuration (--skip-ssl)"
    return
  fi

  log_info "Configuring SSL/TLS for ${NEW_DOMAIN}..."

  if [ -z "$NEW_ZONE_ID" ]; then
    if [ -f .cinacoin-io-zone-id ]; then
      NEW_ZONE_ID=$(cat .cinacoin-io-zone-id)
    else
      log_error "Zone ID not found"
      exit 1
    fi
  fi

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would configure SSL/TLS settings"
    return
  fi

  # Enable Universal SSL
  log_info "Enabling Universal SSL..."
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${NEW_ZONE_ID}/ssl/universal/settings" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"enabled": true}' > /dev/null

  # Set SSL mode to Full (Strict)
  log_info "Setting SSL mode to Full (Strict)..."
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${NEW_ZONE_ID}/settings/ssl" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"value": "strict"}' > /dev/null

  # Set minimum TLS version to 1.2
  log_info "Setting minimum TLS version to 1.2..."
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${NEW_ZONE_ID}/settings/min_tls_version" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"value": "1.2"}' > /dev/null

  # Enable TLS 1.3
  log_info "Enabling TLS 1.3..."
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${NEW_ZONE_ID}/settings/tls_1_3" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"value": "on"}' > /dev/null

  # Enable Always Use HTTPS
  log_info "Enabling Always Use HTTPS..."
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${NEW_ZONE_ID}/settings/always_use_https" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"value": "on"}' > /dev/null

  # Enable HSTS
  log_info "Enabling HSTS..."
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${NEW_ZONE_ID}/settings/security_header" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "value": {
        "strict_transport_security": {
          "enabled": true,
          "max_age": 31536000,
          "include_subdomains": true,
          "preload": true
        }
      }
    }' > /dev/null

  # Generate Origin CA certificate
  log_info "Generating Origin CA certificate..."
  ORIGIN_CERT_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/certificates" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"hostnames\": [\"${NEW_DOMAIN}\", \"*.${NEW_DOMAIN}\"],
      \"request_type\": \"origin-rsa\",
      \"requested_validity\": 5475
    }")

  ORIGIN_CERT_ID=$(echo "$ORIGIN_CERT_RESPONSE" | jq -r '.result.id')

  if [ "$ORIGIN_CERT_ID" != "null" ] && [ -n "$ORIGIN_CERT_ID" ]; then
    log_success "Origin CA certificate generated: ${ORIGIN_CERT_ID}"

    # Save certificate and key
    echo "$ORIGIN_CERT_RESPONSE" | jq -r '.result.certificate' > origin-cert.pem
    echo "$ORIGIN_CERT_RESPONSE" | jq -r '.result.private_key' > origin-key.pem
    chmod 600 origin-key.pem

    log_info "Certificate saved to origin-cert.pem and origin-key.pem"
  else
    log_warning "Origin CA certificate generation failed (may already exist)"
  fi

  log_success "SSL/TLS configuration complete"
}

# Configure CDN and caching
configure_cdn() {
  log_info "Configuring CDN and caching..."

  if [ -z "$NEW_ZONE_ID" ]; then
    if [ -f .cinacoin-io-zone-id ]; then
      NEW_ZONE_ID=$(cat .cinacoin-io-zone-id)
    else
      log_error "Zone ID not found"
      exit 1
    fi
  fi

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would configure CDN settings"
    return
  fi

  # Enable Brotli compression
  log_info "Enabling Brotli compression..."
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${NEW_ZONE_ID}/settings/brotli" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"value": "on"}' > /dev/null

  # Enable automatic minification
  log_info "Enabling automatic minification..."
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${NEW_ZONE_ID}/settings/minify" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"value": {"html": "on", "css": "on", "js": "on"}}' > /dev/null

  # Enable image optimization
  log_info "Enabling image optimization (Polish)..."
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${NEW_ZONE_ID}/settings/polish" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"value": "lossy"}' > /dev/null

  # Enable WebP conversion
  log_info "Enabling WebP conversion..."
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${NEW_ZONE_ID}/settings/webp" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"value": "on"}' > /dev/null

  log_success "CDN configuration complete"
}

# Setup backup infrastructure
setup_backups() {
  if [ "$SKIP_BACKUP" = true ]; then
    log_info "Skipping backup setup (--skip-backup)"
    return
  fi

  log_info "Setting up backup infrastructure..."

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would create backup R2 bucket"
    return
  fi

  # Create backup R2 bucket
  log_info "Creating R2 bucket for backups..."
  aws s3 mb "s3://cinacoin-backups" \
    --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    --region auto 2>/dev/null || log_warning "R2 bucket may already exist"

  # Create backup directories
  mkdir -p backups/{d1,kv,dns,secrets}

  # Run initial backup
  log_info "Running initial backup..."
  if [ -f scripts/backup-d1-to-r2.sh ]; then
    ./scripts/backup-d1-to-r2.sh
  fi

  log_success "Backup infrastructure setup complete"
}

# Verify deployment
verify_deployment() {
  log_info "Verifying deployment..."

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would verify deployment"
    return
  fi

  # Check DNS propagation
  log_info "Checking DNS propagation..."
  for subdomain in api auth users app dashboard; do
    if dig +short "${subdomain}.${NEW_DOMAIN}" | grep -q .; then
      log_success "${subdomain}.${NEW_DOMAIN} → DNS configured"
    else
      log_warning "${subdomain}.${NEW_DOMAIN} → DNS not yet propagated"
    fi
  done

  # Check SSL certificates
  log_info "Checking SSL certificates..."
  for subdomain in api auth app; do
    if curl -sI "https://${subdomain}.${NEW_DOMAIN}" 2>/dev/null | grep -q "200\|301\|302"; then
      log_success "${subdomain}.${NEW_DOMAIN} → SSL valid"
    else
      log_warning "${subdomain}.${NEW_DOMAIN} → SSL not yet provisioned (may take 1-24h)"
    fi
  done

  log_success "Verification complete"
}

# Print summary
print_summary() {
  echo ""
  echo "=========================================="
  echo "  Phase 2 Infrastructure Setup Complete"
  echo "=========================================="
  echo ""
  echo "Domain: ${NEW_DOMAIN}"
  echo "Zone ID: ${NEW_ZONE_ID:-<not created>}"
  echo ""
  echo "Next Steps:"
  echo "1. Update nameservers at domain registrar to Cloudflare nameservers"
  echo "2. Wait for DNS propagation (5 min - 48 hours)"
  echo "3. Submit cinacoin.io to HSTS preload list: https://hstspreload.org/"
  echo "4. Configure external uptime monitoring (Better Stack, UptimeRobot)"
  echo "5. Set up Discord webhooks for alerting"
  echo "6. Schedule automated backups (cron job)"
  echo ""
  echo "Documentation:"
  echo "- Domain & DNS: docs/phase2-infrastructure/01-DOMAIN-DNS.md"
  echo "- SSL/TLS: docs/phase2-infrastructure/02-SSL-TLS.md"
  echo "- CDN & Load Balancer: docs/phase2-infrastructure/03-CDN-LOADBALANCER.md"
  echo "- Monitoring & Alerting: docs/phase2-infrastructure/04-MONITORING-ALERTING.md"
  echo "- Backup & Recovery: docs/phase2-infrastructure/05-BACKUP-RECOVERY.md"
  echo ""
  echo "Estimated Monthly Cost: \$40-135/mo"
  echo "- Domain registration: ~\$/month"
  echo "- Workers (Pro): \$5/mo"
  echo "- CDN & Load Balancer: \$30-80/mo"
  echo "- Monitoring: \$0-45/mo"
  echo "- Backups: ~\$/month"
  echo ""
}

# Main execution
main() {
  echo ""
  echo "=========================================="
  echo "  Cinacoin Phase 2 Infrastructure Setup"
  echo "=========================================="
  echo ""

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN MODE - No changes will be made"
    echo ""
  fi

  check_prerequisites
  setup_new_zone
  configure_dns
  configure_ssl
  configure_cdn
  setup_backups
  verify_deployment
  print_summary

  log_success "Phase 2 infrastructure setup complete!"
}

# Run main function
main "$@"
