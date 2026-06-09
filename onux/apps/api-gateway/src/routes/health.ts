import { Hono } from 'hono';
import type { Env, RequestContext } from '../lib/types';
import { BadRequestError } from '../lib/errors';

/**
 * Health check routes
 * Public endpoints for monitoring and readiness checks
 */
export function healthRoutes() {
  const router = new Hono<{ Bindings: Env }>();

  // Basic health check
  router.get('/', (c) => {
    return c.json({
      status: 'ok',
      service: 'cinacoin-api-gateway',
      version: '1.0.0',
      environment: c.env.ENVIRONMENT,
      timestamp: new Date().toISOString(),
    });
  });

  // Detailed readiness check
  router.get('/ready', async (c) => {
    const checks: Record<string, { status: string; latencyMs?: number }> = {};

    // Check database connectivity
    try {
      const start = Date.now();
      await c.env.DB.prepare('SELECT 1').run();
      checks.database = { status: 'ok', latencyMs: Date.now() - start };
    } catch (error) {
      checks.database = { status: 'error' };
    }

    // Check KV connectivity
    try {
      const start = Date.now();
      await c.env.RATE_LIMIT_KV.get('health_check');
      checks.kv = { status: 'ok', latencyMs: Date.now() - start };
    } catch (error) {
      checks.kv = { status: 'error' };
    }

    const allHealthy = Object.values(checks).every((c) => c.status === 'ok');

    return c.json(
      {
        status: allHealthy ? 'ready' : 'degraded',
        service: 'cinacoin-api-gateway',
        environment: c.env.ENVIRONMENT,
        timestamp: new Date().toISOString(),
        checks,
      },
      allHealthy ? 200 : 503
    );
  });

  // Liveness check (lightweight)
  router.get('/live', (c) => {
    return c.json({ status: 'alive', timestamp: new Date().toISOString() });
  });

  return router;
}
