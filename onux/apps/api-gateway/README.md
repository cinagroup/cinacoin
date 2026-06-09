# Cinacoin API Gateway

Cloudflare Workers-based API Gateway for the Cinacoin platform. Provides authentication, rate limiting, request routing, and proxying to upstream microservices.

## Features

- 🔐 **Authentication**: JWT and API Key authentication with permission-based access control
- 🚦 **Rate Limiting**: Tiered rate limiting with KV-backed sliding window algorithm
- 🔀 **Request Routing**: Intelligent routing to upstream microservices
- 📊 **Usage Analytics**: Request logging and usage statistics
- 🏥 **Health Checks**: Comprehensive health, readiness, and liveness endpoints
- 📝 **Structured Logging**: JSON logs compatible with Cloudflare Logpush
- 🛡️ **Error Handling**: Standardized error responses with appropriate HTTP status codes
- 🔄 **CORS**: Configurable Cross-Origin Resource Sharing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Requests                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (This Service)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Request    │  │     Auth     │  │    Rate      │      │
│  │   Context    │→ │  Middleware  │→ │   Limiter    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Request    │  │    Error     │  │   Logging    │      │
│  │   Router     │→ │   Handler    │→ │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Project    │ │    Wallet    │ │    Usage     │
│   Registry   │ │   Explorer   │ │  Analytics   │
│   (Proxy)    │ │   (Proxy)    │ │   (Local)    │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Project Structure

```
api-gateway/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── lib/
│   │   ├── types.ts            # TypeScript type definitions
│   │   ├── config.ts           # Configuration management
│   │   ├── logger.ts           # Structured logging
│   │   ├── errors.ts           # Custom error classes
│   │   └── utils.ts            # Utility functions
│   ├── middleware/
│   │   ├── context.ts          # Request context & CORS
│   │   ├── auth.ts             # JWT & API Key authentication
│   │   ├── rateLimiter.ts      # Rate limiting
│   │   └── errorHandler.ts     # Error handling
│   ├── routes/
│   │   ├── health.ts           # Health check endpoints
│   │   ├── projects.ts         # Project management
│   │   ├── apiKeys.ts          # API key management
│   │   ├── usage.ts            # Usage analytics
│   │   └── proxy.ts            # Upstream service proxy
│   └── __tests__/              # Unit tests
├── migrations/
│   └── 0001_initial_schema.sql # Database schema
├── wrangler.toml               # Cloudflare Workers config
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── deploy.sh                   # Deployment script
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9
- Cloudflare account with Workers and D1 access

### Installation

```bash
# Install dependencies
pnpm install

# Login to Cloudflare
wrangler login
```

### Local Development

```bash
# Start development server
pnpm dev

# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### Database Setup

```bash
# Create D1 database
wrangler d1 create cinacoin-api-gateway

# Apply migrations locally
pnpm db:migrate

# Apply migrations to production
pnpm db:migrate:prod
```

### Deployment

```bash
# Deploy to staging
pnpm deploy:staging

# Deploy to production
pnpm deploy:prod

# Or use the deployment script
./deploy.sh staging
./deploy.sh production
```

## API Endpoints

### Health Checks (Public)

```
GET /health          - Basic health check
GET /health/ready    - Readiness check (includes dependency checks)
GET /health/live     - Liveness check
```

### Projects (Authenticated)

```
GET    /api/projects          - List projects
GET    /api/projects/:id      - Get project by ID
POST   /api/projects          - Create project (requires 'write' permission)
PUT    /api/projects/:id      - Update project (requires 'write' permission)
DELETE /api/projects/:id      - Delete project (requires 'admin' permission)
```

### API Keys (Authenticated)

```
GET    /api/keys              - List API keys for project
POST   /api/keys              - Create API key (requires 'admin' permission)
DELETE /api/keys/:id          - Revoke API key (requires 'admin' permission)
POST   /api/keys/:id/rotate   - Rotate API key (requires 'admin' permission)
```

### Usage Analytics (Authenticated)

```
GET /api/usage/summary       - Get usage summary (24h, 7d stats)
GET /api/usage/logs          - Get request logs
GET /api/usage/endpoints     - Get usage by endpoint
```

### Proxy Routes (Authenticated)

```
ALL /api/registry/*          - Proxy to project-registry-api
ALL /api/wallets/*           - Proxy to wallet-explorer-api
```

## Authentication

The API Gateway supports two authentication methods:

### 1. JWT Authentication

```bash
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  https://api.cinacoin.com/api/projects
```

JWT tokens must include:
- `sub`: Subject (user/project ID)
- `iss`: Issuer (must be "cinacoin-api")
- `aud`: Audience (must be "cinacoin-services")
- `exp`: Expiration time
- `permissions`: Array of permission strings

### 2. API Key Authentication

```bash
curl -H "Authorization: Bearer ck_..." \
  https://api.cinacoin.com/api/projects
```

API keys are hashed (SHA-256) and stored in the database. The raw key is only returned once during creation.

### Permissions

- `read`: Read-only access
- `write`: Create and update resources
- `admin`: Full access including deletion and key management

## Rate Limiting

Rate limits are applied per IP address using a sliding window algorithm:

- **Unauthenticated**: 100 requests per minute
- **Authenticated**: 500 requests per minute
- **Premium**: 2000 requests per minute (configurable)

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 495
X-RateLimit-Reset: 1640000000
```

## Environment Variables

### Required Secrets (set via `wrangler secret put`)

```bash
wrangler secret put JWT_SECRET
wrangler secret put UPSTREAM_API_KEY  # Optional
```

### Configuration (in wrangler.toml)

```toml
[vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"
PROJECT_REGISTRY_URL = "https://project-registry-api.cinacoin.com"
WALLET_EXPLORER_URL = "https://wallet-explorer-api.cinacoin.com"
```

## Monitoring

### Logs

```bash
# View real-time logs
pnpm logs

# View production logs
pnpm logs:prod
```

### Metrics

The gateway logs structured JSON data compatible with:
- Cloudflare Logpush
- Datadog
- New Relic
- ELK Stack

Example log entry:
```json
{
  "timestamp": "2026-06-08T14:30:00.000Z",
  "level": "info",
  "message": "GET /api/projects 200",
  "service": "api-gateway",
  "requestId": "abc123...",
  "method": "GET",
  "path": "/api/projects",
  "status": 200,
  "duration": 42,
  "clientIp": "1.2.3.4"
}
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## CI/CD

The deployment pipeline is defined in `.github/workflows/deploy-api-gateway.yml`:

1. **Test**: Run type checking and unit tests
2. **Deploy to Staging**: Automatic on push to main
3. **Smoke Tests**: Verify health and readiness endpoints
4. **Deploy to Production**: Manual approval required

## Security

- All API keys are hashed with SHA-256 before storage
- JWT tokens are verified with HMAC-SHA256
- CORS is restricted to allowed origins
- Rate limiting prevents abuse
- Request logging for audit trails
- No sensitive data in logs

## Troubleshooting

### Deployment fails

```bash
# Check Cloudflare status
wrangler whoami

# Verify wrangler.toml configuration
cat wrangler.toml

# Check for TypeScript errors
pnpm typecheck
```

### Health checks fail

```bash
# Check D1 database
wrangler d1 execute cinacoin-api-gateway --command "SELECT 1"

# Check KV namespace
wrangler kv:key list --binding RATE_LIMIT_KV
```

### Rate limiting issues

```bash
# View rate limit KV data
wrangler kv:key list --binding RATE_LIMIT_KV --prefix "rate_limit:"
```

## License

Private - Cinacoin Internal
