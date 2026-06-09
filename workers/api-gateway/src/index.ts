import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

export interface Env {
  AUTH_SERVICE: Fetcher
  USER_SERVICE: Fetcher
  RATE_LIMIT_KV: KVNamespace
  ENVIRONMENT: string
  API_VERSION: string
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

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['https://cinacoin.com', 'https://wallet.cinacoin.com', 'https://backend.cinacoin.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
}))

// Rate limiting middleware
async function rateLimit(kv: KVNamespace, key: string, max: number, windowMs: number) {
  const now = Date.now()
  const windowKey = `${key}:${Math.floor(now / windowMs)}`
  const count = parseInt(await kv.get(windowKey) || '0')
  
  if (count >= max) {
    return { allowed: false, remaining: 0, resetAt: Math.ceil((Math.floor(now / windowMs) + 1) * windowMs) }
  }
  
  await kv.put(windowKey, String(count + 1), { expirationTtl: Math.ceil(windowMs / 1000) * 2 })
  return { allowed: true, remaining: max - count - 1, resetAt: Math.ceil((Math.floor(now / windowMs) + 1) * windowMs) }
}

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
app.all('/auth/*', async (c) => {
  const limit = await rateLimit(c.env.RATE_LIMIT_KV, `auth:${c.req.header('cf-connecting-ip') || 'unknown'}`, 100, 60000)
  if (!limit.allowed) {
    return c.json({ error: 'Rate limit exceeded', resetAt: limit.resetAt }, 429)
  }
  
  const url = new URL(c.req.url)
  // Auth Service routes are mounted at /auth, keep path as-is
  const request = new Request(url.toString(), c.req.raw)
  return c.env.AUTH_SERVICE.fetch(request)
})

// Users routes - proxy to User Service (map to /api/users/*)
app.all('/users/*', async (c) => {
  const limit = await rateLimit(c.env.RATE_LIMIT_KV, `users:${c.req.header('cf-connecting-ip') || 'unknown'}`, 200, 60000)
  if (!limit.allowed) {
    return c.json({ error: 'Rate limit exceeded', resetAt: limit.resetAt }, 429)
  }
  
  const url = new URL(c.req.url)
  // User Service routes are at /api/users/*, map /users/* → /api/users/*
  url.pathname = '/api' + url.pathname
  const request = new Request(url.toString(), c.req.raw)
  return c.env.USER_SERVICE.fetch(request)
})

// Teams routes - proxy to User Service (map to /api/teams/*)
app.all('/teams/*', async (c) => {
  const limit = await rateLimit(c.env.RATE_LIMIT_KV, `teams:${c.req.header('cf-connecting-ip') || 'unknown'}`, 200, 60000)
  if (!limit.allowed) {
    return c.json({ error: 'Rate limit exceeded', resetAt: limit.resetAt }, 429)
  }
  
  const url = new URL(c.req.url)
  // User Service routes are at /api/teams/*, map /teams/* → /api/teams/*
  url.pathname = '/api' + url.pathname
  const request = new Request(url.toString(), c.req.raw)
  return c.env.USER_SERVICE.fetch(request)
})

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
