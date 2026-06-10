/**
 * Cloud Dashboard Middleware
 * Applies security headers for cloud management interface
 * 
 * SECURITY: Uses nonce-based CSP (auto-generated per request).
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityHeadersMiddleware } from '@cinacoin/next/server';

// SECURITY: Uses nonce-based CSP (auto-generated per request)
export const middleware = securityHeadersMiddleware({
  cspOverrides: {
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'connect-src': [
      "'self'",
      'https://api.cinacoin.com',
      'https://cloud.cinacoin.com',
      'wss://api.cinacoin.com',
    ],
    'frame-src': ["'none'"],
    'frame-ancestors': ["'none'"],
  },
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
