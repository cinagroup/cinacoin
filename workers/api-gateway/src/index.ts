import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { globalRateLimit, authRateLimit, withRateLimit } from './middleware/rateLimiter'
import { envCorsMiddleware } from './middleware/cors'
import { metricsMiddleware } from './middleware/metrics'
import { cacheMiddleware } from './middleware/cache'
import abTesting from './routes/ab-testing'
import search from './routes/search'
import webVitals from './routes/analytics/web-vitals'
import monitoring from './routes/monitoring'

export interface Env {
  AUTH_SERVICE: Fetcher
  USER_SERVICE: Fetcher
  RATE_LIMIT_KV: KVNamespace
  ANALYTICS_KV: KVNamespace
  CACHE_KV: KVNamespace
  ENVIRONMENT: string
  API_VERSION: string
  ALERT_WEBHOOK_URL?: string
}

const app = new Hono<{ Bindings: Env }>()

// Security headers middleware
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

app.use('*', async (c, next) => {
  for (const [key, value] of Object.entries(securityHeaders)) {
    c.header(key, value);
  }
  await next();
});

// Cache middleware (Cloudflare edge cache)
app.use('*', cacheMiddleware)

// Middleware
app.use('*', logger())
// Secure CORS middleware (allowlist-based)
app.use('*', envCorsMiddleware(process.env.ENVIRONMENT))

// Global rate limiting (1000 req/hour per IP)
app.use('*', globalRateLimit())

// Metrics collection middleware
app.use('*', metricsMiddleware)

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'api-gateway',
    version: c.env.API_VERSION,
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString()
  })
})

// API Routes
app.route('/', search);
app.route('/', webVitals);
app.route('/', monitoring);

app.get('/', (c) => {
  return c.json({
    message: 'Cinacoin API Gateway',
    version: c.env.API_VERSION,
    endpoints: {
      auth: '/auth/*',
      users: '/users/*',
      teams: '/teams/*',
      health: '/health'
    }
  })
})

// Auth routes - proxy to Auth Service (keeps /auth/* path)
app.all('/auth/*', withRateLimit('auth'), async (c) => {
  const url = new URL(c.req.url)
  // Auth Service routes are mounted at /auth, keep path as-is
  const request = new Request(url.toString(), c.req.raw)
  return c.env.AUTH_SERVICE.fetch(request)
})

// Users routes - proxy to User Service (map to /api/users/*)
app.all('/users/*', withRateLimit('users'), async (c) => {
  const url = new URL(c.req.url)
  // User Service routes are at /api/users/*, map /users/* → /api/users/*
  url.pathname = '/api' + url.pathname
  const request = new Request(url.toString(), c.req.raw)
  return c.env.USER_SERVICE.fetch(request)
})

// Teams routes - proxy to User Service (map to /api/teams/*)
app.all('/teams/*', withRateLimit('teams'), async (c) => {
  const url = new URL(c.req.url)
  // User Service routes are at /api/teams/*, map /teams/* → /api/teams/*
  url.pathname = '/api' + url.pathname
  const request = new Request(url.toString(), c.req.raw)
  return c.env.USER_SERVICE.fetch(request)
})

// A/B Testing routes
app.route('/', abTesting)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'The requested endpoint does not exist' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('API Gateway Error:', err)
  return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})

export default app
