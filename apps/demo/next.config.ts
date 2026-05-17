import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  transpilePackages: ['@cinaconnect/core-sdk', '@cinaconnect/core-ui', '@cinaconnect/react'],
};

export default nextConfig;
