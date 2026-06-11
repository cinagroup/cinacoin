/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: "export",
    images: {
        unoptimized: true,
        formats: ['image/avif', 'image/webp'],
    },
    compress: true,
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
    // Performance: Cache headers
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
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
      ];
    },
};
export default nextConfig;
