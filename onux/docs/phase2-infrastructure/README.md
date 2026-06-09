# Cinacoin Phase 2 — Production Infrastructure

> **Version**: 2.0.0  
> **Date**: 2026-06-08  
> **Status**: Production Ready  
> **Platform**: Cloudflare (Workers + Pages + D1 + KV + R2)

---

## Overview

This directory contains the complete infrastructure documentation and deployment scripts for Cinacoin Phase 2 production deployment.

**Phase 2 Goals:**
- ✅ Migrate from `cinacoin.com` to `cinacoin.io` as primary domain
- ✅ Configure production-grade DNS, SSL, CDN, and load balancing
- ✅ Set up comprehensive monitoring and alerting
- ✅ Implement automated backup and disaster recovery

---

## Documentation Index

| Document | Description | Key Topics |
|----------|-------------|------------|
| [01-DOMAIN-DNS.md](./01-DOMAIN-DNS.md) | Domain & DNS Configuration | Subdomain map, DNS records, Wrangler config, DNSSEC |
| [02-SSL-TLS.md](./02-SSL-TLS.md) | SSL/TLS Configuration | Universal SSL, Origin CA, HSTS, certificate monitoring |
| [03-CDN-LOADBALANCER.md](./03-CDN-LOADBALANCER.md) | CDN & Load Balancer | Cache rules, image optimization, geographic routing, failover |
| [04-MONITORING-ALERTING.md](./04-MONITORING-ALERTING.md) | Monitoring & Alerting | Uptime monitoring, APM, alert rules, incident response |
| [05-BACKUP-RECOVERY.md](./05-BACKUP-RECOVERY.md) | Backup & Recovery | D1 backups, KV snapshots, disaster recovery procedures |

---

## Quick Start

### Prerequisites

```bash
# Install required tools
npm install -g wrangler
brew install jq  # or apt-get install jq

# Authenticate with Cloudflare
wrangler login

# Set API token
export CF_API_TOKEN="your-cloudflare-api-token"
```

### Automated Setup

```bash
# Dry run (preview changes)
./scripts/setup-phase2-infrastructure.sh --dry-run

# Full setup
./scripts/setup-phase2-infrastructure.sh

# Skip specific sections
./scripts/setup-phase2-infrastructure.sh --skip-dns --skip-ssl
```

### Manual Setup

Follow each document in order:
1. Domain & DNS → Register domain, configure DNS records
2. SSL/TLS → Enable Universal SSL, generate Origin CA cert
3. CDN & Load Balancer → Configure caching, set up load balancer
4. Monitoring & Alerting → Set up health checks, configure alerts
5. Backup & Recovery → Configure automated backups, test restore

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet / Users                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                   Cloudflare Edge (300+ PoPs)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   DNS    │  │   SSL    │  │   CDN    │  │   WAF    │       │
│  │ (Anycast)│  │ (TLS 1.3)│  │ (Cache)  │  │ (Security│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Load Balancer (Geo-routing)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────┴───────┐  ┌────────┴────────┐  ┌──────┴──────┐
│   Workers     │  │     Pages       │  │  Storage    │
│               │  │                 │  │             │
│ • API Gateway │  │ • Main App      │  │ • D1 (SQL)  │
│ • Auth Svc    │  │ • Dashboard     │  │ • KV (Cache)│
│ • User Svc    │  │ • Docs          │  │ • R2 (Obj)  │
│ • RPC Proxy   │  │ • Status        │  │             │
│ • Relay       │  │ • Analytics     │  │             │
│ • Monitoring  │  │ • Demo          │  │             │
└───────────────┘  └─────────────────┘  └─────────────┘
```

---

## Subdomain Map

### Phase 2 New Services

| Subdomain | Service | Type | Priority |
|-----------|---------|------|----------|
| `api.cinacoin.io` | API Gateway | Workers | P0 — Critical |
| `auth.cinacoin.io` | Auth Service | Workers | P0 — Critical |
| `users.cinacoin.io` | User Service | Workers | P0 — Critical |
| `app.cinacoin.io` | Main Application | Pages | P1 — High |
| `dashboard.cinacoin.io` | Unified Dashboard | Pages | P1 — High |

### Existing Services (Migrated)

| Subdomain | Service | Type | Status |
|-----------|---------|------|--------|
| `rpc.cinacoin.io` | RPC Proxy | Workers | ✅ Active |
| `keys.cinacoin.io` | Keys Server | Workers | ✅ Active |
| `relay.cinacoin.io` | Relay Server | Workers | ✅ Active |
| `notify.cinacoin.io` | Notify Server | Workers | ✅ Active |
| `push.cinacoin.io` | Push Server | Workers | ✅ Active |
| `monitor.cinacoin.io` | Monitoring | Workers | ✅ Active |
| `docs.cinacoin.io` | Documentation | Pages | ✅ Active |
| `status.cinacoin.io` | Health Status | Pages | ✅ Active |
| `analytics.cinacoin.io` | Analytics Dashboard | Pages | ✅ Active |
| `wallet.cinacoin.io` | Wallet Explorer | Pages | ✅ Active |
| `cloud.cinacoin.io` | Cloud Dashboard | Pages | ✅ Active |
| `demo.cinacoin.io` | Demo App | Pages | ✅ Active |
| `react.cinacoin.io` | React Demo | Pages | ✅ Active |
| `dash.cinacoin.io` | Backend Dashboard | Pages | ✅ Active |

---

## Cost Estimate

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Domain registration (.io) | ~$3/mo | $40/year at-cost |
| Workers (Pro) | $5/mo | 10M requests included |
| CDN & Load Balancer | $30-80/mo | Depends on Argo usage |
| Monitoring | $0-45/mo | Free tier covers basics |
| Backups (R2) | ~$1/mo | ~60GB storage |
| **Total** | **$40-135/mo** | Scales with traffic |

---

## Deployment Checklist

### Pre-Deployment

- [ ] Cloudflare account has Pro plan ($20/mo)
- [ ] API token with appropriate permissions
- [ ] Wrangler CLI installed and authenticated
- [ ] Domain `cinacoin.io` registered or ready to transfer
- [ ] Reviewed all documentation in this directory

### Deployment

- [ ] Run `setup-phase2-infrastructure.sh --dry-run` to preview
- [ ] Execute full setup script
- [ ] Update nameservers at domain registrar
- [ ] Wait for DNS propagation (5 min - 48 hours)
- [ ] Verify SSL certificates provisioned
- [ ] Test all subdomains resolve correctly

### Post-Deployment

- [ ] Submit to HSTS preload list
- [ ] Configure external uptime monitoring
- [ ] Set up Discord webhooks for alerts
- [ ] Schedule automated backups (cron)
- [ ] Test backup restore procedure
- [ ] Document incident response contacts
- [ ] Schedule monthly DR drill

---

## Monitoring & Alerting

### Health Check Endpoints

All services expose `/health` endpoints:

```bash
# Quick health check
curl https://api.cinacoin.io/health
curl https://auth.cinacoin.io/health
curl https://app.cinacoin.io

# Full service check
./scripts/health-check.sh
```

### Alert Channels

| Channel | Purpose | Configuration |
|---------|---------|---------------|
| Discord #critical | P0 incidents | Webhook URL in monitoring worker |
| Discord #alerts | P1-P3 alerts | Webhook URL in monitoring worker |
| Email ops@cinacoin.io | All alerts | Resend API key |
| PagerDuty | P0 incidents | Integration key |

### Status Page

Public status page: https://status.cinacoin.io

---

## Backup & Recovery

### Backup Schedule

| Component | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| D1 Databases | Hourly | 30 days | Cloudflare + R2 |
| KV Namespaces | Daily | 14 days | R2 |
| DNS Records | Weekly | 52 weeks | GitHub + R2 |
| R2 Objects | Continuous | 90 days | R2 (versioned) |

### Recovery Procedures

See [05-BACKUP-RECOVERY.md](./05-BACKUP-RECOVERY.md) for detailed procedures:

- **Single service failure**: Rollback via `wrangler rollback`
- **Database corruption**: Point-in-time restore from D1 backups
- **Full zone outage**: Geographic failover (automatic)
- **Account compromise**: Full restore from backups (2-4 hours)

### Monthly DR Drill

**Schedule**: First Saturday of every month, 10:00 UTC

Test backup restore, failover procedures, and measure actual RTO/RPO.

---

## Security

### SSL/TLS

- ✅ Universal SSL (Let's Encrypt / DigiCert)
- ✅ Origin CA certificates (15-year validity)
- ✅ TLS 1.2 minimum, TLS 1.3 enabled
- ✅ HSTS with preload
- ✅ Automatic certificate renewal

### Security Headers

- ✅ Strict-Transport-Security (HSTS)
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ Content-Security-Policy
- ✅ Referrer-Policy: strict-origin-when-cross-origin

### Access Control

- ✅ API tokens with minimum required permissions
- ✅ Worker secrets for sensitive configuration
- ✅ R2 bucket policies restrict public access
- ✅ DNSSEC enabled

---

## Incident Response

### Severity Levels

| Level | Response Time | Notification | Example |
|-------|--------------|--------------|---------|
| **P0 — Critical** | Immediate | Discord + PagerDuty + Email | Service down, data loss |
| **P1 — High** | < 15 min | Discord + Email | High error rate, degraded |
| **P2 — Medium** | < 1 hour | Discord | Slow response, partial failure |
| **P3 — Low** | < 4 hours | Discord (digest) | Certificate expiring |

### Quick Recovery Commands

```bash
# Rollback last deployment
wrangler deployments rollback --name cinacoin-api-gateway-prod

# Purge all cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything": true}'

# Enable Under Attack mode
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/security_level" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "under_attack"}'

# Emergency health check
./scripts/incident-response.sh health-check
```

---

## Troubleshooting

### DNS Not Propagating

```bash
# Check DNS propagation
dig +short api.cinacoin.io
dig +short api.cinacoin.io @8.8.8.8
dig +short api.cinacoin.io @1.1.1.1

# Force Cloudflare to re-check
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/verify" \
  -H "Authorization: Bearer $CF_API_TOKEN"
```

### SSL Certificate Not Provisioning

```bash
# Check SSL status
curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/ssl/certificate_packs" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[]'

# Manually trigger certificate issuance
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/ssl/certificate_packs" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "universal", "hosts": ["cinacoin.io", "*.cinacoin.io"]}'
```

### Worker Deployment Failing

```bash
# Check deployment logs
wrangler tail cinacoin-api-gateway-prod

# Rollback to previous version
wrangler deployments rollback --name cinacoin-api-gateway-prod

# Check Worker status
curl https://api.cinacoin.io/health
```

### High Error Rate

```bash
# Check Cloudflare analytics
curl -X POST "https://api.cloudflare.com/client/v4/graphql" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "..."}'  # See monitoring docs

# Enable debug logging
wrangler secret put LOG_LEVEL --name cinacoin-api-gateway-prod
# Enter: debug
```

---

## Maintenance

### Weekly Tasks

- [ ] Review monitoring dashboard
- [ ] Check backup logs for failures
- [ ] Review error rate trends
- [ ] Update team on incidents

### Monthly Tasks

- [ ] Run DR drill (first Saturday)
- [ ] Review and rotate API tokens
- [ ] Update documentation
- [ ] Analyze cost trends
- [ ] Review alert thresholds

### Quarterly Tasks

- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Capacity planning
- [ ] Update incident response contacts

---

## Support & Resources

### Cloudflare Documentation

- [Workers Docs](https://developers.cloudflare.com/workers/)
- [Pages Docs](https://developers.cloudflare.com/pages/)
- [D1 Docs](https://developers.cloudflare.com/d1/)
- [Load Balancer Docs](https://developers.cloudflare.com/load-balancing/)

### Internal Resources

- Project Summary: `PROJECT_SUMMARY.md`
- Deployment Report: `DEPLOY-REPORT-2026-06-08.md`
- Cloudflare Deploy Guide: `CLOUDFLARE_DEPLOY.md`

### Contact

- **Engineering Lead**: 十三先生 (Mr. Thirteen)
- **Ops Email**: ops@cinacoin.io
- **Discord**: #cinacoin-ops

---

## Changelog

### v2.0.0 (2026-06-08)

- ✅ Complete Phase 2 infrastructure documentation
- ✅ Automated deployment script
- ✅ Domain migration plan (cinacoin.com → cinacoin.io)
- ✅ SSL/TLS configuration with HSTS preload
- ✅ CDN and load balancer setup
- ✅ Monitoring and alerting framework
- ✅ Backup and disaster recovery procedures

---

*Document version: 2.0.0 | Last updated: 2026-06-08 16:08 UTC*
