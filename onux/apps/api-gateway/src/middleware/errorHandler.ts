import { createMiddleware } from 'hono/factory';
import type { Env } from '../lib/types';
import { ApiGatewayError, InternalError } from '../lib/errors';
import { createLogger } from '../lib/logger';

/**
 * Error handling middleware
 * Catches all errors and returns standardized error responses
 */
export const errorHandler = createMiddleware<{
  Bindings: Env;
}>(async (c, next) => {
  const logger = createLogger({
    level: c.env.LOG_LEVEL as any,
    serviceName: 'api-gateway',
  });

  try {
    await next();
  } catch (error) {
    // Log the error
    logger.error('Request error', error, {
      method: c.req.method,
      path: c.req.path,
    });

    // Handle known API errors
    if (error instanceof ApiGatewayError) {
      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
          request_id: c.req.header('x-request-id') || 'unknown',
          timestamp: new Date().toISOString(),
        },
        error.statusCode as any
      );
    }

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: { issues: (error as any).issues },
          },
          request_id: c.req.header('x-request-id') || 'unknown',
          timestamp: new Date().toISOString(),
        },
        422
      );
    }

    // Handle unknown errors
    const internalError = error instanceof InternalError 
      ? error 
      : new InternalError('An unexpected error occurred');

    return c.json(
      {
        error: {
          code: internalError.code,
          message: c.env.ENVIRONMENT === 'production' 
            ? 'Internal server error' 
            : internalError.message,
          details: c.env.ENVIRONMENT === 'production' ? undefined : internalError.details,
        },
        request_id: c.req.header('x-request-id') || 'unknown',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

/**
 * 404 Not Found handler
 */
export const notFoundHandler = createMiddleware<{
  Bindings: Env;
}>(async (c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
      request_id: c.req.header('x-request-id') || 'unknown',
      timestamp: new Date().toISOString(),
    },
    404
  );
});
