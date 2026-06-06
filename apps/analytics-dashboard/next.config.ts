import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  transpilePackages: ['@cinacoin/ui'],
  // Served under cinacoin.com/analytics via the consolidation router Worker
  // (Phase 3 Multi-Zone). basePath + assetPrefix keep route + asset URLs
  // correct under the subpath.
  basePath: '/analytics',
  assetPrefix: '/analytics',
};

export default nextConfig;
