/**
 * Cloudflare Worker Entry Point — User Service
 *
 * Hono-based REST API replacing the original Node.js + Express + gRPC service.
 * Runs on Cloudflare Workers with D1 (SQLite) for persistence.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { requestId } from 'hono/request-id';
import type { Env } from './db/schema';

// Route modules
import users from './routes/users';
import teams from './routes/teams';
import permissions from './routes/permissions';
import apiKeys from './routes/api-keys';
import newsletter from './routes/newsletter';
import { withRateLimit } from './middleware/rate-limit';

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>();

// ─── Global Middleware ────────────────────────────────────────────────────────

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

// Request ID for tracing
app.use('*', requestId());

// CORS — adjust origins for production
app.use(
  '/api/*',
  cors({
    origin: ['https://cinacoin.com', 'https://wallet.cinacoin.com', 'https://backend.cinacoin.com'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key', 'X-CSRF-Token'],
    exposeHeaders: ['X-Request-Id'],
    maxAge: 86400,
    credentials: true,
  })
);

// Logging (dev only — strip in production to reduce overhead)
app.use('*', async (c, next) => {
  if (c.env.ENVIRONMENT !== 'production') {
    return logger()(c, next);
  }
  await next();
});

// Pretty JSON in non-production
app.use('*', async (c, next) => {
  if (c.env.ENVIRONMENT !== 'production') {
    return prettyJSON()(c, next);
  }
  await next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/', (c) => {
  return c.json({
    service: 'cinacoin-users',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

app.get('/health', async (c) => {
  // Verify D1 connectivity
  try {
    const start = Date.now();
    await c.env.DB.prepare('SELECT 1').first();
    const dbLatency = Date.now() - start;

    return c.json({
      status: 'healthy',
      checks: {
        database: { status: 'ok', latency_ms: dbLatency },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json(
      {
        status: 'unhealthy',
        checks: {
          database: { status: 'error', message: err.message },
        },
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});

// ─── Rate Limiting ─────────────────────────────────────────────────────────────

app.use('/api/users/*', withRateLimit('users'));
app.use('/api/teams/*', withRateLimit('teams'));
app.use('/api/api-keys/*', withRateLimit('apiKeys'));
app.use('/api/*', withRateLimit('default'));

// ─── API Routes ───────────────────────────────────────────────────────────────

app.route('/api/users', users);
app.route('/api/teams', teams);
app.route('/api/permissions', permissions);
app.route('/api/api-keys', apiKeys);
app.route('/api/newsletter', newsletter);

// ─── Error Handling ───────────────────────────────────────────────────────────

// 404 — unmatched routes
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  );
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);

  // D1 constraint errors
  if (err.message?.includes('UNIQUE constraint failed')) {
    return c.json(
      { error: 'Conflict', message: 'A record with this value already exists' },
      409
    );
  }
  if (err.message?.includes('FOREIGN KEY constraint failed')) {
    return c.json(
      { error: 'Bad Request', message: 'Referenced record does not exist' },
      400
    );
  }

  return c.json(
    {
      error: 'Internal Server Error',
      message:
        c.env.ENVIRONMENT === 'production'
          ? 'An unexpected error occurred'
          : err.message,
    },
    500
  );
});

// ─── Export ───────────────────────────────────────────────────────────────────

export default app;
