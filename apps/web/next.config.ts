import path from "node:path";
import config from "@dival-sehgal/next-config";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
  turbopack: {},
  sassOptions: {
    ...config.sassOptions,
    loadPaths: [
      path.join(__dirname, "src/styles"),
      path.join(__dirname, "../../packages/design-tokens/build/scss"),
    ],
  },
};

export default withBundleAnalyzer(withPWA(nextConfig));