import type { NextConfig } from "next";

const CLOUDFLARE_API_URL = process.env.CLOUDFLARE_API_URL || "";

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy API calls and media to Cloudflare when CLOUDFLARE_API_URL is set
    if (CLOUDFLARE_API_URL) {
      return {
        beforeFiles: [
          {
            source: "/api/:path*",
            destination: `${CLOUDFLARE_API_URL}/api/:path*`,
          },
          {
            source: "/product-media/:path*",
            destination: `${CLOUDFLARE_API_URL}/api/media/product-media/:path*`,
          },
        ],
        afterFiles: [],
        fallback: [],
      };
    }
    return { beforeFiles: [], afterFiles: [], fallback: [] };
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "vhash.pages.dev",
      },
      {
        protocol: "https",
        hostname: "*.vhash.pages.dev",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
