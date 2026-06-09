# Cinacoin Production Monitoring & Alerting

## Overview

This directory contains the complete monitoring and alerting stack for Cinacoin production infrastructure.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Monitoring Stack                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐               │
│  │Prometheus│   │  Loki    │   │ Alertmanager │               │
│  │ (Metrics)│   │  (Logs)  │   │  (Alerts)    │               │
│  └────┬─────┘   └────┬─────┘   └──────┬───────┘               │
│       │               │                │                        │
│       └───────┬───────┘                │                        │
│               ▼                        ▼                        │
│       ┌──────────────┐    ┌───────────────────┐               │
│       │   Grafana    │    │  PagerDuty/Slack  │               │
│       │(Dashboards)  │    │  (Notifications)  │               │
│       └──────────────┘    └───────────────────┘               │
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐               │
│  │Promtail  │   │  Node    │   │  cAdvisor    │               │
│  │(Log Ship)│   │ Exporter │   │(Container M.)│               │
│  └──────────┘   └──────────┘   └──────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐              │
│  │            Sentry (Error Tracking)            │              │
│  └──────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Configure Environment Variables

```bash
cd monitoring/
cp .env.monitoring.example .env.monitoring
# Edit .env.monitoring with your actual credentials
```

### 2. Start Monitoring Stack

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

### 3. Access Dashboards

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3001 | admin / (from .env) |
| Prometheus | http://localhost:9090 | - |
| Alertmanager | http://localhost:9093 | - |
| Loki | http://localhost:3100 | - |

## Components

### Prometheus (Metrics Collection)
- **Port:** 9090
- **Retention:** 90 days / 50GB
- **Scrape targets:** All application services, databases, infrastructure

### Grafana (Visualization)
- **Port:** 3001
- **Pre-provisioned dashboards:**
  - Production Overview
  - Business Metrics
  - Infrastructure Health

### Alertmanager (Alert Routing)
- **Port:** 9093
- **Channels:** Slack, PagerDuty
- **Escalation:** Critical → PagerDuty + Slack, Warning → Slack only

### Loki (Log Aggregation)
- **Port:** 3100
- **Retention:** 30 days
- **Sources:** Docker containers, application logs, Cloudflare

### Sentry (Error Tracking)
- **Integration:** Per-service SDK initialization
- **Features:** Error classification, PII scrubbing, performance monitoring

## Alert Categories

| Category | Severity | Channel | Response Time |
|----------|----------|---------|---------------|
| Security | Critical | PagerDuty + #alerts-security | Immediate |
| Container Down | Critical | PagerDuty + #alerts-critical | < 5 min |
| High Error Rate | Critical | PagerDuty + #alerts-critical | < 5 min |
| High CPU/Memory | Warning | #alerts-warning | < 30 min |
| Business Metrics | Warning | #alerts-business | < 1 hour |

## Application Instrumentation

### Adding Metrics to a Service

```javascript
const { BusinessMetrics } = require('./monitoring/metrics/business-metrics');

const metrics = new BusinessMetrics();

// Add middleware to Express/Next.js
app.use(metrics.middleware());

// Metrics endpoint
app.get('/api/metrics', metrics.metricsHandler());

// Track events
metrics.trackRegistration('email', 'cinacoin', 'success');
metrics.trackLoginAttempt('wallet', 'reown', 'web');
metrics.trackLoginSuccess('wallet', 'reown');
```

### Adding Sentry to a Service

```javascript
const { SentryConfig } = require('./monitoring/sentry/sentry-config');

const Sentry = SentryConfig.init(
  process.env.SENTRY_DSN,
  process.env.NODE_ENV,
  'auth-service'
);

// Capture errors with classification
try {
  // ... operation
} catch (error) {
  SentryConfig.captureException(Sentry, error, {
    userId: user.id,
    service: 'auth-service',
    operation: 'login'
  });
}
```

## Cloudflare Logs

See `cloudflare-logs-config.md` for Logpush configuration.

## Alert Rules Summary

### Infrastructure
- CPU > 85% (warning) / > 95% (critical)
- Memory > 85% (warning) / > 95% (critical)
- Disk < 20% free (warning) / < 5% (critical)

### Application
- Error rate > 1% (warning) / > 5% (critical)
- P95 latency > 2s (warning) / > 5s (critical)
- Login failure rate > 20% (warning)

### Database
- PostgreSQL down (critical)
- Redis down (critical)
- High connections > 80% (warning)

### Blockchain
- RPC error rate > 10% (critical)
- Relay server down (critical)
- UserOp failures > 5/s (critical)

### Security
- Brute force: > 10 failed logins/s from same IP (critical)
- Traffic spike: 10x normal (warning)

## Runbooks

See individual alert annotations for runbook URLs. Key runbooks:
- [High CPU](https://docs.cinacoin.com/runbook/high-cpu)
- [Service Down](https://docs.cinacoin.com/runbook/service-down)
- [Database Issues](https://docs.cinacoin.com/runbook/database)
- [Blockchain Errors](https://docs.cinacoin.com/runbook/blockchain)

## Maintenance

### Backup
```bash
# Prometheus data
docker exec cinacoin-prometheus tar czf prometheus-backup-$(date +%Y%m%d).tar.gz /prometheus

# Grafana dashboards (if customized)
docker exec cinacoin-grafana tar czf grafana-backup-$(date +%Y%m%d).tar.gz /var/lib/grafana
```

### Updates
```bash
docker compose -f docker-compose.monitoring.yml pull
docker compose -f docker-compose.monitoring.yml up -d
```
