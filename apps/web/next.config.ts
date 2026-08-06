import path from "node:path";
import config from "@dival-sehgal/next-config";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import bundleAnalyzer from "@next/bundle-analyzer";

const getSecurityHeaders = (environment: "development" | "production" = process.env.NODE_ENV === "production" ? "production" : "development") => {
  const isProduction = environment === "production";

  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
  ];

  if (isProduction) {
    headers.push(
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: https: blob:",
          "font-src 'self' https://fonts.gstatic.com data:",
          "connect-src 'self' https: https://www.google-analytics.com https://www.googletagmanager.com",
          "frame-src https://www.youtube.com https://www.google.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
        ].join("; "),
      },
    );
  }

  return headers;
};

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
  poweredByHeader: false,
  compress: true,
  generateBuildId: async () => "portfolio-blog-build",
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
    serverComponentsHmrCache: false,
  },
  sassOptions: {
    ...config.sassOptions,
    loadPaths: [
      path.join(__dirname, "src/styles"),
      path.join(__dirname, "../../packages/design-tokens/build/scss"),
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: getSecurityHeaders(process.env.NODE_ENV === "production" ? "production" : "development"),
      },
    ];
  },
};

export default withBundleAnalyzer(withPWA(nextConfig));