/**
 * Backend Dashboard Middleware
 * Applies security headers with stricter CSP for admin interface
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityHeadersMiddleware } from '@cinacoin/next/server';

export const middleware = securityHeadersMiddleware({
  cspOverrides: {
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
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
