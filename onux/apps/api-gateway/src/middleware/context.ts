import { createMiddleware } from 'hono/factory';
import type { Env, RequestContext } from '../lib/types';
import { createLogger } from '../lib/logger';
import { generateRequestId, getClientIp } from '../lib/utils';

/**
 * Request context middleware
 * Attaches request ID, client IP, and other context to each request
 */
export const requestContext = createMiddleware<{
  Bindings: Env;
  Variables: { context: RequestContext };
}>(async (c, next) => {
  const requestId = c.req.header('x-request-id') || generateRequestId();
  const clientIp = getClientIp(c.req.raw);
  const userAgent = c.req.header('user-agent');

  const context: RequestContext = {
    requestId,
    clientIp,
    userAgent,
    permissions: [],
  };

  c.set('context', context);
  c.header('X-Request-ID', requestId);

  await next();
});

/**
 * Logging middleware
 * Logs all HTTP requests with structured data
 */
export const requestLogger = createMiddleware<{
  Bindings: Env;
  Variables: { context: RequestContext };
}>(async (c, next) => {
  const logger = createLogger({
    level: c.env.LOG_LEVEL as any,
    serviceName: 'api-gateway',
  });

  const startTime = Date.now();
  const context = c.get('context');

  try {
    await next();

    const duration = Date.now() - startTime;
    logger.httpRequest({
      requestId: context.requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Request failed', error, {
      requestId: context.requestId,
      method: c.req.method,
      path: c.req.path,
      duration,
    });
    throw error;
  }
});

/**
 * CORS middleware
 * Handles Cross-Origin Resource Sharing
 */
export const corsMiddleware = createMiddleware<{
  Bindings: Env;
}>(async (c, next) => {
  const origin = c.req.header('origin') || '';
  const allowedOrigins = c.env.ENVIRONMENT === 'production'
    ? ['https://cinacoin.com', 'https://www.cinacoin.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'https://cinacoin.com'];

  const isAllowed = allowedOrigins.includes(origin) || c.env.ENVIRONMENT === 'development';

  if (isAllowed) {
    c.header('Access-Control-Allow-Origin', origin || '*');
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-API-Key');
  c.header('Access-Control-Max-Age', '86400');
  c.header('Access-Control-Allow-Credentials', 'true');

  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  await next();
});
