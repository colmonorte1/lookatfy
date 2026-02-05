import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@getbrevo/brevo'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ourxhxebtvjnzhvhnyna.supabase.co',
        port: '',
        pathname: '/storage/v1/**',
      },
    ],
  },
};

export default nextConfig;
