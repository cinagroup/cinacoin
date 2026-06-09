#!/bin/bash
# =============================================================================
# Cinacoin — D1 Database Backup to R2
# =============================================================================
# Frequency: Hourly (via cron)
# Usage: ./backup-d1-to-r2.sh
# =============================================================================

set -euo pipefail

CLOUDFLARE_ACCOUNT_ID="7ea8e46d8210bad342fa7595f7935fea"
BACKUP_BUCKET="cinacoin-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups/d1"

DATABASES=(
  "cinacoin-api-gateway-prod"
  "cinacoin-auth-prod"
  "cinacoin-users-prod"
  "cinacoin-monitoring"
)

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Starting D1 backup..."

for db in "${DATABASES[@]}"; do
  echo "  Backing up ${db}..."

  OUTPUT_FILE="${BACKUP_DIR}/${db}-${TIMESTAMP}.sql"

  # Export to SQL
  if wrangler d1 export "${db}" --output="${OUTPUT_FILE}" 2>/dev/null; then
    # Compress
    gzip "${OUTPUT_FILE}"

    # Upload to R2
    if command -v aws &> /dev/null; then
      aws s3 cp "${OUTPUT_FILE}.gz" \
        "s3://${BACKUP_BUCKET}/d1/${db}/${TIMESTAMP}.sql.gz" \
        --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" \
        --region auto 2>/dev/null && \
        echo "    ✅ ${db} → R2" || \
        echo "    ⚠️  ${db} → R2 upload failed (local backup saved)"
    else
      echo "    ⚠️  ${db} → Local backup only (aws cli not found)"
    fi

    # Clean up local file after upload
    rm -f "${OUTPUT_FILE}.gz"
  else
    echo "    ❌ ${db} export failed"
  fi
done

# Clean up old local backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete 2>/dev/null

echo "[$(date -Iseconds)] D1 backup complete"
