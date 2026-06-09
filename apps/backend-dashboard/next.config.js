/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Static export for Cloudflare Pages
  images: {
    unoptimized: true,  // Cloudflare Pages doesn't support Next.js image optimization
  },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
