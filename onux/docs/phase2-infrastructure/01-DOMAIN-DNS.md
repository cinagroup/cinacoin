# Cinacoin Phase 2 — Domain & DNS Configuration

> **Version**: 2.0.0  
> **Date**: 2026-06-08  
> **Status**: Production Ready  
> **Cloudflare Account ID**: `7ea8e46d8210bad342fa7595f7935fea`  
> **Zone ID**: `9e9b0140baac8f501ded715128fa5415`

---

## 1. Domain Architecture

### 1.1 Primary Domain

| Domain | Purpose | Status |
|--------|---------|--------|
| `cinacoin.io` | Primary production domain (Phase 2) | ⏳ Pending registration/transfer |
| `cinacoin.com` | Current production domain (Phase 1) | ✅ Active |

### 1.2 Subdomain Map

| Subdomain | Service | Target | Priority |
|-----------|---------|--------|----------|
| `api.cinacoin.io` | API Gateway | Cloudflare Workers | P0 — Critical |
| `auth.cinacoin.io` | Auth Service | Cloudflare Workers | P0 — Critical |
| `users.cinacoin.io` | User Service | Cloudflare Workers | P0 — Critical |
| `dashboard.cinacoin.io` | Unified Dashboard | Cloudflare Pages | P1 — High |
| `app.cinacoin.io` | Main Application | Cloudflare Pages | P1 — High |
| `rpc.cinacoin.io` | RPC Proxy | Cloudflare Workers | P0 — Existing |
| `keys.cinacoin.io` | Keys Server | Cloudflare Workers | P0 — Existing |
| `relay.cinacoin.io` | Relay Server | Cloudflare Workers | P0 — Existing |
| `notify.cinacoin.io` | Notify Server | Cloudflare Workers | P1 — Existing |
| `push.cinacoin.io` | Push Server | Cloudflare Workers | P1 — Existing |
| `monitor.cinacoin.io` | Monitoring | Cloudflare Workers | P2 — Existing |
| `docs.cinacoin.io` | Documentation | Cloudflare Pages | P2 — Existing |
| `status.cinacoin.io` | Health Status | Cloudflare Pages | P2 — Existing |
| `analytics.cinacoin.io` | Analytics Dashboard | Cloudflare Pages | P2 — Existing |
| `wallet.cinacoin.io` | Wallet Explorer | Cloudflare Pages | P2 — Existing |
| `cloud.cinacoin.io` | Cloud Dashboard | Cloudflare Pages | P2 — Existing |
| `demo.cinacoin.io` | Demo App | Cloudflare Pages | P3 — Existing |
| `react.cinacoin.io` | React Demo | Cloudflare Pages | P3 — Existing |
| `dash.cinacoin.io` | Backend Dashboard | Cloudflare Pages | P3 — Existing |

---

## 2. DNS Record Configuration

### 2.1 Phase 2 New Records (cinacoin.io)

#### API & Services (Workers — Proxied)

```
# API Gateway
api.cinacoin.io.       CNAME   cinacoin-api-gateway-prod.<account>.workers.dev.   proxied
auth.cinacoin.io.      CNAME   cinacoin-auth-service.<account>.workers.dev.       proxied
users.cinacoin.io.     CNAME   cinacoin-users-service.<account>.workers.dev.      proxied

# Main Application (Pages)
app.cinacoin.io.       CNAME   cinacoin-app.pages.dev.                            proxied
dashboard.cinacoin.io. CNAME   cinacoin-unified-dashboard.pages.dev.              proxied
```

#### Infrastructure Services (Workers — Proxied)

```
rpc.cinacoin.io.       CNAME   cinacoin-rpc-proxy.<account>.workers.dev.          proxied
keys.cinacoin.io.      CNAME   cinacoin-keys-server.<account>.workers.dev.        proxied
relay.cinacoin.io.     CNAME   cinacoin-relay-server.<account>.workers.dev.       proxied
notify.cinacoin.io.    CNAME   cinacoin-notify-server.<account>.workers.dev.      proxied
push.cinacoin.io.      CNAME   cinacoin-push-server.<account>.workers.dev.        proxied
monitor.cinacoin.io.   CNAME   cinacoin-monitoring.<account>.workers.dev.         proxied
```

#### Static Sites (Pages — Proxied)

```
docs.cinacoin.io.      CNAME   cinacoin-docs.pages.dev.                           proxied
status.cinacoin.io.    CNAME   cinacoin-health-status.pages.dev.                  proxied
analytics.cinacoin.io. CNAME   cinacoin-analytics.pages.dev.                      proxied
wallet.cinacoin.io.    CNAME   cinacoin-wallet-explorer.pages.dev.                proxied
cloud.cinacoin.io.     CNAME   cinacoin-cloud-dashboard.pages.dev.                proxied
demo.cinacoin.io.      CNAME   cinacoin-demo.pages.dev.                           proxied
react.cinacoin.io.     CNAME   demo-react.pages.dev.                              proxied
dash.cinacoin.io.      CNAME   cinacoin-backend-dashboard.pages.dev.              proxied
```

#### Root Domain

```
cinacoin.io.           A       192.0.2.1     proxied   # Cloudflare placeholder
cinacoin.io.           AAAA    100::         proxied   # Cloudflare placeholder
www.cinacoin.io.       CNAME   cinacoin.io.  proxied
```

#### Email & Verification

```
cinacoin.io.           MX      10 aspmx.l.google.com.        DNS-only
cinacoin.io.           MX      20 alt1.aspmx.l.google.com.   DNS-only
cinacoin.io.           MX      30 alt2.aspmx.l.google.com.   DNS-only
cinacoin.io.           TXT     "v=spf1 include:_spf.google.com ~all"
_dmarc.cinacoin.io.    TXT     "v=DMARC1; p=reject; rua=mailto:dmarc@cinacoin.io"
cinacoin.io.           TXT     "google-site-verification=<TOKEN>"
```

### 2.2 DNS Record TTL Policy

| Record Type | TTL | Rationale |
|-------------|-----|-----------|
| Workers CNAME | Auto (proxied) | Cloudflare manages edge routing |
| Pages CNAME | Auto (proxied) | Cloudflare manages CDN routing |
| MX | 3600 | Standard email TTL |
| TXT (SPF/DMARC) | 3600 | Email verification |
| Root A/AAAA | Auto (proxied) | Cloudflare edge IPs |

---

## 3. Wrangler Configuration (Phase 2 Workers)

### 3.1 API Gateway — `apps/api-gateway/wrangler.toml`

```toml
name = "cinacoin-api-gateway"
main = "src/index.ts"
compatibility_date = "2025-01-01"
account_id = "7ea8e46d8210bad342fa7595f7935fea"

[env.production]
name = "cinacoin-api-gateway-prod"
routes = [
  { pattern = "api.cinacoin.io/*", zone_id = "9e9b0140baac8f501ded715128fa5415" }
]

[env.production.vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"
RATE_LIMIT_RPM = "1000"
CORS_ORIGINS = "https://app.cinacoin.io,https://dashboard.cinacoin.io"

[[env.production.d1_databases]]
binding = "DB"
database_name = "cinacoin-api-gateway-prod"
database_id = "<SET_AFTER_CREATE>"

[[env.production.kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "<SET_AFTER_CREATE>"

[[env.production.kv_namespaces]]
binding = "CACHE_KV"
id = "<SET_AFTER_CREATE>"
```

### 3.2 Auth Service — `apps/auth-service/wrangler.toml`

```toml
name = "cinacoin-auth-service"
main = "src/index.ts"
compatibility_date = "2025-01-01"
account_id = "7ea8e46d8210bad342fa7595f7935fea"

[env.production]
name = "cinacoin-auth-service-prod"
routes = [
  { pattern = "auth.cinacoin.io/*", zone_id = "9e9b0140baac8f501ded715128fa5415" }
]

[env.production.vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"
JWT_EXPIRY = "3600"
SESSION_TTL = "86400"

[[env.production.d1_databases]]
binding = "AUTH_DB"
database_name = "cinacoin-auth-prod"
database_id = "<SET_AFTER_CREATE>"

[[env.production.kv_namespaces]]
binding = "SESSION_KV"
id = "<SET_AFTER_CREATE>"
```

### 3.3 User Service — `apps/user-service/wrangler.toml`

```toml
name = "cinacoin-users-service"
main = "src/index.ts"
compatibility_date = "2025-01-01"
account_id = "7ea8e46d8210bad342fa7595f7935fea"

[env.production]
name = "cinacoin-users-service-prod"
routes = [
  { pattern = "users.cinacoin.io/*", zone_id = "9e9b0140baac8f501ded715128fa5415" }
]

[env.production.vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"

[[env.production.d1_databases]]
binding = "USERS_DB"
database_name = "cinacoin-users-prod"
database_id = "<SET_AFTER_CREATE>"

[[env.production.kv_namespaces]]
binding = "USERS_CACHE_KV"
id = "<SET_AFTER_CREATE>"

[[env.production.r2_buckets]]
binding = "USER_ASSETS"
bucket_name = "cinacoin-user-assets-prod"
```

---

## 4. Deployment Procedure

### 4.1 Domain Registration & Transfer

```bash
# Option A: Register new domain via Cloudflare Registrar
curl -X POST "https://api.cloudflare.com/client/v4/accounts/7ea8e46d8210bad342fa7595f7935fea/registrar/domains" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cinacoin.io",
    "years": 1
  }'

# Option B: Transfer existing domain
# 1. Unlock domain at current registrar
# 2. Obtain authorization code
# 3. Initiate transfer via Cloudflare Dashboard
# 4. Approve transfer email
# 5. Wait 5-7 days for completion
```

### 4.2 DNS Zone Setup

```bash
# Add zone to Cloudflare (if not auto-added by registrar)
curl -X POST "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cinacoin.io",
    "account": {"id": "7ea8e46d8210bad342fa7595f7935fea"},
    "type": "full"
  }'

# Update nameservers at registrar to:
#   alex.ns.cloudflare.com
#   <second-ns>.ns.cloudflare.com
```

### 4.3 Bulk DNS Record Creation

```bash
#!/bin/bash
# scripts/setup-dns-cinacoin-io.sh

ZONE_ID="<NEW_ZONE_ID>"
CF_API="https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records"

# Workers CNAME records (proxied)
declare -A WORKERS=(
  ["api"]="cinacoin-api-gateway-prod"
  ["auth"]="cinacoin-auth-service-prod"
  ["users"]="cinacoin-users-service-prod"
  ["rpc"]="cinacoin-rpc-proxy"
  ["keys"]="cinacoin-keys-server"
  ["relay"]="cinacoin-relay-server"
  ["notify"]="cinacoin-notify-server"
  ["push"]="cinacoin-push-server"
  ["monitor"]="cinacoin-monitoring"
)

for subdomain in "${!WORKERS[@]}"; do
  worker="${WORKERS[$subdomain]}"
  curl -s -X POST "$CF_API" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"CNAME\",
      \"name\": \"${subdomain}.cinacoin.io\",
      \"content\": \"${worker}.7ea8e46d8210bad342fa7595f7935fea.workers.dev\",
      \"ttl\": 1,
      \"proxied\": true
    }"
  echo " → ${subdomain}.cinacoin.io ✅"
done

# Pages CNAME records (proxied)
declare -A PAGES=(
  ["app"]="cinacoin-app"
  ["dashboard"]="cinacoin-unified-dashboard"
  ["docs"]="cinacoin-docs"
  ["status"]="cinacoin-health-status"
  ["analytics"]="cinacoin-analytics"
  ["wallet"]="cinacoin-wallet-explorer"
  ["cloud"]="cinacoin-cloud-dashboard"
  ["demo"]="cinacoin-demo"
  ["react"]="demo-react"
  ["dash"]="cinacoin-backend-dashboard"
)

for subdomain in "${!PAGES[@]}"; do
  project="${PAGES[$subdomain]}"
  curl -s -X POST "$CF_API" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"CNAME\",
      \"name\": \"${subdomain}.cinacoin.io\",
      \"content\": \"${project}.pages.dev\",
      \"ttl\": 1,
      \"proxied\": true
    }"
  echo " → ${subdomain}.cinacoin.io ✅"
done

echo "DNS setup complete for cinacoin.io"
```

### 4.4 Verification

```bash
# Verify DNS propagation
dig +short api.cinacoin.io CNAME
dig +short auth.cinacoin.io CNAME
dig +short app.cinacoin.io CNAME

# Verify SSL provisioning (takes 1-24h after DNS)
curl -sI https://api.cinacoin.io/health | head -5
curl -sI https://auth.cinacoin.io/health | head -5
curl -sI https://app.cinacoin.io | head -5

# Check Cloudflare DNS records
curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?per_page=50" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[] | {name, type, content, proxied}'
```

---

## 5. DNS Security

### 5.1 DNSSEC

```bash
# Enable DNSSEC on Cloudflare zone
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dnssec" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

### 5.2 CAA Records

```
# Only allow Let's Encrypt and Cloudflare to issue certificates
cinacoin.io.  CAA  0 issue "letsencrypt.org"
cinacoin.io.  CAA  0 issue "comodoca.com"
cinacoin.io.  CAA  0 issuewild ";"
cinacoin.io.  CAA  0 iodef "mailto:security@cinacoin.io"
```

### 5.3 Rate Limiting on DNS

- Cloudflare DNS is inherently protected against DNS amplification
- No additional configuration needed for managed zones

---

## 6. Rollback Plan

| Scenario | Action | RTO |
|----------|--------|-----|
| DNS misconfiguration | Revert to previous DNS snapshot via API | < 5 min |
| Domain transfer failure | Keep using cinacoin.com; retry transfer | 0 (no impact) |
| Worker deployment failure | Rollback via `wrangler rollback` | < 2 min |
| Pages deployment failure | Rollback via Cloudflare Dashboard → Pages → Deployments | < 1 min |

---

## 7. Cost Estimate

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Domain registration (.io) | ~$40/year | Cloudflare Registrar at-cost |
| DNS (Cloudflare) | $0 | Included with any plan |
| Workers (Pro) | $5/mo | 10M requests included |
| Pages | $0 | 500 builds/mo free |
| D1 | $0–5/mo | Depends on read/write volume |
| KV | $0–5/mo | Depends on operations |
| **Total** | **~$10-15/mo** | Excluding domain registration |

---

*Document version: 2.0.0 | Last updated: 2026-06-08 16:08 UTC*
