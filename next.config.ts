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
};

export default nextConfig;
