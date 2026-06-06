/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
  // Served under cinacoin.com/dashboard via the consolidation router Worker
  // (Phase 3 Multi-Zone). basePath + assetPrefix keep route + asset URLs
  // correct under the subpath.
  basePath: '/dashboard',
  assetPrefix: '/dashboard',
};

export default nextConfig;
