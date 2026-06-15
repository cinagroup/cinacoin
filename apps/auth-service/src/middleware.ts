import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const publicPaths = ['/login', '/register', '/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/auth/refresh', '/api/auth/mfa'];

// SEC-07 FIX: JWT verification configuration
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-in-production');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 允许公开路径
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // 允许静态资源
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // SEC-07 FIX: Verify JWT token for protected routes
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing or invalid token' },
      { status: 401 }
    );
  }
  
  const token = authHeader.slice(7);
  
  try {
    // Verify JWT signature and expiration
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    
    // Attach user info to request headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', String(payload.sub || ''));
    response.headers.set('x-user-email', String(payload.email || ''));
    
    return response;
  } catch (error) {
    // JWT verification failed
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or expired token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
