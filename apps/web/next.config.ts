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

// Contentful's Live Preview pane loads the preview routes in an iframe, so
// those (and only those) may be framed by the Contentful web app.
const CONTENTFUL_APP_ORIGIN = "https://app.contentful.com";
const PREVIEW_ROUTES = ["/preview/:path*", "/api/preview/:path*", "/api/preview"];

function getSecurityHeaders(
  environment: RuntimeEnvironment = "production",
  { frameableByContentful = false } = {},
): Array<{ key: string; value: string }> {
  const isProduction = environment === "production";
  const frameAncestors = frameableByContentful ? `'self' ${CONTENTFUL_APP_ORIGIN}` : "'none'";

  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    // X-Frame-Options can't allow a specific origin, so framable routes rely on
    // CSP frame-ancestors alone.
    ...(frameableByContentful ? [] : [{ key: "X-Frame-Options", value: "DENY" }]),
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
          "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: https: blob:",
          "font-src 'self' https://fonts.gstatic.com data:",
          "connect-src 'self' https: https://www.google-analytics.com https://www.googletagmanager.com",
          "frame-src https://www.youtube.com https://www.google.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          `frame-ancestors ${frameAncestors}`,
        ].join("; "),
      },
    );
  } else if (frameableByContentful) {
    headers.push({ key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` });
  }

  return headers;
}

const nextConfig: NextConfig = {
  ...config,
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  // Workspace packages ship TypeScript/SCSS source; Next compiles them like app
  // code, so per-file exports tree-shake and "use client" boundaries survive.
  transpilePackages: ["@dival-sehgal/ui", "@dival-sehgal/utils"],
  poweredByHeader: false,
  compress: true,
  generateBuildId: () => "portfolio-blog-build",
  experimental: {
    // `inlineCss` is deliberately off: it embedded every stylesheet in each
    // page's HTML (and again in the RSC payload) while the same files were
    // still downloaded, so CSS was paid for twice and never cached across
    // pages. Linked, content-hashed stylesheets are cached immutably instead.
    // Rewrites barrel imports to per-module imports at build time so only
    // what is used ships (MUI is also enforced by an ESLint rule).
    optimizePackageImports: [
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
      "framer-motion",
      "@xyflow/react",
      "@react-three/fiber",
    ],
    serverComponentsHmrCache: false,
  },
  sassOptions: {
    ...config.sassOptions,
    loadPaths: [
      path.join(__dirname, "src/styles"),
      path.join(__dirname, "../../packages/design-tokens/build/scss"),
      // Shared Sass helpers that ship with the UI package (e.g. `motion`).
      path.join(__dirname, "../../packages/ui/src/styles"),
    ],
  },
  redirects() {
    // The About page was merged into the home hero; Search Console still had
    // `/about` as a 404, so send it (and its ranking signals) to the home page.
    return Promise.resolve([{ source: "/about", destination: "/", permanent: true }]);
  },
  headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const environment = isProduction ? "production" : "development";
    const securityHeaders = getSecurityHeaders(environment);
    const previewSecurityHeaders = getSecurityHeaders(environment, { frameableByContentful: true });

    // Long-lived caching is for production builds only. In development, chunk
    // URLs are reused while their contents change, so an `immutable` header
    // pins the browser to stale code ("module factory is not available").
    const cacheRules = isProduction
      ? [
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
        ]
      : [
          {
            // Dev only, once per browser: earlier builds sent `immutable` for
            // dev chunks, so browsers may still hold stale code for lazily
            // loaded chunks (a hard reload doesn't refetch those). Clear the
            // HTTP cache on the next page load, then mark it done. Bump the
            // cookie value to force another reset.
            source: "/:path((?!_next/).*)",
            missing: [{ type: "cookie" as const, key: "dev-cache-reset", value: "v1" }],
            headers: [
              { key: "Clear-Site-Data", value: '"cache"' },
              { key: "Set-Cookie", value: "dev-cache-reset=v1; Path=/; Max-Age=31536000; SameSite=Lax" },
            ],
          },
        ];

    return [
      ...cacheRules,
      {
        // Every route except the preview ones, which get the framable set below.
        source: "/:path((?!preview/|api/preview).*)",
        headers: securityHeaders,
      },
      ...PREVIEW_ROUTES.map((source) => ({ source, headers: previewSecurityHeaders })),
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
