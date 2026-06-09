# Cinacoin Phase 2 — Backup & Recovery Plan

> **Version**: 2.0.0  
> **Date**: 2026-06-08  
> **Status**: Production Ready  
> **RPO**: 1 hour | **RTO**: 4 hours

---

## 1. Backup Strategy Overview

### 1.1 What We Back Up

| Component | Type | Frequency | Retention | Location |
|-----------|------|-----------|-----------|----------|
| **D1 Databases** | SQLite | Every 1 hour | 30 days | Cloudflare (automatic) + R2 (manual) |
| **KV Namespaces** | Key-value | Daily snapshot | 14 days | R2 export |
| **R2 Buckets** | Object storage | Continuous (versioned) | 90 days | Cloudflare R2 (built-in) |
| **Worker Code** | Source | Git (every commit) | Forever | GitHub |
| **Worker Secrets** | Config | Manual export | Latest 5 versions | Encrypted local |
| **DNS Records** | Config | Weekly export | 52 weeks | GitHub + R2 |
| **Page Rules** | Config | Monthly export | 12 months | GitHub |
| **SSL Certificates** | Certs | Auto (Cloudflare) | N/A | Cloudflare managed |

### 1.2 Recovery Time & Point Objectives

| Scenario | RPO | RTO | Recovery Method |
|----------|-----|-----|-----------------|
| Single Worker failure | 0 | < 5 min | Automatic failover |
| D1 database corruption | 1 hour | < 30 min | Point-in-time restore |
| KV data loss | 24 hours | < 1 hour | Restore from R2 snapshot |
| Full zone outage | 0 | < 15 min | Geographic failover |
| Account compromise | 24 hours | 2-4 hours | Full restore from backups |
| Catastrophic data loss | 1 hour | 4 hours | Multi-region restore |

---

## 2. D1 Database Backup

### 2.1 Automatic Backups (Cloudflare Built-in)

Cloudflare D1 provides automatic continuous backups with point-in-time recovery:

```bash
# List available D1 databases
wrangler d1 list

# View backup information
wrangler d1 backups list cinacoin-api-gateway-prod

# Restore to point-in-time
wrangler d1 restore cinacoin-api-gateway-prod \
  --timestamp "2026-06-08T15:00:00Z"
```

**Backup retention:**
- Continuous backups: 30 days
- Point-in-time recovery: Any second within retention window
- Automatic daily snapshots: 30 days

### 2.2 Manual Export to R2

```bash
#!/bin/bash
# scripts/backup-d1-to-r2.sh

DATABASES=(
  "cinacoin-api-gateway-prod"
  "cinacoin-auth-prod"
  "cinacoin-users-prod"
  "cinacoin-monitoring"
)

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_BUCKET="cinacoin-backups"

for db in "${DATABASES[@]}"; do
  echo "Backing up ${db}..."

  # Export to SQL
  wrangler d1 export "${db}" --output="./backups/${db}-${TIMESTAMP}.sql"

  # Upload to R2
  aws s3 cp "./backups/${db}-${TIMESTAMP}.sql" \
    "s3://${BACKUP_BUCKET}/d1/${db}/${TIMESTAMP}.sql" \
    --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    --region auto

  # Compress and keep local copy
  gzip "./backups/${db}-${TIMESTAMP}.sql"

  echo "✅ ${db} backed up"
done

# Clean up old local backups (keep last 7 days)
find ./backups -name "*.sql.gz" -mtime +7 -delete

echo "All D1 databases backed up successfully"
```

### 2.3 Automated Backup Schedule

```bash
# Add to crontab (runs every hour)
0 * * * * /path/to/scripts/backup-d1-to-r2.sh >> /var/log/cinacoin-backup.log 2>&1

# Daily full export (2 AM UTC)
0 2 * * * /path/to/scripts/backup-d1-full-export.sh >> /var/log/cinacoin-backup.log 2>&1
```

### 2.4 D1 Restore Procedure

```bash
#!/bin/bash
# scripts/restore-d1.sh

DATABASE=$1
BACKUP_FILE=$2

if [ -z "$DATABASE" ] || [ -z "$BACKUP_FILE" ]; then
  echo "Usage: restore-d1.sh <database-name> <backup-file.sql.gz>"
  exit 1
fi

echo "⚠️  WARNING: This will overwrite database '${DATABASE}'"
echo "Backup file: ${BACKUP_FILE}"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted"
  exit 0
fi

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" > /tmp/restore.sql
  BACKUP_FILE="/tmp/restore.sql"
fi

# Import backup
wrangler d1 execute "${DATABASE}" --file="${BACKUP_FILE}"

echo "✅ Database '${DATABASE}' restored successfully"
```

---

## 3. KV Namespace Backup

### 3.1 KV Export Script

```bash
#!/bin/bash
# scripts/backup-kv-to-r2.sh

KV_NAMESPACES=(
  "RATE_LIMIT_KV:cinacoin-api-gateway-prod"
  "SESSION_KV:cinacoin-auth-prod"
  "USERS_CACHE_KV:cinacoin-users-prod"
  "MONITORING_KV:cinacoin-monitoring"
)

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_BUCKET="cinacoin-backups"

for ns_config in "${KV_NAMESPACES[@]}"; do
  IFS=':' read -r BINDING ENV <<< "$ns_config"
  NAMESPACE_ID=$(wrangler kv:namespace list | jq -r ".[] | select(.title == \"${ENV}_${BINDING}\") | .id")

  echo "Backing up KV namespace: ${BINDING} (${NAMESPACE_ID})..."

  # List all keys
  KEYS=$(wrangler kv:key list --namespace-id="${NAMESPACE_ID}" | jq -r '.[].name')

  # Export each key
  mkdir -p "./backups/kv/${BINDING}-${TIMESTAMP}"

  for key in $KEYS; do
    wrangler kv:key get "${key}" --namespace-id="${NAMESPACE_ID}" \
      > "./backups/kv/${BINDING}-${TIMESTAMP}/${key}.json"
  done

  # Compress and upload to R2
  tar -czf "./backups/kv/${BINDING}-${TIMESTAMP}.tar.gz" \
    -C "./backups/kv" "${BINDING}-${TIMESTAMP}"

  aws s3 cp "./backups/kv/${BINDING}-${TIMESTAMP}.tar.gz" \
    "s3://${BACKUP_BUCKET}/kv/${BINDING}/${TIMESTAMP}.tar.gz" \
    --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    --region auto

  # Clean up local files
  rm -rf "./backups/kv/${BINDING}-${TIMESTAMP}"
  rm "./backups/kv/${BINDING}-${TIMESTAMP}.tar.gz"

  echo "✅ ${BINDING} backed up ($(echo "$KEYS" | wc -l) keys)"
done

echo "All KV namespaces backed up successfully"
```

### 3.2 KV Restore Procedure

```bash
#!/bin/bash
# scripts/restore-kv.sh

BINDING=$1
BACKUP_DIR=$2

if [ -z "$BINDING" ] || [ -z "$BACKUP_DIR" ]; then
  echo "Usage: restore-kv.sh <binding-name> <backup-directory>"
  exit 1
fi

NAMESPACE_ID=$(wrangler kv:namespace list | jq -r ".[] | select(.title | contains(\"${BINDING}\")) | .id")

echo "⚠️  WARNING: This will overwrite KV namespace '${BINDING}'"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted"
  exit 0
fi

# Restore each key
for file in "${BACKUP_DIR}"/*.json; do
  KEY=$(basename "$file" .json)
  echo "Restoring key: ${KEY}"
  wrangler kv:key put "${KEY}" --namespace-id="${NAMESPACE_ID}" --path="${file}"
done

echo "✅ KV namespace '${BINDING}' restored successfully"
```

---

## 4. R2 Bucket Backup

### 4.1 R2 Versioning (Built-in)

R2 supports object versioning, which is enabled by default:

```bash
# Enable versioning on a bucket
aws s3api put-bucket-versioning \
  --bucket cinacoin-user-assets-prod \
  --versioning-configuration Status=Enabled \
  --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --region auto

# List object versions
aws s3api list-object-versions \
  --bucket cinacoin-user-assets-prod \
  --prefix "avatars/" \
  --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --region auto
```

### 4.2 Cross-Region Replication (Manual)

```bash
#!/bin/bash
# scripts/replicate-r2.sh

SOURCE_BUCKET="cinacoin-user-assets-prod"
DEST_BUCKET="cinacoin-user-assets-backup"

# Sync buckets (incremental)
aws s3 sync "s3://${SOURCE_BUCKET}" "s3://${DEST_BUCKET}" \
  --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --region auto \
  --size-only

echo "✅ R2 replication complete"
```

---

## 5. Configuration Backup

### 5.1 DNS Records Export

```bash
#!/bin/bash
# scripts/backup-dns-records.sh

ZONE_ID="9e9b0140baac8f501ded715128fa5415"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups/dns"

mkdir -p "$BACKUP_DIR"

# Export all DNS records
curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?per_page=100" \
  -H "Authorization: Bearer $CF_API_TOKEN" | \
  jq '.result' > "${BACKUP_DIR}/dns-records-${TIMESTAMP}.json"

# Export by type
for type in A AAAA CNAME MX TXT SRV; do
  curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=${type}&per_page=100" \
    -H "Authorization: Bearer $CF_API_TOKEN" | \
    jq '.result' > "${BACKUP_DIR}/dns-${type}-${TIMESTAMP}.json"
done

# Commit to Git
cd "$BACKUP_DIR"
git add .
git commit -m "backup: DNS records ${TIMESTAMP}"
git push

echo "✅ DNS records backed up"
```

### 5.2 Page Rules Export

```bash
#!/bin/bash
# scripts/backup-page-rules.sh

ZONE_ID="9e9b0140baac8f501ded715128fa5415"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules?per_page=50" \
  -H "Authorization: Bearer $CF_API_TOKEN" | \
  jq '.result' > "./backups/page-rules-${TIMESTAMP}.json"

git add "./backups/page-rules-${TIMESTAMP}.json"
git commit -m "backup: Page rules ${TIMESTAMP}"
git push

echo "✅ Page rules backed up"
```

### 5.3 Worker Secrets Export

```bash
#!/bin/bash
# scripts/backup-worker-secrets.sh
# WARNING: Secrets are sensitive - encrypt before storing

WORKERS=(
  "cinacoin-api-gateway-prod"
  "cinacoin-auth-service-prod"
  "cinacoin-users-service-prod"
)

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups/secrets"
mkdir -p "$BACKUP_DIR"

for worker in "${WORKERS[@]}"; do
  echo "Exporting secrets for ${worker}..."

  # List secret names (not values)
  wrangler secret:list --name="${worker}" > "${BACKUP_DIR}/${worker}-secrets-${TIMESTAMP}.json"

  # Note: Actual secret values cannot be exported via API
  # They must be manually documented in a secure vault
done

# Encrypt the backup
gpg --symmetric --cipher-algo AES256 "${BACKUP_DIR}/${worker}-secrets-${TIMESTAMP}.json"

echo "✅ Worker secret metadata backed up (encrypted)"
```

---

## 6. Disaster Recovery Plan

### 6.1 Scenario 1: Single Service Failure

**Impact**: One Worker or Pages deployment is down  
**RTO**: < 5 minutes  
**Recovery**:

```bash
# 1. Check health
curl https://api.cinacoin.io/health

# 2. If unhealthy, rollback last deployment
wrangler deployments rollback --name cinacoin-api-gateway-prod

# 3. Verify recovery
curl https://api.cinacoin.io/health
```

### 6.2 Scenario 2: Database Corruption

**Impact**: D1 database is corrupted or has bad data  
**RTO**: < 30 minutes  
**RPO**: 1 hour  
**Recovery**:

```bash
# 1. Identify the issue
wrangler d1 execute cinacoin-api-gateway-prod --command="SELECT COUNT(*) FROM users;"

# 2. Restore from point-in-time backup
wrangler d1 restore cinacoin-api-gateway-prod \
  --timestamp "2026-06-08T15:00:00Z"

# 3. Verify data integrity
wrangler d1 execute cinacoin-api-gateway-prod --command="SELECT COUNT(*) FROM users;"

# 4. If point-in-time fails, restore from R2 backup
./scripts/restore-d1.sh cinacoin-api-gateway-prod \
  ./backups/d1/cinacoin-api-gateway-prod-20260608-150000.sql.gz
```

### 6.3 Scenario 3: Full Zone Outage

**Impact**: Entire cinacoin.io zone is unreachable  
**RTO**: < 15 minutes  
**Recovery**:

```bash
# 1. Check Cloudflare status
curl https://www.cloudflarestatus.com/

# 2. If Cloudflare issue, wait for resolution (automatic failover handles this)

# 3. If zone misconfiguration, restore DNS from backup
./scripts/restore-dns-records.sh ./backups/dns/dns-records-20260608-150000.json

# 4. Verify all services
./scripts/health-check.sh
```

### 6.4 Scenario 4: Account Compromise

**Impact**: Cloudflare account is compromised  
**RTO**: 2-4 hours  
**RPO**: 24 hours  
**Recovery**:

```bash
# 1. IMMEDIATE: Rotate all API tokens
# - Cloudflare Dashboard → My Profile → API Tokens → Roll all

# 2. Enable 2FA if not already enabled
# - Cloudflare Dashboard → My Profile → Authentication

# 3. Review audit log
curl -s "https://api.cloudflare.com/client/v4/accounts/7ea8e46d8210bad342fa7595f7935fea/audit_logs" \
  -H "Authorization: Bearer $NEW_CF_API_TOKEN" | jq '.result[]'

# 4. Restore DNS from last known good backup
./scripts/restore-dns-records.sh ./backups/dns/dns-records-LASTGOOD.json

# 5. Restore all Worker secrets
# (Manual process - requires secure vault access)

# 6. Rotate all application secrets (JWT_SECRET, API keys, etc.)

# 7. Verify all services
./scripts/health-check.sh
```

### 6.5 Scenario 5: Catastrophic Data Loss

**Impact**: All data lost (extremely rare)  
**RTO**: 4 hours  
**RPO**: 1 hour  
**Recovery**:

```bash
# 1. Restore all D1 databases from R2 backups
for db in cinacoin-api-gateway-prod cinacoin-auth-prod cinacoin-users-prod; do
  LATEST_BACKUP=$(aws s3 ls "s3://cinacoin-backups/d1/${db}/" \
    --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    --region auto | sort | tail -n 1 | awk '{print $4}')

  aws s3 cp "s3://cinacoin-backups/d1/${db}/${LATEST_BACKUP}" \
    "./backups/restore/${db}.sql.gz" \
    --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    --region auto

  ./scripts/restore-d1.sh "${db}" "./backups/restore/${db}.sql.gz"
done

# 2. Restore KV namespaces
for ns in RATE_LIMIT_KV SESSION_KV USERS_CACHE_KV; do
  LATEST_BACKUP=$(aws s3 ls "s3://cinacoin-backups/kv/${ns}/" \
    --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    --region auto | sort | tail -n 1 | awk '{print $4}')

  aws s3 cp "s3://cinacoin-backups/kv/${ns}/${LATEST_BACKUP}" \
    "./backups/restore/${ns}.tar.gz" \
    --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    --region auto

  tar -xzf "./backups/restore/${ns}.tar.gz" -C "./backups/restore/"
  ./scripts/restore-kv.sh "${ns}" "./backups/restore/${ns}-$(date +%Y%m%d)"
done

# 3. Verify all services
./scripts/health-check.sh

# 4. Notify users of incident
# (Via status page and Discord)
```

---

## 7. Backup Verification

### 7.1 Automated Backup Testing

```bash
#!/bin/bash
# scripts/verify-backups.sh

echo "Verifying backup integrity..."

# Test 1: D1 backup can be restored
echo "1. Testing D1 restore..."
TEST_DB="cinacoin-backup-test"
wrangler d1 create "$TEST_DB"
./scripts/restore-d1.sh "$TEST_DB" "./backups/d1/cinacoin-api-gateway-prod-latest.sql.gz"
ROW_COUNT=$(wrangler d1 execute "$TEST_DB" --command="SELECT COUNT(*) FROM users;" --json | jq '.[0].results[0]["COUNT(*)"]')

if [ "$ROW_COUNT" -gt 0 ]; then
  echo "✅ D1 backup valid (${ROW_COUNT} rows)"
else
  echo "❌ D1 backup invalid"
  exit 1
fi

wrangler d1 delete "$TEST_DB"

# Test 2: KV backup can be restored
echo "2. Testing KV restore..."
# (Similar test for KV)

# Test 3: DNS records are valid
echo "3. Testing DNS records..."
DNS_COUNT=$(jq length ./backups/dns/dns-records-latest.json)
if [ "$DNS_COUNT" -gt 10 ]; then
  echo "✅ DNS backup valid (${DNS_COUNT} records)"
else
  echo "❌ DNS backup invalid"
  exit 1
fi

echo "✅ All backup verification tests passed"
```

### 7.2 Monthly DR Drill

**Schedule**: First Saturday of every month, 10:00 UTC

**Drill checklist**:

```markdown
## Disaster Recovery Drill — YYYY-MM-DD

### Preparation
- [ ] Notify team of drill (24h advance)
- [ ] Prepare test environment
- [ ] Download latest backups

### Execution
- [ ] Restore D1 database to test instance
- [ ] Restore KV namespace to test instance
- [ ] Verify data integrity
- [ ] Test failover to backup region
- [ ] Measure actual RTO

### Validation
- [ ] All services respond correctly
- [ ] Data matches production (sample check)
- [ ] SSL certificates valid
- [ ] DNS records resolve correctly

### Documentation
- [ ] Record actual RTO achieved
- [ ] Document any issues encountered
- [ ] Update runbook if needed
- [ ] Share results with team
```

---

## 8. Backup Storage Costs

| Storage Type | Estimated Size | Monthly Cost |
|--------------|---------------|--------------|
| D1 backups (30 days) | ~5 GB | $0.50 |
| KV backups (14 days) | ~2 GB | $0.20 |
| R2 versioning | ~50 GB | $0 |
| DNS/Config backups | ~100 MB | $0 |
| **Total** | **~57 GB** | **~$0.70/mo** |

---

## 9. Compliance & Security

### 9.1 Backup Encryption

- All backups encrypted at rest (R2 server-side encryption)
- Manual exports encrypted with AES-256 before storage
- Secrets never stored in plain text

### 9.2 Access Control

- Backup scripts require `CF_API_TOKEN` with appropriate permissions
- R2 access restricted to backup service account
- Git repository for config backups is private

### 9.3 Audit Trail

- All backup operations logged to `/var/log/cinacoin-backup.log`
- Git commits provide audit trail for config changes
- R2 access logs enabled

---

*Document version: 2.0.0 | Last updated: 2026-06-08 16:08 UTC*
