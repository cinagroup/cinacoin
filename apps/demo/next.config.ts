import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Served under cinacoin.com/demo via the consolidation router Worker
  // (Phase 3 Multi-Zone). basePath keeps asset + route URLs correct.
  basePath: '/demo',
  transpilePackages: ['@cinacoin/core-sdk', '@cinacoin/core-ui', '@cinacoin/react'],
};

export default nextConfig;
