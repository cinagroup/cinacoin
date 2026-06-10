import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/**
 * Backend Dashboard Next.js config with security + performance optimizations.
 */
const baseConfig: NextConfig = {
  // Static export mode (API routes disabled in _auth_disabled)
  output: "export",

  // Performance: SWC minification
  swcMinify: true,

  // Performance: Transpile internal packages
  transpilePackages: ['@cinacoin/ui', '@cinacoin/core-sdk'],

  // Performance: Image optimization
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },

  // Performance: Package import optimization
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

  // Performance: Remove console in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Performance: Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'framework',
            priority: 40,
            enforce: true,
            reuseExistingChunk: true,
          },
          ui: {
            test: /[\\/]node_modules[\\/](@cinacoin[\\/]ui|@cinacoin[\\/]design-tokens)[\\/]/,
            name: 'cinacoin-ui',
            priority: 30,
            reuseExistingChunk: true,
          },
          sdk: {
            test: /[\\/]node_modules[\\/]@cinacoin[\\/]core-sdk[\\/]/,
            name: 'cinacoin-sdk',
            priority: 30,
            reuseExistingChunk: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: 'lib',
            priority: 10,
            reuseExistingChunk: true,
          },
          shared: {
            name: 'shared',
            minChunks: 2,
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      },
    };

    if (!dev && !isServer) {
      config.devtool = false;
    }

    return config;
  },

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
              "style-src 'self'",
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
      // ── Performance: Immutable caching for hashed static assets ──
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // ── Performance: SWR for HTML pages ──────────────────────────
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(baseConfig);
