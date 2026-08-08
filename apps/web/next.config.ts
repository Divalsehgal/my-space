import path from "node:path";
import config from "@dival-sehgal/next-config";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Security headers are defined inline rather than imported from a sibling module
// on purpose. `next.config.ts` is transpiled and evaluated as a standalone
// CommonJS module (Next compiles only this file, not its imports), so a relative
// import like `./src/lib/security` is resolved against `process.cwd()` and fails
// with "Cannot find module" whenever the config is loaded from outside
// `apps/web` — e.g. from the monorepo root during a husky/lint-staged pre-commit
// run. Keeping the logic here makes the config self-contained (a single source
// of truth) and removes that cwd-dependent fragility.
type RuntimeEnvironment = "development" | "production" | "test";

function getSecurityHeaders(
  environment: RuntimeEnvironment = "production",
): Array<{ key: string; value: string }> {
  const isProduction = environment === "production";

  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
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
}

const nextConfig: NextConfig = {
  ...config,
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
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
    const securityHeaders = getSecurityHeaders(
      process.env.NODE_ENV === "production" ? "production" : "development",
    );

    return [
      {
        // Content-hashed build assets never change for a given URL, so they can
        // be cached forever without revalidation round-trips.
        source: '/_next/static/(.*)',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Public assets (avatar, icons, local fonts, manifest, etc.) served
        // from the site root. The negative lookahead keeps this rule from also
        // matching `/_next/*` paths — those are content-hashed and handled by
        // the immutable rule above. Without it, the shorter TTL here would
        // override the immutable one and cap hashed fonts at a 1-day lifetime.
        // These files are stable between deploys, so a long max-age with
        // stale-while-revalidate maximises cache hits on repeat visits while
        // still allowing background refresh.
        source: String.raw`/:file((?!_next/).*\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|ttf|woff|woff2|json))`,
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
