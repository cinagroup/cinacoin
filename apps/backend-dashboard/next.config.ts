import type { NextConfig } from "next";

/**
 * Backend Dashboard Next.js config with security headers.
 *
 * Adds CSP, HSTS, and other security headers to all responses.
 * For SSR mode (remove `output: 'export'` if you want dynamic API routes).
 */
const nextConfig: NextConfig = {
  // Static export mode (API routes disabled in _auth_disabled)
  output: "export",

  // Redirects for legacy route names
  async redirects() {
    return [
      { source: '/appkit', destination: '/', permanent: true },
      { source: '/auth', destination: '/login', permanent: true },
      { source: '/keys', destination: '/keys-server', permanent: true },
      { source: '/relay', destination: '/relay-server', permanent: true },
      { source: '/rpc', destination: '/rpc-proxy', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self' https://*.cinacoin.com https://*.walletconnect.com",
              "frame-src 'none'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '0',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
