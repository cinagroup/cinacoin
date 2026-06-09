import { createMiddleware } from 'hono/factory';
import * as jose from 'jose';
import type { Env, JWTPayload, RequestContext } from '../lib/types';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';

/**
 * JWT authentication middleware
 * Verifies JWT tokens from Authorization header
 */
export const jwtAuth = createMiddleware<{
  Bindings: Env;
  Variables: { context: RequestContext; jwtPayload: JWTPayload };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: 'cinacoin-api',
      audience: 'cinacoin-services',
    });

    const jwtPayload = payload as unknown as JWTPayload;
    c.set('jwtPayload', jwtPayload);

    // Update context with JWT data
    const context = c.get('context');
    context.projectId = jwtPayload.project_id;
    context.permissions = jwtPayload.permissions || [];
    c.set('context', context);

    await next();
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      throw new UnauthorizedError('Token has expired');
    }
    if (error instanceof jose.errors.JWTInvalid) {
      throw new UnauthorizedError('Invalid token format');
    }
    if (error instanceof jose.errors.JWSVerificationFailed) {
      throw new UnauthorizedError('Invalid token signature');
    }
    throw new UnauthorizedError('Token verification failed');
  }
});

/**
 * API Key authentication middleware
 * Verifies API keys from Authorization header
 */
export const apiKeyAuth = createMiddleware<{
  Bindings: Env;
  Variables: { context: RequestContext };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const apiKey = authHeader.slice(7);

  // Hash the API key
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Look up the API key in the database
  const result = await c.env.DB
    .prepare(
      'SELECT id, project_id, is_active, expires_at, permissions FROM api_keys WHERE key_hash = ? AND is_active = 1'
    )
    .bind(keyHash)
    .first<{
      id: string;
      project_id: string;
      is_active: number;
      expires_at: string | null;
      permissions: string;
    }>();

  if (!result) {
    throw new ForbiddenError('Invalid or inactive API key');
  }

  // Check expiration
  if (result.expires_at) {
    const expiresAt = new Date(result.expires_at).getTime();
    if (Date.now() > expiresAt) {
      throw new ForbiddenError('API key has expired');
    }
  }

  // Update last_used_at
  await c.env.DB
    .prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), result.id)
    .run();

  // Update context
  const context = c.get('context');
  context.apiKeyId = result.id;
  context.projectId = result.project_id;
  context.permissions = JSON.parse(result.permissions || '["read"]');
  c.set('context', context);

  await next();
});

/**
 * Permission check middleware factory
 * Checks if the authenticated user has required permissions
 */
export const requirePermission = (requiredPermissions: string | string[]) => {
  return createMiddleware<{
    Bindings: Env;
    Variables: { context: RequestContext };
  }>(async (c, next) => {
    const context = c.get('context');
    const userPermissions = context.permissions || [];
    const required = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    // Check if user has all required permissions
    const hasPermission = required.every((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      throw new ForbiddenError('Insufficient permissions', {
        required,
        granted: userPermissions,
      });
    }

    await next();
  });
};

/**
 * Combined auth middleware
 * Tries JWT first, then API key
 */
export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: { context: RequestContext; jwtPayload?: JWTPayload };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing Authorization header');
  }

  const token = authHeader.slice(7);

  // Try JWT first
  if (token.includes('.')) {
    // Looks like a JWT (has dots)
    try {
      const secret = new TextEncoder().encode(c.env.JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret, {
        issuer: 'cinacoin-api',
        audience: 'cinacoin-services',
      });

      const jwtPayload = payload as unknown as JWTPayload;
      c.set('jwtPayload', jwtPayload);

      const context = c.get('context');
      context.projectId = jwtPayload.project_id;
      context.permissions = jwtPayload.permissions || [];
      c.set('context', context);

      await next();
      return;
    } catch (error) {
      // Not a valid JWT, try API key
    }
  }

  // Try API key
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  const result = await c.env.DB
    .prepare(
      'SELECT id, project_id, is_active, expires_at, permissions FROM api_keys WHERE key_hash = ? AND is_active = 1'
    )
    .bind(keyHash)
    .first<{
      id: string;
      project_id: string;
      is_active: number;
      expires_at: string | null;
      permissions: string;
    }>();

  if (!result) {
    throw new UnauthorizedError('Invalid authentication credentials');
  }

  if (result.expires_at) {
    const expiresAt = new Date(result.expires_at).getTime();
    if (Date.now() > expiresAt) {
      throw new ForbiddenError('API key has expired');
    }
  }

  await c.env.DB
    .prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), result.id)
    .run();

  const context = c.get('context');
  context.apiKeyId = result.id;
  context.projectId = result.project_id;
  context.permissions = JSON.parse(result.permissions || '["read"]');
  c.set('context', context);

  await next();
});
