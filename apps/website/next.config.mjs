/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'export',
    compress: true,
    images: {
        unoptimized: true,
    },
    experimental: {
        optimizePackageImports: ['@heroicons/react', 'lucide-react'],
    },
    // Minify HTML output
    productionBrowserSourceMaps: false,
};

export default nextConfig;
