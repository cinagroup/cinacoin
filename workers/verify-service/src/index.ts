/**
 * CINAcoin Verify API Service - Main Entry Point
 * Anti-phishing domain verification for Web3 dApps
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './lib/types.js';

// Import routes
import registerRoute from './routes/verify/register.js';
import checkRoute from './routes/verify/check.js';
import domainRoute from './routes/verify/domain.js';

const app = new Hono<{ Bindings: Env }>();

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

app.use('*', async (c, next) => {
  for (const [key, value] of Object.entries(securityHeaders)) {
    c.header(key, value);
  }
  await next();
});

// Global middleware
app.use('*', logger());
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGIN || '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    service: 'CINAcoin Verify API',
    version: '1.0.0',
    status: 'healthy',
    endpoints: {
      register: 'POST /verify/register',
      check: 'GET /verify/check?domain=example.com',
      domain: 'GET /verify/domain?domain=example.com',
    },
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register routes
registerRoute(app);
checkRoute(app);
domainRoute(app);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'not_found', message: 'Endpoint not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    { error: 'internal_error', message: 'An unexpected error occurred' },
    500
  );
});

export default app;
