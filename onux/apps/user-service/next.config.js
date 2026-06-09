/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  async rewrites() {
    return [];
  },
};

export default nextConfig;
