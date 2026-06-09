import { createMiddleware } from 'hono/factory';
import type { Env, RequestContext } from '../lib/types';
import { createLogger } from '../lib/logger';

/**
 * Request logging middleware
 * Persists request/response data to the database for analytics
 */
export const requestLogger = createMiddleware<{
  Bindings: Env;
  Variables: { context: RequestContext };
}>(async (c, next) => {
  const logger = createLogger({
    level: c.env.LOG_LEVEL as any,
    serviceName: 'api-gateway-request-logger',
  });

  const startTime = Date.now();

  try {
    await next();
  } finally {
    const duration = Date.now() - startTime;
    const context = c.get('context');
    const status = c.res.status;
    const errorCode = status >= 400 ? extractErrorCode(c.res) : null;

    // Only log API requests (skip health checks and static assets)
    const path = c.req.path;
    if (path.startsWith('/health') || path.startsWith('/_')) {
      return;
    }

    // Log to database asynchronously (don't block response)
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
 * Extract error code from response body (best effort)
 */
function extractErrorCode(response: Response): string | null {
  try {
    // We can't read the body here since it's already sent,
    // so we use status-based error codes
    if (response.status >= 500) return 'INTERNAL_ERROR';
    if (response.status === 429) return 'RATE_LIMIT_EXCEEDED';
    if (response.status === 401) return 'UNAUTHORIZED';
    if (response.status === 403) return 'FORBIDDEN';
    if (response.status === 404) return 'NOT_FOUND';
    if (response.status === 422) return 'VALIDATION_ERROR';
    return 'CLIENT_ERROR';
  } catch {
    return null;
  }
}
