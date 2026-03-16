// next.config.ts
import path from "path";
import config from "@dival-sehgal/next-config";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV !== "production",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  ...config,
  sassOptions: {
    ...config.sassOptions,
    additionalData: `@use "${path.join(__dirname, "src/styles/dist/tokens.generated.scss").replace(/\\/g, '/')}" as *; @use "${path.join(__dirname, "src/styles/mixins.scss").replace(/\\/g, '/')}" as *;`,
    includePaths: [
      ...(config.sassOptions?.includePaths || []),
      path.join(__dirname, "src", "styles"),
      path.join(__dirname, "node_modules")
    ],
  },
  output: 'standalone',
  productionBrowserSourceMaps: true,
  experimental: {
    ...config.experimental,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      },
      {
        protocol: "https",
        hostname: "images.pexels.com"
      }
    ]
  },
};

export default withPWA(nextConfig);
