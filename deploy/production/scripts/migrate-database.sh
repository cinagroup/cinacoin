#!/bin/bash
# =============================================================================
# Cinacoin Production Database Migration Script
# Usage: ./migrate-database.sh [up|down|status|backup]
# =============================================================================

set -euo pipefail

# Load environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../config/.env.production"
source "${SCRIPT_DIR}/../config/.env.secrets" 2>/dev/null || {
    echo "ERROR: .env.secrets not found. Copy from .env.secrets.template"
    exit 1
}

MIGRATION_DIR="${SCRIPT_DIR}/../../onux/apps/auth-service/migrations"
BACKUP_DIR="${SCRIPT_DIR}/../backups/$(date +%Y%m%d_%H%M%S)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${SCRIPT_DIR}/../logs/migrate_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"
mkdir -p "${SCRIPT_DIR}/../logs"

# Function to backup database
backup_database() {
    log "Starting database backup..."
    local backup_file="${BACKUP_DIR}/cinacoin_auth_backup.sql.gz"
    
    # Extract connection details from DATABASE_URL
    local db_host=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    local db_name=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    local db_user=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$db_host" \
        -U "$db_user" \
        -d "$db_name" \
        --verbose \
        --format=custom \
        --file="${BACKUP_DIR}/cinacoin_auth_backup.dump" 2>>"$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        gzip "${BACKUP_DIR}/cinacoin_auth_backup.dump"
        log "Backup created: ${backup_file}.gz"
        echo "$backup_file"
    else
        error "Backup failed"
        return 1
    fi
}

# Function to check migration status
check_status() {
    log "Checking migration status..."
    
    # Create migrations tracking table if not exists
    PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" -c "
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            checksum VARCHAR(64),
            description TEXT
        );
    " >> "$LOG_FILE" 2>&1
    
    # Show applied migrations
    log "Applied migrations:"
    PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" -c "
        SELECT version, applied_at, description 
        FROM schema_migrations 
        ORDER BY version;
    " | tee -a "$LOG_FILE"
    
    # Show pending migrations
    log "Pending migrations:"
    for migration_file in "$MIGRATION_DIR"/*.sql; do
        if [ -f "$migration_file" ]; then
            version=$(basename "$migration_file" | cut -d'_' -f1)
            applied=$(PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" -t -c "
                SELECT COUNT(*) FROM schema_migrations WHERE version = '$version';
            " 2>/dev/null | tr -d ' ')
            
            if [ "$applied" = "0" ]; then
                warn "Pending: $(basename "$migration_file")"
            fi
        fi
    done
}

# Function to run migrations up
migrate_up() {
    log "Starting database migration (up)..."
    
    # Create backup first
    backup_database
    
    # Create migrations tracking table
    PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" -c "
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            checksum VARCHAR(64),
            description TEXT
        );
    " >> "$LOG_FILE" 2>&1
    
    # Apply each migration
    for migration_file in "$MIGRATION_DIR"/*.sql; do
        if [ -f "$migration_file" ]; then
            version=$(basename "$migration_file" | cut -d'_' -f1)
            description=$(basename "$migration_file" .sql | cut -d'_' -f2-)
            
            # Check if already applied
            applied=$(PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" -t -c "
                SELECT COUNT(*) FROM schema_migrations WHERE version = '$version';
            " 2>/dev/null | tr -d ' ')
            
            if [ "$applied" = "0" ]; then
                log "Applying migration: $(basename "$migration_file")"
                
                # Calculate checksum
                checksum=$(sha256sum "$migration_file" | cut -d' ' -f1)
                
                # Apply migration in transaction
                if PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration_file" >> "$LOG_FILE" 2>&1; then
                    # Record migration
                    PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" -c "
                        INSERT INTO schema_migrations (version, checksum, description)
                        VALUES ('$version', '$checksum', '$description');
                    " >> "$LOG_FILE" 2>&1
                    
                    log "✓ Migration applied: $version"
                else
                    error "✗ Migration failed: $version"
                    error "Rolling back is not automatic. Check logs and fix manually."
                    exit 1
                fi
            else
                log "Skipping already applied: $version"
            fi
        fi
    done
    
    log "Migration completed successfully"
}

# Function to verify migration
verify_migration() {
    log "Verifying migration..."
    
    # Check critical tables exist
    local tables=("users" "sessions" "oauth_accounts" "mfa_secrets" "api_keys")
    local all_exist=true
    
    for table in "${tables[@]}"; do
        if PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" -t -c "
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = '$table'
            );
        " 2>/dev/null | grep -q 't'; then
            log "✓ Table exists: $table"
        else
            error "✗ Table missing: $table"
            all_exist=false
        fi
    done
    
    if [ "$all_exist" = true ]; then
        log "Migration verification passed"
        return 0
    else
        error "Migration verification failed"
        return 1
    fi
}

# Main command handler
case "${1:-up}" in
    up)
        migrate_up
        verify_migration
        ;;
    down)
        error "Down migration not implemented. Use manual rollback."
        exit 1
        ;;
    status)
        check_status
        ;;
    backup)
        backup_database
        ;;
    verify)
        verify_migration
        ;;
    *)
        echo "Usage: $0 [up|down|status|backup|verify]"
        exit 1
        ;;
esac

log "Operation completed. Log file: $LOG_FILE"
