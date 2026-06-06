import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  // NOTE: /demo Multi-Zone consolidation deferred — the demo's static export
  // build needs repair (it was relying on a committed out/ that masked a
  // broken `next build`). Keep demo on its standalone demo.cinacoin.com until
  // the build is fixed, then re-add basePath:'/demo' + assetPrefix:'/demo'.
  transpilePackages: ['@cinacoin/core-sdk', '@cinacoin/core-ui', '@cinacoin/react'],
};

export default nextConfig;
