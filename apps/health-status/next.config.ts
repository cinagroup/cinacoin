import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Since we export statically, we can't use server-side health checks.
  // The page will fetch health data from service-status.json and /health endpoints at runtime in the browser.
  // For deployment as a static site, health checks run client-side.
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
  // Base path if deployed under a subpath (e.g., /status)
  // basePath: process.env.BASE_PATH || "",
};

export default nextConfig;
