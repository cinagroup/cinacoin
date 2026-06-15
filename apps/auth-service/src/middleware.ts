import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, type KeyLike } from 'jose';

const publicPaths = ['/login', '/register', '/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/auth/refresh', '/api/auth/mfa'];

// ============================================================
// DEFI-07 FIX: Secure JWT verification
// ============================================================
// PRODUCTION: JWT_SECRET env var is REQUIRED. No insecure fallback.
// Without a real secret, all protected routes return 500 (fail-closed).
// ============================================================

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  
  // DEFI-07: In production, refuse to operate without a proper secret
  if (!secret) {
    const nodeEnv = process.env.NODE_ENV || 'production';
    if (nodeEnv === 'production') {
      throw new Error(
        'DEFI-07: JWT_SECRET environment variable is required in production. ' +
        'Refusing to start with insecure fallback.'
      );
    }
    // Non-production: use a dev-only placeholder (logged as warning)
    console.warn(
      'DEFI-07 WARNING: JWT_SECRET not set. Using insecure dev-only secret. ' +
      'This MUST be configured before deploying to production.'
    );
    return new TextEncoder().encode('dev-only-insecure-secret-do-not-use-in-production');
  }

  // DEFI-07: Reject known-weak secrets
  const weakSecrets = [
    'fallback-secret-change-in-production',
    'secret',
    'changeme',
    'test',
    'dev',
    '123456',
  ];
  if (weakSecrets.includes(secret.toLowerCase()) || secret.length < 32) {
    throw new Error(
      'DEFI-07: JWT_SECRET is too weak or matches a known insecure value. ' +
      'Use a cryptographically random string of at least 32 characters.'
    );
  }

  return new TextEncoder().encode(secret);
}

let _jwtSecret: Uint8Array | null = null;

function jwtSecret(): Uint8Array {
  if (!_jwtSecret) {
    _jwtSecret = getJwtSecret();
  }
  return _jwtSecret;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Allow static resources
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // DEFI-07: Verify JWT token for protected routes
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing or invalid token' },
      { status: 401 }
    );
  }
  
  const token = authHeader.slice(7);
  
  try {
    // DEFI-07: Verify JWT signature, expiration, and algorithm
    const secret = jwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],  // Restrict to HS256 only — prevent algorithm confusion attacks
    });
    
    // DEFI-07: Verify required claims exist
    if (!payload.sub) {
      return NextResponse.json(
        { error: 'Unauthorized: Token missing subject claim' },
        { status: 401 }
      );
    }

    // Attach user info to request headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', String(payload.sub));
    if (payload.email) {
      response.headers.set('x-user-email', String(payload.email));
    }
    
    return response;
  } catch (error) {
    // JWT verification failed (bad signature, expired, malformed, etc.)
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or expired token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
