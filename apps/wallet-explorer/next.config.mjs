/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
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
        // Note: sideEffects: false removed — can break packages that rely on side-effect imports
      };
    }
    return config;
  },
  // NOTE: headers() removed — not compatible with output: 'export' (static export).
  // Security headers are configured via Cloudflare Pages _headers file instead.
};

export default nextConfig;
