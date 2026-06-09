#!/bin/bash
# =============================================================================
# Cinacoin — DNS Records Backup
# =============================================================================
# Frequency: Weekly (via cron)
# Usage: ./backup-dns-records.sh [zone_id]
# =============================================================================

set -euo pipefail

CLOUDFLARE_ACCOUNT_ID="7ea8e46d8210bad342fa7595f7935fea"
ZONE_ID="${1:-9e9b0140baac8f501ded715128fa5415}"
BACKUP_BUCKET="cinacoin-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups/dns"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Starting DNS backup for zone ${ZONE_ID}..."

# Export all DNS records
ALL_RECORDS=$(curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?per_page=100" \
  -H "Authorization: Bearer $CF_API_TOKEN")

RECORD_COUNT=$(echo "$ALL_RECORDS" | jq '.result | length')
echo "  Found ${RECORD_COUNT} DNS records"

# Save full export
echo "$ALL_RECORDS" | jq '.result' > "${BACKUP_DIR}/dns-records-${TIMESTAMP}.json"

# Export by type
for type in A AAAA CNAME MX TXT SRV CAA; do
  curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=${type}&per_page=100" \
    -H "Authorization: Bearer $CF_API_TOKEN" | \
    jq '.result' > "${BACKUP_DIR}/dns-${type}-${TIMESTAMP}.json"
done

# Also backup Page Rules
curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules?per_page=50" \
  -H "Authorization: Bearer $CF_API_TOKEN" | \
  jq '.result' > "${BACKUP_DIR}/pagerules-${TIMESTAMP}.json"

# Upload to R2
if command -v aws &> /dev/null; then
  tar -czf "${BACKUP_DIR}/dns-backup-${TIMESTAMP}.tar.gz" -C "$BACKUP_DIR" \
    "dns-records-${TIMESTAMP}.json" \
    "pagerules-${TIMESTAMP}.json"

  aws s3 cp "${BACKUP_DIR}/dns-backup-${TIMESTAMP}.tar.gz" \
    "s3://${BACKUP_BUCKET}/dns/${TIMESTAMP}.tar.gz" \
    --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    --region auto 2>/dev/null && \
    echo "  ✅ DNS backup → R2" || \
    echo "  ⚠️  R2 upload failed (local backup saved)"

  rm -f "${BACKUP_DIR}/dns-backup-${TIMESTAMP}.tar.gz"
fi

# Commit to Git
if git rev-parse --is-inside-work-tree &>/dev/null; then
  git add "${BACKUP_DIR}/"
  git commit -m "backup: DNS records ${TIMESTAMP} (${RECORD_COUNT} records)" --quiet 2>/dev/null || true
  echo "  ✅ Committed to Git"
fi

# Clean up old local backups (keep last 12 weeks)
find "$BACKUP_DIR" -name "dns-records-*.json" -mtime +84 -delete 2>/dev/null
find "$BACKUP_DIR" -name "dns-*-*.json" -mtime +84 -delete 2>/dev/null

echo "[$(date -Iseconds)] DNS backup complete (${RECORD_COUNT} records)"
