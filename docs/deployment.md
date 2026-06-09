# Deployment Guide

## Prerequisites

1. Cloudflare account with Workers and Pages enabled
2. Domain with DNS managed by Cloudflare
3. Node.js 18+ and npm installed

## Infrastructure Setup

### 1. Create D1 Databases

```bash
# Auth database
wrangler d1 create cinacoin-auth

# Users database
wrangler d1 create cinacoin-users
```

### 2. Create KV Namespaces

```bash
# Rate limiting
wrangler kv:namespace create RATE_LIMIT_KV

# Session storage
wrangler kv:namespace create SESSION_KV

# Analytics
wrangler kv:namespace create ANALYTICS_KV
```

### 3. Create R2 Buckets

```bash
# User avatars
wrangler r2 bucket create cinacoin-avatars

# Backups
wrangler r2 bucket create cinacoin-backups
```

### 4. Run Migrations

```bash
# Auth database
wrangler d1 execute cinacoin-auth --file=workers/auth-service/migrations/001_initial.sql
wrangler d1 execute cinacoin-auth --file=workers/auth-service/migrations/002_2fa_enforcement.sql

# Users database
wrangler d1 execute cinacoin-users --file=workers/user-service/migrations/001_initial.sql
wrangler d1 execute cinacoin-users --file=workers/user-service/migrations/003_newsletter.sql
```

## Workers Deployment

### API Gateway

```bash
cd workers/api-gateway
npm install
npx wrangler deploy
```

### Auth Service

```bash
cd workers/auth-service
npm install

# Set secrets
npx wrangler secret put JWT_SECRET
npx wrangler secret put JWT_REFRESH_SECRET

# Deploy
npx wrangler deploy
```

### User Service

```bash
cd workers/user-service
npm install

# Set secrets
npx wrangler secret put RESEND_API_KEY

# Deploy
npx wrangler deploy
```

## Pages Deployment

### Website

```bash
cd apps/website
npm install
npm run build
npm run deploy
```

### Backend Dashboard

```bash
cd apps/backend-dashboard
npm install
npm run build
npm run deploy
```

### Cloud Dashboard

```bash
cd apps/cloud-dashboard
npm install
npm run build
npm run deploy
```

## Domain Configuration

### Add Custom Domains

1. Go to Cloudflare Dashboard
2. Select your domain
3. Go to Workers & Pages
4. Click on each service
5. Add custom domain

### Expected Domains

| Service | Domain |
|---------|--------|
| Website | cinacoin.com |
| API | api.cinacoin.com |
| Auth | auth.cinacoin.com |
| Users | users.cinacoin.com |
| Backend | backend.cinacoin.com |
| Cloud | cloud.cinacoin.com |
| Wallet | wallet.cinacoin.com |
| Status | status.cinacoin.com |

## Environment Variables

### Workers

Update `wrangler.toml` for each worker with:
- D1 database IDs
- KV namespace IDs
- R2 bucket names

### Pages

Add environment variables in Cloudflare Dashboard:
- `NEXT_PUBLIC_API_URL`: https://api.cinacoin.com
- `NEXT_PUBLIC_AUTH_URL`: https://auth.cinacoin.com
- `NEXT_PUBLIC_USERS_URL`: https://users.cinacoin.com

## Verification

### Test Endpoints

```bash
# Health checks
curl https://api.cinacoin.com/health
curl https://auth.cinacoin.com/health
curl https://users.cinacoin.com/health

# Authentication
curl -X POST https://auth.cinacoin.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"password123"}'
```

### Test Frontend

Visit each domain and verify:
- Website loads correctly
- Login/register works
- Dashboard accessible
- All pages render

## Monitoring

### Set Up Alerts

1. Go to Cloudflare Dashboard
2. Navigate to Notifications
3. Create alert policies for:
   - Worker errors
   - High latency
   - D1 query failures

### View Metrics

Visit `backend.cinacoin.com/monitoring` for:
- Request counts
- Response times
- Error rates
- Alert history

## Troubleshooting

### Common Issues

#### 500 Error on Registration
- Check JWT_SECRET and JWT_REFRESH_SECRET are set
- Verify D1 database migrations completed

#### CORS Errors
- Ensure custom domains are configured
- Check CORS middleware in API Gateway

#### Rate Limit Issues
- Verify RATE_LIMIT_KV namespace is bound
- Check KV namespace ID in wrangler.toml

## Rollback

If deployment fails:

```bash
# Rollback Worker
npx wrangler deployments rollback

# Rollback Pages
# Use Cloudflare Dashboard → Pages → Deployments → Rollback
```
