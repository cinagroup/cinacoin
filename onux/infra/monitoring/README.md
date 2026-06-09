# infra/monitoring — Cinacoin WalletConnect Relay Alerting

Centralized monitoring and alerting for the WC relay infrastructure.

## Alert Rules

| Rule | Condition | Severity | Channels |
|------|-----------|----------|----------|
| Worker Error Rate | > 1% over 5 min | Critical | Slack, PagerDuty |
| Response Time P99 | > 1s over 5 min | Warning | Slack, Email |
| Connection Count Drop | > 50% below baseline | Critical | Slack, PagerDuty, Email |
| Worker Availability | Health check fails 3x | Critical | Slack, PagerDuty, Email |
| KV Store Latency | P99 > 200ms | Warning | Slack |
| D1 Query Errors | > 5 errors / min | Warning | Slack |
| Rate Limit Triggered | > 1000 blocked / min | Info | Slack |

## Notification Channels

- **Slack** — Webhook to #cinacoin-alerts
- **Email** — ops@cinacoin.com
- **PagerDuty** — On-call rotation via Events API

## Deployment

```bash
cd infra/monitoring
./scripts/deploy-alerts.sh
```
