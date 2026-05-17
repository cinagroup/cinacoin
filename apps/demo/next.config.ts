import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cinaconnect/core-sdk', '@cinaconnect/core-ui', '@cinaconnect/react'],
};

export default nextConfig;
