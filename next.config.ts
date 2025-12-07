import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "http://localhost:3000",
        "https://effective-waffle-r4v4gqjpp9wjf57g6-3000.app.github.dev",
        "localhost:3000",
        "effective-waffle-r4v4gqjpp9wjf57g6-3000.app.github.dev",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dlckqnherotkbdsfrsoq.supabase.co",
        pathname: "/storage/v1/object/public/avatars/**",
      },
    ],
  },
};

export default nextConfig;
