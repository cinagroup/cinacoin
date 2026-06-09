#!/bin/bash
# =============================================================================
# Cinacoin DNS Verification Script
# Verifies all required DNS records for production deployment
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="dns-verification-report-${TIMESTAMP}.md"

# Required DNS records
declare -A REQUIRED_RECORDS=(
    ["auth.cinacoin.com"]="A/CNAME"
    ["api.cinacoin.com"]="A/CNAME"
    ["cinacoin.com"]="A"
    ["cloud.cinacoin.com"]="CNAME"
    ["dash.cinacoin.com"]="CNAME"
    ["demo.cinacoin.com"]="CNAME"
    ["wallet.cinacoin.com"]="CNAME"
    ["analytics.cinacoin.com"]="CNAME"
    ["status.cinacoin.com"]="CNAME"
    ["rpc.cinacoin.com"]="CNAME"
    ["keys.cinacoin.com"]="CNAME"
    ["relay.cinacoin.com"]="CNAME"
    ["notify.cinacoin.com"]="CNAME"
    ["push.cinacoin.com"]="CNAME"
)

# Internal DNS records (for Kubernetes/VPC)
declare -A INTERNAL_RECORDS=(
    ["db-primary.cinacoin.internal"]="A"
    ["db-replica.cinacoin.internal"]="A"
    ["redis-primary.cinacoin.internal"]="A"
    ["redis-replica.cinacoin.internal"]="A"
    ["otel-collector.cinacoin.internal"]="A"
    ["smtp.cinacoin.internal"]="A"
)

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO:${NC} $1"
}

# Check if dig is available
if ! command -v dig &> /dev/null; then
    error "dig command not found. Install dnsutils package."
    exit 1
fi

# Function to check DNS record
check_dns() {
    local domain=$1
    local record_type=$2
    local expected=$3
    
    info "Checking $domain ($record_type)..."
    
    # Query DNS
    local result=$(dig +short "$domain" "$record_type" 2>/dev/null | head -1)
    
    if [ -z "$result" ]; then
        warn "No $record_type record found for $domain"
        return 1
    fi
    
    if [ -n "$expected" ] && [ "$result" != "$expected" ]; then
        warn "Unexpected value for $domain: got $result, expected $expected"
        return 1
    fi
    
    log "✓ $domain → $result"
    return 0
}

# Function to check SSL certificate
check_ssl() {
    local domain=$1
    local port=${2:-443}
    
    info "Checking SSL certificate for $domain..."
    
    # Check if certificate exists and is valid
    local cert_info=$(echo | openssl s_client -servername "$domain" -connect "${domain}:${port}" 2>/dev/null | openssl x509 -noout -dates -subject 2>/dev/null)
    
    if [ -z "$cert_info" ]; then
        warn "No SSL certificate found for $domain"
        return 1
    fi
    
    # Extract expiry date
    local expiry=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
    local subject=$(echo "$cert_info" | grep "subject" | sed 's/subject=//')
    
    # Check if certificate is expired
    if echo "$cert_info" | grep -q "notAfter"; then
        local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || echo 0)
        local now_epoch=$(date +%s)
        local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))
        
        if [ $days_left -lt 0 ]; then
            error "Certificate for $domain is EXPIRED"
            return 1
        elif [ $days_left -lt 30 ]; then
            warn "Certificate for $domain expires in $days_left days"
            return 0
        else
            log "✓ SSL certificate valid for $days_left days"
            return 0
        fi
    fi
    
    return 1
}

# Function to generate report
generate_report() {
    cat > "$REPORT_FILE" << EOF
# DNS Verification Report

**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Environment:** Production

## Summary

- Total domains checked: ${#REQUIRED_RECORDS[@]}
- Internal records: ${#INTERNAL_RECORDS[@]}
- Report file: $REPORT_FILE

## Public DNS Records

EOF
    
    echo "| Domain | Record Type | Status | Value |" >> "$REPORT_FILE"
    echo "|--------|-------------|--------|-------|" >> "$REPORT_FILE"
}

# Main execution
log "Starting DNS verification for Cinacoin production..."
echo ""

# Check public DNS records
info "=== Checking Public DNS Records ==="
echo ""

passed=0
failed=0

for domain in "${!REQUIRED_RECORDS[@]}"; do
    record_type="${REQUIRED_RECORDS[$domain]}"
    
    if [ "$record_type" = "A/CNAME" ]; then
        if check_dns "$domain" "A" || check_dns "$domain" "CNAME"; then
            ((passed++))
        else
            ((failed++))
        fi
    else
        if check_dns "$domain" "$record_type"; then
            ((passed++))
        else
            ((failed++))
        fi
    fi
done

echo ""
info "=== Checking Internal DNS Records ==="
echo ""

for domain in "${!INTERNAL_RECORDS[@]}"; do
    record_type="${INTERNAL_RECORDS[$domain]}"
    if check_dns "$domain" "$record_type"; then
        ((passed++))
    else
        ((failed++))
        warn "Internal DNS record missing: $domain (required for production)"
    fi
done

echo ""
info "=== Checking SSL Certificates ==="
echo ""

# Check critical SSL certificates
critical_domains=("auth.cinacoin.com" "api.cinacoin.com" "cinacoin.com")

for domain in "${critical_domains[@]}"; do
    if check_ssl "$domain"; then
        ((passed++))
    else
        ((failed++))
    fi
done

echo ""
log "=== DNS Verification Summary ==="
echo ""
log "Passed: $passed"
warn "Failed: $failed"
echo ""

if [ $failed -eq 0 ]; then
    log "✓ All DNS checks passed!"
    exit 0
else
    error "✗ $failed DNS check(s) failed. Review the output above."
    exit 1
fi
