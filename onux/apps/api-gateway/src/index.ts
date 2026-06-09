import { Hono } from 'hono';
import type { Env, RequestContext } from './lib/types';
import { createConfig } from './lib/config';
import { createLogger } from './lib/logger';

// Middleware
import { requestContext, requestLogger, corsMiddleware } from './middleware/context';
import { tieredRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import { healthRoutes } from './routes/health';
import { projectRoutes } from './routes/projects';
import { apiKeyRoutes } from './routes/apiKeys';
import { usageRoutes } from './routes/usage';
import { proxyRoutes } from './routes/proxy';

/**
 * Cinacoin API Gateway
 * 
 * Main entry point for all API requests.
 * Handles authentication, rate limiting, routing, and proxying to upstream services.
 */
const app = new Hono<{ Bindings: Env; Variables: { context: RequestContext } }>();

// ─────────────────────────────────────────────────────────────
// Global Middleware (order matters!)
// ─────────────────────────────────────────────────────────────

// 1. Request context (request ID, client IP)
app.use('*', requestContext);

// 2. CORS
app.use('*', corsMiddleware);

// 3. Request logging
app.use('*', requestLogger);

// 4. Error handling (wraps all downstream middleware)
app.use('*', errorHandler);

// 5. Rate limiting
app.use('/api/*', tieredRateLimiter);

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────

// Health checks (public, no auth)
app.route('/health', healthRoutes());

// API routes
app.route('/api/projects', projectRoutes());
app.route('/api/keys', apiKeyRoutes());
app.route('/api/usage', usageRoutes());

// Proxy routes (forward to upstream services)
app.route('/api', proxyRoutes());

// ─────────────────────────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────────────────────────

app.notFound(notFoundHandler);

// ─────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────

export default app;
