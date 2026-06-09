import { createMiddleware } from 'hono/factory';
import type { Env, RequestContext } from '../lib/types';
import { createLogger } from '../lib/logger';

/**
 * Request persistence middleware
 * Persists request/response data to the database for analytics.
 * Runs after the response is generated (in the "finally" block)
 * so it doesn't add latency to the response.
 */
export const requestPersistence = createMiddleware<{
  Bindings: Env;
  Variables: { context: RequestContext };
}>(async (c, next) => {
  const logger = createLogger({
    level: c.env.LOG_LEVEL as any,
    serviceName: 'api-gateway-persistence',
  });

  const startTime = Date.now();

  try {
    await next();
  } finally {
    const duration = Date.now() - startTime;
    const context = c.get('context');
    const status = c.res.status;
    const errorCode = status >= 400 ? statusToErrorCode(status) : null;

    // Only log API requests (skip health checks and static assets)
    const path = c.req.path;
    if (path.startsWith('/health') || path.startsWith('/_')) {
      return;
    }

    // Persist to database asynchronously (don't block response)
    try {
      const id = crypto.randomUUID().replace(/-/g, '');
      await c.env.DB
        .prepare(
          `INSERT INTO request_logs (id, project_id, api_key_id, method, path, status, duration_ms, client_ip, user_agent, error_code, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        )
        .bind(
          id,
          context.projectId || null,
          context.apiKeyId || null,
          c.req.method,
          path,
          status,
          duration,
          context.clientIp,
          context.userAgent || null,
          errorCode
        )
        .run();
    } catch (error) {
      // Log failure shouldn't affect the response
      logger.error('Failed to persist request log', error, {
        requestId: context.requestId,
        path,
        status,
      });
    }
  }
});

/**
 * Map HTTP status codes to error code strings
 */
function statusToErrorCode(status: number): string {
  if (status >= 500) return 'INTERNAL_ERROR';
  if (status === 429) return 'RATE_LIMIT_EXCEEDED';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 422) return 'VALIDATION_ERROR';
  if (status === 400) return 'BAD_REQUEST';
  return 'CLIENT_ERROR';
}
