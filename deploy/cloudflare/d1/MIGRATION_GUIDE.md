# PostgreSQL → Cloudflare D1 Migration Guide

## Overview

This guide covers migrating existing PostgreSQL data to Cloudflare D1 (SQLite) for the cinacoin-auth service.

## Data Type Mapping

| PostgreSQL | SQLite (D1) | Conversion Notes |
|------------|-------------|------------------|
| `UUID` | `TEXT` | Store as string: `'550e8400-e29b-41d4-a716-446655440000'` |
| `TIMESTAMP` / `TIMESTAMPTZ` | `INTEGER` | Unix epoch seconds: `EXTRACT(EPOCH FROM created_at)::INTEGER` |
| `JSONB` | `TEXT` | Serialize to JSON string: `data::TEXT` |
| `BYTEA` | `BLOB` | Binary data preserved as-is |
| `VARCHAR(n)` / `TEXT` | `TEXT` | No length constraints in SQLite |
| `BOOLEAN` | `INTEGER` | `TRUE` → `1`, `FALSE` → `0` |
| `SERIAL` / `BIGSERIAL` | `INTEGER` | Use UUIDs for primary keys (already the case) |
| `TEXT[]` (arrays) | `TEXT` | JSON array: `to_jsonb(array_col)::TEXT` |
| `INET` | `TEXT` | Store IP as string |
| `NUMERIC` / `DECIMAL` | `TEXT` or `REAL` | Use TEXT for precision, REAL for approximations |

## Pre-Migration Checklist

- [ ] Backup PostgreSQL database: `pg_dump -Fc cinacoin_auth > backup.dump`
- [ ] Stop write traffic to PostgreSQL (maintenance window)
- [ ] Note the latest timestamps for CDC/cutover validation
- [ ] Ensure `wrangler` CLI is installed and authenticated (`wrangler login`)
- [ ] Create D1 database: `wrangler d1 create cinacoin-auth`
- [ ] Run schema migration: `./migrate-d1.sh`

## Migration Methods

### Method 1: Export → Transform → Import (Recommended for < 100k rows)

#### Step 1: Export PostgreSQL tables to CSV

```bash
#!/bin/bash
# export-pg.sh

PG_CONN="postgresql://user:pass@localhost:5432/cinacoin_auth"
EXPORT_DIR="./pg-export"
mkdir -p "$EXPORT_DIR"

TABLES=(users sessions oauth_accounts authenticators mfa_secrets mfa_sessions \
        teams team_members permissions api_keys audit_logs token_blacklist)

for table in "${TABLES[@]}"; do
  echo "Exporting $table..."
  psql "$PG_CONN" -c "\COPY (
    SELECT * FROM $table
  ) TO '$EXPORT_DIR/$table.csv' WITH CSV HEADER"
done

echo "✅ Export complete"
```

#### Step 2: Transform timestamps and types

```python
#!/usr/bin/env python3
"""transform_pg_to_d1.py - Convert PostgreSQL CSV exports to D1-compatible SQL INSERTs"""

import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

EXPORT_DIR = Path("./pg-export")
OUTPUT_DIR = Path("./d1-import")
OUTPUT_DIR.mkdir(exist_ok=True)

def pg_timestamp_to_epoch(val):
    """Convert PostgreSQL timestamp to Unix epoch integer."""
    if not val:
        return 0
    try:
        # Handle ISO format
        dt = datetime.fromisoformat(val.replace('+00:00', '+00:00'))
        return int(dt.timestamp())
    except:
        # Try common formats
        for fmt in ['%Y-%m-%d %H:%M:%S.%f%z', '%Y-%m-%d %H:%M:%S%z', '%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%d %H:%M:%S']:
            try:
                dt = datetime.strptime(val, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return int(dt.timestamp())
            except:
                continue
    return 0

def pg_bool_to_int(val):
    """Convert PostgreSQL boolean to SQLite integer."""
    if val is None or val == '':
        return 0
    return 1 if val.lower() in ('true', 't', '1', 'yes') else 0

def escape_sql(val):
    """Escape single quotes for SQL."""
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"

def transform_users():
    """Transform users table."""
    rows = []
    with open(EXPORT_DIR / 'users.csv') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(f"""({escape_sql(row['id'])}, {escape_sql(row['email'])}, {escape_sql(row.get('username'))}, {escape_sql(row.get('password_hash'))}, {escape_sql(row['auth_type'])}, {pg_bool_to_int(row.get('mfa_enabled'))}, {escape_sql(row.get('status', 'active'))}, {pg_timestamp_to_epoch(row['created_at'])}, {pg_timestamp_to_epoch(row['updated_at'])})""")
    
    if rows:
        sql = "INSERT OR IGNORE INTO users (id, email, username, password_hash, auth_type, mfa_enabled, status, created_at, updated_at) VALUES\n" + ",\n".join(rows) + ";\n"
        (OUTPUT_DIR / '01_users.sql').write_text(sql)

def transform_sessions():
    """Transform sessions table."""
    rows = []
    with open(EXPORT_DIR / 'sessions.csv') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(f"""({escape_sql(row['id'])}, {escape_sql(row['user_id'])}, {escape_sql(row['refresh_token_hash'])}, {escape_sql(row.get('token_family'))}, {escape_sql(row.get('device_info'))}, {escape_sql(row.get('ip_address'))}, {pg_timestamp_to_epoch(row['expires_at'])}, {pg_timestamp_to_epoch(row['created_at'])})""")
    
    if rows:
        sql = "INSERT OR IGNORE INTO sessions (id, user_id, refresh_token_hash, token_family, device_info, ip_address, expires_at, created_at) VALUES\n" + ",\n".join(rows) + ";\n"
        (OUTPUT_DIR / '02_sessions.sql').write_text(sql)

def transform_audit_logs():
    """Transform audit_logs table (often the largest)."""
    rows = []
    with open(EXPORT_DIR / 'audit_logs.csv') as f:
        reader = csv.DictReader(f)
        for row in reader:
            metadata = row.get('metadata')
            if metadata and metadata != '{}':
                # Ensure valid JSON
                try:
                    json.loads(metadata)
                except:
                    metadata = json.dumps({"raw": metadata})
            else:
                metadata = None
            
            rows.append(f"""({escape_sql(row['id'])}, {escape_sql(row.get('user_id'))}, {escape_sql(row['action'])}, {escape_sql(row.get('resource'))}, {escape_sql(row.get('resource_id'))}, {escape_sql(row.get('ip_address'))}, {escape_sql(row.get('user_agent'))}, {escape_sql(metadata)}, {pg_timestamp_to_epoch(row['created_at'])})""")
    
    if rows:
        # Batch in chunks of 500 for D1 limits
        chunk_size = 500
        for i in range(0, len(rows), chunk_size):
            chunk = rows[i:i+chunk_size]
            sql = "INSERT OR IGNORE INTO audit_logs (id, user_id, action, resource, resource_id, ip_address, user_agent, metadata, created_at) VALUES\n" + ",\n".join(chunk) + ";\n"
            (OUTPUT_DIR / f'07_audit_logs_{i//chunk_size:03d}.sql').write_text(sql)

# Run transformations
print("Transforming PostgreSQL exports to D1 SQL...")
transform_users()
transform_sessions()
transform_audit_logs()
# Add similar transforms for other tables as needed
print(f"✅ Transform complete. Files written to {OUTPUT_DIR}/")
```

#### Step 3: Import to D1

```bash
#!/bin/bash
# import-d1.sh

DB_NAME="cinacoin-auth"
IMPORT_DIR="./d1-import"

echo "Importing transformed data to D1..."

for sql_file in $(ls "$IMPORT_DIR"/*.sql | sort); do
  echo "  Importing: $(basename $sql_file)"
  wrangler d1 execute "$DB_NAME" --file="$sql_file" --remote
  echo "  ✅ Done"
done

echo ""
echo "✅ All data imported!"
```

### Method 2: Direct Query Transform (for medium datasets)

Use PostgreSQL's built-in functions to generate D1-compatible SQL directly:

```sql
-- Generate INSERT statements for D1 from PostgreSQL
-- Run this in psql and redirect output to a .sql file

-- Users
SELECT 'INSERT OR IGNORE INTO users (id, email, username, password_hash, auth_type, mfa_enabled, status, created_at, updated_at) VALUES (' ||
  quote_literal(id::TEXT) || ', ' ||
  quote_literal(email) || ', ' ||
  COALESCE(quote_literal(username), 'NULL') || ', ' ||
  COALESCE(quote_literal(password_hash), 'NULL') || ', ' ||
  quote_literal(auth_type::TEXT) || ', ' ||
  CASE WHEN mfa_enabled THEN '1' ELSE '0' END || ', ' ||
  quote_literal(COALESCE(status::TEXT, 'active')) || ', ' ||
  EXTRACT(EPOCH FROM created_at)::BIGINT || ', ' ||
  EXTRACT(EPOCH FROM updated_at)::BIGINT ||
');'
FROM users;

-- Sessions
SELECT 'INSERT OR IGNORE INTO sessions (id, user_id, refresh_token_hash, token_family, device_info, ip_address, expires_at, created_at) VALUES (' ||
  quote_literal(id::TEXT) || ', ' ||
  quote_literal(user_id::TEXT) || ', ' ||
  quote_literal(refresh_token_hash) || ', ' ||
  COALESCE(quote_literal(token_family), 'NULL') || ', ' ||
  COALESCE(quote_literal(device_info::TEXT), 'NULL') || ', ' ||
  COALESCE(quote_literal(ip_address::TEXT), 'NULL') || ', ' ||
  EXTRACT(EPOCH FROM expires_at)::BIGINT || ', ' ||
  EXTRACT(EPOCH FROM created_at)::BIGINT ||
');'
FROM sessions;

-- Audit Logs (batch with COPY for large tables)
\COPY (
  SELECT 'INSERT OR IGNORE INTO audit_logs (id, user_id, action, resource, resource_id, ip_address, user_agent, metadata, created_at) VALUES (' ||
    quote_literal(id::TEXT) || ', ' ||
    COALESCE(quote_literal(user_id::TEXT), 'NULL') || ', ' ||
    quote_literal(action) || ', ' ||
    COALESCE(quote_literal(resource), 'NULL') || ', ' ||
    COALESCE(quote_literal(resource_id), 'NULL') || ', ' ||
    COALESCE(quote_literal(ip_address::TEXT), 'NULL') || ', ' ||
    COALESCE(quote_literal(user_agent), 'NULL') || ', ' ||
    COALESCE(quote_literal(metadata::TEXT), 'NULL') || ', ' ||
    EXTRACT(EPOCH FROM created_at)::BIGINT ||
    ');'
  FROM audit_logs
  ORDER BY created_at
) TO './d1-import/audit_logs.sql';
```

### Method 3: Application-Level Migration (for large/complex datasets)

For production migrations with zero downtime:

1. **Dual-write phase**: Update application to write to both PostgreSQL and D1
2. **Backfill**: Run historical data migration in batches
3. **Validation**: Compare row counts and checksums
4. **Cutover**: Switch reads to D1, stop PostgreSQL writes
5. **Cleanup**: Remove PostgreSQL code paths

```typescript
// Example: Dual-write service (Hono Worker)
interface Env {
  DB: D1Database;            // D1 (new)
  PG_URL: string;            // PostgreSQL (legacy, temporary)
}

async function dualWriteUser(env: Env, user: UserData) {
  // Write to D1
  await env.DB.prepare(`
    INSERT INTO users (id, email, username, password_hash, auth_type, mfa_enabled, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    user.id, user.email, user.username, user.passwordHash,
    user.authType, user.mfaEnabled ? 1 : 0, user.status,
    Math.floor(user.createdAt.getTime() / 1000),
    Math.floor(user.updatedAt.getTime() / 1000)
  ).run();

  // Write to PostgreSQL (best-effort during transition)
  try {
    const pgClient = await getPgClient(env.PG_URL);
    await pgClient.query(`
      INSERT INTO users (id, email, username, password_hash, auth_type, mfa_enabled, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING
    `, [user.id, user.email, user.username, user.passwordHash,
        user.authType, user.mfaEnabled, user.status,
        user.createdAt, user.updatedAt]);
  } catch (e) {
    console.error('PG dual-write failed (non-fatal):', e);
  }
}
```

## D1 Limitations & Considerations

| Constraint | Value | Mitigation |
|------------|-------|------------|
| Max DB size | 10 GB (free), 200 GB (paid) | Archive old audit logs |
| Max query size | ~1 MB | Batch large INSERTs (500 rows/chunk) |
| No `ALTER TABLE DROP COLUMN` (older) | Use recreate pattern | Plan schema changes carefully |
| No stored procedures | Application logic | Move logic to Worker |
| Limited concurrent writes | Single writer | Use queue/batch patterns |
| No `JSONB` operators | Use `json_extract()` | `SELECT json_extract(metadata, '$.key')` |

## Useful D1 SQLite Functions (replacing PostgreSQL)

```sql
-- PostgreSQL: NOW()
-- D1: strftime('%s', 'now')  -- returns TEXT, cast to INTEGER
-- Or in application: Math.floor(Date.now() / 1000)

-- PostgreSQL: gen_random_uuid()
-- D1: Use application-generated UUIDs (crypto.randomUUID() in Workers)

-- PostgreSQL: data->>'key' (JSONB)
-- D1: json_extract(data, '$.key')

-- PostgreSQL: ARRAY_AGG(x)
-- D1: GROUP_CONCAT(x, ',')  -- or build JSON array in app

-- PostgreSQL: ON CONFLICT ... DO UPDATE
-- D1: INSERT OR REPLACE / ON CONFLICT(col) DO UPDATE SET ...

-- PostgreSQL: RETURNING *
-- D1: Supported! D1 supports RETURNING clause

-- PostgreSQL: ILIKE (case-insensitive)
-- D1: LIKE is case-insensitive by default for ASCII
```

## Post-Migration Validation

```bash
#!/bin/bash
# validate-migration.sh

DB_NAME="cinacoin-auth"

echo "=== Post-Migration Validation ==="
echo ""

# Row counts
echo "📊 Row counts:"
wrangler d1 execute "$DB_NAME" --command="
  SELECT 'users' as tbl, COUNT(*) as cnt FROM users
  UNION ALL SELECT 'sessions', COUNT(*) FROM sessions
  UNION ALL SELECT 'oauth_accounts', COUNT(*) FROM oauth_accounts
  UNION ALL SELECT 'authenticators', COUNT(*) FROM authenticators
  UNION ALL SELECT 'mfa_secrets', COUNT(*) FROM mfa_secrets
  UNION ALL SELECT 'teams', COUNT(*) FROM teams
  UNION ALL SELECT 'team_members', COUNT(*) FROM team_members
  UNION ALL SELECT 'permissions', COUNT(*) FROM permissions
  UNION ALL SELECT 'api_keys', COUNT(*) FROM api_keys
  UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs
  UNION ALL SELECT 'token_blacklist', COUNT(*) FROM token_blacklist
  ORDER BY tbl;
" --remote

echo ""
echo "🔗 Foreign key integrity:"
wrangler d1 execute "$DB_NAME" --command="
  PRAGMA foreign_key_check;
" --remote

echo ""
echo "📈 Database size:"
wrangler d1 execute "$DB_NAME" --command="
  SELECT page_count * page_size as size_bytes, page_count as pages
  FROM pragma_page_count(), pragma_page_size();
" --remote

echo ""
echo "✅ Validation complete!"
```

## Rollback Plan

If migration fails:

1. D1 is non-destructive to PostgreSQL — original data remains intact
2. Switch application config back to PostgreSQL connection string
3. No data loss on the PostgreSQL side
4. D1 database can be deleted and recreated: `wrangler d1 delete cinacoin-auth`

## Cleanup (after successful migration)

```bash
# Remove expired sessions older than 30 days
wrangler d1 execute cinacoin-auth --command="
  DELETE FROM sessions WHERE expires_at < strftime('%s', 'now') - 2592000;
" --remote

# Remove expired token blacklist entries
wrangler d1 execute cinacoin-auth --command="
  DELETE FROM token_blacklist WHERE expires_at < strftime('%s', 'now');
" --remote

# Remove expired MFA sessions
wrangler d1 execute cinacoin-auth --command="
  DELETE FROM mfa_sessions WHERE expires_at < strftime('%s', 'now');
" --remote
```

## File Structure

```
deploy/cloudflare/
├── wrangler.toml              # D1 binding configuration
├── d1/
│   ├── migrate-d1.sh          # Create DB + run schema migration
│   ├── seed-d1.sh             # Insert seed data
│   ├── MIGRATION_GUIDE.md     # This file
│   ├── migrations/
│   │   └── 0001_init.sql      # Full D1 schema
│   └── seed/
│       └── seed.sql           # Initial seed data
```
