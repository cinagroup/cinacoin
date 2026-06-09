/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Static export for Cloudflare Pages
  images: {
    unoptimized: true,  // Cloudflare Pages doesn't support Next.js image optimization
  },
  // Disable server-side features not supported by static export
  trailingSlash: true,
  // Ignore ESLint and TypeScript errors during build (optional, remove if you want strict checks)
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
