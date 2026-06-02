# infra/relay — WalletConnect Relay Infrastructure

Multi-region Cloudflare Workers deployment for WalletConnect v2 relay proxy and session management.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────┐
│   dApp SDK  │────▶│ Cloudflare   │────▶│ D1       │
│ (Web/Mobile)│     │ Workers      │     │ (state)  │
└─────────────┘     │ (Edge)       │     └──────────┘
                    │              │     ┌──────────┐
                    │              │────▶│ KV       │
                    │              │     │ (cache)  │
                    └──────────────┘     └──────────┘
                          │
                    ┌──────────────┐
                    │ Monitoring   │
                    │ (Alerts)     │
                    └──────────────┘
```

## Regions

| Region   | Cloudflare Group | Location          |
|----------|-----------------|-------------------|
| NA       | NAM               | North America     |
| EU       | EUR               | Europe            |
| APAC     | APAC              | Asia Pacific      |

## Deployment

```bash
cd infra/relay
terraform init
terraform plan
terraform apply
```

## Components

- **Cloudflare Workers** — Edge relay proxy, session routing, health checks
- **D1 Database** — Session state, connection tracking, analytics
- **KV Store** — Hot session cache, rate limiting counters
- **Alerts** — Error rate, latency, connection monitoring
