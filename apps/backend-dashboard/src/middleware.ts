/**
 * Backend Dashboard Middleware
 * Applies security headers with stricter CSP for admin interface
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
      'https://analytics.cinacoin.com',
      'wss://api.cinacoin.com',
    ],
    'frame-src': ["'none'"], // No frames in admin
    'frame-ancestors': ["'none'"], // Prevent embedding
  },
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
