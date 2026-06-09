#!/bin/bash
# =============================================================================
# Cinacoin SSL Certificate Preparation Script
# Prepares and validates SSL certificates for production deployment
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="${SCRIPT_DIR}/../certs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${SCRIPT_DIR}/../logs/ssl-prep-${TIMESTAMP}.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Domains requiring certificates
DOMAINS=(
    "cinacoin.com"
    "auth.cinacoin.com"
    "api.cinacoin.com"
    "cloud.cinacoin.com"
    "dash.cinacoin.com"
    "demo.cinacoin.com"
    "wallet.cinacoin.com"
    "analytics.cinacoin.com"
    "status.cinacoin.com"
    "rpc.cinacoin.com"
    "keys.cinacoin.com"
    "relay.cinacoin.com"
    "notify.cinacoin.com"
    "push.cinacoin.com"
)

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# Create directories
mkdir -p "$CERT_DIR"
mkdir -p "${SCRIPT_DIR}/../logs"

# Function to check certificate expiry
check_cert_expiry() {
    local domain=$1
    local port=${2:-443}
    
    info "Checking certificate for $domain..."
    
    # Get certificate info
    local cert_info=$(echo | openssl s_client -servername "$domain" -connect "${domain}:${port}" 2>/dev/null)
    
    if [ -z "$cert_info" ]; then
        warn "No certificate found for $domain"
        return 1
    fi
    
    # Extract dates
    local not_before=$(echo "$cert_info" | openssl x509 -noout -startdate 2>/dev/null | cut -d= -f2)
    local not_after=$(echo "$cert_info" | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    local subject=$(echo "$cert_info" | openssl x509 -noout -subject 2>/dev/null | sed 's/subject=//')
    local issuer=$(echo "$cert_info" | openssl x509 -noout -issuer 2>/dev/null | sed 's/issuer=//')
    
    if [ -z "$not_after" ]; then
        error "Could not parse certificate dates for $domain"
        return 1
    fi
    
    # Calculate days until expiry
    local expiry_epoch=$(date -d "$not_after" +%s 2>/dev/null || echo 0)
    local now_epoch=$(date +%s)
    local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))
    
    # Check certificate validity
    if [ $days_left -lt 0 ]; then
        error "Certificate for $domain is EXPIRED (expired $((-$days_left)) days ago)"
        return 1
    elif [ $days_left -lt 14 ]; then
        error "Certificate for $domain expires in $days_left days (CRITICAL)"
        return 1
    elif [ $days_left -lt 30 ]; then
        warn "Certificate for $domain expires in $days_left days (WARNING)"
        return 0
    else
        log "✓ $domain: Valid for $days_left days (Issuer: $issuer)"
        return 0
    fi
}

# Function to generate CSR (Certificate Signing Request)
generate_csr() {
    local domain=$1
    local org="Cinacoin"
    local country="US"
    local state="California"
    local city="San Francisco"
    
    info "Generating CSR for $domain..."
    
    local key_file="${CERT_DIR}/${domain}.key"
    local csr_file="${CERT_DIR}/${domain}.csr"
    
    # Generate private key if not exists
    if [ ! -f "$key_file" ]; then
        openssl genrsa -out "$key_file" 2048 2>/dev/null
        chmod 600 "$key_file"
        log "Generated private key: $key_file"
    fi
    
    # Generate CSR
    openssl req -new -sha256 -key "$key_file" -out "$csr_file" \
        -subj "/C=$country/ST=$state/L=$city/O=$org/CN=$domain" 2>/dev/null
    
    log "Generated CSR: $csr_file"
    
    # Verify CSR
    if openssl req -text -noout -verify -in "$csr_file" >/dev/null 2>&1; then
        log "✓ CSR verified for $domain"
    else
        error "CSR verification failed for $domain"
        return 1
    fi
}

# Function to generate self-signed certificate (for testing)
generate_self_signed() {
    local domain=$1
    local days=${2:-365}
    
    info "Generating self-signed certificate for $domain (valid for $days days)..."
    
    local key_file="${CERT_DIR}/${domain}.key"
    local cert_file="${CERT_DIR}/${domain}.crt"
    
    # Generate private key if not exists
    if [ ! -f "$key_file" ]; then
        openssl genrsa -out "$key_file" 2048 2>/dev/null
        chmod 600 "$key_file"
    fi
    
    # Generate self-signed certificate
    openssl req -x509 -sha256 -nodes -days "$days" \
        -newkey rsa:2048 \
        -keyout "$key_file" \
        -out "$cert_file" \
        -subj "/CN=$domain" 2>/dev/null
    
    chmod 644 "$cert_file"
    
    log "Generated self-signed certificate: $cert_file"
}

# Function to check certificate chain
check_cert_chain() {
    local domain=$1
    local port=${2:-443}
    
    info "Checking certificate chain for $domain..."
    
    # Get full certificate chain
    local chain=$(echo | openssl s_client -showcerts -servername "$domain" -connect "${domain}:${port}" 2>/dev/null)
    
    # Count certificates in chain
    local cert_count=$(echo "$chain" | grep -c "BEGIN CERTIFICATE")
    
    if [ $cert_count -eq 0 ]; then
        error "No certificates in chain for $domain"
        return 1
    elif [ $cert_count -eq 1 ]; then
        warn "Only 1 certificate in chain for $domain (missing intermediate?)"
        return 0
    else
        log "✓ Certificate chain complete: $cert_count certificates"
        return 0
    fi
}

# Function to verify certificate matches domain
verify_cert_domain() {
    local domain=$1
    local port=${2:-443}
    
    info "Verifying certificate domain match for $domain..."
    
    # Get certificate SAN (Subject Alternative Names)
    local san=$(echo | openssl s_client -servername "$domain" -connect "${domain}:${port}" 2>/dev/null | \
                openssl x509 -noout -ext subjectAltName 2>/dev/null)
    
    if echo "$san" | grep -q "$domain"; then
        log "✓ Certificate covers $domain"
        return 0
    else
        error "Certificate does not cover $domain"
        return 1
    fi
}

# Main execution
log "Starting SSL certificate preparation for Cinacoin production..."
echo ""

# Parse command line
ACTION=${1:-check}

case "$ACTION" in
    check)
        info "=== Checking Existing Certificates ==="
        echo ""
        
        passed=0
        failed=0
        
        for domain in "${DOMAINS[@]}"; do
            if check_cert_expiry "$domain"; then
                ((passed++))
            else
                ((failed++))
            fi
        done
        
        echo ""
        log "=== Certificate Check Summary ==="
        log "Passed: $passed"
        if [ $failed -gt 0 ]; then
            error "Failed: $failed"
            echo ""
            warn "To generate CSRs for Let's Encrypt or other CA:"
            echo "  $0 csr"
            echo ""
            warn "To generate self-signed certificates (testing only):"
            echo "  $0 self-signed"
        fi
        ;;
        
    csr)
        info "=== Generating Certificate Signing Requests ==="
        echo ""
        
        for domain in "${DOMAINS[@]}"; do
            generate_csr "$domain"
        done
        
        echo ""
        log "CSR generation complete"
        log "Submit CSRs to your Certificate Authority (e.g., Let's Encrypt, DigiCert)"
        log "CSRs are in: $CERT_DIR"
        ;;
        
    self-signed)
        warn "=== Generating Self-Signed Certificates (TESTING ONLY) ==="
        echo ""
        
        for domain in "${DOMAINS[@]}"; do
            generate_self_signed "$domain" 365
        done
        
        echo ""
        log "Self-signed certificates generated"
        warn "These are for TESTING ONLY. Do not use in production!"
        log "Certificates are in: $CERT_DIR"
        ;;
        
    chain)
        info "=== Checking Certificate Chains ==="
        echo ""
        
        for domain in "${DOMAINS[@]}"; do
            check_cert_chain "$domain"
        done
        ;;
        
    verify)
        info "=== Verifying Certificate Domain Coverage ==="
        echo ""
        
        for domain in "${DOMAINS[@]}"; do
            verify_cert_domain "$domain"
        done
        ;;
        
    *)
        echo "Usage: $0 [check|csr|self-signed|chain|verify]"
        echo ""
        echo "Commands:"
        echo "  check        - Check existing certificate expiry (default)"
        echo "  csr          - Generate CSRs for all domains"
        echo "  self-signed  - Generate self-signed certs (testing only)"
        echo "  chain        - Verify certificate chains"
        echo "  verify       - Verify domain coverage in certificates"
        exit 1
        ;;
esac

echo ""
log "Operation complete. Log file: $LOG_FILE"
