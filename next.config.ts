import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    middlewareClientMaxBodySize: 104857600,
  },
  async headers() {
    return [
      {
        source: "/admin/(.*)", // Only for admin routes to be safe
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/sitemap-images.xml",
        destination: "/api/sitemaps/images",
      },
      {
        source: "/sitemap-videos.xml",
        destination: "/api/sitemaps/videos",
      },
    ];
  },
};

export default nextConfig;
