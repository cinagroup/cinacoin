# Cinacoin Phase 2 — CDN & Load Balancer Configuration

> **Version**: 2.0.0  
> **Date**: 2026-06-08  
> **Status**: Production Ready  
> **CDN Provider**: Cloudflare (300+ PoPs)  
> **Load Balancer**: Cloudflare Load Balancer

---

## 1. CDN Architecture

### 1.1 Cloudflare CDN Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Global Edge Network                        │
│                  (300+ Points of Presence)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   NYC    │  │   LAX    │  │   LON    │  │   TYO    │   │
│  │  (US)    │  │  (US)    │  │  (UK)    │  │  (JP)    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │          │
│       └──────────────┴──────────────┴──────────────┘          │
│                          │                                    │
│              ┌───────────┴───────────┐                       │
│              │   Intelligent Routing  │                       │
│              │   + Caching + WAF      │                       │
│              └───────────┬───────────┘                       │
│                          │                                    │
│              ┌───────────┴───────────┐                       │
│              │   Origin Servers     │                       │
│              │  (Cloudflare Workers) │                       │
│              │  (Cloudflare Pages)   │                       │
│              └───────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Cache Hierarchy

| Layer | Location | TTL | Purpose |
|-------|----------|-----|---------|
| **L1: Edge Cache** | PoP closest to user | 5 min - 1 day | Static assets, API responses |
| **L2: Regional Cache** | Regional edge | 1 hour - 7 days | Reduced origin load |
| **L3: Origin** | Cloudflare Workers/Pages | N/A | Dynamic content generation |

---

## 2. Cache Configuration

### 2.1 Page Rules (Cache by Pattern)

```bash
# Create Page Rules via Cloudflare API
ZONE_ID="9e9b0140baac8f501ded715128fa5415"

# Rule 1: Static assets (aggressive caching)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [{
      "target": "url",
      "constraint": {
        "operator": "matches",
        "value": "*cinacoin.io/*.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)"
      }
    }],
    "actions": [{
      "id": "cache_level",
      "value": "cache_everything"
    }, {
      "id": "edge_cache_ttl",
      "value": 2592000
    }, {
      "id": "browser_cache_ttl",
      "value": 31536000
    }, {
      "id": "cache_key_fields",
      "value": {
        "host": {"enabled": true},
        "path": {"enabled": true},
        "query_string": {"enabled": false}
      }
    }]
  }'

# Rule 2: API responses (short cache, respect origin)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [{
      "target": "url",
      "constraint": {
        "operator": "matches",
        "value": "api.cinacoin.io/*"
      }
    }],
    "actions": [{
      "id": "cache_level",
      "value": "cache_everything"
    }, {
      "id": "edge_cache_ttl",
      "value": 60
    }, {
      "id": "cache_on_cookie",
      "value": "bypass"
    }]
  }'

# Rule 3: Auth endpoints (no cache)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [{
      "target": "url",
      "constraint": {
        "operator": "matches",
        "value": "auth.cinacoin.io/*"
      }
    }],
    "actions": [{
      "id": "cache_level",
      "value": "bypass"
    }, {
      "id": "security_level",
      "value": "high"
    }]
  }'

# Rule 4: Dashboard apps (cache HTML, respect cache headers)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [{
      "target": "url",
      "constraint": {
        "operator": "matches",
        "value": "*dashboard.cinacoin.io/*"
      }
    }],
    "actions": [{
      "id": "cache_level",
      "value": "cache_everything"
    }, {
      "id": "edge_cache_ttl",
      "value": 300
    }, {
      "id": "cache_on_cookie",
      "value": "bypass"
    }]
  }'
```

### 2.2 Cache-Control Headers (Origin)

```typescript
// apps/api-gateway/src/cache-control.ts

export function setCacheHeaders(path: string, isAuth: boolean): Headers {
  const headers = new Headers();

  if (isAuth) {
    // Never cache auth endpoints
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
  } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/)) {
    // Static assets: long cache, immutable
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (path.startsWith('/api/')) {
    // API responses: short cache
    headers.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
  } else if (path === '/' || path.endsWith('.html')) {
    // HTML pages: short cache
    headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600');
  } else {
    // Default: moderate cache
    headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  }

  return headers;
}
```

### 2.3 Cache Purge Strategy

```bash
# Purge all cache (emergency)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything": true}'

# Purge by URL (specific pages)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      "https://app.cinacoin.io/",
      "https://dashboard.cinacoin.io/",
      "https://cinacoin.io/"
    ]
  }'

# Purge by tag (granular)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["user-data", "api-response"]}'

# Purge by prefix (entire subdomain)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"hosts": ["api.cinacoin.io"]}'
```

---

## 3. Static Asset Optimization

### 3.1 Auto Minification

```bash
# Enable automatic minification
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/minify" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": {
      "html": "on",
      "css": "on",
      "js": "on"
    }
  }'
```

### 3.2 Brotli Compression

```bash
# Enable Brotli (superior to gzip)
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/brotli" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "on"}'
```

### 3.3 Image Optimization (Polish)

```bash
# Enable Polish (image optimization)
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/polish" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "lossy"}'

# Enable WebP conversion
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/webp" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "on"}'
```

### 3.4 Mirage (Mobile Image Optimization)

```bash
# Enable Mirage for mobile optimization
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/mirage" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "on"}'
```

---

## 4. Load Balancer Configuration

### 4.1 Load Balancer Setup

```bash
# Create origin pools
# Pool 1: Primary (US East)
curl -X POST "https://api.cloudflare.com/client/v4/accounts/7ea8e46d8210bad342fa7595f7935fea/load_balancers/pools" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "us-east-primary",
    "description": "Primary US East origin pool",
    "origins": [{
      "name": "cloudflare-workers-us-east",
      "address": "workers-us-east.cinacoin.io",
      "enabled": true,
      "weight": 1.0
    }],
    "minimum_origins": 1,
    "monitor": "<MONITOR_ID>",
    "notification_email": "ops@cinacoin.io"
  }'

# Pool 2: Secondary (EU West)
curl -X POST "https://api.cloudflare.com/client/v4/accounts/7ea8e46d8210bad342fa7595f7935fea/load_balancers/pools" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "eu-west-secondary",
    "description": "Secondary EU West origin pool",
    "origins": [{
      "name": "cloudflare-workers-eu-west",
      "address": "workers-eu-west.cinacoin.io",
      "enabled": true,
      "weight": 1.0
    }],
    "minimum_origins": 1,
    "monitor": "<MONITOR_ID>",
    "notification_email": "ops@cinacoin.io"
  }'

# Pool 3: Fallback (Global)
curl -X POST "https://api.cloudflare.com/client/v4/accounts/7ea8e46d8210bad342fa7595f7935fea/load_balancers/pools" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "global-fallback",
    "description": "Global fallback pool",
    "origins": [{
      "name": "cloudflare-workers-global",
      "address": "workers-global.cinacoin.io",
      "enabled": true,
      "weight": 1.0
    }],
    "minimum_origins": 1,
    "monitor": "<MONITOR_ID>",
    "notification_email": "ops@cinacoin.io"
  }'
```

### 4.2 Load Balancer Creation

```bash
# Create load balancer for API
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/load_balancers" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "api.cinacoin.io",
    "fallback_pool": "<FALLBACK_POOL_ID>",
    "default_pools": ["<US_EAST_POOL_ID>", "<EU_WEST_POOL_ID>"],
    "description": "API Gateway load balancer",
    "ttl": 30,
    "steering_policy": "latency",
    "session_affinity": "cookie",
    "session_affinity_ttl": 3600,
    "session_affinity_attributes": {
      "samesite": "Strict",
      "secure": "Always"
    },
    "proxied": true,
    "pop_pools": {
      "NA": ["<US_EAST_POOL_ID>"],
      "EU": ["<EU_WEST_POOL_ID>"],
      "AS": ["<US_EAST_POOL_ID>", "<EU_WEST_POOL_ID>"]
    },
    "region_pools": {
      "WNAM": ["<US_EAST_POOL_ID>"],
      "ENAM": ["<US_EAST_POOL_ID>"],
      "WEU": ["<EU_WEST_POOL_ID>"],
      "EEU": ["<EU_WEST_POOL_ID>"]
    }
  }'
```

### 4.3 Health Check Configuration

```bash
# Create health monitor
curl -X POST "https://api.cloudflare.com/client/v4/accounts/7ea8e46d8210bad342fa7595f7935fea/load_balancers/monitors" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "http",
    "description": "API health check",
    "method": "GET",
    "path": "/health",
    "header": {
      "Host": ["api.cinacoin.io"],
      "User-Agent": ["Cloudflare-LB-Health/1.0"]
    },
    "timeout": 5,
    "retries": 2,
    "interval": 60,
    "expected_body": "healthy",
    "expected_codes": "200",
    "follow_redirects": false,
    "allow_insecure": false,
    "consecutive_down": 3,
    "consecutive_up": 2
  }'
```

### 4.4 Geographic Routing

```typescript
// apps/api-gateway/src/geo-routing.ts

interface GeoRoutingConfig {
  region: string;
  preferredOrigin: string;
  fallbackOrigin: string;
}

const GEO_ROUTING: Record<string, GeoRoutingConfig> = {
  // North America
  'US': { preferredOrigin: 'us-east', fallbackOrigin: 'us-west' },
  'CA': { preferredOrigin: 'us-east', fallbackOrigin: 'us-west' },
  'MX': { preferredOrigin: 'us-west', fallbackOrigin: 'us-east' },

  // Europe
  'GB': { preferredOrigin: 'eu-west', fallbackOrigin: 'us-east' },
  'DE': { preferredOrigin: 'eu-west', fallbackOrigin: 'us-east' },
  'FR': { preferredOrigin: 'eu-west', fallbackOrigin: 'us-east' },

  // Asia
  'JP': { preferredOrigin: 'ap-northeast', fallbackOrigin: 'us-west' },
  'SG': { preferredOrigin: 'ap-southeast', fallbackOrigin: 'us-west' },
  'CN': { preferredOrigin: 'ap-northeast', fallbackOrigin: 'us-west' },

  // Oceania
  'AU': { preferredOrigin: 'ap-southeast', fallbackOrigin: 'us-west' },
  'NZ': { preferredOrigin: 'ap-southeast', fallbackOrigin: 'us-west' },
};

export function getOptimalOrigin(request: Request): string {
  const country = request.cf?.country || 'US';
  const config = GEO_ROUTING[country] || GEO_ROUTING['US'];

  // Try preferred origin first
  try {
    const healthCheck = await fetch(`https://${config.preferredOrigin}.cinacoin.io/health`, {
      method: 'HEAD',
      cf: { cacheTtl: 10 },
    });

    if (healthCheck.ok) {
      return config.preferredOrigin;
    }
  } catch (e) {
    console.error(`Preferred origin ${config.preferredOrigin} failed:`, e);
  }

  // Fallback to secondary origin
  return config.fallbackOrigin;
}
```

---

## 5. Failover Configuration

### 5.1 Automatic Failover

```bash
# Configure failover pools (priority-based)
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/load_balancers/<LB_ID>" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fallback_pool": "<FALLBACK_POOL_ID>",
    "default_pools": [
      "<US_EAST_POOL_ID>",
      "<EU_WEST_POOL_ID>",
      "<GLOBAL_POOL_ID>"
    ],
    "steering_policy": "geo"
  }'
```

### 5.2 Failover Testing

```bash
#!/bin/bash
# scripts/test-failover.sh

echo "Testing failover scenarios..."

# Test 1: Primary origin down
echo "1. Simulating primary origin failure..."
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/7ea8e46d8210bad342fa7595f7935fea/load_balancers/pools/<US_EAST_POOL_ID>" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"origins": [{"name": "cloudflare-workers-us-east", "address": "workers-us-east.cinacoin.io", "enabled": false}]}'

sleep 120  # Wait for health check to detect failure

# Verify failover to EU
echo "2. Verifying failover to EU pool..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://api.cinacoin.io/health)
if [ "$RESPONSE" == "200" ]; then
  echo "✅ Failover successful"
else
  echo "❌ Failover failed (HTTP $RESPONSE)"
fi

# Restore primary
echo "3. Restoring primary origin..."
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/7ea8e46d8210bad342fa7595f7935fea/load_balancers/pools/<US_EAST_POOL_ID>" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"origins": [{"name": "cloudflare-workers-us-east", "address": "workers-us-east.cinacoin.io", "enabled": true}]}'

echo "✅ Failover test complete"
```

---

## 6. Performance Optimization

### 6.1 Argo Smart Routing

```bash
# Enable Argo Smart Routing
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/argo_smart_routing" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "on"}'

# Enable Tiered Caching
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/tiered_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "on"}'
```

### 6.2 Early Hints

```bash
# Enable Early Hints (103)
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/early_hints" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "on"}'
```

### 6.3 Prefetching

```typescript
// apps/website/src/prefetch.ts

export function addPrefetchHeaders(html: string): string {
  const prefetchLinks = [
    '<https://api.cinacoin.io>; rel=preconnect',
    '<https://auth.cinacoin.io>; rel=preconnect',
    '<https://rpc.cinacoin.io>; rel=preconnect',
    '<https://app.cinacoin.io>; rel=prefetch',
  ];

  const linkHeader = prefetchLinks.join(', ');
  return html.replace('</head>', `<link rel="preload" as="script" href="/main.js">\n</head>`);
}
```

---

## 7. Monitoring & Analytics

### 7.1 Cache Analytics

```bash
# Get cache analytics
curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/analytics/dashboard" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result | {
    requests: .requests.all,
    cached: .requests.cached,
    cache_hit_ratio: (.requests.cached / .requests.all * 100),
    bandwidth: .bandwidth.all,
    cached_bandwidth: .bandwidth.cached
  }'
```

### 7.2 Load Balancer Analytics

```bash
# Get load balancer analytics
curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/load_balancers/<LB_ID>/analytics" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result | {
    total_requests: .requests,
    healthy_origins: .healthy_origins,
    avg_response_time: .avg_response_time,
    error_rate: .error_rate
  }'
```

---

## 8. Cost Optimization

### 8.1 Cache Hit Ratio Targets

| Content Type | Target Cache Hit Ratio | Strategy |
|--------------|----------------------|----------|
| Static assets (JS/CSS/images) | > 95% | Long TTL, immutable |
| API responses | > 60% | Short TTL, stale-while-revalidate |
| HTML pages | > 40% | Short TTL, tag-based purging |
| Auth endpoints | 0% | No cache (security) |
| **Overall target** | **> 75%** | |

### 8.2 Bandwidth Savings

```bash
# Calculate monthly savings
# Assuming:
# - 10TB total bandwidth
# - 75% cache hit ratio
# - $0.08/GB origin egress

TOTAL_BANDWIDTH_GB = 10240
CACHE_HIT_RATIO = 0.75
ORIGIN_EGRESS_COST = 0.08

ORIGIN_BANDWIDTH = TOTAL_BANDWIDTH_GB * (1 - CACHE_HIT_RATIO)
MONTHLY_SAVINGS = TOTAL_BANDWIDTH_GB * CACHE_HIT_RATIO * ORIGIN_EGRESS_COST

echo "Monthly savings: $${MONTHLY_SAVINGS}"  # ~$614/month
```

---

## 9. Cost Summary

| Service | Tier | Monthly Cost | Notes |
|---------|------|--------------|-------|
| CDN (Cloudflare) | Pro | $20 | Unlimited bandwidth |
| Argo Smart Routing | — | $5 + $0.10/GB | Optional, ~$50/mo for 500GB |
| Load Balancer | — | $5 + $0.75/1M requests | ~$10/mo for 10M requests |
| Image Polish | Pro | Included | Lossy optimization |
| Mirage | Pro | Included | Mobile optimization |
| **Total** | | **$30-80/mo** | Depends on Argo usage |

---

*Document version: 2.0.0 | Last updated: 2026-06-08 16:08 UTC*
