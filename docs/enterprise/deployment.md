# Enterprise Deployment Guide

## Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (Nginx/ALB)   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
        │  App Node │ │  App Node │ │  App Node │
        │  (Relay)  │ │  (Relay)  │ │  (Relay)  │
        └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │   Redis Cache   │
                    │   (Sessions)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   (Data)        │
                    └─────────────────┘
```

## Docker Compose

```yaml
version: '3.8'
services:
  relay:
    image: ghcr.io/cinagroup/cinaconnect-relay:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/cinaconnect
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=cinaconnect

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

## Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cinaconnect-relay
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cinaconnect-relay
  template:
    metadata:
      labels:
        app: cinaconnect-relay
    spec:
      containers:
      - name: relay
        image: ghcr.io/cinagroup/cinaconnect-relay:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: cinaconnect-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## SSL/TLS Setup

Use Let's Encrypt with cert-manager:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: cinaconnect-tls
spec:
  secretName: cinaconnect-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - relay.cinaconnect.com
```

## Monitoring

Prometheus + Grafana stack:
- Export `/metrics` endpoint
- Track: active connections, relay latency, error rates
- Alert on: connection failures > 5%, latency > 1s
