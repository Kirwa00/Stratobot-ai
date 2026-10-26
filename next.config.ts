import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mobile performance optimizations
  reactStrictMode: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [420, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // PGlite (local-development Postgres) ships WASM; load it from node_modules, don't bundle it.
  serverExternalPackages: ["@electric-sql/pglite"],

  // The beta programme ended when paid EAs launched; send old links somewhere useful.
  async redirects() {
    return [
      { source: "/beta", destination: "/pricing", permanent: true },
      { source: "/blog/stratobot-beta-launch", destination: "/pricing", permanent: true },
    ];
  },
};

export default nextConfig;