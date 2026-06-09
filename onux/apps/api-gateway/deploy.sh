#!/bin/bash
#
# Cinacoin API Gateway Deployment Script
#
# Usage:
#   ./deploy.sh [staging|production]
#
# This script handles:
#   - Pre-deployment checks
#   - Database migrations
#   - Worker deployment
#   - Post-deployment verification
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-staging}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        log_error "wrangler is not installed. Install it with: npm install -g wrangler"
        exit 1
    fi
    
    # Check if logged in to Cloudflare
    if ! wrangler whoami &> /dev/null; then
        log_error "Not logged in to Cloudflare. Run: wrangler login"
        exit 1
    fi
    
    # Check if in the correct directory
    if [ ! -f "$PROJECT_DIR/wrangler.toml" ]; then
        log_error "wrangler.toml not found. Are you in the api-gateway directory?"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Run pre-deployment checks
pre_deploy_checks() {
    log_info "Running pre-deployment checks..."
    
    # Type check
    log_info "Running type check..."
    if ! pnpm typecheck; then
        log_error "Type check failed"
        exit 1
    fi
    
    # Run tests
    log_info "Running tests..."
    if ! pnpm test; then
        log_error "Tests failed"
        exit 1
    fi
    
    log_success "Pre-deployment checks passed"
}

# Apply database migrations
apply_migrations() {
    log_info "Applying database migrations for $ENVIRONMENT..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        pnpm db:migrate:prod
    else
        pnpm db:migrate
    fi
    
    log_success "Database migrations applied"
}

# Deploy the worker
deploy_worker() {
    log_info "Deploying to $ENVIRONMENT..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        pnpm deploy:prod
    else
        pnpm deploy:staging
    fi
    
    log_success "Worker deployed to $ENVIRONMENT"
}

# Post-deployment verification
post_deploy_verify() {
    log_info "Running post-deployment verification..."
    
    # Wait for deployment to propagate
    log_info "Waiting for deployment to propagate..."
    sleep 10
    
    # Determine the base URL
    if [ "$ENVIRONMENT" = "production" ]; then
        BASE_URL="https://api.cinacoin.com"
    else
        BASE_URL="https://api-staging.cinacoin.com"
    fi
    
    # Health check
    log_info "Checking health endpoint..."
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
    if [ "$HEALTH_STATUS" != "200" ]; then
        log_error "Health check failed with status: $HEALTH_STATUS"
        exit 1
    fi
    log_success "Health check passed"
    
    # Readiness check
    log_info "Checking readiness endpoint..."
    READY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health/ready")
    if [ "$READY_STATUS" != "200" ]; then
        log_error "Readiness check failed with status: $READY_STATUS"
        exit 1
    fi
    log_success "Readiness check passed"
    
    # Check response content
    log_info "Verifying response content..."
    HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
    if ! echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
        log_error "Health response does not contain expected status"
        exit 1
    fi
    log_success "Response content verified"
    
    log_success "Post-deployment verification passed"
}

# Main deployment flow
main() {
    log_info "Starting deployment to $ENVIRONMENT"
    log_info "Project directory: $PROJECT_DIR"
    
    cd "$PROJECT_DIR"
    
    check_prerequisites
    pre_deploy_checks
    apply_migrations
    deploy_worker
    post_deploy_verify
    
    log_success "Deployment to $ENVIRONMENT completed successfully! 🚀"
    log_info "API Gateway is now live at:"
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "  https://api.cinacoin.com"
    else
        log_info "  https://api-staging.cinacoin.com"
    fi
}

# Run main function
main "$@"
