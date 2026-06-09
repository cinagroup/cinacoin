/**
 * Authentication middleware
 * Verifies JWT tokens and attaches user to request
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '../lib/jwt.js';
import type { AccessTokenPayload } from '../lib/jwt.js';

// Extend NextRequest to include user property
declare module 'next/server' {
  interface NextRequest {
    user?: AccessTokenPayload;
  }
}

/**
 * Middleware to require authentication
 * Extracts and verifies Bearer token from Authorization header
 */
export function requireAuth(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const [scheme, token] = authHeader.split(' ');
    
    if (scheme !== 'Bearer' || !token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid authorization scheme' },
        { status: 401 }
      );
    }

    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
      return handler(req, context);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware to require specific role
 */
export function requireRole(...roles: string[]) {
  return (handler: Function) => {
    return requireAuth(async (req: NextRequest, context?: any) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      return handler(req, context);
    });
  };
}

/**
 * Optional auth middleware
 * Attaches user if token present, but doesn't require it
 */
export function optionalAuth(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    const authHeader = req.headers.get('authorization');
    
    if (authHeader) {
      const [scheme, token] = authHeader.split(' ');
      
      if (scheme === 'Bearer' && token) {
        try {
          const payload = verifyAccessToken(token);
          req.user = payload;
        } catch {
          // Token invalid, continue without user
        }
      }
    }
    
    return handler(req, context);
  };
}
