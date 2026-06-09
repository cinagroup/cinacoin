# Cinacoin Phase 2 - Database Migration Guide

## Overview

Cinacoin Phase 2 introduces three major services with database migrations:

1. **Auth Service** - PostgreSQL (cinacoin_auth)
2. **User Service** - PostgreSQL (cinacoin_users)
3. **API Gateway** - Cloudflare D1 (SQLite) or PostgreSQL (cinacoin_gateway)

## Migration Order & Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    MIGRATION DEPENDENCIES                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Auth Service (001 → 002 → 003)                          │
│     └─ Creates: users, web3_wallets, passkeys, mfa_*        │
│                                                              │
│  2. User Service (001)                                       │
│     └─ Creates: users, teams, team_members, permissions     │
│     └─ Depends on: Auth Service users table                 │
│                                                              │
│  3. API Gateway (0001)                                       │
│     └─ Creates: api_keys, projects, request_logs            │
│     └─ Independent                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Critical:** Auth Service must be migrated first as User Service references the users table.

## Pre-Migration Checklist

- [ ] Backup all databases
- [ ] Verify database credentials in environment variables
- [ ] Ensure PostgreSQL extensions are available (uuid-ossp, pgcrypto, citext)
- [ ] Test migrations in staging environment
- [ ] Notify users of maintenance window
- [ ] Prepare rollback scripts

## Migration Execution

### 1. Auth Service Migrations

```bash
# Set environment
export DATABASE_URL="postgresql://cinacoin_auth:PASSWORD@postgres:5432/cinacoin_auth"

# Run migrations
cd apps/auth-service
npm run db:migrate:prod

# Verify
psql $DATABASE_URL -c "\dt"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

**Migrations:**
- `001_initial_schema.sql` - Core users table with authentication fields
- `002_auth_phase2.sql` - Web3 wallets, passkeys, MFA (TOTP), audit logs
- `003_oauth_accounts.sql` - OAuth accounts, sessions, OAuth states

### 2. User Service Migrations

```bash
# Set environment
export DATABASE_URL="postgresql://cinacoin_users:PASSWORD@postgres:5432/cinacoin_users"

# Run migrations
cd apps/user-service
npm run db:migrate:prod

# Verify
psql $DATABASE_URL -c "\dt"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM permissions;"  # Should be 13
```

**Migrations:**
- `001_initial_schema.sql` - Users, teams, permissions, team_members

### 3. API Gateway Migrations

**Option A: Cloudflare D1 (Edge)**
```bash
cd apps/api-gateway

# Create D1 database (first time only)
wrangler d1 create cinacoin-gateway-prod

# Apply migrations
wrangler d1 execute cinacoin-gateway-prod --file=migrations/0001_initial_schema.sql --remote

# Verify
wrangler d1 execute cinacoin-gateway-prod --command="SELECT name FROM sqlite_master WHERE type='table';" --remote
```

**Option B: PostgreSQL (Dedicated)**
```bash
export DATABASE_URL="postgresql://cinacoin_gateway:PASSWORD@postgres:5432/cinacoin_gateway"

# Convert SQLite migrations to PostgreSQL (if needed)
# See scripts/convert-d1-to-postgres.sh

# Run migrations
psql $DATABASE_URL -f migrations/0001_initial_schema.sql
```

## Post-Migration Verification

```bash
# Run verification script
./deploy/scripts/verify-migrations.sh

# Expected output:
# ✓ Auth Service: 12 tables created
# ✓ User Service: 5 tables created, 13 permissions seeded
# ✓ API Gateway: 4 tables created
# ✓ All indexes verified
# ✓ All constraints verified
```

## Rollback Procedures

### Auth Service Rollback

```bash
# Rollback migration 003 (OAuth)
psql $AUTH_DATABASE_URL -f deploy/scripts/rollback/auth-003-rollback.sql

# Rollback migration 002 (Phase 2 features)
psql $AUTH_DATABASE_URL -f deploy/scripts/rollback/auth-002-rollback.sql

# Rollback migration 001 (Initial) - DESTRUCTIVE
psql $AUTH_DATABASE_URL -f deploy/scripts/rollback/auth-001-rollback.sql
```

### User Service Rollback

```bash
# Drop all tables (User Service has only one migration)
psql $USER_DATABASE_URL -f deploy/scripts/rollback/user-001-rollback.sql
```

### API Gateway Rollback

```bash
# D1
wrangler d1 execute cinacoin-gateway-prod --command="DROP TABLE IF EXISTS usage_stats, request_logs, api_keys, projects;" --remote

# PostgreSQL
psql $GATEWAY_DATABASE_URL -c "DROP TABLE IF EXISTS usage_stats, request_logs, api_keys, projects CASCADE;"
```

## Data Migration (Phase 1 → Phase 2)

If migrating from Phase 1:

```bash
# 1. Export existing data
./deploy/scripts/export-phase1-data.sh > phase1-data.json

# 2. Transform data
node deploy/scripts/transform-phase1-data.js phase1-data.json > phase2-data.json

# 3. Import to new schema
./deploy/scripts/import-phase2-data.sh phase2-data.json

# 4. Verify data integrity
./deploy/scripts/verify-data-integrity.sh
```

## Troubleshooting

### Migration Fails Mid-Way

```bash
# Check which migrations succeeded
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version;"

# Manually apply remaining migrations
psql $DATABASE_URL -f migrations/XXX_failed_migration.sql
```

### Foreign Key Constraint Errors

Ensure migrations are run in order. Auth Service must complete before User Service.

### Extension Not Available

```sql
-- Install required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
```

### Connection Timeout

Increase timeout in environment:
```bash
export DATABASE_CONNECTION_TIMEOUT_MS=10000
```

## Maintenance Window

Recommended maintenance window for production migration:

- **Duration:** 30-60 minutes
- **Impact:** All services unavailable during migration
- **Communication:** Notify users 24 hours in advance
- **Rollback:** Keep rollback scripts ready, test in staging first

## Monitoring

After migration, monitor:

1. **Database connections:** `SELECT count(*) FROM pg_stat_activity;`
2. **Query performance:** Check slow query logs
3. **Application errors:** Monitor Sentry/error tracking
4. **Migration status:** Verify all tables/indexes created

## Support

For migration issues:
- Check logs: `kubectl logs -n cinacoin deployment/auth-service`
- Database status: `kubectl exec -it postgres-0 -- psql -U cinacoin`
- Rollback if needed: See rollback procedures above
