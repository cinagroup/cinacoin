

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Served under cinacoin.com/demo via the consolidation router Worker
  // (Phase 3 Multi-Zone). basePath + assetPrefix keep route + asset URLs
  // correct under the subpath.
  basePath: '/demo',
  assetPrefix: '/demo',
  trailingSlash: true,
  transpilePackages: ['@cinacoin/core-sdk', '@cinacoin/core-ui', '@cinacoin/react'],
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

  // Performance: Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Performance: Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      config.devtool = false;
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
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'lib',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
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
              "connect-src 'self' https://*.cinacoin.com https://*.walletconnect.com https://buy.moonpay.com",
              "frame-src 'self' https://buy.moonpay.com",
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
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
