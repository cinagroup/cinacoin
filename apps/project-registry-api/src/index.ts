import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SCHEMA } from './db/schema';
import { projectRoutes } from './routes/projects';
import { keyRoutes } from './routes/keys';
import { usageRoutes } from './routes/usage';
import { createRateLimiter } from './middleware/rateLimiter';
import type { Env } from './db/types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

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
