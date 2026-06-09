# Cinacoin Phase 2 — Monitoring & Alerting Configuration

> **Version**: 2.0.0  
> **Date**: 2026-06-08  
> **Status**: Production Ready  
> **Monitoring Stack**: Cloudflare Workers + Uptime + Prometheus + Grafana

---

## 1. Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Uptime      │  │  Synthetic   │  │  Real User   │     │
│  │  Monitor     │  │  Monitoring  │  │  Monitoring  │     │
│  │  (External)  │  │  (Workers)   │  │  (RUM)       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                  ┌─────────┴─────────┐                      │
│                  │  Alert Router     │                      │
│                  │  (Workers)        │                      │
│                  └─────────┬─────────┘                      │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐             │
│         │                  │                  │              │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐     │
│  │  Discord     │  │  Email       │  │  PagerDuty   │     │
│  │  Webhook     │  │  (Resend)    │  │  (Optional)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Uptime Monitoring

### 2.1 Service Health Endpoints

All services expose `/health` endpoints:

| Service | URL | Check Interval | Timeout |
|---------|-----|---------------|---------|
| API Gateway | `https://api.cinacoin.io/health` | 30s | 5s |
| Auth Service | `https://auth.cinacoin.io/health` | 30s | 5s |
| User Service | `https://users.cinacoin.io/health` | 30s | 5s |
| RPC Proxy | `https://rpc.cinacoin.io/health` | 30s | 5s |
| Keys Server | `https://keys.cinacoin.io/health` | 30s | 5s |
| Relay Server | `https://relay.cinacoin.io/health` | 30s | 5s |
| Notify Server | `https://notify.cinacoin.io/health` | 60s | 5s |
| Push Server | `https://push.cinacoin.io/health` | 60s | 5s |
| Main App | `https://app.cinacoin.io` | 60s | 10s |
| Dashboard | `https://dashboard.cinacoin.io` | 60s | 10s |
| Website | `https://cinacoin.io` | 120s | 10s |

### 2.2 Health Check Response Format

```typescript
// Standard health check response
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  checks: {
    [service: string]: {
      status: 'up' | 'down' | 'degraded';
      latency_ms: number;
      details?: string;
    };
  };
}

// Example response
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2026-06-08T16:08:00Z",
  "uptime": 86400,
  "checks": {
    "database": { "status": "up", "latency_ms": 12 },
    "cache": { "status": "up", "latency_ms": 3 },
    "upstream_rpc": { "status": "up", "latency_ms": 145 }
  }
}
```

### 2.3 External Uptime Monitoring

**Recommended services (pick one or combine):**

| Service | Free Tier | Features |
|---------|-----------|----------|
| Better Stack (betterstack.com) | 10 monitors | Status page, incident management |
| UptimeRobot | 50 monitors | 5-min interval, SSL expiry |
| HetrixTools | 15 monitors | Blacklist monitoring |
| Checkly | 100k check runs | API + browser checks |

**Configuration example (Better Stack):**

```yaml
# Monitors to configure:
monitors:
  - url: https://api.cinacoin.io/health
    name: "API Gateway"
    interval: 30s
    regions: [us-east, eu-west, ap-southeast]
    assertions:
      - type: status_code
        value: 200
      - type: response_time
        value: < 2000ms
      - type: body_contains
        value: "healthy"

  - url: https://auth.cinacoin.io/health
    name: "Auth Service"
    interval: 30s
    regions: [us-east, eu-west]

  - url: https://app.cinacoin.io
    name: "Main Application"
    interval: 60s
    regions: [us-east, eu-west, ap-southeast]
    assertions:
      - type: status_code
        value: 200
      - type: response_time
        value: < 5000ms

  # SSL Certificate monitors
  - url: https://cinacoin.io
    name: "SSL Certificate (cinacoin.io)"
    type: ssl
    alert_before: [30, 7, 1]  # days
```

---

## 3. Application Performance Monitoring (APM)

### 3.1 Worker-Level Metrics

```typescript
// packages/monitoring/src/metrics.ts

interface ServiceMetrics {
  // Request metrics
  requests_total: number;
  requests_per_second: number;
  request_duration_p50: number;
  request_duration_p95: number;
  request_duration_p99: number;
  errors_total: number;
  error_rate: number;

  // Resource metrics
  cpu_time_ms: number;
  memory_mb: number;
  subrequests: number;

  // Business metrics
  active_sessions: number;
  cache_hit_rate: number;
  rpc_calls_total: number;
  auth_attempts: number;
}

export class MetricsCollector {
  private metrics: Map<string, number> = new Map();

  increment(name: string, value: number = 1): void {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  observe(name: string, value: number): void {
    this.metrics.set(name, value);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Prometheus-compatible format
  toPrometheus(): string {
    let output = '';
    for (const [name, value] of this.metrics) {
      output += `cinacoin_${name} ${value}\n`;
    }
    return output;
  }
}
```

### 3.2 Request Tracing

```typescript
// apps/api-gateway/src/tracing.ts

interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  duration: number;
  tags: Record<string, string>;
  logs: Array<{ timestamp: number; message: string }>;
}

export function createTraceContext(request: Request): TraceContext {
  const traceId = request.headers.get('X-Trace-Id') || crypto.randomUUID();
  const spanId = crypto.randomUUID().slice(0, 16);

  return {
    traceId,
    spanId,
    startTime: Date.now(),
  };
}

export function addTraceHeaders(response: Response, ctx: TraceContext): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Trace-Id', ctx.traceId);
  headers.set('X-Span-Id', ctx.spanId);
  headers.set('Server-Timing', `total;dur=${Date.now() - ctx.startTime}`);

  return new Response(response.body, { ...response, headers });
}
```

### 3.3 Real User Monitoring (RUM)

```typescript
// apps/website/src/rum.ts

interface WebVitals {
  FCP: number;  // First Contentful Paint
  LCP: number;  // Largest Contentful Paint
  FID: number;  // First Input Delay
  CLS: number;  // Cumulative Layout Shift
  INP: number;  // Interaction to Next Paint
  TTFB: number; // Time to First Byte
}

export function reportWebVitals(metrics: WebVitals): void {
  const payload = {
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    connection: (navigator as any).connection?.effectiveType,
    ...metrics,
  };

  // Send to analytics endpoint
  navigator.sendBeacon('https://analytics.cinacoin.io/api/vitals', JSON.stringify(payload));
}

// Auto-collect
import { onFCP, onLCP, onFID, onCLS, onINP, onTTFB } from 'web-vitals';
onFCP(reportWebVitals);
onLCP(reportWebVitals);
onFID(reportWebVitals);
onCLS(reportWebVitals);
onINP(reportWebVitals);
onTTFB(reportWebVitals);
```

---

## 4. Alert Rules

### 4.1 Alert Severity Levels

| Level | Response Time | Notification | Example |
|-------|--------------|--------------|---------|
| **P0 — Critical** | Immediate | Discord + PagerDuty + Email | Service down, data loss |
| **P1 — High** | < 15 min | Discord + Email | High error rate, degraded |
| **P2 — Medium** | < 1 hour | Discord | Slow response, partial failure |
| **P3 — Low** | < 4 hours | Discord (digest) | Certificate expiring, disk usage |

### 4.2 Alert Rules Configuration

```typescript
// packages/monitoring/src/alert-rules.ts

export interface AlertRule {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  condition: AlertCondition;
  cooldown_seconds: number;
  channels: string[];
}

export const ALERT_RULES: AlertRule[] = [
  // Service availability
  {
    id: 'service-down',
    name: 'Service Unreachable',
    severity: 'critical',
    condition: {
      metric: 'health_check_status',
      operator: 'equals',
      value: 0,
      duration_seconds: 60,
    },
    cooldown_seconds: 300,
    channels: ['discord-critical', 'email', 'pagerduty'],
  },

  // Error rate
  {
    id: 'high-error-rate',
    name: 'High Error Rate',
    severity: 'high',
    condition: {
      metric: 'error_rate_percent',
      operator: 'greater_than',
      value: 5,
      duration_seconds: 300,
    },
    cooldown_seconds: 600,
    channels: ['discord-alerts', 'email'],
  },

  // Response time
  {
    id: 'slow-response',
    name: 'Slow Response Time',
    severity: 'medium',
    condition: {
      metric: 'p95_latency_ms',
      operator: 'greater_than',
      value: 3000,
      duration_seconds: 300,
    },
    cooldown_seconds: 600,
    channels: ['discord-alerts'],
  },

  // SSL certificate expiry
  {
    id: 'ssl-expiring-soon',
    name: 'SSL Certificate Expiring',
    severity: 'high',
    condition: {
      metric: 'ssl_days_until_expiry',
      operator: 'less_than',
      value: 14,
      duration_seconds: 0,
    },
    cooldown_seconds: 86400,
    channels: ['discord-alerts', 'email'],
  },

  // D1 database errors
  {
    id: 'db-errors',
    name: 'Database Error Rate',
    severity: 'critical',
    condition: {
      metric: 'db_error_rate_percent',
      operator: 'greater_than',
      value: 1,
      duration_seconds: 120,
    },
    cooldown_seconds: 300,
    channels: ['discord-critical', 'email'],
  },

  // Worker CPU time
  {
    id: 'worker-cpu-high',
    name: 'Worker CPU Time High',
    severity: 'medium',
    condition: {
      metric: 'cpu_time_ms',
      operator: 'greater_than',
      value: 45000,  // 45s of 50s limit
      duration_seconds: 300,
    },
    cooldown_seconds: 600,
    channels: ['discord-alerts'],
  },

  // Rate limiting triggered
  {
    id: 'rate-limit-triggered',
    name: 'Rate Limit Exceeded',
    severity: 'low',
    condition: {
      metric: 'rate_limit_rejections_per_min',
      operator: 'greater_than',
      value: 100,
      duration_seconds: 300,
    },
    cooldown_seconds: 1800,
    channels: ['discord-alerts'],
  },
];
```

### 4.3 Alert Notification Channels

```typescript
// packages/monitoring/src/notifications.ts

interface NotificationChannel {
  type: 'discord' | 'email' | 'pagerduty' | 'slack';
  webhook_url?: string;
  address?: string;
}

const CHANNELS: Record<string, NotificationChannel> = {
  'discord-critical': {
    type: 'discord',
    webhook_url: 'https://discord.com/api/webhooks/...',
  },
  'discord-alerts': {
    type: 'discord',
    webhook_url: 'https://discord.com/api/webhooks/...',
  },
  'email': {
    type: 'email',
    address: 'ops@cinacoin.io',
  },
  'pagerduty': {
    type: 'pagerduty',
    webhook_url: 'https://events.pagerduty.com/v2/enqueue',
  },
};

// Discord embed format
function formatDiscordAlert(alert: Alert, metrics: Record<string, any>): object {
  const color = {
    critical: 0xFF0000,
    high: 0xFF6600,
    medium: 0xFFCC00,
    low: 0x00CCFF,
  }[alert.severity];

  return {
    embeds: [{
      title: `🚨 ${alert.name}`,
      description: alert.message,
      color,
      fields: [
        { name: 'Severity', value: alert.severity.toUpperCase(), inline: true },
        { name: 'Service', value: alert.service, inline: true },
        { name: 'Duration', value: `${alert.duration_seconds}s`, inline: true },
        { name: 'Current Value', value: String(alert.current_value), inline: true },
        { name: 'Threshold', value: String(alert.threshold), inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'Cinacoin Monitoring' },
    }],
  };
}
```

---

## 5. Cloudflare Dashboard Monitoring

### 5.1 GraphQL Analytics API

```bash
# Query Cloudflare analytics via GraphQL
curl -X POST "https://api.cloudflare.com/client/v4/graphql" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query {
      viewer {
        zones(filter: { zoneTag: \"9e9b0140baac8f501ded715128fa5415\" }) {
          httpRequests1hGroups(limit: 24, filter: { datetime_gt: \"2026-06-07T00:00:00Z\" }) {
            dimensions { datetime }
            sum {
              requests
              bytes
              cachedBytes
              threats
              pageViews
              countryMap {
                clientCountryName
                requests
                bytes
                threats
              }
            }
            uniq { uniques }
          }
        }
      }
    }"
  }'
```

### 5.2 Workers Analytics

```bash
# Get Workers metrics
curl -X POST "https://api.cloudflare.com/client/v4/graphql" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query {
      viewer {
        workersInvocationsAdaptive(limit: 100, filter: {
          datetime_geq: \"2026-06-08T00:00:00Z\",
          datetime_lt: \"2026-06-09T00:00:00Z\"
        }) {
          sum {
            requests
            errors
            subrequests
          }
          quantiles {
            cpuTimeP50
            cpuTimeP95
            cpuTimeP99
            durationP50
            durationP95
            durationP99
          }
          dimensions {
            datetimeMinute
            scriptName
            status
          }
        }
      }
    }"
  }'
```

---

## 6. Error Rate Monitoring

### 6.1 Error Tracking

```typescript
// packages/monitoring/src/error-tracking.ts

interface ErrorEvent {
  timestamp: string;
  service: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  request_url?: string;
  request_method?: string;
  user_agent?: string;
  trace_id?: string;
}

export class ErrorTracker {
  private errors: ErrorEvent[] = [];
  private readonly MAX_ERRORS = 1000;

  track(error: ErrorEvent): void {
    this.errors.push({
      ...error,
      timestamp: new Date().toISOString(),
    });

    // Keep bounded
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(-this.MAX_ERRORS);
    }
  }

  getErrorRate(window_seconds: number = 300): number {
    const cutoff = Date.now() - window_seconds * 1000;
    const recent = this.errors.filter(
      e => new Date(e.timestamp).getTime() > cutoff
    );
    return recent.length / window_seconds;
  }

  getTopErrors(limit: number = 10): ErrorEvent[] {
    const counts = new Map<string, { count: number; latest: ErrorEvent }>();

    for (const error of this.errors) {
      const key = `${error.service}:${error.error_type}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
        existing.latest = error;
      } else {
        counts.set(key, { count: 1, latest: error });
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([_, { count, latest }]) => ({ ...latest, error_message: `[${count}x] ${latest.error_message}` }));
  }
}
```

---

## 7. Status Page

### 7.1 Public Status Page

The existing `status.cinacoin.io` (Cloudflare Pages) serves as the public status page.

**Integration with monitoring:**

```typescript
// packages/monitoring/src/status-page.ts

interface StatusPageUpdate {
  component_id: string;
  status: 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage';
  description?: string;
}

// Update status page via API
async function updateStatusPage(updates: StatusPageUpdate[]): Promise<void> {
  const statusPageUrl = 'https://status.cinacoin.io/api/status';

  await fetch(statusPageUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STATUS_PAGE_API_KEY}`,
    },
    body: JSON.stringify({ updates }),
  });
}

// Auto-update based on health checks
async function syncHealthToStatusPage(healthResults: HealthCheckResult[]): Promise<void> {
  const updates = healthResults.map(result => ({
    component_id: result.service,
    status: result.healthy ? 'operational' : 'major_outage',
    description: result.healthy ? undefined : result.error,
  }));

  await updateStatusPage(updates);
}
```

---

## 8. Incident Response Runbook

### 8.1 Severity Classification

| Severity | Definition | Response | Escalation |
|----------|-----------|----------|------------|
| **SEV-1** | Complete outage, data loss risk | Immediate all-hands | CTO + Engineering Lead |
| **SEV-2** | Major feature degraded | < 15 min response | Engineering Lead |
| **SEV-3** | Minor feature affected | < 1 hour response | On-call engineer |
| **SEV-4** | Cosmetic / non-urgent | < 4 hours | Any engineer |

### 8.2 Incident Response Steps

```markdown
## Incident Response Checklist

### Step 1: Detect & Acknowledge (0-5 min)
- [ ] Alert received and acknowledged in Discord
- [ ] Incident channel created (#incident-YYYY-MM-DD-brief)
- [ ] Incident commander assigned

### Step 2: Assess Impact (5-15 min)
- [ ] Identify affected services
- [ ] Determine user impact scope
- [ ] Check Cloudflare Dashboard for anomalies
- [ ] Review recent deployments

### Step 3: Mitigate (15-60 min)
- [ ] If deployment-related: rollback via `wrangler rollback`
- [ ] If origin issue: enable Cloudflare cache-everything
- [ ] If DDoS: enable "Under Attack" mode
- [ ] If data issue: switch to read-only mode

### Step 4: Resolve (30 min - 4 hours)
- [ ] Root cause identified
- [ ] Fix deployed and verified
- [ ] Monitoring confirms recovery

### Step 5: Post-Mortem (24-72 hours)
- [ ] Timeline documented
- [ ] Root cause analysis complete
- [ ] Action items assigned
- [ ] Post-mortem shared with team
```

### 8.3 Quick Recovery Commands

```bash
#!/bin/bash
# scripts/incident-response.sh

case "$1" in
  "rollback")
    echo "Rolling back last Worker deployment..."
    cd /path/to/onux
    SERVICE=$2
    wrangler deployments rollback --name "cinacoin-${SERVICE}"
    echo "✅ Rolled back cinacoin-${SERVICE}"
    ;;

  "cache-purge")
    echo "Purging all cache..."
    curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"purge_everything": true}'
    echo "✅ Cache purged"
    ;;

  "under-attack")
    echo "Enabling Under Attack mode..."
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/security_level" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"value": "under_attack"}'
    echo "✅ Under Attack mode enabled"
    ;;

  "health-check")
    echo "Running emergency health check..."
    for service in api auth users rpc keys relay app dashboard; do
      URL="https://${service}.cinacoin.io/health"
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$URL")
      if [ "$STATUS" == "200" ]; then
        echo "  ✅ ${service}: healthy"
      else
        echo "  ❌ ${service}: DOWN (HTTP ${STATUS})"
      fi
    done
    ;;

  *)
    echo "Usage: incident-response.sh {rollback|cache-purge|under-attack|health-check} [service]"
    ;;
esac
```

---

## 9. Monitoring Cost

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Cloudflare Workers Monitoring | $0 | Built-in analytics |
| Better Stack (uptime) | $0-25/mo | Free tier covers basics |
| Discord webhooks | $0 | Free |
| Email (Resend) | $0-20/mo | 100k emails/mo free |
| Grafana Cloud | $0 | Free tier (10k metrics) |
| **Total** | **$0-45/mo** | |

---

*Document version: 2.0.0 | Last updated: 2026-06-08 16:08 UTC*
