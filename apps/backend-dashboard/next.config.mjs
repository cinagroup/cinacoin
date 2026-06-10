/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: "export",
    images: {
        unoptimized: true,
    },
    experimental: {
        optimizePackageImports: [
          '@heroicons/react',
          'lucide-react',
          '@cinacoin/ui',
          '@cinacoin/core-sdk',
          'lodash',
          'date-fns',
        ],
    },
};
export default nextConfig;
