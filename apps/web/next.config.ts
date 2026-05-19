// next.config.ts
import path from "node:path";
import config from "@dival-sehgal/next-config";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

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
  turbopack: {},  // Use Turbopack (Next.js 16 default), ignore webpack configs from plugins
  sassOptions: {
    ...config.sassOptions,
    implementation: require.resolve('sass'),
    additionalData: `@use "@dival-sehgal/design-tokens/variables.scss" as *; @use "${path.join(__dirname, "src/styles/mixins.scss").replaceAll('\\', '/')}" as *;`,
    includePaths: [
      path.join(__dirname, "src", "styles"),
      path.join(__dirname, "node_modules")
    ],
  },
};


export default withBundleAnalyzer(withPWA(nextConfig));
