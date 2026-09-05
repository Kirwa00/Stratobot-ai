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
};

export default nextConfig;