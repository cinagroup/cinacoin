#!/usr/bin/env bash
# rollback.sh — Automatic rollback for Cloudflare Workers deployments.
#
# Usage:
#   rollback.sh <service> [environment]
#
# Examples:
#   rollback.sh rpc-proxy production
#   rollback.sh keys-server staging
#   rollback.sh all production
#
# Requires: wrangler CLI >= 3.x, CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars.
set -euo pipefail

# ─── Configuration ──────────────────────────────────────────────────────────

SERVICES=(
  rpc-proxy
  relay-server
  keys-server
  push-server
  notify-server
  analytics-server
)

MAX_RETRIES=3
RETRY_DELAY=5

# ─── Helpers ────────────────────────────────────────────────────────────────

log() {
  echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $*"
}

error() {
  echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: $*" >&2
}

usage() {
  cat <<EOF
Usage: $(basename "$0") <service|all> [environment]

Arguments:
  service       Service name to rollback (e.g. rpc-proxy, keys-server) or "all"
  environment   Deployment environment: staging (default) or production

Environment variables:
  CLOUDFLARE_API_TOKEN     Required. Cloudflare API token with Workers edit permission.
  CLOUDFLARE_ACCOUNT_ID    Required. Cloudflare account ID.

Examples:
  $(basename "$0") rpc-proxy production
  $(basename "$0") all staging
EOF
  exit 1
}

check_prerequisites() {
  if ! command -v wrangler &>/dev/null; then
    error "wrangler CLI not found. Install with: npm install -g wrangler"
    exit 1
  fi

  if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    error "CLOUDFLARE_API_TOKEN is not set"
    exit 1
  fi

  if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
    error "CLOUDFLARE_ACCOUNT_ID is not set"
    exit 1
  fi
}

# Get the wrangler config path for a service + environment
get_wrangler_config() {
  local service="$1"
  local env="$2"
  local pkg_dir="packages/${service}"

  if [[ ! -d "$pkg_dir" ]]; then
    error "Package directory not found: $pkg_dir"
    return 1
  fi

  if [[ "$env" == "production" ]] && [[ -f "${pkg_dir}/wrangler.production.toml" ]]; then
    echo "${pkg_dir}/wrangler.production.toml"
  else
    echo "${pkg_dir}/wrangler.toml"
  fi
}

# Rollback a single service
rollback_service() {
  local service="$1"
  local env="$2"
  local config

  config=$(get_wrangler_config "$service" "$env") || return 1

  log "🔄 Rolling back ${service} (${env}) using config: ${config}"

  local attempt=0
  while (( attempt < MAX_RETRIES )); do
    attempt=$((attempt + 1))

    # Try versioned rollback first (wrangler >= 3.x)
    if wrangler versions rollback --auto --config "$config" 2>/dev/null; then
      log "✅ Successfully rolled back ${service} to previous version"
      return 0
    fi

    # Fallback: redeploy the previous deployment ID if available
    local state_file="deploy/.wrangler-state"
    if [[ -f "$state_file" ]]; then
      local prev_version
      prev_version=$(jq -r ".\"${service}\".\"${env}\".previous_version // empty" "$state_file" 2>/dev/null || true)
      if [[ -n "$prev_version" ]]; then
        log "Attempting rollback to version ${prev_version}..."
        if wrangler versions rollback "${prev_version}" --config "$config" 2>/dev/null; then
          log "✅ Rolled back ${service} to version ${prev_version}"
          return 0
        fi
      fi
    fi

    if (( attempt < MAX_RETRIES )); then
      log "⚠️ Rollback attempt ${attempt}/${MAX_RETRIES} failed for ${service}, retrying in ${RETRY_DELAY}s..."
      sleep "$RETRY_DELAY"
    fi
  done

  error "❌ Failed to rollback ${service} after ${MAX_RETRIES} attempts"
  return 1
}

# Save current deployment version for future rollback
save_deployment_version() {
  local service="$1"
  local env="$2"
  local config

  config=$(get_wrangler_config "$service" "$env") || return 1

  local state_file="deploy/.wrangler-state"
  mkdir -p "$(dirname "$state_file")"

  # Get current version ID before deploy
  local current_version
  current_version=$(wrangler versions list --config "$config" --json 2>/dev/null | jq -r '.[0].version_id // "unknown"' 2>/dev/null || echo "unknown")

  # Update state file
  if [[ -f "$state_file" ]]; then
    local tmp
    tmp=$(mktemp)
    jq --arg svc "$service" --arg env "$env" --arg ver "$current_version" \
      '.[$svc][$env].previous_version = .[$svc][$env].current_version // "none" |
       .[$svc][$env].current_version = $ver |
       .[$svc][$env].rolled_back_at = null' \
      "$state_file" > "$tmp" && mv "$tmp" "$state_file"
  else
    cat > "$state_file" <<EOF
{
  "${service}": {
    "${env}": {
      "current_version": "${current_version}",
      "previous_version": "none",
      "deployed_at": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    }
  }
}
EOF
  fi

  log "📝 Saved deployment version for ${service}/${env}: ${current_version}"
}

# Health check after rollback
health_check() {
  local service="$1"
  local env="$2"
  local url

  case "$service" in
    rpc-proxy)      url="https://rpc${env:+-$env}.cinacoin.com/health" ;;
    relay-server)   url="https://relay${env:+-$env}.cinacoin.com/health" ;;
    keys-server)    url="https://keys${env:+-$env}.cinacoin.com/health" ;;
    push-server)    url="https://push${env:+-$env}.cinacoin.com/health" ;;
    notify-server)  url="https://notify${env:+-$env}.cinacoin.com/health" ;;
    analytics-server) url="https://analytics${env:+-$env}.cinacoin.com/health" ;;
    *)
      error "Unknown service for health check: $service"
      return 1
      ;;
  esac

  log "🏥 Running health check: $url"

  for i in {1..5}; do
    if curl -sf --max-time 10 "$url" > /dev/null 2>&1; then
      log "✅ Health check passed for ${service}"
      return 0
    fi
    log "⏳ Health check attempt ${i}/5 failed, retrying in 5s..."
    sleep 5
  done

  error "❌ Health check failed for ${service} after 5 attempts"
  return 1
}

# ─── Main ───────────────────────────────────────────────────────────────────

main() {
  if [[ $# -lt 1 ]]; then
    usage
  fi

  local service="$1"
  local env="${2:-staging}"

  if [[ "$env" != "staging" && "$env" != "production" ]]; then
    error "Invalid environment: ${env}. Must be 'staging' or 'production'."
    exit 1
  fi

  check_prerequisites

  log "🚨 Starting rollback: service=${service}, environment=${env}"

  local failed=0

  if [[ "$service" == "all" ]]; then
    for svc in "${SERVICES[@]}"; do
      if ! rollback_service "$svc" "$env"; then
        failed=$((failed + 1))
      else
        # Verify health after rollback
        health_check "$svc" "$env" || true
      fi
    done
  else
    # Validate service name
    local valid=false
    for svc in "${SERVICES[@]}"; do
      if [[ "$svc" == "$service" ]]; then
        valid=true
        break
      fi
    done

    if [[ "$valid" != "true" ]]; then
      error "Unknown service: ${service}"
      echo "Available services: ${SERVICES[*]}"
      exit 1
    fi

    if ! rollback_service "$service" "$env"; then
      failed=1
    else
      health_check "$service" "$env" || true
    fi
  fi

  if [[ $failed -gt 0 ]]; then
    error "❌ Rollback completed with ${failed} failure(s)"
    exit 1
  fi

  log "✅ Rollback completed successfully"
}

main "$@"
