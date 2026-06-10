import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'export',
    transpilePackages: ['@cinacoin/ui', '@cinacoin/core-sdk'],
    compress: true,
    swcMinify: true,
    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
    },
    experimental: {
        optimizePackageImports: [
          '@heroicons/react',
          'lucide-react',
          '@cinacoin/ui',
          '@cinacoin/core-sdk',
          'lodash',
          'date-fns',
          'react-icons',
        ],
    },
    productionBrowserSourceMaps: false,

    // ── Performance: Compiler optimizations ──────────────────────────
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production' ? {
        exclude: ['error', 'warn'],
      } : false,
    },

    // ── Performance: Webpack customization ───────────────────────────
    webpack: (config, { isServer, dev }) => {
      // Tree shaking optimization
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Split vendor chunks for better caching
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
            // All other node_modules
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'lib',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Shared components
            shared: {
              name: 'shared',
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Don't bundle source maps in production
      if (!dev && !isServer) {
        config.devtool = false;
      }

      return config;
    },

    // ── Performance: Cache headers for static assets ─────────────────
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
            // ── Performance: Long caching for images/fonts ──────────────
            {
                source: '/images/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=604800, stale-while-revalidate=86400',
                    },
                ],
            },
            {
                source: '/fonts/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            // ── Performance: SWR for HTML pages ─────────────────────────
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
            // ── Performance: API response caching ───────────────────────
            {
                source: '/api/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'private, no-cache, no-store, must-revalidate',
                    },
                ],
            },
        ];
    },
};

export default withBundleAnalyzer(nextConfig);
