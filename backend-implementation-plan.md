# Cinacoin Backend Implementation & Migration Plan

> Version: 1.0.0 | Date: 2026-06-08 | Author: 000 (AI Architect)
> Status: Design Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Implementation Phases](#3-implementation-phases)
4. [Phase 1: Foundation (Weeks 1-4)](#4-phase-1-foundation-weeks-1-4)
5. [Phase 2: Core Services (Weeks 5-12)](#5-phase-2-core-services-weeks-5-12)
6. [Phase 3: Advanced Services (Weeks 13-20)](#6-phase-3-advanced-services-weeks-13-20)
7. [Phase 4: Optimization & Scale (Weeks 21-28)](#7-phase-4-optimization--scale-weeks-21-28)
8. [Phase 5: Production Hardening (Weeks 29-36)](#8-phase-5-production-hardening-weeks-29-36)
9. [Migration Strategies](#9-migration-strategies)
10. [Risk Management](#10-risk-management)
11. [Resource Requirements](#11-resource-requirements)
12. [Success Metrics](#12-success-metrics)
13. [Appendix](#13-appendix)

---

## 1. Executive Summary

This document provides a comprehensive implementation plan for transforming Cinacoin's backend architecture from its current state (Cloudflare Workers + Pages) to a production-grade, scalable microservices platform.

### 1.1 Key Objectives

| Objective | Target | Timeline |
|---|---|---|
| Unified API Gateway | Single entry point for all services | Week 4 |
| Core Services Deployed | Auth, Project, Wallet services in production | Week 12 |
| Payment & Cross-Chain | Production-ready payment processing | Week 20 |
| Full Observability | Metrics, logs, traces for all services | Week 16 |
| Security Compliance | SOC 2 Type I ready | Week 28 |
| Production Scale | 10,000 RPS per service | Week 36 |

### 1.2 Implementation Approach

**Strategy:** Incremental migration using the Strangler Fig pattern

- **Phase 1:** Foundation (infrastructure, CI/CD, gateway)
- **Phase 2:** Core services (auth, project, wallet)
- **Phase 3:** Advanced services (payment, cross-chain, analytics)
- **Phase 4:** Optimization (performance, caching, scaling)
- **Phase 5:** Production hardening (security, compliance, DR)

**Key Principles:**
1. **Zero downtime** — All migrations use blue/green or canary deployments
2. **Backward compatible** — Old endpoints continue working during transition
3. **Feature flags** — New features gated behind flags for gradual rollout
4. **Automated rollback** — Every deployment can be reverted in <5 minutes
5. **Continuous testing** — Every phase includes comprehensive test coverage

---

## 2. Current State Assessment

### 2.1 Existing Infrastructure

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CURRENT ARCHITECTURE                              │
│                                                                      │
│  Frontend (7 apps):                                                 │
│  ├── cinacoin.com (Vercel)                                          │
│  ├── cloud.cinacoin.com (Cloudflare Pages)                         │
│  ├── dash.cinacoin.com (Cloudflare Pages)                          │
│  ├── demo.cinacoin.com (Vercel)                                    │
│  ├── wallet.cinacoin.com (Cloudflare Pages)                        │
│  ├── analytics.cinacoin.com (Cloudflare Pages)                     │
│  └── status.cinacoin.com (Cloudflare Pages)                        │
│                                                                      │
│  Backend Services (5 Workers):                                      │
│  ├── rpc.cinacoin.com (Cloudflare Worker + Go)                     │
│  ├── keys.cinacoin.com (Cloudflare Worker)                         │
│  ├── relay.cinacoin.com (Cloudflare Worker)                        │
│  ├── notify.cinacoin.com (Cloudflare Worker)                       │
│  └── push.cinacoin.com (Cloudflare Worker)                         │
│                                                                      │
│  Data Layer:                                                        │
│  ├── Cloudflare D1 (SQLite at edge)                                │
│  ├── Cloudflare KV (key-value store)                               │
│  └── Cloudflare R2 (object storage)                                │
│                                                                      │
│  Monorepo:                                                          │
│  ├── 92 packages (@cinacoin/*)                                     │
│  ├── 15+ apps                                                       │
│  ├── Turborepo (build orchestration)                               │
│  └── Changesets (versioning)                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Gap Analysis

| Area | Current State | Target State | Gap | Priority |
|---|---|---|---|---|
| **API Gateway** | None (direct Worker access) | Kong / CF Gateway with rate limiting, auth | High | P0 |
| **Database** | D1 (SQLite, limited) | PostgreSQL + Redis + ClickHouse | High | P0 |
| **Auth Service** | JWT in Workers | Full auth service (SIWE, Passkey, Social, MFA) | High | P0 |
| **Project Service** | D1-based | PostgreSQL with full CRUD, usage tracking | High | P0 |
| **Wallet Service** | Static registry | Dynamic registry + address book + ENS | Medium | P1 |
| **Payment Service** | SDK only (client-side) | Server-side swap/onramp/KYC processing | High | P1 |
| **Cross-Chain** | SDK + HTLC (Math.random bug) | Production bridge with CSPRNG, monitoring | High | P1 |
| **Analytics** | Basic D1 aggregation | ClickHouse/TimescaleDB with real-time dashboards | Medium | P1 |
| **Observability** | Basic health endpoints | Prometheus + Grafana + OpenTelemetry | High | P0 |
| **CI/CD** | GitHub Actions (basic) | Full GitOps with ArgoCD, canary deploys | Medium | P1 |
| **Security** | Basic JWT, CORS | WAF, mTLS, Vault, SOC 2 compliance | High | P0 |
| **Kubernetes** | None | EKS/GKE with Istio service mesh | Medium | P2 |

### 2.3 Migration Constraints

| Constraint | Impact | Mitigation |
|---|---|---|
| **Zero downtime** | Cannot take services offline | Blue/green deployments, feature flags |
| **Data migration** | D1 → PostgreSQL without data loss | Dual-write, backfill scripts, validation |
| **Team size** | Small team (<15 engineers) | Phased approach, prioritize P0 items |
| **Budget** | Cloud costs must be controlled | Start with managed services, optimize later |
| **Compliance** | GDPR, future SOC 2 | Build compliance into each phase |
| **Existing users** | API keys must continue working | Versioned APIs, backward compatibility |

---

## 3. Implementation Phases

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION TIMELINE (36 WEEKS)                    │
│                                                                          │
│  Phase 1: Foundation (Weeks 1-4)                                        │
│  ├── Infrastructure setup (K8s, DB, Redis)                             │
│  ├── CI/CD pipeline (GitHub Actions + ArgoCD)                          │
│  ├── API Gateway (Kong)                                                │
│  └── Observability stack (Prometheus + Grafana)                        │
│                                                                          │
│  Phase 2: Core Services (Weeks 5-12)                                    │
│  ├── Auth Service (SIWE, Passkey, Social, JWT)                         │
│  ├── Project Service (CRUD, API keys, usage)                           │
│  ├── Wallet Service (registry, address book)                           │
│  └── Data migration (D1 → PostgreSQL)                                  │
│                                                                          │
│  Phase 3: Advanced Services (Weeks 13-20)                               │
│  ├── Payment Service (swap, onramp, KYC)                               │
│  ├── Cross-Chain Service (bridge, HTLC, messaging)                     │
│  ├── Notification Service (push, email, webhooks)                      │
│  └── Analytics Service (event ingestion, dashboards)                   │
│                                                                          │
│  Phase 4: Optimization (Weeks 21-28)                                    │
│  ├── Performance tuning (caching, query optimization)                  │
│  ├── Horizontal scaling (HPA, cluster autoscaler)                      │
│  ├── Edge optimization (D1/KV replication, CDN)                        │
│  └── Security hardening (Vault, mTLS, WAF rules)                       │
│                                                                          │
│  Phase 5: Production Hardening (Weeks 29-36)                            │
│  ├── Disaster recovery (multi-AZ, backup testing)                      │
│  ├── Chaos engineering (fault injection, resilience testing)           │
│  ├── Compliance audit (SOC 2 Type I preparation)                       │
│  └── Load testing (10K RPS per service)                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Phase 1: Foundation (Weeks 1-4)

### 4.1 Week 1: Infrastructure Setup

**Goals:**
- Provision Kubernetes cluster (EKS/GKE)
- Set up PostgreSQL (RDS) with read replicas
- Deploy Redis cluster (ElastiCache)
- Configure VPC, subnets, security groups

**Tasks:**

```yaml
# infrastructure/terraform/environments/dev/main.tf

# 1. VPC
module "vpc" {
  source = "../../modules/vpc"
  
  name = "cinacoin-dev"
  cidr = "10.0.0.0/16"
  
  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  single_nat_gateway = true  # Cost optimization for dev
}

# 2. EKS Cluster
module "eks" {
  source = "../../modules/eks"
  
  cluster_name    = "cinacoin-dev"
  cluster_version = "1.30"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  
  node_groups = {
    general = {
      instance_types = ["t3.large"]
      min_size       = 2
      max_size       = 10
      desired_size   = 3
    }
  }
}

# 3. RDS PostgreSQL
module "rds" {
  source = "../../modules/rds"
  
  identifier = "cinacoin-dev"
  
  engine         = "postgres"
  engine_version = "16.3"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 500
  
  db_name  = "cinacoin"
  username = "cinacoin_admin"
  
  multi_az            = false  # Dev environment
  storage_encrypted   = true
  deletion_protection = false
  
  subnet_ids   = module.vpc.private_subnets
  vpc_security_group_ids = [module.vpc.database_sg_id]
}

# 4. ElastiCache Redis
module "redis" {
  source = "../../modules/elasticache"
  
  cluster_id = "cinacoin-dev"
  
  node_type  = "cache.t3.medium"
  num_cache_clusters = 2
  
  engine_version = "7.1"
  port           = 6379
  
  subnet_group_name   = module.vpc.cache_subnet_group
  security_group_ids  = [module.vpc.cache_sg_id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}
```

**Deliverables:**
- [ ] EKS cluster running (3 nodes)
- [ ] PostgreSQL accessible from EKS
- [ ] Redis cluster accessible from EKS
- [ ] VPC with proper network isolation
- [ ] kubectl configured for cluster access

**Validation:**
```bash
# Verify cluster
kubectl cluster-info
kubectl get nodes

# Verify database
kubectl run psql-test --image=postgres:16-alpine --rm -it -- \
  psql -h $RDS_ENDPOINT -U cinacoin_admin -d cinacoin

# Verify Redis
kubectl run redis-test --image=redis:7-alpine --rm -it -- \
  redis-cli -h $REDIS_ENDPOINT ping
```

---

### 4.2 Week 2: CI/CD Pipeline

**Goals:**
- Set up GitHub Actions workflows (CI)
- Deploy ArgoCD to Kubernetes (CD)
- Configure container registry (GHCR)
- Implement GitOps workflow

**Tasks:**

```yaml
# .github/workflows/ci.yml (enhanced from devops-pipeline-design.md)
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
      
      - name: Type check
        run: pnpm typecheck
      
      - name: Unit tests
        run: pnpm test -- --coverage
      
      - name: Security scan
        run: |
          pnpm audit --audit-level=high
          pnpm exec semgrep --config=auto --error
      
      - name: Build
        run: pnpm turbo run build --filter='...[HEAD^1]'
      
      - name: Build and push Docker images
        if: github.ref == 'refs/heads/main'
        run: |
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          for svc in auth project wallet; do
            docker build -t ghcr.io/cinagroup/${svc}:${{ github.sha }} apps/${svc}-service/
            docker push ghcr.io/cinagroup/${svc}:${{ github.sha }}
          done
      
      - name: Update manifests (GitOps)
        if: github.ref == 'refs/heads/main'
        run: |
          # Update image tags in k8s/manifests
          for svc in auth project wallet; do
            sed -i "s|ghcr.io/cinagroup/${svc}:.*|ghcr.io/cinagroup/${svc}:${{ github.sha }}|g" \
              k8s/overlays/dev/${svc}-deployment.yaml
          done
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add k8s/overlays/dev/
          git commit -m "chore: update dev images to ${{ github.sha }}" || exit 0
          git push
```

```yaml
# k8s/argocd/install.yaml
# ArgoCD installation manifest
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: argocd
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/cinagroup/cinacoin.git
    targetRevision: main
    path: k8s/argocd/base
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Deliverables:**
- [ ] CI pipeline passing (lint, test, build, scan)
- [ ] Docker images pushed to GHCR
- [ ] ArgoCD deployed and accessible
- [ ] GitOps workflow functional (manifest changes auto-sync)

**Validation:**
```bash
# Trigger CI
git commit --allow-empty -m "test: trigger CI"
git push

# Verify ArgoCD
kubectl -n argocd get applications
argocd app list
```

---

### 4.3 Week 3: API Gateway

**Goals:**
- Deploy Kong API Gateway
- Configure routing rules
- Implement rate limiting
- Set up authentication plugins

**Tasks:**

```yaml
# k8s/base/gateway/kong-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kong-gateway
  namespace: cinacoin-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kong-gateway
  template:
    metadata:
      labels:
        app: kong-gateway
    spec:
      containers:
        - name: kong
          image: kong:3.7
          env:
            - name: KONG_DATABASE
              value: "postgres"
            - name: KONG_PG_HOST
              valueFrom:
                secretKeyRef:
                  name: kong-db-credentials
                  key: host
            - name: KONG_PG_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: kong-db-credentials
                  key: password
          ports:
            - containerPort: 8000  # Proxy
            - containerPort: 8443  # Proxy SSL
            - containerPort: 8001  # Admin API
```

```yaml
# Kong configuration (KongIngress resources)
apiVersion: configuration.konghq.com/v1
kind: KongIngress
metadata:
  name: auth-service-route
  namespace: cinacoin
route:
  paths:
    - /api/v1/auth
  methods:
    - GET
    - POST
  strip_path: false
  plugins:
    - name: rate-limiting
      config:
        minute: 30
        policy: redis
        redis_host: redis.cinacoin.svc.cluster.local
    - name: jwt
      config:
        claims_to_verify:
          - exp
---
apiVersion: configuration.konghq.com/v1
kind: KongIngress
metadata:
  name: project-service-route
  namespace: cinacoin
route:
  paths:
    - /api/v1/projects
  strip_path: false
  plugins:
    - name: rate-limiting
      config:
        minute: 600  # Per-tier, configured dynamically
        policy: redis
        redis_host: redis.cinacoin.svc.cluster.local
    - name: key-auth
      config:
        key_names:
          - x-api-key
          - apikey
```

**Deliverables:**
- [ ] Kong deployed (3 replicas)
- [ ] Routes configured for all services
- [ ] Rate limiting functional
- [ ] Authentication plugins active

**Validation:**
```bash
# Test gateway
curl -H "Host: api.cinacoin.com" https://gateway.cinacoin.dev/api/v1/auth/health

# Test rate limiting
for i in {1..35}; do
  curl -H "Host: api.cinacoin.com" https://gateway.cinacoin.dev/api/v1/auth/health
done
# Should return 429 after 30 requests
```

---

### 4.4 Week 4: Observability Stack

**Goals:**
- Deploy Prometheus (metrics collection)
- Deploy Grafana (dashboards)
- Deploy Loki (log aggregation)
- Deploy Tempo (distributed tracing)
- Configure OpenTelemetry in services

**Tasks:**

```yaml
# k8s/base/monitoring/prometheus-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: cinacoin-monitoring
spec:
  replicas: 2
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus:v2.53.0
          args:
            - "--config.file=/etc/prometheus/prometheus.yml"
            - "--storage.tsdb.path=/prometheus"
            - "--storage.tsdb.retention.time=15d"
          ports:
            - containerPort: 9090
          volumeMounts:
            - name: config
              mountPath: /etc/prometheus
            - name: storage
              mountPath: /prometheus
      volumes:
        - name: config
          configMap:
            name: prometheus-config
        - name: storage
          persistentVolumeClaim:
            claimName: prometheus-storage
```

```yaml
# k8s/base/monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: cinacoin-monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
      
      - job_name: 'kong'
        static_configs:
          - targets: ['kong-gateway.cinacoin-gateway.svc:8001']
      
      - job_name: 'postgresql'
        static_configs:
          - targets: ['postgres-exporter.cinacoin-monitoring.svc:9187']
      
      - job_name: 'redis'
        static_configs:
          - targets: ['redis-exporter.cinacoin-monitoring.svc:9121']
```

```yaml
# k8s/base/monitoring/grafana-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: cinacoin-monitoring
spec:
  replicas: 2
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:11.0.0
          ports:
            - containerPort: 3000
          env:
            - name: GF_SECURITY_ADMIN_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: grafana-credentials
                  key: admin-password
          volumeMounts:
            - name: dashboards
              mountPath: /var/lib/grafana/dashboards
      volumes:
        - name: dashboards
          configMap:
            name: grafana-dashboards
```

**Deliverables:**
- [ ] Prometheus scraping metrics from all services
- [ ] Grafana dashboards created (overview, API, services)
- [ ] Loki collecting logs from all pods
- [ ] Tempo receiving traces from OpenTelemetry
- [ ] AlertManager configured with PagerDuty integration

**Validation:**
```bash
# Verify Prometheus targets
kubectl port-forward -n cinacoin-monitoring svc/prometheus 9090:9090
# Open http://localhost:9090/targets — all targets should be UP

# Verify Grafana
kubectl port-forward -n cinacoin-monitoring svc/grafana 3000:3000
# Open http://localhost:3000 — dashboards should show data

# Verify logs
kubectl logs -n cinacoin-monitoring deployment/loki
# Should show log ingestion activity
```

---

## 5. Phase 2: Core Services (Weeks 5-12)

### 5.1 Week 5-6: Auth Service

**Goals:**
- Implement Auth Service (Node.js + TypeScript)
- Support SIWE/SIWX, Passkey, Social Login, Phone OTP
- JWT issuance and validation
- Session management with Redis

**Implementation:**

```typescript
// apps/auth-service/src/index.ts
import express from 'express';
import { SiweStrategy } from './strategies/siwe';
import { PasskeyStrategy } from './strategies/passkey';
import { SocialStrategy } from './strategies/social';
import { OtpStrategy } from './strategies/otp';
import { JwtService } from './services/jwt';
import { SessionService } from './services/session';
import { RateLimiter } from './middleware/rate-limiter';
import { validateInput } from './middleware/validation';
import { CreateSessionSchema } from './schemas/auth';

const app = express();
app.use(express.json());

// Rate limiting
app.use('/auth', RateLimiter({ windowMs: 60_000, max: 30 }));

// Authentication endpoints
app.post('/auth/siwe/verify', validateInput(CreateSessionSchema), async (req, res) => {
  try {
    const { message, signature } = req.body;
    const strategy = new SiweStrategy();
    const result = await strategy.verify(message, signature);
    
    if (!result.success) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const jwtService = new JwtService();
    const tokens = await jwtService.generateTokens({
      user_id: result.userId,
      method: 'siwe',
      chain: result.chain,
    });
    
    const sessionService = new SessionService();
    await sessionService.createSession(result.userId, req.ip, req.useragent);
    
    res.json(tokens);
  } catch (error) {
    console.error('SIWE verification failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/passkey/register', async (req, res) => {
  // WebAuthn registration flow
});

app.post('/auth/passkey/authenticate', async (req, res) => {
  // WebAuthn authentication flow
});

app.post('/auth/social/:provider/callback', async (req, res) => {
  // OAuth 2.0 callback (Google, Apple, GitHub, etc.)
});

app.post('/auth/otp/send', async (req, res) => {
  // Send OTP via SMS/WhatsApp
});

app.post('/auth/otp/verify', async (req, res) => {
  // Verify OTP and issue JWT
});

app.post('/auth/token/refresh', async (req, res) => {
  // Refresh access token using refresh token
});

app.post('/auth/token/revoke', async (req, res) => {
  // Revoke refresh token (logout)
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// Metrics endpoint (Prometheus)
app.get('/metrics', async (req, res) => {
  const metrics = await collectMetrics();
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Auth service listening on port ${PORT}`);
});
```

```typescript
// apps/auth-service/src/services/jwt.ts
import jwt from 'jsonwebtoken';
import { redis } from '../lib/redis';

export class JwtService {
  private privateKey: string;
  private publicKey: string;
  
  constructor() {
    this.privateKey = process.env.JWT_PRIVATE_KEY!;
    this.publicKey = process.env.JWT_PUBLIC_KEY!;
  }
  
  async generateTokens(payload: JwtPayload): Promise<TokenResponse> {
    const accessToken = jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: '15m',
      issuer: 'https://auth.cinacoin.com',
      audience: 'https://api.cinacoin.com',
      jwtid: crypto.randomUUID(),
    });
    
    const refreshToken = jwt.sign(
      { sub: payload.user_id },
      this.privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '7d',
        issuer: 'https://auth.cinacoin.com',
        audience: 'https://auth.cinacoin.com/token',
        jwtid: crypto.randomUUID(),
      }
    );
    
    // Store refresh token in Redis (for revocation)
    await redis.setex(
      `refresh_token:${refreshToken}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify(payload)
    );
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes
      token_type: 'Bearer',
    };
  }
  
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }
      
      return jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://auth.cinacoin.com',
        audience: 'https://api.cinacoin.com',
      }) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }
  
  async revokeToken(token: string): Promise<void> {
    // Add to blacklist with TTL = token expiry
    const decoded = jwt.decode(token) as any;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    
    if (ttl > 0) {
      await redis.setex(`blacklist:${token}`, ttl, 'revoked');
    }
    
    // Remove refresh token from Redis
    await redis.del(`refresh_token:${token}`);
  }
}
```

**Database Schema:**

```sql
-- migrations/001_create_auth_tables.sql

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  wallet_address VARCHAR(42) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
);

CREATE TABLE user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_type VARCHAR(20) NOT NULL, -- 'passkey', 'social', 'otp'
  credential_id VARCHAR(255) NOT NULL,
  credential_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(credential_type, credential_id)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_info JSONB NOT NULL,
  ip_address INET NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mfa_verified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash
  key_prefix VARCHAR(12) NOT NULL, -- First 12 chars (ck_live_a1b2)
  scopes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
```

**Deliverables:**
- [ ] Auth Service deployed (3 replicas)
- [ ] SIWE/SIWX authentication working
- [ ] Passkey registration/authentication working
- [ ] Social login (Google, GitHub) working
- [ ] JWT issuance and validation working
- [ ] Session management with Redis working
- [ ] Rate limiting applied
- [ ] Metrics exposed to Prometheus

**Validation:**
```bash
# Test SIWE authentication
curl -X POST https://api.cinacoin.dev/api/v1/auth/siwe/verify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "...',
    "signature": "0x..."
  }'

# Verify JWT
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://api.cinacoin.dev/api/v1/auth/session
```

---

### 5.2 Week 7-8: Project Service

**Goals:**
- Implement Project Service (CRUD, API keys, usage tracking)
- Migrate existing D1 data to PostgreSQL
- Implement usage metering with Redis HyperLogLog

**Implementation:**

```typescript
// apps/project-service/src/index.ts
import express from 'express';
import { ProjectController } from './controllers/project';
import { ApiKeyController } from './controllers/api-key';
import { UsageController } from './controllers/usage';
import { authenticate } from './middleware/auth';
import { authorize } from './middleware/authorization';
import { validateInput } from './middleware/validation';
import { CreateProjectSchema, UpdateProjectSchema } from './schemas/project';

const app = express();
app.use(express.json());

const projectController = new ProjectController();
const apiKeyController = new ApiKeyController();
const usageController = new UsageController();

// Project endpoints
app.post('/projects', authenticate, validateInput(CreateProjectSchema), projectController.create);
app.get('/projects', authenticate, projectController.list);
app.get('/projects/:id', authenticate, authorize('projects:read'), projectController.get);
app.put('/projects/:id', authenticate, authorize('projects:update'), validateInput(UpdateProjectSchema), projectController.update);
app.delete('/projects/:id', authenticate, authorize('projects:delete'), projectController.delete);

// API Key endpoints
app.post('/projects/:id/api-keys', authenticate, authorize('api-keys:create'), apiKeyController.create);
app.get('/projects/:id/api-keys', authenticate, authorize('api-keys:read'), apiKeyController.list);
app.delete('/projects/:id/api-keys/:keyId', authenticate, authorize('api-keys:revoke'), apiKeyController.revoke);

// Usage endpoints
app.get('/projects/:id/usage', authenticate, authorize('analytics:read'), usageController.getUsage);
app.get('/projects/:id/usage/summary', authenticate, authorize('analytics:read'), usageController.getSummary);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Project service listening on port ${PORT}`);
});
```

```typescript
// apps/project-service/src/services/usage.ts
import { redis } from '../lib/redis';
import { db } from '../lib/database';

export class UsageService {
  async trackRequest(projectId: string, endpoint: string): Promise<void> {
    const key = `usage:${projectId}:${this.getDateKey()}`;
    
    // Increment request counter
    await redis.incr(key);
    await redis.expire(key, 86400 * 30); // 30 days TTL
    
    // Track unique API keys (HyperLogLog)
    const hllKey = `usage:${projectId}:unique_keys:${this.getDateKey()}`;
    // API key would be passed from middleware
    // await redis.pfadd(hllKey, apiKeyId);
    
    // Track endpoint distribution
    const endpointKey = `usage:${projectId}:endpoints:${endpoint}:${this.getDateKey()}`;
    await redis.incr(endpointKey);
    await redis.expire(endpointKey, 86400 * 30);
  }
  
  async getUsage(projectId: string, startDate: Date, endDate: Date): Promise<UsageData> {
    const keys = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      keys.push(`usage:${projectId}:${this.formatDate(current)}`);
      current.setDate(current.getDate() + 1);
    }
    
    const counts = await redis.mget(keys);
    
    return {
      project_id: projectId,
      start_date: startDate,
      end_date: endDate,
      total_requests: counts.reduce((sum, count) => sum + (parseInt(count || '0')), 0),
      daily_breakdown: keys.map((key, i) => ({
        date: key.split(':').pop()!,
        requests: parseInt(counts[i] || '0'),
      })),
    };
  }
  
  async getUniqueApiKeys(projectId: string, date: Date): Promise<number> {
    const key = `usage:${projectId}:unique_keys:${this.formatDate(date)}`;
    return await redis.pfcount(key);
  }
  
  private getDateKey(): string {
    return this.formatDate(new Date());
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
```

**Data Migration Script:**

```typescript
// scripts/migrate-d1-to-postgres.ts
import { D1Database } from '@cloudflare/workers-types';
import { Pool } from 'pg';

async function migrateProjects(d1: D1Database, pg: Pool) {
  console.log('Starting project migration...');
  
  // Read from D1
  const { results: d1Projects } = await d1.prepare('SELECT * FROM projects').all();
  
  console.log(`Found ${d1Projects.length} projects to migrate`);
  
  for (const project of d1Projects) {
    // Check if already exists in PostgreSQL
    const existing = await pg.query('SELECT id FROM projects WHERE id = $1', [project.id]);
    
    if (existing.rows.length > 0) {
      console.log(`Project ${project.id} already exists, skipping`);
      continue;
    }
    
    // Insert into PostgreSQL
    await pg.query(
      `INSERT INTO projects (id, user_id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [project.id, project.user_id, project.name, project.description, project.created_at, project.updated_at]
    );
    
    console.log(`Migrated project ${project.id}`);
  }
  
  console.log('Project migration complete');
}

async function migrateApiKeys(d1: D1Database, pg: Pool) {
  console.log('Starting API key migration...');
  
  const { results: d1Keys } = await d1.prepare('SELECT * FROM api_keys').all();
  
  console.log(`Found ${d1Keys.length} API keys to migrate`);
  
  for (const key of d1Keys) {
    const existing = await pg.query('SELECT id FROM api_keys WHERE id = $1', [key.id]);
    
    if (existing.rows.length > 0) {
      console.log(`API key ${key.id} already exists, skipping`);
      continue;
    }
    
    await pg.query(
      `INSERT INTO api_keys (id, project_id, name, key_hash, key_prefix, scopes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [key.id, key.project_id, key.name, key.key_hash, key.key_prefix, key.scopes, key.created_at]
    );
    
    console.log(`Migrated API key ${key.id}`);
  }
  
  console.log('API key migration complete');
}

// Run migration
const d1 = getD1Client();
const pg = new Pool({ connectionString: process.env.DATABASE_URL });

await migrateProjects(d1, pg);
await migrateApiKeys(d1, pg);

await pg.end();
```

**Deliverables:**
- [ ] Project Service deployed (3 replicas)
- [ ] CRUD operations working
- [ ] API key generation and validation working
- [ ] Usage tracking with Redis HyperLogLog working
- [ ] D1 data migrated to PostgreSQL
- [ ] Data validation (row counts match)

**Validation:**
```bash
# Create project
curl -X POST https://api.cinacoin.dev/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project", "chains": ["ethereum"]}'

# Generate API key
curl -X POST https://api.cinacoin.dev/api/v1/projects/$PROJECT_ID/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Key", "scopes": ["read:wallets"]}'

# Check usage
curl https://api.cinacoin.dev/api/v1/projects/$PROJECT_ID/usage \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5.3 Week 9-10: Wallet Service

**Goals:**
- Implement Wallet Service (registry, address book, ENS resolution)
- Migrate wallet registry from static JSON to PostgreSQL
- Implement caching with Redis

**Implementation:**

```typescript
// apps/wallet-service/src/index.ts
import express from 'express';
import { WalletController } from './controllers/wallet';
import { AddressBookController } from './controllers/address-book';
import { EnsController } from './controllers/ens';
import { authenticate } from './middleware/auth';
import { cache } from './middleware/cache';

const app = express();
app.use(express.json());

const walletController = new WalletController();
const addressBookController = new AddressBookController();
const ensController = new EnsController();

// Wallet registry endpoints (public, cached)
app.get('/wallets', cache({ ttl: 300 }), walletController.list);
app.get('/wallets/:id', cache({ ttl: 300 }), walletController.get);
app.get('/wallets/recommended', walletController.getRecommended);

// Address book endpoints (authenticated)
app.get('/address-book', authenticate, addressBookController.list);
app.post('/address-book', authenticate, addressBookController.add);
app.delete('/address-book/:id', authenticate, addressBookController.remove);

// ENS resolution (cached)
app.get('/ens/resolve/:name', cache({ ttl: 3600 }), ensController.resolve);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Wallet service listening on port ${PORT}`);
});
```

```typescript
// apps/wallet-service/src/services/wallet-registry.ts
import { db } from '../lib/database';
import { redis } from '../lib/redis';

export class WalletRegistryService {
  async listWallets(filters: WalletFilters): Promise<Wallet[]> {
    const cacheKey = `wallets:${JSON.stringify(filters)}`;
    
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Query database
    let query = 'SELECT * FROM wallets WHERE 1=1';
    const params: any[] = [];
    
    if (filters.chain) {
      query += ' AND chains @> $1';
      params.push([filters.chain]);
    }
    
    if (filters.type) {
      query += ' AND wallet_type = $' + (params.length + 1);
      params.push(filters.type);
    }
    
    query += ' ORDER BY name LIMIT 100';
    
    const result = await db.query(query, params);
    const wallets = result.rows;
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(wallets));
    
    return wallets;
  }
  
  async getWallet(id: string): Promise<Wallet | null> {
    const cacheKey = `wallet:${id}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const result = await db.query('SELECT * FROM wallets WHERE id = $1', [id]);
    const wallet = result.rows[0];
    
    if (wallet) {
      await redis.setex(cacheKey, 300, JSON.stringify(wallet));
    }
    
    return wallet || null;
  }
  
  async getRecommendedWallets(userId: string, chains: string[]): Promise<Wallet[]> {
    // Simple recommendation: most popular wallets for selected chains
    const result = await db.query(
      `SELECT w.*, COUNT(DISTINCT u.id) as user_count
       FROM wallets w
       LEFT JOIN user_wallets u ON w.id = u.wallet_id
       WHERE w.chains @> $1
       GROUP BY w.id
       ORDER BY user_count DESC
       LIMIT 10`,
      [chains]
    );
    
    return result.rows;
  }
}
```

**Deliverables:**
- [ ] Wallet Service deployed (3 replicas)
- [ ] Wallet registry API working (list, get, filter)
- [ ] Address book CRUD working
- [ ] ENS resolution working
- [ ] Redis caching functional
- [ ] Wallet registry data migrated from JSON to PostgreSQL

---

### 5.4 Week 11-12: Integration & Testing

**Goals:**
- Integrate all core services with API Gateway
- End-to-end testing of authentication flows
- Load testing (1,000 RPS per service)
- Documentation (API reference, guides)

**Tasks:**

```typescript
// tests/e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('User can authenticate with SIWE', async ({ request }) => {
    // 1. Generate SIWE message
    const messageResponse = await request.post('https://api.cinacoin.dev/api/v1/auth/siwe/message', {
      data: {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        chain_id: 1,
        domain: 'cloud.cinacoin.com',
      },
    });
    
    expect(messageResponse.ok()).toBeTruthy();
    const { message } = await messageResponse.json();
    
    // 2. Sign message (simulated)
    const signature = '0x...'; // Would use actual wallet in real test
    
    // 3. Verify and get tokens
    const verifyResponse = await request.post('https://api.cinacoin.dev/api/v1/auth/siwe/verify', {
      data: { message, signature },
    });
    
    expect(verifyResponse.ok()).toBeTruthy();
    const { access_token, refresh_token } = await verifyResponse.json();
    
    expect(access_token).toBeTruthy();
    expect(refresh_token).toBeTruthy();
    
    // 4. Use access token
    const sessionResponse = await request.get('https://api.cinacoin.dev/api/v1/auth/session', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    
    expect(sessionResponse.ok()).toBeTruthy();
    const session = await sessionResponse.json();
    expect(session.user_id).toBeTruthy();
  });
  
  test('User can create project and generate API key', async ({ request }) => {
    // Authenticate first
    const tokens = await authenticate(request);
    
    // Create project
    const projectResponse = await request.post('https://api.cinacoin.dev/api/v1/projects', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      data: {
        name: 'Test Project',
        description: 'A test project',
        chains: ['ethereum', 'polygon'],
      },
    });
    
    expect(projectResponse.ok()).toBeTruthy();
    const project = await projectResponse.json();
    expect(project.name).toBe('Test Project');
    
    // Generate API key
    const keyResponse = await request.post(
      `https://api.cinacoin.dev/api/v1/projects/${project.id}/api-keys`,
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        data: {
          name: 'Test API Key',
          scopes: ['read:wallets', 'read:projects'],
        },
      }
    );
    
    expect(keyResponse.ok()).toBeTruthy();
    const apiKey = await keyResponse.json();
    expect(apiKey.key).toMatch(/^ck_live_/);
    expect(apiKey.scopes).toContain('read:wallets');
  });
});
```

**Load Testing:**

```javascript
// tests/performance/core-services-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Test auth service
  const authResponse = http.post('https://api.cinacoin.dev/api/v1/auth/siwe/verify', JSON.stringify({
    message: '...',
    signature: '0x...',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(authResponse, {
    'auth status is 200': (r) => r.status === 200,
    'auth latency < 500ms': (r) => r.timings.duration < 500,
  });
  
  // Test project service
  const projectResponse = http.get('https://api.cinacoin.dev/api/v1/projects', {
    headers: { Authorization: `Bearer ${authResponse.json().access_token}` },
  });
  
  check(projectResponse, {
    'project status is 200': (r) => r.status === 200,
    'project latency < 500ms': (r) => r.timings.duration < 500,
  });
  
  // Test wallet service
  const walletResponse = http.get('https://api.cinacoin.dev/api/v1/wallets');
  
  check(walletResponse, {
    'wallet status is 200': (r) => r.status === 200,
    'wallet latency < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

**Deliverables:**
- [ ] All core services integrated with API Gateway
- [ ] E2E tests passing (authentication, project creation, API key generation)
- [ ] Load test results: 1,000 RPS per service with <500ms p95 latency
- [ ] API documentation published (docs.cinacoin.com)
- [ ] Phase 2 complete ✅

---

## 6. Phase 3: Advanced Services (Weeks 13-20)

### 6.1 Week 13-15: Payment Service

**Goals:**
- Implement Payment Service (swap, onramp, KYC, travel rule)
- Integrate with swap providers (Uniswap, 1inch, Jupiter)
- Integrate with onramp providers (MoonPay, Ramp, Transak)
- Implement KYC document verification
- Implement Travel Rule compliance

**Key Components:**

```typescript
// apps/payment-service/src/services/swap.ts
export class SwapService {
  async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    const { sourceChain, destChain, sourceToken, destToken, amount } = params;
    
    // Query multiple providers for best rate
    const quotes = await Promise.all([
      this.getUniswapQuote(params),
      this.get1inchQuote(params),
      this.getJupiterQuote(params),
    ]);
    
    // Return best quote
    return quotes
      .filter(q => q !== null)
      .sort((a, b) => parseFloat(b.destAmount) - parseFloat(a.destAmount))[0];
  }
  
  async executeSwap(quote: SwapQuote, userAddress: string): Promise<SwapResult> {
    // 1. Validate quote (not expired, slippage acceptable)
    if (this.isQuoteExpired(quote)) {
      throw new Error('Quote expired');
    }
    
    // 2. Build transaction
    const tx = await this.buildSwapTransaction(quote, userAddress);
    
    // 3. Submit to blockchain
    const txHash = await this.submitTransaction(tx);
    
    // 4. Monitor transaction
    const receipt = await this.waitForConfirmation(txHash);
    
    // 5. Record in database
    await this.recordSwap(quote, txHash, receipt);
    
    return { txHash, receipt };
  }
}
```

**Deliverables:**
- [ ] Payment Service deployed
- [ ] Swap aggregation working (3+ providers)
- [ ] Onramp aggregation working (3+ providers)
- [ ] KYC document verification working
- [ ] Travel Rule compliance implemented
- [ ] Payment state machine (pending → processing → completed/failed)

---

### 6.2 Week 16-17: Cross-Chain Service

**Goals:**
- Implement Cross-Chain Service (bridge, HTLC, messaging)
- **CRITICAL:** Fix Math.random() vulnerability (replace with CSPRNG)
- Implement swap lifecycle management
- Implement cross-chain messaging

**Critical Fix:**

```typescript
// packages/cross-chain-sync/src/AtomicSwap.ts (FIXED)
import { webcrypto } from 'crypto';

export class AtomicSwap {
  async generateSecret(): Promise<Buffer> {
    // FIXED: Use cryptographically secure random number generator
    const bytes = new Uint8Array(32);
    webcrypto.getRandomValues(bytes);
    return Buffer.from(bytes);
    
    // OLD (VULNERABLE):
    // for (let i = 0; i < 32; i++) bytes.push(Math.floor(Math.random() * 256));
  }
}
```

**Deliverables:**
- [ ] Cross-Chain Service deployed
- [ ] HTLC atomic swaps working (with CSPRNG fix)
- [ ] Bridge router working (optimal path finding)
- [ ] Swap lifecycle management working
- [ ] Cross-chain messaging working
- [ ] Security audit of cryptographic code

---

### 6.3 Week 18-19: Notification Service

**Goals:**
- Implement Notification Service (push, email, webhooks)
- Integrate FCM (Firebase Cloud Messaging) and APNs (Apple Push Notification service)
- Implement webhook delivery with retry logic
- Implement notification preferences

**Deliverables:**
- [ ] Notification Service deployed
- [ ] Push notifications working (FCM + APNs)
- [ ] Email notifications working
- [ ] Webhook delivery working (with retry)
- [ ] Notification preferences working

---

### 6.4 Week 20: Analytics Service

**Goals:**
- Implement Analytics Service (event ingestion, aggregation, dashboards)
- Deploy ClickHouse or TimescaleDB for time-series data
- Implement real-time aggregation with Redis Streams
- Build dashboard KPIs

**Deliverables:**
- [ ] Analytics Service deployed
- [ ] Event ingestion working (high-throughput)
- [ ] Real-time aggregation working
- [ ] Dashboard KPIs functional
- [ ] Phase 3 complete ✅

---

## 7. Phase 4: Optimization & Scale (Weeks 21-28)

### 7.1 Week 21-22: Performance Tuning

**Goals:**
- Optimize database queries (indexing, query plans)
- Implement connection pooling (PgBouncer)
- Optimize Redis usage (pipelining, compression)
- Implement multi-level caching (L1 in-process, L2 Redis, L3 D1/KV)

**Tasks:**

```sql
-- Add indexes for hot queries
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_swaps_status_created ON swaps(status, created_at DESC);
CREATE INDEX idx_api_keys_project ON api_keys(project_id) WHERE revoked_at IS NULL;

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM transactions WHERE user_id = '...' AND created_at > NOW() - INTERVAL '7 days';
```

**Deliverables:**
- [ ] Database query p95 < 20ms
- [ ] Connection pooling configured (PgBouncer)
- [ ] Cache hit rate > 95%
- [ ] API p95 latency < 100ms

---

### 7.2 Week 23-24: Horizontal Scaling

**Goals:**
- Configure Horizontal Pod Autoscaler (HPA) for all services
- Implement cluster autoscaler
- Load test to 10,000 RPS per service
- Optimize resource requests/limits

**Deliverables:**
- [ ] HPA configured for all services
- [ ] Cluster autoscaler functional
- [ ] Load test: 10,000 RPS per service with <500ms p99 latency
- [ ] Resource optimization (CPU/memory requests tuned)

---

### 7.3 Week 25-26: Edge Optimization

**Goals:**
- Replicate read-only data to Cloudflare D1/KV
- Implement edge caching for wallet registry, project configs
- Optimize CDN cache hit rate
- Implement cache invalidation webhooks

**Deliverables:**
- [ ] D1/KV replication working (PostgreSQL → D1)
- [ ] Edge caching functional (wallet registry, project configs)
- [ ] CDN cache hit rate > 90%
- [ ] Cache invalidation working (webhook-triggered)

---

### 7.4 Week 27-28: Security Hardening

**Goals:**
- Deploy HashiCorp Vault for secret management
- Enable mTLS for all service-to-service communication (Istio)
- Configure WAF rules (OWASP Top 10)
- Conduct security audit (internal red team)

**Deliverables:**
- [ ] Vault deployed and integrated
- [ ] mTLS enabled for all services
- [ ] WAF rules configured and tested
- [ ] Security audit complete (all CRITICAL/HIGH issues resolved)
- [ ] Phase 4 complete ✅

---

## 8. Phase 5: Production Hardening (Weeks 29-36)

### 8.1 Week 29-30: Disaster Recovery

**Goals:**
- Implement multi-AZ deployment (all services)
- Configure automated backups (PostgreSQL, Redis, R2)
- Test disaster recovery (failover to secondary AZ)
- Document RTO/RPO (Recovery Time Objective / Recovery Point Objective)

**Deliverables:**
- [ ] Multi-AZ deployment functional
- [ ] Automated backups configured (daily snapshots, continuous WAL archiving)
- [ ] DR test successful (failover completed in < 4 hours)
- [ ] RTO < 4 hours, RPO < 1 hour

---

### 8.2 Week 31-32: Chaos Engineering

**Goals:**
- Deploy chaos engineering tools (Litmus / Chaos Mesh)
- Conduct fault injection tests (pod failures, network partitions, database outages)
- Verify auto-recovery mechanisms
- Update runbooks based on findings

**Deliverables:**
- [ ] Chaos engineering tools deployed
- [ ] 10+ chaos experiments conducted
- [ ] All critical failure scenarios tested
- [ ] Auto-recovery verified
- [ ] Runbooks updated

---

### 8.3 Week 33-34: Compliance Audit

**Goals:**
- Prepare for SOC 2 Type I audit
- Document all security controls
- Conduct internal audit (gap analysis)
- Remediate findings

**Deliverables:**
- [ ] SOC 2 Type I audit complete
- [ ] All security controls documented
- [ ] Internal audit findings remediated
- [ ] Compliance dashboard created

---

### 8.4 Week 35-36: Final Load Testing & Go-Live

**Goals:**
- Conduct final load test (10,000 RPS per service, sustained 1 hour)
- Verify all SLOs met
- Conduct go/no-go review
- Production launch

**Deliverables:**
- [ ] Final load test passed (10K RPS, <500ms p99, <0.1% error rate)
- [ ] All SLOs met (availability, latency, throughput)
- [ ] Go/no-go review complete
- [ ] Production launch ✅
- [ ] Phase 5 complete ✅

---

## 9. Migration Strategies

### 9.1 Database Migration (D1 → PostgreSQL)

**Strategy:** Dual-write with backfill

```
Phase 1: Dual-write
├── New writes go to both D1 and PostgreSQL
├── Reads still from D1 (source of truth)
└── Monitor for inconsistencies

Phase 2: Backfill
├── Backfill historical data from D1 to PostgreSQL
├── Validate row counts and checksums
└── Fix any discrepancies

Phase 3: Switch reads
├── Switch reads to PostgreSQL
├── Keep D1 as fallback (read-only)
└── Monitor for issues

Phase 4: Decommission D1
├── Stop dual-write
├── Archive D1 data
└── Remove D1 code
```

### 9.2 API Migration (Workers → Services)

**Strategy:** API Gateway routing with gradual traffic shift

```
Phase 1: Shadow traffic
├── API Gateway receives all traffic
├── 100% to old Workers
├── 100% mirrored to new services (shadow mode)
└── Compare responses (no user impact)

Phase 2: Canary (5% traffic)
├── 95% to old Workers
├── 5% to new services
├── Monitor error rate, latency
└── Auto-rollback if error rate > 1%

Phase 3: Gradual shift
├── Week 1: 5% → 25%
├── Week 2: 25% → 50%
├── Week 3: 50% → 75%
└── Week 4: 75% → 100%

Phase 4: Decommission Workers
├── Old Workers receive 0% traffic
├── Keep running for 1 week (rollback option)
└── Decommission after 1 week
```

### 9.3 Feature Flag Strategy

**Implementation:** LaunchDarkly / Unleash / custom

```typescript
// Feature flag usage
import { featureFlags } from '@cinacoin/feature-flags';

async function handlePayment(req, res) {
  // New payment service behind feature flag
  if (await featureFlags.isEnabled('new-payment-service', req.user.id)) {
    return newPaymentService.handle(req, res);
  } else {
    return oldPaymentWorker.handle(req, res);
  }
}
```

---

## 10. Risk Management

### 10.1 Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| **Data loss during migration** | Low | Critical | Dual-write, backfill validation, backups | DevOps Lead |
| **Downtime during cutover** | Medium | High | Blue/green deployment, canary releases | DevOps Lead |
| **Performance regression** | Medium | High | Load testing at each phase, rollback plan | Engineering Lead |
| **Security vulnerability** | Medium | Critical | Security audit, penetration testing, bug bounty | Security Lead |
| **Team burnout** | High | Medium | Realistic timeline, buffer weeks, hiring plan | CTO |
| **Budget overrun** | Medium | Medium | Cost monitoring, reserved instances, spot instances | DevOps Lead |
| **Compliance failure** | Low | High | Early engagement with auditors, compliance tooling | Compliance Lead |
| **Third-party API failure** | Medium | Medium | Circuit breakers, fallback providers, caching | Engineering Lead |

### 10.2 Mitigation Strategies

**Data Loss Prevention:**
- Automated backups before every migration
- Dual-write during transition period
- Row count and checksum validation
- Point-in-time recovery capability

**Downtime Prevention:**
- Blue/green deployments (zero downtime)
- Canary releases (gradual traffic shift)
- Automated rollback on error rate > 1%
- Health checks and readiness probes

**Performance Assurance:**
- Load testing at each phase (1K → 5K → 10K RPS)
- Performance monitoring (p50, p95, p99 latency)
- Auto-scaling based on CPU/memory/request rate
- Database query optimization (indexing, connection pooling)

**Security Assurance:**
- Security audit before each phase
- Penetration testing (internal red team)
- Bug bounty program (HackerOne)
- Automated vulnerability scanning (SAST, SCA, container)

---

## 11. Resource Requirements

### 11.1 Team Structure

| Role | Count | Responsibilities |
|---|---|---|
| Engineering Lead | 1 | Architecture decisions, code reviews, technical guidance |
| Backend Engineers | 4 | Service implementation, API development, database design |
| DevOps Engineer | 2 | Infrastructure, CI/CD, Kubernetes, monitoring |
| Security Engineer | 1 | Security audits, compliance, penetration testing |
| QA Engineer | 1 | Test automation, load testing, E2E testing |
| Technical Writer | 0.5 | API documentation, guides, runbooks |
| **Total** | **9.5** | |

### 11.2 Infrastructure Costs (Estimated)

| Resource | Dev/Staging | Production | Monthly Cost |
|---|---|---|---|
| EKS Cluster (3 nodes) | t3.large × 3 | m5.xlarge × 5 | $1,500 |
| RDS PostgreSQL | db.t3.medium | db.r5.xlarge (primary + 2 replicas) | $2,000 |
| ElastiCache Redis | cache.t3.medium × 2 | cache.r5.large × 3 | $800 |
| Cloudflare (Workers, Pages, D1, KV, R2) | — | Enterprise plan | $2,000 |
| Monitoring (Prometheus, Grafana, Loki) | Self-hosted | Self-hosted (3 nodes) | $500 |
| Vault (secret management) | Self-hosted | Self-hosted (HA) | $300 |
| Load balancer, NAT gateway, etc. | — | — | $400 |
| **Total** | | | **$7,500/month** |

### 11.3 Timeline Summary

| Phase | Duration | Key Deliverables |
|---|---|---|
| Phase 1: Foundation | 4 weeks | Infrastructure, CI/CD, Gateway, Observability |
| Phase 2: Core Services | 8 weeks | Auth, Project, Wallet services |
| Phase 3: Advanced Services | 8 weeks | Payment, Cross-Chain, Notification, Analytics |
| Phase 4: Optimization | 8 weeks | Performance, scaling, edge, security |
| Phase 5: Hardening | 8 weeks | DR, chaos, compliance, go-live |
| **Total** | **36 weeks** | **Production-ready platform** |

---

## 12. Success Metrics

### 12.1 Technical Metrics

| Metric | Target | Measurement |
|---|---|---|
| API availability | 99.95% | Uptime monitoring (Pingdom) |
| API p50 latency | <50ms | Prometheus histograms |
| API p99 latency | <500ms | Prometheus histograms |
| Throughput | 10,000 RPS per service | Load testing (k6) |
| Error rate | <0.1% | Prometheus error counters |
| Cache hit rate | >95% | Redis metrics |
| Database query p95 | <20ms | PostgreSQL query logs |
| Deployment frequency | Daily | ArgoCD deployment logs |
| Lead time for changes | <1 hour | GitHub PR → production |
| Mean time to recovery (MTTR) | <30 minutes | Incident logs |

### 12.2 Business Metrics

| Metric | Target | Measurement |
|---|---|---|
| Developer onboarding time | <1 day | New hire feedback |
| API adoption rate | 20% MoM growth | API key registrations |
| Customer satisfaction (CSAT) | >4.5/5 | Surveys |
| Support ticket volume | <10/week | Zendesk |
| Infrastructure cost per 1M requests | <$0.50 | Cloud billing / request count |

### 12.3 Milestone Checkpoints

| Week | Milestone | Go/No-Go Criteria |
|---|---|---|
| Week 4 | Foundation complete | Infrastructure stable, CI/CD working, gateway routing |
| Week 12 | Core services complete | Auth/Project/Wallet in production, 1K RPS tested |
| Week 20 | Advanced services complete | Payment/Cross-Chain in production, security audit passed |
| Week 28 | Optimization complete | 10K RPS tested, cache hit rate >95%, security hardened |
| Week 36 | Production ready | DR tested, SOC 2 audit passed, load test passed |

---

## 13. Appendix

### 13.1 Technology Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | 22 LTS | Application runtime |
| Language | TypeScript | 5.x | Type safety |
| Framework | Express | 4.x | HTTP server |
| Database | PostgreSQL | 16 | Primary data store |
| Cache | Redis | 7 | Caching, sessions, queues |
| Time-Series | ClickHouse | 24.x | Analytics |
| Search | Elasticsearch | 8.x | Log aggregation (alternative: Loki) |
| Container | Docker | 24.x | Containerization |
| Orchestration | Kubernetes | 1.30 | Container orchestration |
| Service Mesh | Istio | 1.22 | mTLS, traffic management |
| API Gateway | Kong | 3.7 | Rate limiting, auth, routing |
| CI/CD | GitHub Actions | — | Continuous integration |
| CD | ArgoCD | 2.11 | GitOps continuous deployment |
| IaC | Terraform | 1.9 | Infrastructure provisioning |
| Monitoring | Prometheus | 2.53 | Metrics collection |
| Visualization | Grafana | 11.0 | Dashboards |
| Logging | Loki | 3.0 | Log aggregation |
| Tracing | Tempo | 2.5 | Distributed tracing |
| Secrets | HashiCorp Vault | 1.17 | Secret management |
| WAF | Cloudflare WAF | — | Web application firewall |
| CDN | Cloudflare CDN | — | Content delivery |

### 13.2 API Endpoint Summary

| Service | Endpoint | Method | Auth | Rate Limit |
|---|---|---|---|---|
| Auth | `/api/v1/auth/siwe/verify` | POST | None | 30/min |
| Auth | `/api/v1/auth/passkey/register` | POST | JWT | 10/min |
| Auth | `/api/v1/auth/passkey/authenticate` | POST | None | 30/min |
| Auth | `/api/v1/auth/social/:provider/callback` | POST | None | 30/min |
| Auth | `/api/v1/auth/otp/send` | POST | None | 5/min |
| Auth | `/api/v1/auth/otp/verify` | POST | None | 10/min |
| Auth | `/api/v1/auth/token/refresh` | POST | Refresh Token | 60/min |
| Auth | `/api/v1/auth/token/revoke` | POST | JWT | 60/min |
| Auth | `/api/v1/auth/session` | GET | JWT | 60/min |
| Projects | `/api/v1/projects` | POST | JWT | Per-tier |
| Projects | `/api/v1/projects` | GET | JWT | Per-tier |
| Projects | `/api/v1/projects/:id` | GET | JWT | Per-tier |
| Projects | `/api/v1/projects/:id` | PUT | JWT | Per-tier |
| Projects | `/api/v1/projects/:id` | DELETE | JWT | Per-tier |
| Projects | `/api/v1/projects/:id/api-keys` | POST | JWT | Per-tier |
| Projects | `/api/v1/projects/:id/api-keys` | GET | JWT | Per-tier |
| Projects | `/api/v1/projects/:id/api-keys/:keyId` | DELETE | JWT | Per-tier |
| Projects | `/api/v1/projects/:id/usage` | GET | JWT | Per-tier |
| Wallets | `/api/v1/wallets` | GET | API Key | Per-tier |
| Wallets | `/api/v1/wallets/:id` | GET | API Key | Per-tier |
| Wallets | `/api/v1/wallets/recommended` | GET | API Key | Per-tier |
| Wallets | `/api/v1/address-book` | GET | JWT | 60/min |
| Wallets | `/api/v1/address-book` | POST | JWT | 30/min |
| Wallets | `/api/v1/address-book/:id` | DELETE | JWT | 30/min |
| Wallets | `/api/v1/ens/resolve/:name` | GET | API Key | Per-tier |
| Payments | `/api/v1/pay/swap/quote` | POST | JWT | Per-tier |
| Payments | `/api/v1/pay/swap/execute` | POST | JWT | Per-tier |
| Payments | `/api/v1/pay/onramp/quote` | POST | JWT | Per-tier |
| Payments | `/api/v1/pay/onramp/create` | POST | JWT | Per-tier |
| Payments | `/api/v1/pay/kyc/submit` | POST | JWT | 10/min |
| Payments | `/api/v1/pay/kyc/status` | GET | JWT | 60/min |
| Cross-Chain | `/api/v1/bridge/quote` | POST | JWT | Per-tier |
| Cross-Chain | `/api/v1/bridge/initiate` | POST | JWT | Per-tier |
| Cross-Chain | `/api/v1/bridge/status/:swapId` | GET | JWT | Per-tier |
| Cross-Chain | `/api/v1/bridge/claim` | POST | JWT | Per-tier |
| Cross-Chain | `/api/v1/bridge/refund` | POST | JWT | Per-tier |
| Notifications | `/api/v1/notify/send` | POST | JWT | 100/min |
| Notifications | `/api/v1/notify/batch` | POST | JWT | 10/min |
| Notifications | `/api/v1/notify/preferences` | GET | JWT | 60/min |
| Notifications | `/api/v1/notify/preferences` | PUT | JWT | 30/min |
| Analytics | `/api/v1/analytics/ingest` | POST | API Key | Per-tier |
| Analytics | `/api/v1/analytics/overview` | GET | JWT | 60/min |
| Analytics | `/api/v1/analytics/events` | GET | JWT | 60/min |
| Analytics | `/api/v1/analytics/usage/:projectId` | GET | JWT | 60/min |

### 13.3 Glossary

| Term | Definition |
|---|---|
| **AA** | Account Abstraction (ERC-4337) |
| **API Gateway** | Single entry point for all API requests (Kong) |
| **ArgoCD** | GitOps continuous delivery tool for Kubernetes |
| **Blue/Green Deployment** | Zero-downtime deployment strategy with two identical environments |
| **Canary Release** | Gradual rollout to a small subset of users before full deployment |
| **CSPRNG** | Cryptographically Secure Pseudo-Random Number Generator |
| **D1** | Cloudflare's serverless SQLite database |
| **EKS** | Amazon Elastic Kubernetes Service |
| **GitOps** | Operational framework that uses Git as single source of truth |
| **HPA** | Horizontal Pod Autoscaler (Kubernetes) |
| **HTLC** | Hash Time-Lock Contract (atomic swap primitive) |
| **HyperLogLog** | Probabilistic data structure for counting unique elements (Redis) |
| **IaC** | Infrastructure as Code (Terraform) |
| **KV** | Cloudflare Key-Value store |
| **mTLS** | Mutual TLS (both client and server authenticate) |
| **OIDC** | OpenID Connect (authentication layer on OAuth 2.0) |
| **R2** | Cloudflare's S3-compatible object storage |
| **RBAC** | Role-Based Access Control |
| **RPO** | Recovery Point Objective (maximum acceptable data loss) |
| **RTO** | Recovery Time Objective (maximum acceptable downtime) |
| **SIWE** | Sign-In with Ethereum (EIP-4361) |
| **SIWX** | Sign-In with X — multi-chain extension of SIWE |
| **SLO** | Service Level Objective (target metric) |
| **Strangler Fig Pattern** | Incremental migration pattern (replace components one by one) |
| **WAF** | Web Application Firewall |

---

## Document Control

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0.0 | 2026-06-08 | 000 (AI Architect) | Initial version |

---

**End of Document**

This implementation plan provides a comprehensive roadmap for transforming Cinacoin's backend architecture. Each phase builds on the previous one, with clear deliverables, validation steps, and go/no-go criteria. The plan prioritizes zero-downtime migrations, backward compatibility, and continuous testing to ensure a smooth transition to the target architecture.
