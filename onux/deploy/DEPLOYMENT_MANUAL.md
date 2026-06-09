# Cinacoin Phase 2 - Production Deployment Manual

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Initial Setup](#initial-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Docker Deployment](#docker-deployment)
7. [Kubernetes Deployment](#kubernetes-deployment)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Monitoring & Observability](#monitoring--observability)
10. [Security Hardening](#security-hardening)
11. [Backup & Disaster Recovery](#backup--disaster-recovery)
12. [Troubleshooting](#troubleshooting)
13. [Runbooks](#runbooks)

---

## Prerequisites

### Infrastructure Requirements

| Component | Minimum | Production |
|-----------|---------|------------|
| CPU | 4 cores | 16+ cores |
| RAM | 8 GB | 32+ GB |
| Storage | 100 GB SSD | 500+ GB SSD |
| Network | 100 Mbps | 1 Gbps |

### Software Requirements

- **Kubernetes**: v1.28+
- **Docker**: v24+
- **kubectl**: v1.28+
- **Helm**: v3.13+ (optional)
- **Node.js**: v22 LTS
- **pnpm**: v9.15+
- **PostgreSQL**: v16
- **Redis**: v7

### External Services

- Container Registry (GHCR, Docker Hub, or private)
- DNS provider (Cloudflare recommended)
- SSL certificates (Let's Encrypt via cert-manager)
- Monitoring stack (Prometheus + Grafana)
- Log aggregation (Loki or ELK)
- Error tracking (Sentry)
- RPC providers (Alchemy, Infura, or QuickNode)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          INTERNET / CDN                              │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│                     NGINX INGRESS CONTROLLER                         │
│              (TLS termination, rate limiting, routing)                │
└──┬──────────────┬──────────────┬──────────────┬─────────────────────┘
   │              │              │              │
   ▼              ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
│Unified │  │   Auth   │  │   User   │  │     API      │
│Dash-   │  │ Service  │  │ Service  │  │   Gateway    │
│board   │  │  :3200   │  │  :3201   │  │    :8787     │
│ :3000  │  └────┬─────┘  └────┬─────┘  └──────┬───────┘
└────────┘       │              │               │
                 │              │               │
    ┌────────────▼──────────────▼───────────────▼──────┐
    │                   PostgreSQL                       │
    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
    │  │cinacoin_ │  │cinacoin_ │  │cinacoin_     │    │
    │  │  auth    │  │  users   │  │  gateway     │    │
    │  └──────────┘  └──────────┘  └──────────────┘    │
    └───────────────────────────────────────────────────┘
                         │
    ┌────────────────────▼─────────────────────────────┐
    │                     Redis                         │
    │  (Sessions, Rate Limiting, Cache)                 │
    │  DB 0: Auth | DB 1: Users | DB 2: Gateway        │
    └───────────────────────────────────────────────────┘
```

---

## Initial Setup

### 1. Clone and Configure Repository

```bash
git clone https://github.com/cinacoin/onux.git
cd onux

# Install dependencies
pnpm install
```

### 2. Generate Security Keys

```bash
# Generate all required secrets
./deploy/scripts/generate-secrets.sh

# This creates deploy/env/.env.generated with:
# - JWT_SECRET (64 hex chars)
# - SESSION_SECRET (64 hex chars)
# - ENCRYPTION_KEY (64 hex chars)
# - SERVICE_API_KEY (32 hex chars)
# - DB_PASSWORD (random)
# - REDIS_PASSWORD (random)
```

### 3. Configure DNS

| Record | Type | Value |
|--------|------|-------|
| `cinacoin.com` | A | `<INGRESS_IP>` |
| `app.cinacoin.com` | CNAME | `cinacoin.com` |
| `api.cinacoin.com` | CNAME | `cinacoin.com` |
| `ws.cinacoin.com` | CNAME | `cinacoin.com` |

---

## Environment Configuration

### Sensitive Information Encryption

For production, use a secrets manager instead of plain environment variables:

**Option A: Kubernetes Secrets (encrypted at rest)**
```bash
# Enable encryption at rest in K8s API server
# See: https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/

# Apply secrets
kubectl apply -f deploy/k8s/secrets-config.yaml
```

**Option B: External Secrets Operator (recommended)**
```bash
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace

# Configure SecretStore (AWS Secrets Manager example)
kubectl apply -f deploy/k8s/external-secrets/secretstore.yaml
kubectl apply -f deploy/k8s/external-secrets/externalsecret.yaml
```

**Option C: HashiCorp Vault**
```bash
# Install Vault agent injector
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault -n vault --create-namespace
```

### Environment Files

Copy and customize environment templates:

```bash
# Auth Service
cp deploy/env/auth-service.env.example deploy/env/auth-service.env.production
# Edit with actual values

# User Service
cp deploy/env/user-service.env.example deploy/env/user-service.env.production

# API Gateway
cp deploy/env/api-gateway.env.example deploy/env/api-gateway.env.production

# Unified Dashboard
cp deploy/env/unified-dashboard.env.example deploy/env/unified-dashboard.env.production
```

---

## Database Setup

### 1. Provision PostgreSQL

```bash
# Option A: Managed (recommended for production)
# Use AWS RDS, GCP Cloud SQL, or similar

# Option B: Kubernetes (StatefulSet)
kubectl apply -f deploy/k8s/postgres/statefulset.yaml
kubectl apply -f deploy/k8s/postgres/service.yaml
```

### 2. Create Databases

```bash
# Create databases for each service
psql $ADMIN_DATABASE_URL <<SQL
CREATE DATABASE cinacoin_auth;
CREATE DATABASE cinacoin_users;
CREATE DATABASE cinacoin_gateway;

CREATE USER cinacoin_auth WITH PASSWORD '<STRONG_PASSWORD>';
CREATE USER cinacoin_users WITH PASSWORD '<STRONG_PASSWORD>';
CREATE USER cinacoin_gateway WITH PASSWORD '<STRONG_PASSWORD>';

GRANT ALL PRIVILEGES ON DATABASE cinacoin_auth TO cinacoin_auth;
GRANT ALL PRIVILEGES ON DATABASE cinacoin_users TO cinacoin_users;
GRANT ALL PRIVILEGES ON DATABASE cinacoin_gateway TO cinacoin_gateway;
SQL
```

### 3. Run Migrations

```bash
# Follow the detailed guide in deploy/DATABASE_MIGRATION_GUIDE.md

# Auth Service (must be first)
cd apps/auth-service
DATABASE_URL="postgresql://cinacoin_auth:PASSWORD@host:5432/cinacoin_auth" pnpm db:migrate:prod

# User Service
cd apps/user-service
DATABASE_URL="postgresql://cinacoin_users:PASSWORD@host:5432/cinacoin_users" pnpm db:migrate:prod

# API Gateway (D1 or PostgreSQL)
cd apps/api-gateway
# For D1:
wrangler d1 execute cinacoin-gateway-prod --file=migrations/0001_initial_schema.sql --remote
# For PostgreSQL:
DATABASE_URL="postgresql://cinacoin_gateway:PASSWORD@host:5432/cinacoin_gateway" psql -f migrations/0001_initial_schema.sql
```

### 4. Verify Migrations

```bash
# Run verification script
export AUTH_DATABASE_URL="..."
export USER_DATABASE_URL="..."
export GATEWAY_DATABASE_URL="..."
./deploy/scripts/verify-migrations.sh
```

---

## Docker Deployment

For simpler setups or development/staging environments:

```bash
cd deploy/docker

# 1. Create production environment file
cp ../env/auth-service.env.example .env.production
# Edit .env.production with actual values

# 2. Build and start
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# 3. Run migrations
docker-compose -f docker-compose.prod.yml exec auth-service node apps/auth-service/dist/db/migrate.js
docker-compose -f docker-compose.prod.yml exec user-service node apps/user-service/dist/db/migrate.js

# 4. Check health
docker-compose -f docker-compose.prod.yml ps
```

---

## Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl apply -f deploy/k8s/namespace.yaml
```

### 2. Apply ConfigMaps and Secrets

```bash
# IMPORTANT: Edit secrets-config.yaml with actual values first!
# NEVER commit real secrets to git.

kubectl apply -f deploy/k8s/secrets-config.yaml
```

### 3. Deploy Services (in order)

```bash
# 1. Auth Service (first - other services depend on it)
kubectl apply -f deploy/k8s/auth-service/deployment.yaml
kubectl wait --for=condition=available deployment/auth-service -n cinacoin --timeout=300s

# 2. User Service
kubectl apply -f deploy/k8s/user-service/  # Uses existing k8s/ dir
kubectl wait --for=condition=available deployment/user-service -n cinacoin --timeout=300s

# 3. API Gateway
kubectl apply -f deploy/k8s/api-gateway/deployment.yaml
kubectl wait --for=condition=available deployment/api-gateway -n cinacoin --timeout=300s

# 4. Unified Dashboard
kubectl apply -f deploy/k8s/unified-dashboard/deployment.yaml
kubectl wait --for=condition=available deployment/unified-dashboard -n cinacoin --timeout=300s
```

### 4. Apply Supporting Resources

```bash
# Service accounts
kubectl apply -f deploy/k8s/service-accounts.yaml

# Ingress
kubectl apply -f deploy/k8s/ingress/ingress.yaml

# Pod Disruption Budgets
kubectl apply -f deploy/k8s/pdb.yaml

# Monitoring
kubectl apply -f deploy/k8s/monitoring/servicemonitor.yaml
```

### 5. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n cinacoin

# Check all services
kubectl get svc -n cinacoin

# Check ingress
kubectl get ingress -n cinacoin

# Check HPA
kubectl get hpa -n cinacoin

# Test health endpoints
kubectl exec -it deployment/auth-service -n cinacoin -- curl -s http://localhost:3200/api/health
kubectl exec -it deployment/user-service -n cinacoin -- curl -s http://localhost:3201/api/health
kubectl exec -it deployment/api-gateway -n cinacoin -- curl -s http://localhost:8787/health
```

---

## CI/CD Pipeline

### GitHub Actions Setup

1. **Repository Secrets** (Settings → Secrets → Actions):

| Secret | Description |
|--------|-------------|
| `KUBE_CONFIG_STAGING` | Base64-encoded kubeconfig for staging cluster |
| `KUBE_CONFIG_PRODUCTION` | Base64-encoded kubeconfig for production cluster |
| `SNYK_TOKEN` | Snyk security scanning token |

2. **Environment Protection Rules**:
   - `staging`: Auto-deploy on push to `main`
   - `production`: Require manual approval

### Pipeline Stages

```
Push → CI (lint, test, build, security) → Docker Build → Deploy Staging → Smoke Tests → Deploy Production → Verify
```

### Manual Deployment

```bash
# Trigger via GitHub CLI
gh workflow run cd.yml -f service=auth-service -f strategy=rolling

# Or canary deployment
gh workflow run cd.yml -f service=api-gateway -f strategy=canary
```

### Database Migration via CI

```bash
# Dry run first
gh workflow run db-migrate.yml -f environment=staging -f service=auth-service -f dry_run=true

# Then actual migration
gh workflow run db-migrate.yml -f environment=staging -f service=auth-service
```

---

## Monitoring & Observability

### Health Check Endpoints

| Service | Endpoint | Port |
|---------|----------|------|
| Auth Service | `/api/health` | 3200 |
| User Service | `/api/health` | 3201 |
| API Gateway | `/health` | 8787 |
| Unified Dashboard | `/` | 3000 |

### Prometheus Metrics

Each service exposes metrics at `:PORT/metrics` when `METRICS_ENABLED=true`.

### Grafana Dashboards

Import pre-built dashboards from `deploy/monitoring/grafana/`:
- `cinacoin-overview.json` - System-wide overview
- `cinacoin-services.json` - Per-service metrics
- `cinacoin-database.json` - Database performance

### Alerting Rules

```yaml
# Key alerts to configure:
- PodCrashLooping
- HighErrorRate (>5% over 5min)
- HighLatency (p99 > 2s)
- DatabaseConnectionPoolExhausted
- RedisMemoryUsageHigh (>80%)
- CertificateExpiry (<14 days)
```

---

## Security Hardening

### Network Policies

```bash
kubectl apply -f deploy/k8s/network-policies.yaml
```

### Security Checklist

- [ ] All secrets encrypted at rest
- [ ] TLS enabled on all ingress
- [ ] Network policies restrict pod-to-pod communication
- [ ] Non-root containers
- [ ] Read-only root filesystem where possible
- [ ] Resource limits set on all containers
- [ ] Pod Security Standards enforced
- [ ] RBAC configured with least privilege
- [ ] Regular security scanning in CI
- [ ] Dependency vulnerability scanning

---

## Backup & Disaster Recovery

### Database Backups

```bash
# Automated daily backups (cron job)
0 2 * * * /deploy/scripts/backup-databases.sh

# Manual backup
./deploy/scripts/backup-databases.sh

# Restore from backup
./deploy/scripts/restore-database.sh <backup-file>
```

### RTO/RPO Targets

| Metric | Target |
|--------|--------|
| RPO (Recovery Point Objective) | < 1 hour |
| RTO (Recovery Time Objective) | < 30 minutes |

---

## Troubleshooting

### Common Issues

**Pod stuck in CrashLoopBackOff:**
```bash
kubectl logs deployment/auth-service -n cinacoin --previous
kubectl describe pod <pod-name> -n cinacoin
```

**Database connection refused:**
```bash
# Check if database is accessible
kubectl exec -it deployment/auth-service -n cinacoin -- nc -zv postgres 5432

# Check database credentials
kubectl get secret cinacoin-secrets -n cinacoin -o jsonpath='{.data.auth-database-url}' | base64 -d
```

**502 Bad Gateway:**
```bash
# Check if service is running
kubectl get endpoints -n cinacoin

# Check ingress configuration
kubectl describe ingress cinacoin-ingress -n cinacoin
```

**High memory usage:**
```bash
# Check resource usage
kubectl top pods -n cinacoin

# Adjust resource limits if needed
kubectl edit deployment auth-service -n cinacoin
```

---

## Runbooks

### Scale Service

```bash
# Manual scale
kubectl scale deployment auth-service -n cinacoin --replicas=5

# Or update HPA
kubectl patch hpa auth-service-hpa -n cinacoin -p '{"spec":{"maxReplicas":20}}'
```

### Rollback Deployment

```bash
# Check rollout history
kubectl rollout history deployment/auth-service -n cinacoin

# Rollback to previous
kubectl rollout undo deployment/auth-service -n cinacoin

# Rollback to specific revision
kubectl rollout undo deployment/auth-service -n cinacoin --to-revision=3
```

### Emergency Maintenance Mode

```bash
# Enable maintenance mode
kubectl set env deployment/unified-dashboard -n cinacoin NEXT_PUBLIC_MAINTENANCE_MODE=true

# Disable
kubectl set env deployment/unified-dashboard -n cinacoin NEXT_PUBLIC_MAINTENANCE_MODE=false
```

### Database Emergency Rollback

```bash
# 1. Stop application traffic
kubectl scale deployment auth-service -n cinacoin --replicas=0
kubectl scale deployment user-service -n cinacoin --replicas=0

# 2. Restore from backup
./deploy/scripts/restore-database.sh <latest-backup>

# 3. Restart services
kubectl scale deployment auth-service -n cinacoin --replicas=3
kubectl scale deployment user-service -n cinacoin --replicas=3
```

---

## Appendix

### File Structure

```
deploy/
├── env/                          # Environment variable templates
│   ├── auth-service.env.example
│   ├── user-service.env.example
│   ├── api-gateway.env.example
│   └── unified-dashboard.env.example
├── docker/                       # Docker configurations
│   ├── Dockerfile.auth-service
│   ├── Dockerfile.user-service
│   ├── Dockerfile.api-gateway
│   ├── Dockerfile.unified-dashboard
│   └── docker-compose.prod.yml
├── k8s/                          # Kubernetes manifests
│   ├── namespace.yaml
│   ├── secrets-config.yaml
│   ├── service-accounts.yaml
│   ├── pdb.yaml
│   ├── auth-service/
│   ├── user-service/             # (existing)
│   ├── api-gateway/
│   ├── unified-dashboard/
│   ├── ingress/
│   └── monitoring/
├── scripts/                      # Utility scripts
│   ├── verify-migrations.sh
│   ├── generate-secrets.sh
│   ├── backup-databases.sh
│   ├── restore-database.sh
│   └── rollback/
├── ci-cd/                        # CI/CD references
├── DATABASE_MIGRATION_GUIDE.md
└── DEPLOYMENT_MANUAL.md          # This file
```

### Contact

- **DevOps**: devops@cinacoin.com
- **On-call**: See PagerDuty rotation
- **Status page**: https://status.cinacoin.com
