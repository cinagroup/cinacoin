import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createLogger } from '@cinacoin/logger';
import { SCHEMA } from './db/schema';
import { projectRoutes } from './routes/projects';
import { keyRoutes } from './routes/keys';
import { usageRoutes } from './routes/usage';
import { createRateLimiter } from './middleware/rateLimiter';
import type { Env } from './db/types';

const logger = createLogger({ name: 'project-registry-api', level: 'info' });

const app = new Hono<{ Bindings: Env }>();

// SECURITY: Restrict CORS to specific origins
const ALLOWED_ORIGINS = [
  'https://cinacoin.com',
  'https://www.cinacoin.com',
  'https://cloud.cinacoin.com',
  'https://backend.cinacoin.com',
  'https://analytics.cinacoin.com',
];

app.use('*', cors({
  origin: ALLOWED_ORIGINS,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Owner-Address'],
  maxAge: 86400,
}));

// Apply rate limiting to all API routes
app.use('/api/*', createRateLimiter({ windowMs: 60_000, limit: 100 }));

// Initialize DB schema on startup
app.use('*', async (c, next) => {
  const db = c.env.DB;
  try {
    const statements = SCHEMA.split(';').filter((s) => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        await db.prepare(stmt.trim()).run();
      }
    }
  } catch {
    // Schema already initialized or migration in progress
  }
  await next();
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', environment: c.env.ENVIRONMENT }));

// API routes
const projects = projectRoutes();
const keys = keyRoutes();
const usage = usageRoutes();

app.route('/api/projects', projects);
app.route('/api', keys);
app.route('/api', usage);

export default app;
