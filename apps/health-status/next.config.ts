import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Since we export statically, we can't use server-side health checks.
  // The page will fetch health data from service-status.json and /health endpoints at runtime in the browser.
  // For deployment as a static site, health checks run client-side.
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: [
      '@heroicons/react',
      'lucide-react',
      '@cinacoin/ui',
      '@cinacoin/core-sdk',
      'lodash',
      'date-fns',
    ],
  },
  // Base path if deployed under a subpath (e.g., /status)
  // basePath: process.env.BASE_PATH || "",

  async headers() {
    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-eval';
      style-src 'self';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https:;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `;

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\n/g, '').replace(/\s{2,}/g, ' ').trim()
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
