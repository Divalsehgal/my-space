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
  ...config,
  sassOptions: {
    ...config.sassOptions,
    additionalData: `@use "@dival-sehgal/design-tokens/variables.scss" as *; @use "${path.join(__dirname, "src/styles/mixins.scss").replace(/\\/g, '/')}" as *;`,
    includePaths: [
      path.join(__dirname, "src", "styles"),
      path.join(__dirname, "node_modules")
    ],
  },
};

export default withPWA(nextConfig);
