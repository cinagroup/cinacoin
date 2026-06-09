# Cinacoin Backend Architecture

> Version: 1.0.0 | Date: 2026-06-08 | Author: 000 (AI Architect)
> Status: Design Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architecture Decision: Modular Monolith → Microservices](#3-architecture-decision)
4. [API Gateway Design](#4-api-gateway-design)
5. [Service Architecture](#5-service-architecture)
6. [Data Layer](#6-data-layer)
7. [Service Communication](#7-service-communication)
8. [Infrastructure Topology](#8-infrastructure-topology)
9. [Performance & Scalability](#9-performance--scalability)
10. [Appendix](#10-appendix)

---

## 1. Executive Summary

Cinacoin is a comprehensive Web3 infrastructure platform providing wallet connection, cross-chain interoperability, account abstraction, payments, and developer tooling across 7 front-end applications and 5+ backend services.

This document defines the target backend architecture that unifies:

| Application | Domain | Current Deployment |
|---|---|---|
| Website | cinacoin.com | Cloudflare Pages (Vercel) |
| Cloud Dashboard | cloud.cinacoin.com | Cloudflare Pages |
| Backend Dashboard | dash.cinacoin.com | Cloudflare Pages |
| Demo App | demo.cinacoin.com | Vercel |
| Wallet Explorer | wallet.cinacoin.com | Cloudflare Pages |
| Analytics | analytics.cinacoin.com | Cloudflare Pages |
| Health Status | status.cinacoin.com | Cloudflare Pages |

**Backend services:**
- RPC Proxy (rpc.cinacoin.com) — Cloudflare Worker + Go
- Keys Server (keys.cinacoin.com) — Node.js
- Relay Server (relay.cinacoin.com) — Node.js
- Notify Server (notify.cinacoin.com) — Node.js
- Push Server (push.cinacoin.com) — Node.js
- Project Registry API — Cloudflare Workers + D1
- Wallet Explorer API — Cloudflare Workers + D1

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  Website │ Cloud Dashboard │ Backend Dashboard │ Demo │ Explorer     │
│  Analytics │ Health Status │ Mobile Apps │ SDK Clients              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────────┐
│                     EDGE / CDN LAYER                                 │
│         Cloudflare CDN + WAF + DDoS Protection + Bot Management     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                      API GATEWAY LAYER                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Kong / Cloudflare Gateway                                   │    │
│  │  • Rate Limiting  • Auth (JWT/API Key)  • Request Routing   │    │
│  │  • Request Transform  • Circuit Breaking  • Observability    │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                    SERVICE MESH LAYER                                 │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Auth     │ │ Project  │ │ Wallet   │ │ RPC      │              │
│  │ Service  │ │ Service  │ │ Service  │ │ Proxy    │              │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘              │
│       │             │             │             │                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Payment  │ │ Cross-   │ │ Notify   │ │ Analytics│              │
│  │ Service  │ │ Chain    │ │ Service  │ │ Service  │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                      DATA LAYER                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │PostgreSQL│ │  Redis   │ │Cloudflare│ │  Object  │              │
│  │(Primary) │ │ (Cache/  │ │   D1     │ │ Storage  │              │
│  │          │ │  Queue)  │ │ (Edge)   │ │  (R2/S3) │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Design Principles

| Principle | Rationale |
|---|---|
| **Edge-first** | Global user base demands <100ms TTFB; Cloudflare Workers at 300+ PoPs |
| **API-first** | All services expose RESTful + GraphQL APIs; SDK clients consume them |
| **Event-driven** | Async operations (cross-chain swaps, notifications) use message queues |
| **Zero-trust** | Every service-to-service call authenticated via mTLS or JWT |
| **Observable** | Distributed tracing, structured logging, SLO-based alerting |
| **Progressive** | Start with modular monolith, extract services as scale demands |

---

## 3. Architecture Decision

### 3.1 Modular Monolith → Microservices (Strangler Fig Pattern)

**Decision:** Start with a **modular monolith** deployed as a single deployable unit per domain, progressively extracting into microservices.

**Rationale:**

| Factor | Monolith | Microservices | Decision |
|---|---|---|---|
| Team size (<15 engineers) | ✅ Lower overhead | ❌ Operational complexity | Monolith |
| Current scale (<1M DAU) | ✅ Sufficient | ❌ Premature optimization | Monolith |
| Deployment velocity | ⚠️ Coupled releases | ✅ Independent deploys | Extract later |
| Data consistency | ✅ ACID transactions | ⚠️ Eventual consistency | Monolith |
| Debugging | ✅ Single process | ❌ Distributed tracing needed | Monolith |
| Future scale (>10M DAU) | ❌ Horizontal limits | ✅ Per-service scaling | Plan for it |

### 3.2 Service Decomposition Plan

```
Phase 1 (Now): Modular Monolith
├── apps/gateway          — API Gateway (Kong/Cloudflare)
├── apps/auth-service     — Authentication & Authorization
├── apps/project-service  — Project management, API keys, usage
├── apps/wallet-service   — Wallet explorer, address book
├── apps/rpc-service      — RPC proxy (already Go Worker)
├── apps/payment-service  — Swap, OnRamp, Deposit, Pay
├── apps/crosschain-service — Bridge, HTLC, messaging
├── apps/notification-service — Notify + Push combined
└── apps/analytics-service — Analytics aggregation + reporting

Phase 2 (Scale): Extract hot paths
├── rpc-service → standalone (already separate)
├── payment-service → split into swap/onramp/pay
├── crosschain-service → split into bridge/messaging
└── analytics-service → split into ingest/query
```

---

## 4. API Gateway Design

### 4.1 Gateway Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     API Gateway (Kong / CF Gateway)               │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐      │
│  │ Rate Limiter│  │ Auth Plugin │  │ Request Transformer │      │
│  │ (Redis)     │  │ (JWT/APIKey)│  │ (Header injection)  │      │
│  └─────────────┘  └─────────────┘  └─────────────────────┘      │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐      │
│  │ CORS        │  │ Circuit     │  │ Request/Response    │      │
│  │ Handler     │  │ Breaker     │  │ Logger              │      │
│  └─────────────┘  └─────────────┘  └─────────────────────┘      │
│                                                                   │
│  Routing Rules:                                                   │
│  /api/v1/auth/**       → auth-service                             │
│  /api/v1/projects/**   → project-service                          │
│  /api/v1/wallets/**    → wallet-service                           │
│  /rpc/**               → rpc-service                              │
│  /api/v1/pay/**        → payment-service                          │
│  /api/v1/bridge/**     → crosschain-service                       │
│  /api/v1/notify/**     → notification-service                     │
│  /api/v1/analytics/**  → analytics-service                        │
│  /graphql              → GraphQL Federation Gateway               │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 API Versioning Strategy

| Version | Path | Status |
|---|---|---|
| v1 | `/api/v1/*` | Current stable |
| v2 | `/api/v2/*` | Next (breaking changes) |
| Internal | `/internal/*` | Service-to-service only (not exposed) |
| GraphQL | `/graphql` | Federated schema |

### 4.3 Authentication at Gateway

```
Request Flow:
1. Client sends request with Bearer token or X-API-Key
2. Gateway validates JWT signature (RS256) or API key (hashed)
3. Gateway injects headers:
   - X-User-ID: <user_id>
   - X-Project-ID: <project_id>
   - X-Permissions: <scope_list>
   - X-Request-ID: <uuid>
   - X-Trace-ID: <opentelemetry_trace_id>
4. Service receives pre-authenticated context
```

### 4.4 Rate Limiting Tiers

| Tier | Requests/min | Burst | Use Case |
|---|---|---|---|
| Free | 60 | 10 | Trial users |
| Developer | 600 | 100 | Indie developers |
| Pro | 6,000 | 1,000 | Startups |
| Enterprise | 60,000 | 10,000 | Production apps |
| Internal | Unlimited | — | Service-to-service |

---

## 5. Service Architecture

### 5.1 Auth Service

```
┌─────────────────────────────────────────────────────────┐
│                    Auth Service                          │
│                                                          │
│  Capabilities:                                           │
│  • SIWE/SIWX (EIP-4361) — Multi-chain sign-in          │
│  • Passkey (WebAuthn) — Biometric authentication        │
│  • Social Login — Google/Apple/GitHub/Twitter/Discord   │
│  • Phone OTP — SMS/WhatsApp verification                │
│  • Embedded Wallet — PBKDF2 + secp256k1 + AES backup   │
│  • Session Management — JWT issuance + refresh          │
│  • RBAC — Role-based access control per project         │
│                                                          │
│  Data:                                                   │
│  • PostgreSQL: users, sessions, credentials, api_keys   │
│  • Redis: session cache, token blacklist, rate limits   │
│                                                          │
│  Endpoints:                                              │
│  POST /auth/siwe/verify                                  │
│  POST /auth/passkey/register                             │
│  POST /auth/passkey/authenticate                         │
│  POST /auth/social/{provider}/callback                   │
│  POST /auth/otp/send                                     │
│  POST /auth/otp/verify                                   │
│  POST /auth/token/refresh                                │
│  POST /auth/token/revoke                                 │
│  GET  /auth/session                                      │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Project Service

```
┌─────────────────────────────────────────────────────────┐
│                  Project Service                         │
│                                                          │
│  Capabilities:                                           │
│  • Project CRUD — Create/manage dApp projects           │
│  • API Key Management — Generate, rotate, revoke keys   │
│  • Usage Tracking — Per-project request counting        │
│  • Billing — Usage-based metering + invoicing           │
│  • Webhook Management — Configure event callbacks       │
│                                                          │
│  Data:                                                   │
│  • PostgreSQL: projects, api_keys, usage_records        │
│  • Redis: usage counters (HyperLogLog), cache           │
│  • D1 (Edge): cached project configs for Workers        │
│                                                          │
│  Endpoints:                                              │
│  CRUD /projects                                          │
│  CRUD /projects/:id/api-keys                             │
│  GET  /projects/:id/usage                                │
│  POST /projects/:id/usage/summary                        │
│  CRUD /projects/:id/webhooks                             │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Wallet Service

```
┌─────────────────────────────────────────────────────────┐
│                  Wallet Service                          │
│                                                          │
│  Capabilities:                                           │
│  • Wallet Registry — 104+ wallets with metadata         │
│  • Wallet Discovery — EIP-6963 provider detection       │
│  • Address Book — User-saved addresses per chain        │
│  • ENS Resolution — Name → address lookup               │
│  • Wallet Recommendation — ML-based matching            │
│                                                          │
│  Data:                                                   │
│  • PostgreSQL: wallets, addresses, ens_cache            │
│  • Redis: wallet list cache, ENS cache                  │
│  • D1 (Edge): wallet registry for Workers               │
│                                                          │
│  Endpoints:                                              │
│  GET  /wallets (paginated, filterable)                   │
│  GET  /wallets/:id                                       │
│  GET  /wallets/recommended                               │
│  CRUD /address-book                                      │
│  GET  /ens/resolve/:name                                 │
└─────────────────────────────────────────────────────────┘
```

### 5.4 Payment Service

```
┌─────────────────────────────────────────────────────────┐
│                  Payment Service                         │
│                                                          │
│  Capabilities:                                           │
│  • Swap Aggregation — Uniswap/1inch/0x/Jupiter routing  │
│  • OnRamp Aggregation — MoonPay/Ramp/Transak/Stripe     │
│  • Deposit Links — Exchange deep links (Binance/OKX)    │
│  • Pay UI — Buy/Send/Receive flows                      │
│  • KYC Engine — AES-GCM encrypted PII, screening        │
│  • Travel Rule — FATF R16 compliance                    │
│                                                          │
│  Data:                                                   │
│  • PostgreSQL: transactions, kyc_records, routes        │
│  • Redis: quote cache, rate limits                      │
│  • Event Store: payment state machine events            │
│                                                          │
│  Endpoints:                                              │
│  POST /pay/swap/quote                                    │
│  POST /pay/swap/execute                                  │
│  POST /pay/onramp/quote                                  │
│  POST /pay/onramp/create                                 │
│  POST /pay/kyc/submit                                    │
│  GET  /pay/kyc/status                                    │
│  POST /pay/travel-rule/validate                          │
└─────────────────────────────────────────────────────────┘
```

### 5.5 Cross-Chain Service

```
┌─────────────────────────────────────────────────────────┐
│                Cross-Chain Service                       │
│                                                          │
│  Capabilities:                                           │
│  • Bridge Router — Optimal path finding                 │
│  • HTLC Atomic Swaps — Trustless cross-chain exchange   │
│  • State Management — Swap lifecycle tracking           │
│  • Cross-Chain Messaging — Arbitrary data relay         │
│  • Executor — Multi-chain transaction execution         │
│                                                          │
│  Data:                                                   │
│  • PostgreSQL: swaps, bridge_tx, messages               │
│  • Redis: swap state cache, lock management             │
│  • Event Store: swap lifecycle events                   │
│                                                          │
│  ⚠️ CRITICAL: Replace Math.random() with CSPRNG        │
│  for HTLC secret generation (P1 finding)                 │
│                                                          │
│  Endpoints:                                              │
│  POST /bridge/quote                                      │
│  POST /bridge/initiate                                   │
│  GET  /bridge/status/:swapId                             │
│  POST /bridge/claim                                      │
│  POST /bridge/refund                                     │
│  POST /messaging/send                                    │
│  GET  /messaging/inbox/:address                          │
└─────────────────────────────────────────────────────────┘
```

### 5.6 Notification Service

```
┌─────────────────────────────────────────────────────────┐
│              Notification Service                        │
│                                                          │
│  Capabilities:                                           │
│  • Push Notifications — FCM (RS256) + APNs             │
│  • In-App Notifications — WebSocket + SSE               │
│  • Email Notifications — Transactional + marketing      │
│  • Webhook Delivery — Reliable event callbacks          │
│  • Preference Management — Per-user notification config │
│                                                          │
│  Data:                                                   │
│  • PostgreSQL: notification_prefs, delivery_log         │
│  • Redis: notification queue, device tokens             │
│  • Redis Streams: event fan-out                         │
│                                                          │
│  Endpoints:                                              │
│  POST /notify/send                                       │
│  POST /notify/batch                                      │
│  GET  /notify/preferences                                │
│  PUT  /notify/preferences                                │
│  POST /push/register-device                              │
│  DELETE /push/unregister-device                          │
│  WS   /notify/stream                                     │
└─────────────────────────────────────────────────────────┘
```

### 5.7 Analytics Service

```
┌─────────────────────────────────────────────────────────┐
│                Analytics Service                         │
│                                                          │
│  Capabilities:                                           │
│  • Event Ingestion — High-throughput event collection   │
│  • Real-time Aggregation — Streaming windowed counts    │
│  • Historical Queries — Time-series data retrieval      │
│  • Dashboard KPIs — Overview metrics for cloud portal   │
│  • GDPR Compliance — PII anonymization, data retention  │
│                                                          │
│  Data:                                                   │
│  • ClickHouse/TimescaleDB: event store (time-series)    │
│  • Redis: real-time counters, sliding windows           │
│  • PostgreSQL: dashboard configs, saved reports         │
│  • D1 (Edge): cached KPI summaries for Workers          │
│                                                          │
│  Endpoints:                                              │
│  POST /analytics/ingest (batch)                          │
│  GET  /analytics/overview                                │
│  GET  /analytics/events                                  │
│  GET  /analytics/usage/:projectId                        │
│  GET  /analytics/latency                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Data Layer

### 6.1 Database Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                       DATA ARCHITECTURE                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              PRIMARY DATABASE (PostgreSQL)                │     │
│  │                                                           │     │
│  │  Deployment: AWS RDS / Supabase / Neon (serverless)      │     │
│  │  Replication: 1 primary + 2 read replicas               │     │
│  │  Backup: Continuous WAL archiving + daily snapshots     │     │
│  │                                                           │     │
│  │  Schema per service (logical separation):                │     │
│  │  ├── auth: users, sessions, credentials, api_keys       │     │
│  │  ├── projects: projects, api_keys, usage, webhooks      │     │
│  │  ├── wallets: wallet_registry, addresses, ens_cache     │     │
│  │  ├── payments: transactions, kyc_records, routes        │     │
│  │  ├── crosschain: swaps, bridge_tx, messages             │     │
│  │  ├── notifications: prefs, delivery_log, devices        │     │
│  │  └── analytics: dashboard_configs, reports              │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │   Redis Cluster   │  │  Cloudflare D1   │                     │
│  │                    │  │                   │                     │
│  │  • Session cache   │  │  • Edge-cached    │                     │
│  │  • Rate limiting   │  │    read-only data │                     │
│  │  • Job queues      │  │  • Wallet registry│                     │
│  │  • Pub/Sub         │  │  • Project config │                     │
│  │  • Event streams   │  │  • KPI summaries  │                     │
│  └──────────────────┘  └──────────────────┘                     │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │  ClickHouse /     │  │  Object Storage  │                     │
│  │  TimescaleDB      │  │  (R2 / S3)       │                     │
│  │                    │  │                   │                     │
│  │  • Analytics       │  │  • KYC documents │                     │
│  │    time-series     │  │  • Backup files  │                     │
│  │  • Event log       │  │  • Static assets │                     │
│  │  • Audit trail     │  │  • SDK bundles   │                     │
│  └──────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Database Sharding Strategy

| Domain | Strategy | Shard Key | Rationale |
|---|---|---|---|
| Users | Hash | user_id | Even distribution |
| Projects | Hash | project_id | Project-scoped queries |
| Transactions | Range | created_at | Time-series access pattern |
| Analytics Events | Range | timestamp + hash(project_id) | Write distribution + time queries |
| Wallet Registry | None (read-only) | — | Small dataset, fully cached |
| Cross-chain Swaps | Hash | swap_id | Independent operations |

### 6.3 Caching Layers

```
L1: In-Process Cache (LRU, 100MB per instance)
    → Wallet registry, chain configs, feature flags
    → TTL: 5 min, invalidation via pub/sub

L2: Redis Cluster
    → Session data, rate limit counters, API key lookups
    → TTL: varies (sessions: 24h, rate limits: 1min)

L3: Cloudflare D1 / KV (Edge)
    → Read-only data replicated from PostgreSQL
    → Wallet list, project configs, KPI summaries
    → TTL: 1 min, invalidated on write via webhook

L4: Cloudflare CDN Cache
    → Static assets, SDK bundles, documentation
    → TTL: 1 hour (versioned URLs for cache busting)
```

### 6.4 Data Replication Flow

```
PostgreSQL (Primary)
    │
    ├──→ Read Replica 1 (analytics queries)
    ├──→ Read Replica 2 (reporting)
    │
    ├──→ Redis (change data capture via logical decoding)
    │    └──→ Edge D1/KV (periodic sync, every 60s)
    │
    └──→ ClickHouse (analytics pipeline)
         └──→ Materialized views for dashboards
```

---

## 7. Service Communication

### 7.1 Communication Patterns

| Pattern | Protocol | Use Case | Example |
|---|---|---|---|
| Synchronous REST | HTTP/2 | CRUD operations, queries | GET /wallets |
| GraphQL Federation | HTTP/2 | Complex cross-service queries | Dashboard data |
| Async Events | Redis Streams | State changes, notifications | Payment completed |
| gRPC (internal) | HTTP/2 | High-throughput service-to-service | RPC routing |
| WebSocket | WSS | Real-time updates | Swap status, notifications |

### 7.2 Event-Driven Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Payment    │────▶│  Redis       │────▶│  Notification   │
│  Service    │     │  Streams     │     │  Service        │
└─────────────┘     │              │     └─────────────────┘
                    │  Topics:     │
┌─────────────┐     │  • payments  │     ┌─────────────────┐
│  Cross-     │────▶│  • swaps     │────▶│  Analytics      │
│  Chain      │     │  • auth      │     │  Service        │
└─────────────┘     │  • projects  │     └─────────────────┘
                    │  • webhooks  │
┌─────────────┐     │              │     ┌─────────────────┐
│  Auth       │────▶│  Consumers:  │────▶│  Webhook        │
│  Service    │     │  per-topic   │     │  Dispatcher     │
└─────────────┘     └──────────────┘     └─────────────────┘
```

### 7.3 Service Discovery

**Phase 1 (Cloudflare-native):**
- Services register in Cloudflare D1 service registry
- Gateway resolves via DNS (each service has internal subdomain)
- Health checks via `/health` endpoints every 10s

**Phase 2 (Kubernetes):**
- Kubernetes Service Discovery (DNS-based)
- Service mesh (Istio/Linkerd) for mTLS + traffic management
- Consul/etcd for non-K8s service registration

---

## 8. Infrastructure Topology

### 8.1 Multi-Region Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                     GLOBAL INFRASTRUCTURE                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              Cloudflare Edge (300+ PoPs)                 │     │
│  │  CDN │ WAF │ Workers │ D1 │ KV │ R2 │ DDoS Protection  │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│  ┌────────────────────┐         ┌────────────────────┐          │
│  │   Region: US-East   │         │   Region: AP-East   │          │
│  │                      │         │                      │          │
│  │  ┌────────────────┐ │  Sync   │ ┌────────────────┐ │          │
│  │  │ K8s Cluster    │ │◄──────►│ │ K8s Cluster    │ │          │
│  │  │ • Auth Service │ │         │ │ • Auth Service │ │          │
│  │  │ • Project Svc  │ │         │ │ • Project Svc  │ │          │
│  │  │ • Payment Svc  │ │         │ │ • Payment Svc  │ │          │
│  │  │ • CrossChain   │ │         │ │ • CrossChain   │ │          │
│  │  └────────────────┘ │         │ └────────────────┘ │          │
│  │  ┌────────────────┐ │         │ ┌────────────────┐ │          │
│  │  │ PostgreSQL     │ │  Repl   │ │ PostgreSQL     │ │          │
│  │  │ (Primary)      │ │◄──────►│ │ (Replica)      │ │          │
│  │  └────────────────┘ │         │ └────────────────┘ │          │
│  │  ┌────────────────┐ │         │ ┌────────────────┐ │          │
│  │  │ Redis Cluster  │ │         │ │ Redis Cluster  │ │          │
│  │  └────────────────┘ │         │ └────────────────┘ │          │
│  └────────────────────┘         └────────────────────┘          │
│                                                                   │
│  ┌────────────────────┐                                          │
│  │   Region: EU-West   │                                          │
│  │  • Read replica     │                                          │
│  │  • Redis cache      │                                          │
│  │  • GDPR data store  │                                          │
│  └────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Technology Stack Summary

| Layer | Technology | Rationale |
|---|---|---|
| Edge/CDN | Cloudflare | Existing investment, 300+ PoPs |
| Edge Compute | Cloudflare Workers | Low-latency global execution |
| API Gateway | Kong (OSS) or Cloudflare Gateway | Plugin ecosystem, rate limiting |
| Application Runtime | Node.js 22 LTS + Go (RPC) | TypeScript ecosystem + Go performance |
| Container Orchestration | Kubernetes (EKS/GKE) | Industry standard, portable |
| Primary Database | PostgreSQL 16 | ACID, JSONB, mature tooling |
| Time-Series | ClickHouse or TimescaleDB | Analytics at scale |
| Cache | Redis 7 Cluster | Sub-ms latency, pub/sub, streams |
| Edge Database | Cloudflare D1 | SQLite at edge, zero-config |
| Object Storage | Cloudflare R2 / AWS S3 | S3-compatible, no egress fees (R2) |
| Message Queue | Redis Streams → Kafka (scale) | Event-driven, ordered delivery |
| Service Mesh | Istio (Phase 2) | mTLS, traffic management, observability |
| CI/CD | GitHub Actions + ArgoCD | GitOps, automated deploys |
| Monitoring | Prometheus + Grafana + OpenTelemetry | Industry standard observability |
| Logging | Loki + Grafana | Log aggregation, queryable |
| Tracing | Tempo / Jaeger | Distributed tracing |

---

## 9. Performance & Scalability

### 9.1 Performance Targets

| Metric | Target | Measurement |
|---|---|---|
| API p50 latency | <50ms | Gateway → Service → DB roundtrip |
| API p99 latency | <500ms | Including cold starts |
| Edge Worker p50 | <10ms | Cloudflare Worker execution |
| Database query p95 | <20ms | Connection pool hit |
| Cache hit rate | >95% | Redis + in-process |
| Uptime SLA | 99.95% | ~4.3h downtime/year |
| Throughput | 10,000 RPS per service | Horizontal scaling |

### 9.2 Horizontal Scaling Strategy

```
Service Scaling Rules:
├── Auth Service:       2-10 pods (CPU-based, spike on login waves)
├── Project Service:    2-5 pods  (steady, moderate load)
├── Wallet Service:     2-5 pods  (cache-heavy, low CPU)
├── Payment Service:    3-15 pods (CPU-intensive, quote computation)
├── CrossChain Service: 2-10 pods (long-running swaps, memory)
├── Notification Service: 2-8 pods (burst on batch sends)
├── Analytics Service:  3-20 pods (query-heavy, auto-scale on dashboards)
└── RPC Proxy:          Edge-only (Cloudflare Workers, auto-scale)
```

### 9.3 Database Optimization

| Technique | Application | Impact |
|---|---|---|
| Connection pooling (PgBouncer) | All services | 10x connection efficiency |
| Read replicas | Analytics, reporting | Offload primary |
| Table partitioning | Transactions (by month), events (by day) | Faster queries, easier maintenance |
| Materialized views | Dashboard KPIs, usage summaries | Pre-computed aggregations |
| Index optimization | Covering indexes for hot paths | <5ms lookups |
| Query result cache (Redis) | Wallet list, chain configs | Eliminate DB roundtrips |

---

## 10. Appendix

### 10.1 API Endpoint Summary

| Service | Base Path | Auth | Rate Limit |
|---|---|---|---|
| Auth | `/api/v1/auth` | None (login endpoints) | 30/min per IP |
| Projects | `/api/v1/projects` | JWT / API Key | Per-tier |
| Wallets | `/api/v1/wallets` | API Key | Per-tier |
| RPC | `/rpc/:chainId` | API Key | Per-tier |
| Payments | `/api/v1/pay` | JWT | Per-tier |
| Cross-Chain | `/api/v1/bridge` | JWT | Per-tier |
| Notifications | `/api/v1/notify` | JWT | 100/min |
| Analytics | `/api/v1/analytics` | JWT (project-scoped) | 60/min |
| GraphQL | `/graphql` | JWT / API Key | Per-tier |

### 10.2 Technology Decision Records

| ADR | Decision | Alternatives Considered |
|---|---|---|
| ADR-001 | Modular monolith → microservices | Pure microservices (rejected: premature) |
| ADR-002 | PostgreSQL primary | MySQL (less JSON support), CockroachDB (overkill) |
| ADR-003 | Redis for cache+queue | Memcached (no persistence), RabbitMQ (separate system) |
| ADR-004 | Cloudflare Workers at edge | AWS Lambda@Edge (vendor lock-in), Fastly Compute |
| ADR-005 | Kong API Gateway | AWS API Gateway (cost at scale), Envoy (more ops) |
| ADR-006 | Kubernetes orchestration | Serverless (cold starts), ECS (AWS lock-in) |

### 10.3 Glossary

| Term | Definition |
|---|---|
| SIWE | Sign-In with Ethereum (EIP-4361) |
| SIWX | Sign-In with X — multi-chain extension of SIWE |
| HTLC | Hash Time-Lock Contract — atomic swap primitive |
| AA | Account Abstraction (ERC-4337) |
| PoP | Point of Presence (CDN edge location) |
| D1 | Cloudflare's serverless SQLite database |
| R2 | Cloudflare's S3-compatible object storage |
