/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Served under cinacoin.com/wallets via the consolidation router Worker
  // (Phase 3 Multi-Zone). basePath keeps asset + route URLs correct.
  basePath: "/wallets",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@cinacoin/ui"],
};

export default nextConfig;
