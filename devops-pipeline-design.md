# Cinacoin DevOps Pipeline Design

> Version: 1.0.0 | Date: 2026-06-08 | Author: 000 (AI Architect)
> Status: Design Document

---

## Table of Contents

1. [Overview](#1-overview)
2. [CI/CD Pipeline Architecture](#2-cicd-pipeline-architecture)
3. [Infrastructure as Code (IaC)](#3-infrastructure-as-code-iac)
4. [Deployment Strategies](#4-deployment-strategies)
5. [Monitoring & Observability](#5-monitoring--observability)
6. [Automated Testing Strategy](#6-automated-testing-strategy)
7. [Release Management](#7-release-management)
8. [Incident Response](#8-incident-response)
9. [Developer Experience](#9-developer-experience)

---

## 1. Overview

### 1.1 Current State

Cinacoin currently deploys via:
- **Cloudflare Pages** — Static sites (website, dashboards, demos) via Git integration
- **Cloudflare Workers** — Edge services (rpc, keys, relay, notify, push) via Wrangler
- **Vercel** — cinacoin.com and demo.cinacoin.com via Git integration
- **GitHub Actions** — CI/CD workflows triggered on push to main

**Monorepo structure:** `onux/` — 92 packages, 15+ apps, Turborepo-based

### 1.2 Target State

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DEVOPS ARCHITECTURE                                │
│                                                                       │
│  ┌───────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │  GitHub   │───▶│   CI     │───▶│  CD      │───▶│  Prod    │     │
│  │  (Source) │    │ (Build/  │    │ (Deploy/ │    │ (Run/    │     │
│  │           │    │  Test)   │    │  Promote)│    │ Monitor) │     │
│  └───────────┘    └──────────┘    └──────────┘    └──────────┘     │
│                                                                       │
│  Tools:                                                               │
│  • GitHub Actions (CI)      • ArgoCD (GitOps CD)                    │
│  • Turborepo (monorepo)     • Terraform (IaC)                       │
│  • Docker (containers)      • Prometheus+Grafana (monitoring)       │
│  • Trivy (security scan)    • OpenTelemetry (tracing)               │
│  • Changesets (versioning)  • PagerDuty (incident)                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Design Principles

| Principle | Implementation |
|---|---|
| **GitOps** | All infra and app config in Git; ArgoCD syncs cluster state |
| **Immutable artifacts** | Build once, deploy everywhere; container images tagged by SHA |
| **Progressive delivery** | Canary → blue/green → full rollout with automated rollback |
| **Shift-left security** | SAST, SCA, container scanning in CI; no deploy without passing |
| **Developer self-service** | Preview environments per PR; one-command local dev |
| **Observability-first** | Every deploy includes metrics, logs, traces from day one |

---

## 2. CI/CD Pipeline Architecture

### 2.1 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CI PIPELINE (GitHub Actions)                     │
│                                                                           │
│  Trigger: push to main / PR to main / scheduled (nightly)               │
│                                                                           │
│  ┌─────────────┐                                                         │
│  │ 1. Checkout │                                                         │
│  │ + Turbo     │                                                         │
│  │   Remote    │                                                         │
│  │   Cache     │                                                         │
│  └──────┬──────┘                                                         │
│         ▼                                                                 │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────────┐         │
│  │ 2. Install  │────▶│ 3. Lint +    │────▶│ 4. Type Check    │         │
│  │ Deps        │     │    Format    │     │    (tsc --noEmit)│         │
│  │ (pnpm)      │     │    Check     │     │                  │         │
│  └─────────────┘     └──────────────┘     └────────┬─────────┘         │
│                                                      ▼                   │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────────┐         │
│  │ 7. Security │◄────│ 6. E2E Tests │◄────│ 5. Unit +        │         │
│  │    Scans    │     │    (Playwright│     │    Integration   │         │
│  │             │     │     /Vitest)  │     │    Tests         │         │
│  └──────┬──────┘     └──────────────┘     └──────────────────┘         │
│         ▼                                                                 │
│  ┌─────────────┐     ┌──────────────┐                                   │
│  │ 8. Build    │────▶│ 9. Push      │                                   │
│  │ Artifacts   │     │    Artifacts │                                   │
│  │ (Docker/    │     │    (GHCR /   │                                   │
│  │  Static)    │     │     R2)      │                                   │
│  └─────────────┘     └──────────────┘                                   │
│                                                                           │
│  Parallel tracks (Turborepo remote cache):                               │
│  ├── apps/* build independently                                          │
│  ├── packages/* build independently                                      │
│  └── Only affected projects rebuild on PR                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Pipeline Stages Detail

#### Stage 1: Checkout + Cache

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2  # Need previous commit for Turborepo

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Turbo Remote Cache
        uses: dtinth/setup-turborepo@v1
        with:
          token: ${{ secrets.TURBO_TOKEN }}
```

#### Stage 2-4: Quality Gates

```yaml
      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Format check
        run: pnpm format:check

      - name: Type check
        run: pnpm typecheck
```

#### Stage 5-6: Testing

```yaml
      - name: Unit + Integration tests
        run: pnpm test -- --coverage
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}

      - name: E2E tests (Playwright)
        run: pnpm exec playwright test
        if: github.event_name == 'push'  # Skip on PR for speed

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

#### Stage 7: Security Scanning

```yaml
      - name: SAST (Semgrep)
        run: pnpm exec semgrep --config=auto --error

      - name: SCA (Dependency audit)
        run: pnpm audit --audit-level=high

      - name: Container image scan (Trivy)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
```

#### Stage 8-9: Build & Push

```yaml
      - name: Build affected apps
        run: pnpm turbo run build --filter='...[HEAD^1]'

      - name: Build Docker images (services)
        if: github.ref == 'refs/heads/main'
        run: |
          for svc in auth project wallet payment crosschain notification analytics; do
            docker build -t ghcr.io/cinagroup/${svc}:${{ github.sha }} \
                         -t ghcr.io/cinagroup/${svc}:latest \
                         apps/${svc}-service/
          done

      - name: Push to GHCR
        if: github.ref == 'refs/heads/main'
        run: |
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          for svc in auth project wallet payment crosschain notification analytics; do
            docker push ghcr.io/cinagroup/${svc}:${{ github.sha }}
            docker push ghcr.io/cinagroup/${svc}:latest
          done
```

### 2.3 CD Pipeline (GitOps with ArgoCD)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CD PIPELINE (ArgoCD GitOps)                       │
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐       │
│  │  GHCR Image  │───▶│  ArgoCD      │───▶│  Kubernetes      │       │
│  │  Repository  │    │  Controller  │    │  Cluster         │       │
│  └──────────────┘    └──────┬───────┘    └──────────────────┘       │
│                              │                                        │
│  ┌──────────────┐           │                                        │
│  │  Git Repo    │◄──────────┘                                        │
│  │  (k8s/       │  Watches for manifest changes                      │
│  │   manifests) │                                                     │
│  └──────────────┘                                                     │
│                                                                       │
│  Promotion Flow:                                                      │
│  1. CI pushes image to GHCR with SHA tag                             │
│  2. CI updates k8s/manifests with new image tag (PR)                 │
│  3. PR merged → ArgoCD detects manifest change                       │
│  4. ArgoCD syncs to staging → automated smoke tests                  │
│  5. Manual approval → ArgoCD syncs to production                     │
│  6. Canary deployment (10% → 50% → 100%) with auto-rollback         │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 Environment Promotion

```
┌────────┐     ┌──────────┐     ┌───────────┐     ┌──────────────┐
│  Dev   │────▶│ Preview  │────▶│ Staging   │────▶│ Production   │
│        │     │ (per PR) │     │           │     │              │
│ • Auto │     │ • Auto   │     │ • Auto    │     │ • Approved   │
│ • Ephem│     │ • Ephem  │     │ • Persist │     │ • Canary     │
│        │     │          │     │ • Full data│     │ • Multi-AZ   │
└────────┘     └──────────┘     └───────────┘     └──────────────┘
   │                │                 │                    │
   ▼                ▼                 ▼                    ▼
 Auto-deploy   PR comment      Smoke tests         Canary 10%→50%→100%
 on push       with preview    + integration       Auto-rollback on
               URL             tests               error rate > 1%
```

### 2.5 Cloudflare-Specific Deployments

For edge services that remain on Cloudflare (Workers, Pages):

```yaml
# .github/workflows/deploy-cloudflare.yml
name: Deploy to Cloudflare
on:
  push:
    branches: [main]
    paths:
      - 'packages/rpc-proxy/**'
      - 'packages/keys-server/**'
      - 'packages/relay-server/**'
      - 'packages/notify-server/**'
      - 'packages/push-server/**'
      - 'apps/**'

jobs:
  deploy-workers:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        worker: [rpc-proxy, keys-server, relay-server, notify-server, push-server]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build --filter=${{ matrix.worker }}
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          workingDirectory: packages/${{ matrix.worker }}

  deploy-pages:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [website, cloud-dashboard, backend-dashboard, wallet-explorer, 
              analytics-dashboard, health-status, demo, demo-react]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build --filter=${{ matrix.app }}
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: cinacoin-${{ matrix.app }}
          directory: apps/${{ matrix.app }}/dist
```

---

## 3. Infrastructure as Code (IaC)

### 3.1 IaC Toolchain

| Tool | Purpose | State Backend |
|---|---|---|
| Terraform | Cloud infrastructure (AWS/GCP) | Terraform Cloud / S3 + DynamoDB |
| Pulumi (alternative) | If team prefers TypeScript | Pulumi Cloud |
| Wrangler (wrangler.toml) | Cloudflare Workers config | Git-managed |
| Helm | Kubernetes application packaging | Git (k8s/manifests) |
| kustomize | Environment-specific overlays | Git (k8s/overlays/) |

### 3.2 Terraform Module Structure

```
infrastructure/
├── modules/
│   ├── vpc/                    # VPC, subnets, security groups
│   ├── eks/                    # EKS cluster, node groups
│   ├── rds/                    # PostgreSQL RDS, replicas
│   ├── elasticache/            # Redis cluster
│   ├── cloudflare/             # CF Workers, Pages, DNS, WAF
│   ├── monitoring/             # Prometheus, Grafana, AlertManager
│   ├── secrets/                # AWS Secrets Manager / Vault
│   └── backup/                 # Backup policies, retention
│
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   └── ...
│   └── production/
│       └── ...
│
└── global/
    ├── dns.tf                  # Route53 / Cloudflare DNS
    ├── iam.tf                  # Cross-account roles
    └── secrets.tf              # Global secret definitions
```

### 3.3 Cloudflare Configuration as Code

```toml
# packages/rpc-proxy/wrangler.toml
name = "cinacoin-rpc-proxy"
main = "dist/worker.js"
compatibility_date = "2026-06-01"

[vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"

[[kv_namespaces]]
binding = "RPC_CONFIG"
id = "abc123..."

[[d1_databases]]
binding = "DB"
database_name = "cinacoin-rpc"
database_id = "def456..."

[observability]
enabled = true
head_sampling_rate = 0.1  # 10% of requests traced
```

### 3.4 Kubernetes Manifests (GitOps)

```
k8s/
├── base/
│   ├── auth-service/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── kustomization.yaml
│   ├── project-service/
│   │   └── ...
│   └── ...
│
├── overlays/
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   ├── replicas-patch.yaml      # 1 replica
│   │   └── resources-patch.yaml     # Small resources
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   ├── replicas-patch.yaml      # 2 replicas
│   │   └── resources-patch.yaml     # Medium resources
│   └── production/
│       ├── kustomization.yaml
│       ├── replicas-patch.yaml      # 3+ replicas
│       ├── resources-patch.yaml     # Full resources
│       └── pdb.yaml                 # PodDisruptionBudget
│
└── argocd/
    ├── applications/
    │   ├── auth-service.yaml
    │   ├── project-service.yaml
    │   └── ...
    └── appsets/
        └── cinacoin-services.yaml   # ApplicationSet for all services
```

---

## 4. Deployment Strategies

### 4.1 Canary Deployment (Production)

```
┌─────────────────────────────────────────────────────────────────┐
│                   CANARY DEPLOYMENT FLOW                          │
│                                                                   │
│  Phase 1: Deploy Canary (5% traffic)                             │
│  ┌────────────┐    ┌────────────┐                                │
│  │  Stable    │95% │  Canary    │5%                              │
│  │  (v1.2.3)  │───▶│  (v1.2.4)  │                                │
│  └────────────┘    └────────────┘                                │
│  Duration: 5 min | Monitor: error rate, latency, CPU            │
│                                                                   │
│  Phase 2: Expand (25% traffic)                                   │
│  ┌────────────┐    ┌────────────┐                                │
│  │  Stable    │75% │  Canary    │25%                             │
│  │  (v1.2.3)  │───▶│  (v1.2.4)  │                                │
│  └────────────┘    └────────────┘                                │
│  Duration: 10 min | Monitor: same + business metrics             │
│                                                                   │
│  Phase 3: Majority (50% traffic)                                 │
│  ┌────────────┐    ┌────────────┐                                │
│  │  Stable    │50% │  Canary    │50%                             │
│  │  (v1.2.3)  │───▶│  (v1.2.4)  │                                │
│  └────────────┘    └────────────┘                                │
│  Duration: 15 min | Monitor: all metrics                         │
│                                                                   │
│  Phase 4: Full Rollout (100%)                                    │
│  ┌─────────────────────────┐                                     │
│  │  v1.2.4 (100%)          │                                     │
│  └─────────────────────────┘                                     │
│                                                                   │
│  AUTO-ROLLBACK TRIGGERS:                                         │
│  • Error rate > 1% (5xx responses)                               │
│  • p99 latency > 2x baseline                                     │
│  • CPU > 90% for > 2 min                                         │
│  • Pod crash loop detected                                        │
│  • Health check failures > 3                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Argo Rollouts Configuration

```yaml
# k8s/base/auth-service/rollout.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: auth-service
spec:
  replicas: 5
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: 5m }
        - setWeight: 25
        - pause: { duration: 10m }
        - setWeight: 50
        - pause: { duration: 15m }
        - setWeight: 100
      canaryMetadata:
        annotations:
          role: canary
        labels:
          role: canary
      stableMetadata:
        annotations:
          role: stable
        labels:
          role: stable
      analysis:
        templates:
          - templateName: success-rate
        startingStep: 1
        args:
          - name: service-name
            value: auth-service
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
        - name: auth-service
          image: ghcr.io/cinagroup/auth-service:latest
```

### 4.3 Database Migration Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                DATABASE MIGRATION PIPELINE                        │
│                                                                   │
│  Tool: Prisma Migrate / Alembic / Flyway                         │
│                                                                   │
│  Migration Rules:                                                 │
│  1. NEVER drop columns in a single deploy                        │
│  2. Additive changes first (add column, backfill, then use)     │
│  3. Two-phase migrations:                                        │
│     Phase A: Add new column + dual-write                        │
│     Phase B: Migrate old data + switch reads                    │
│     Phase C: Remove old column (next release)                   │
│  4. All migrations run BEFORE app code deploys                   │
│  5. Migrations are idempotent and reversible                     │
│                                                                   │
│  Pipeline:                                                        │
│  1. CI validates migration syntax                                │
│  2. Staging: auto-run migration + verify row counts              │
│  3. Production: run migration in transaction                     │
│  4. Verify: row count check + sample data validation             │
│  5. Deploy: app code that uses new schema                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Monitoring & Observability

### 5.1 Observability Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY ARCHITECTURE                         │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                    OpenTelemetry SDK                         │     │
│  │  (Auto-instrumentation: HTTP, DB, Redis, gRPC)             │     │
│  └──────────────────────────┬──────────────────────────────────┘     │
│                              │                                        │
│         ┌────────────────────┼────────────────────┐                  │
│         ▼                    ▼                    ▼                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐         │
│  │  Metrics    │    │   Logs      │    │   Traces        │         │
│  │  (Prometheus│    │  (Loki /    │    │  (Tempo /       │         │
│  │   /Mimir)   │    │   Fluentd)  │    │   Jaeger)       │         │
│  └──────┬──────┘    └──────┬──────┘    └────────┬────────┘         │
│         │                   │                    │                   │
│         └───────────────────┼────────────────────┘                  │
│                             ▼                                        │
│                    ┌─────────────────┐                               │
│                    │    Grafana      │                               │
│                    │  (Unified UI)   │                               │
│                    │  • Dashboards   │                               │
│                    │  • Alerts       │                               │
│                    │  • SLO tracking │                               │
│                    └─────────────────┘                               │
│                             │                                        │
│                    ┌────────▼────────┐                               │
│                    │  AlertManager   │                               │
│                    │  • PagerDuty    │                               │
│                    │  • Slack        │                               │
│                    │  • Webhook      │                               │
│                    └─────────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Key Metrics (SLOs)

| Service | SLI | SLO Target | Alert Threshold |
|---|---|---|---|
| API Gateway | Availability (non-5xx) | 99.95% | <99.9% for 5min |
| API Gateway | Latency (p99) | <500ms | >1s for 5min |
| Auth Service | Login success rate | 99.5% | <99% for 10min |
| RPC Proxy | Request success rate | 99.9% | <99.5% for 5min |
| Payment Service | Transaction success | 99.5% | <99% for 5min |
| Cross-Chain | Swap completion | 99% | <98% for 15min |
| Database | Query latency (p95) | <20ms | >50ms for 5min |
| Redis | Cache hit rate | >95% | <90% for 10min |

### 5.3 Grafana Dashboard Layout

```
Cinacoin Operations Dashboard
├── 🏠 Overview
│   ├── Request rate (global)
│   ├── Error rate (global)
│   ├── Active users
│   └── Revenue metrics
│
├── 🔌 API Gateway
│   ├── Request rate by endpoint
│   ├── Latency distribution (p50/p95/p99)
│   ├── Error rate by status code
│   ├── Rate limit triggers
│   └── Active connections
│
├── 🔐 Auth Service
│   ├── Login attempts by method (SIWE/Passkey/Social/OTP)
│   ├── Token issuance rate
│   ├── Failed auth attempts
│   └── Session duration distribution
│
├── 💰 Payment Service
│   ├── Transaction volume (by type: swap/onramp/deposit)
│   ├── Success/failure rate
│   ├── Average transaction value
│   └── Provider availability (MoonPay/Ramp/Transak)
│
├── 🔗 Cross-Chain
│   ├── Active swaps
│   ├── Bridge volume by chain
│   ├── Average completion time
│   └── Failed/expired swaps
│
├── 🗄️ Infrastructure
│   ├── CPU/Memory per service
│   ├── Pod count + restarts
│   ├── Database connections (active/idle)
│   ├── Redis memory + hit rate
│   └── Disk I/O
│
└── 📊 Business
    ├── DAU/MAU
    ├── API calls per project (top 10)
    ├── Chain distribution
    └── Wallet connection success rate
```

### 5.4 Alerting Rules

```yaml
# alerts/cinacoin-alerts.yaml
groups:
  - name: cinacoin-critical
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) 
          / sum(rate(http_requests_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate > 1% for 5 minutes"
          runbook: "https://wiki.cinacoin.com/runbooks/high-error-rate"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.99, 
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > 1.0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "p99 latency > 1s for 5 minutes"

      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_activity_count > pg_settings_max_connections * 0.9
        for: 2m
        labels:
          severity: critical

      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
        for: 5m
        labels:
          severity: warning

      - alert: PodCrashLooping
        expr: |
          increase(kube_pod_container_status_restarts_total[1h]) > 5
        for: 10m
        labels:
          severity: critical
```

### 5.5 Structured Logging Standard

```typescript
// All services use structured JSON logging
// Logger configuration (shared package: @cinacoin/logger)

import { createLogger } from '@cinacoin/logger';

const logger = createLogger({
  service: 'auth-service',
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  // OpenTelemetry trace context auto-injected
});

// Standard log structure:
{
  "timestamp": "2026-06-08T14:00:00.000Z",
  "level": "info",
  "service": "auth-service",
  "message": "User login successful",
  "traceId": "abc123...",
  "spanId": "def456...",
  "userId": "user_123",        // Never log PII (email, phone)
  "projectId": "proj_456",
  "method": "SIWE",
  "chain": "ethereum",
  "duration_ms": 45,
  "requestId": "req_789"
}
```

---

## 6. Automated Testing Strategy

### 6.1 Testing Pyramid

```
                    ┌─────────┐
                    │  E2E    │  ← 10 tests (critical paths)
                    │ (10%)   │     Playwright + mobile
                   ┌┴─────────┴┐
                   │Integration│  ← 100 tests (service boundaries)
                   │   (20%)   │     API contracts, DB integration
                  ┌┴───────────┴┐
                  │  Unit Tests │  ← 1000+ tests (business logic)
                  │    (70%)    │     Vitest / Jest
                  └─────────────┘
```

### 6.2 Test Types & Tools

| Test Type | Tool | Scope | When | Coverage Target |
|---|---|---|---|---|
| Unit | Vitest | Functions, classes, hooks | Every commit | >80% |
| Integration | Vitest + Testcontainers | Service + DB + Redis | Every commit | >70% |
| API Contract | Pact / Dredd | Service API contracts | Every PR | All endpoints |
| E2E | Playwright | Full user flows | Nightly + pre-release | Critical paths |
| Performance | k6 / Artillery | Load testing | Weekly + pre-release | SLO validation |
| Security | Semgrep + Trivy | SAST + container scan | Every commit | OWASP Top 10 |
| Chaos | Litmus / Chaos Mesh | Fault injection | Monthly (staging) | Resilience |

### 6.3 E2E Test Scenarios (Critical Paths)

```typescript
// e2e/critical-paths.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  
  test('User connects wallet via SIWE', async ({ page }) => {
    // 1. Navigate to demo app
    // 2. Click "Connect Wallet"
    // 3. Select MetaMask
    // 4. Sign SIWE message
    // 5. Verify dashboard shows connected state
  });

  test('User creates project and gets API key', async ({ page }) => {
    // 1. Login to cloud dashboard
    // 2. Create new project
    // 3. Generate API key
    // 4. Verify key appears in list
    // 5. Test key against API
  });

  test('User initiates cross-chain swap', async ({ page }) => {
    // 1. Connect wallet
    // 2. Select source chain (Ethereum)
    // 3. Select destination chain (Solana)
    // 4. Enter amount
    // 5. Get quote
    // 6. Confirm swap
    // 7. Verify swap status updates
  });

  test('Payment onramp flow', async ({ page }) => {
    // 1. Select "Buy Crypto"
    // 2. Choose provider (MoonPay)
    // 3. Enter fiat amount
    // 4. Verify quote
    // 5. Complete KYC (test data)
    // 6. Verify transaction created
  });

  test('Analytics dashboard loads real data', async ({ page }) => {
    // 1. Login to analytics dashboard
    // 2. Verify KPI cards show data (not zeros/placeholders)
    // 3. Verify charts render
    // 4. Verify date range filter works
  });
});
```

### 6.4 Performance Testing

```yaml
# k6 load test configuration
# tests/performance/api-load-test.js

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 1000 },  // Hold at 1000 RPS
    { duration: '2m', target: 5000 },  // Spike to 5000
    { duration: '5m', target: 5000 },  // Hold spike
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};
```

### 6.5 CI Test Gates

| Gate | Requirement | Blocks |
|---|---|---|
| Unit tests | All pass, coverage >80% | PR merge |
| Integration tests | All pass | PR merge |
| Security scan | No CRITICAL/HIGH findings | PR merge |
| E2E tests | All critical paths pass | Release |
| Performance test | p99 < SLO target | Release |
| Contract tests | No breaking API changes | Service deploy |

---

## 7. Release Management

### 7.1 Versioning Strategy

| Component | Versioning | Example |
|---|---|---|
| SDK packages (@cinacoin/*) | Semver via Changesets | `@cinacoin/core-sdk@2.1.0` |
| Backend services | Semver (Docker tags) | `auth-service:v1.3.2` |
| Frontend apps | CalVer (optional) | `cloud-dashboard:2026.06.08` |
| API | URL versioning | `/api/v1/`, `/api/v2/` |
| Infrastructure | Git SHA | `k8s@abc123` |

### 7.2 Changesets Workflow

```
Developer creates PR
    │
    ├── Makes code changes
    ├── Runs: pnpm changeset
    │   └── Selects packages affected
    │   └── Chooses bump type (patch/minor/major)
    │   └── Writes changelog entry
    └── Commits .changeset/*.md with PR
    
PR merged to main
    │
    ├── Changesets bot creates "Version Packages" PR
    │   └── Bumps versions in package.json
    │   └── Updates CHANGELOG.md
    │   └── Deletes consumed .changeset files
    │
    └── Maintainer merges "Version Packages" PR
        │
        ├── GitHub Release created (git tag)
        ├── npm publish (SDK packages)
        ├── Docker image tagged with version
        └── ArgoCD picks up new version
```

### 7.3 Hotfix Process

```
Production incident detected
    │
    ├── Create hotfix branch from release tag
    │   (e.g., release/v1.3.2 → hotfix/fix-critical-bug)
    │
    ├── Fix + tests
    │
    ├── PR to main (review + merge)
    │
    ├── Cherry-pick to release branch
    │
    ├── Fast-track CI (skip non-critical stages)
    │
    ├── Deploy to staging → smoke test
    │
    └── Deploy to production (skip canary if critical)
```

---

## 8. Incident Response

### 8.1 Severity Levels

| Severity | Definition | Response Time | Resolution Target | Example |
|---|---|---|---|---|
| SEV-1 | Complete outage / data loss | 5 min | 1 hour | All services down |
| SEV-2 | Major feature broken | 15 min | 4 hours | Payment processing down |
| SEV-3 | Minor feature degraded | 1 hour | 24 hours | Analytics delayed |
| SEV-4 | Cosmetic / non-urgent | Next business day | 1 week | UI glitch |

### 8.2 On-Call Rotation

```
Weekly rotation (Mon 09:00 UTC → Mon 09:00 UTC):
├── Primary on-call: PagerDuty alert → 5 min ack
├── Secondary on-call: Escalation if primary doesn't ack
├── Engineering lead: SEV-1/SEV-2 escalation
└── CTO: SEV-1 > 1 hour unresolved

Tools:
• PagerDuty: Alert routing + escalation
• Slack: #incidents channel for war room
• Statuspage: status.cinacoin.com for public updates
```

### 8.3 Post-Incident Process

```
1. Incident resolved
2. Within 24h: Draft post-mortem (blameless)
   - Timeline
   - Root cause analysis (5 Whys)
   - Impact assessment
   - Action items (prevent recurrence)
3. Within 48h: Post-mortem review meeting
4. Action items tracked in project management
5. Runbook updated if needed
```

---

## 9. Developer Experience

### 9.1 Local Development Setup

```bash
# One-command setup
git clone git@github.com:cinagroup/cinacoin.git
cd cinacoin
pnpm install
pnpm dev          # Starts all apps with Turborepo

# Or target specific apps
pnpm dev --filter=cloud-dashboard
pnpm dev --filter=backend-dashboard
```

### 9.2 Preview Environments

Every PR automatically gets a preview environment:

```
PR #123 opened
    │
    ├── Cloudflare Pages: preview-123--cinacoin-cloud.pages.dev
    ├── Vercel: cinacoin-git-preview-123.vercel.app
    ├── Workers: preview-123--cinacoin-rpc.workers.dev
    │
    └── PR comment with all preview URLs + deployment status
```

### 9.3 Developer Commands

```bash
# Development
pnpm dev                    # Start all apps
pnpm dev --filter=<app>     # Start specific app
pnpm build                  # Build all
pnpm typecheck              # Type check all
pnpm lint                   # Lint all
pnpm test                   # Test all

# Database
pnpm db:migrate             # Run migrations
pnpm db:seed                # Seed test data
pnpm db:studio              # Open Prisma Studio

# Docker
pnpm docker:build           # Build all service images
pnpm docker:up              # Start all services locally
pnpm docker:down            # Stop all services

# Deployment
pnpm changeset              # Create a changeset
pnpm release                # Version + publish packages
```

### 9.4 Documentation

| Doc Type | Location | Tool |
|---|---|---|
| API Reference | docs.cinacoin.com | Docusaurus |
| Architecture ADRs | docs/adr/ | Markdown |
| Runbooks | wiki.cinacoin.com/runbooks | Notion/Confluence |
| Code comments | Inline | TSDoc |
| SDK guides | docs-site/docs/guides | Docusaurus |

---

## Appendix A: CI/CD Tool Comparison

| Tool | Chosen | Alternative | Reason |
|---|---|---|---|
| CI | GitHub Actions | GitLab CI, CircleCI | Native GitHub integration, free for OSS |
| CD | ArgoCD | Flux, Spinnaker | GitOps native, UI, progressive delivery |
| Monorepo | Turborepo | Nx, Lerna | Fast, simple, great DX |
| Container | Docker + GHCR | GitLab Registry | Industry standard |
| IaC | Terraform | Pulumi, CDK | Mature, large provider ecosystem |
| K8s Packaging | Helm + Kustomize | Kustomize only | Helm for complex apps, Kustomize for overlays |

## Appendix B: Pipeline Timing Targets

| Stage | Target Duration | Notes |
|---|---|---|
| Checkout + Install | <1 min | Turbo remote cache |
| Lint + Format | <1 min | Parallel with typecheck |
| Type Check | <2 min | Turborepo parallelism |
| Unit Tests | <3 min | Coverage threshold enforced |
| Integration Tests | <5 min | Testcontainers for DB |
| Security Scan | <2 min | Parallel with tests |
| Build | <3 min | Only affected packages |
| Docker Build + Push | <3 min | Layer caching |
| **Total CI** | **<10 min** | PR feedback loop |
| Deploy to Staging | <5 min | ArgoCD sync |
| Smoke Tests | <2 min | Critical path verification |
| Canary (Production) | 30 min | 5% → 25% → 50% → 100% |
