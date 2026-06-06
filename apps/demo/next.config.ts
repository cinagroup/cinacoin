import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Served under cinacoin.com/demo via the consolidation router Worker
  // (Phase 3 Multi-Zone). basePath + assetPrefix keep asset + route URLs
  // correct under the subpath.
  basePath: '/demo',
  assetPrefix: '/demo',
  transpilePackages: ['@cinacoin/core-sdk', '@cinacoin/core-ui', '@cinacoin/react'],
};

export default nextConfig;
