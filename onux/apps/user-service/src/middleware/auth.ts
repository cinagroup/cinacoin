/**
 * Authentication middleware
 * Validates service-to-service API keys or JWT tokens
 */
import { NextRequest, NextResponse } from 'next/server';
import { config } from '../lib/config.js';
import { createLogger } from '../lib/logger.js';
import type { RequestContext } from '../lib/types.js';

const logger = createLogger('user-service-auth');

export interface AuthContext extends RequestContext {
  userId?: string;
  serviceAuth?: boolean;
}

/**
 * Verify service-to-service authentication
 */
export function verifyServiceAuth(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-Service-API-Key');
  const authHeader = request.headers.get('Authorization');

  // Check service API key
  if (apiKey === config.security.serviceApiKey) {
    return true;
  }

  // Check Bearer token (for service-to-service)
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // In production, validate JWT with auth-service
    // For now, accept service API key as Bearer token
    if (token === config.security.serviceApiKey) {
      return true;
    }
  }

  return false;
}

/**
 * Extract user ID from JWT token
 * In production, this would validate with auth-service
 */
export function extractUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  // In production: validate JWT and extract user ID
  // For now, check if it's a service key
  if (token === config.security.serviceApiKey) {
    return null; // Service auth, no user context
  }

  // Mock: extract user ID from token (in production, decode JWT)
  // Format: "user:<userId>"
  if (token.startsWith('user:')) {
    return token.substring(5);
  }

  return null;
}

/**
 * Middleware to require authentication
 */
export function requireAuth(
  request: NextRequest,
  options: { allowServiceAuth?: boolean } = {}
): AuthContext | NextResponse {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();

  // Check service auth
  if (verifyServiceAuth(request)) {
    if (options.allowServiceAuth !== false) {
      return {
        requestId,
        serviceAuth: true,
      };
    }
  }

  // Check user auth
  const userId = extractUserId(request);
  if (userId) {
    return {
      requestId,
      userId,
      serviceAuth: false,
    };
  }

  // Unauthorized
  logger.warn('Unauthorized request', { requestId, path: request.nextUrl.pathname });
  return NextResponse.json(
    { error: 'Unauthorized', message: 'Valid authentication required' },
    { status: 401 }
  );
}

/**
 * Middleware to require service-to-service auth only
 */
export function requireServiceAuth(request: NextRequest): AuthContext | NextResponse {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();

  if (verifyServiceAuth(request)) {
    return {
      requestId,
      serviceAuth: true,
    };
  }

  logger.warn('Unauthorized service request', { requestId, path: request.nextUrl.pathname });
  return NextResponse.json(
    { error: 'Unauthorized', message: 'Service authentication required' },
    { status: 401 }
  );
}
