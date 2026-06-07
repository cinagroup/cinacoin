/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@cinacoin/react',
    '@cinacoin/core-sdk',
    '@cinacoin/nft-display',
  ],
};

export default nextConfig;
