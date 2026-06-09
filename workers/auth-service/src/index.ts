/**
 * Cloudflare Workers Auth Service - Main Entry Point
 * Hono framework with D1 database and KV storage
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './lib/types.js';

// Import routes
import loginRoute from './routes/auth/login.js';
import registerRoute from './routes/auth/register.js';
import logoutRoute from './routes/auth/logout.js';
import refreshRoute from './routes/auth/refresh.js';
import meRoute from './routes/auth/me.js';
import sessionsRoute from './routes/auth/sessions.js';
import changePasswordRoute from './routes/auth/change-password.js';
import mfaRoutes from './routes/mfa/index.js';
import oauthRoutes from './routes/oauth/index.js';
import twoFaStatusRoute from './routes/auth/2fa-status.js';
import { oneClickAuthRoutes } from './one-click-auth/index.js';
import { enforceTwoFactor } from './middleware/2fa-enforce.js';
import csrfTokenRoute from './routes/auth/csrf-token.js';
import { requireCsrf } from './middleware/csrf.js';
import { withRateLimit } from './middleware/rate-limit.js';

const app = new Hono<{ Bindings: Env }>();

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

// Global middleware
app.use('*', logger());
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: ['https://cinacoin.com', 'https://wallet.cinacoin.com', 'https://backend.cinacoin.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Session-ID'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'cinacoin-auth',
    version: '1.0.0',
    environment: c.env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
  });
});

// CSRF protection for state-changing authenticated requests
app.use('/auth/*', requireCsrf);

// Rate limiting for sensitive endpoints
app.post('/auth/login', withRateLimit('login'));
app.post('/auth/register', withRateLimit('register'));
app.post('/auth/password-reset', withRateLimit('passwordReset'));
app.post('/auth/mfa/verify', withRateLimit('mfaVerify'));
app.use('/auth/oauth/*', withRateLimit('oauth'));

// Mount routes (csrf-token must be before requireCsrf middleware)
app.route('/auth', csrfTokenRoute);
app.route('/auth', loginRoute);
app.route('/auth', registerRoute);
app.route('/auth', logoutRoute);
app.route('/auth', refreshRoute);
app.route('/auth', twoFaStatusRoute);
app.route('/auth', meRoute);
app.route('/auth', sessionsRoute);
app.route('/auth', changePasswordRoute);
app.route('/auth/mfa', mfaRoutes);
app.route('/auth/oauth', oauthRoutes);
app.route('/auth', oneClickAuthRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'Route not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    { error: 'Internal Server Error', message: 'An unexpected error occurred' },
    500
  );
});

export default app;
