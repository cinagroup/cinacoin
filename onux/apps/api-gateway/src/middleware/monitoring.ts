import { createMiddleware } from 'hono/factory';
import type { Env, RequestContext } from '../lib/types';
import { createLogger } from '../lib/logger';

/**
 * Monitoring and metrics middleware
 * Collects request metrics for observability dashboards
 */
export const monitoring = createMiddleware<{
  Bindings: Env;
  Variables: { context: RequestContext };
}>(async (c, next) => {
  const logger = createLogger({
    level: c.env.LOG_LEVEL as any,
    serviceName: 'api-gateway-monitoring',
  });

  const startTime = performance.now();
  const context = c.get('context');

  try {
    await next();
  } finally {
    const durationMs = performance.now() - startTime;
    const status = c.res.status;
    const path = normalizePath(c.req.path);

    // Emit structured metrics log
    logger.info('request_metrics', {
      requestId: context.requestId,
      method: c.req.method,
      path,
      status,
      durationMs: Math.round(durationMs * 100) / 100,
      clientIp: context.clientIp,
      projectId: context.projectId,
      apiKeyId: context.apiKeyId,
      userAgent: context.userAgent,
      environment: c.env.ENVIRONMENT,
    });

    // Update usage stats aggregate (daily)
    if (context.projectId && !path.startsWith('/health')) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const isError = status >= 400 ? 1 : 0;

        // Upsert daily usage stats
        await c.env.DB
          .prepare(
            `INSERT INTO usage_stats (id, project_id, api_key_id, endpoint, request_count, error_count, date, created_at)
             VALUES (?, ?, ?, ?, 1, ?, ?, datetime('now'))
             ON CONFLICT(project_id, api_key_id, endpoint, date) DO UPDATE SET
               request_count = request_count + 1,
               error_count = error_count + ?`
          )
          .bind(
            crypto.randomUUID().replace(/-/g, ''),
            context.projectId,
            context.apiKeyId || 'anonymous',
            `${c.req.method} ${path}`,
            isError,
            today,
            isError
          )
          .run();
      } catch (error) {
        // Non-critical: don't fail the request if stats update fails
        logger.error('Failed to update usage stats', error, {
          requestId: context.requestId,
          projectId: context.projectId,
        });
      }
    }
  }
});

/**
 * Normalize path for metrics aggregation
 * Replaces UUIDs and numeric IDs with placeholders
 */
function normalizePath(path: string): string {
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/[0-9a-f]{32}/gi, ':id')
    .replace(/\/\d+\//g, '/:id/')
    .replace(/\/\d+$/g, '/:id');
}
