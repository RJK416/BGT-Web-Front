import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    // Ensure app dir features are enabled and compatible for hosting
    optimizePackageImports: ['react', 'react-dom'],
  },
  // Expose public runtime env (Amplify will inject NEXT_PUBLIC_* at build time)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
