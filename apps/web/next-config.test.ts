import nextConfig from "./next.config";

jest.mock("@dival-sehgal/next-config", () => ({}));

jest.mock("@next/bundle-analyzer", () => ({
    __esModule: true,
    default: () => (config: unknown) => config,
}));



const env = process.env as Record<string, string | undefined>;
const withNodeEnv = async <T,>(value: string, run: () => T | Promise<T>): Promise<T> => {
    const previous = env.NODE_ENV;
    env.NODE_ENV = value;
    try {
        return await run();
    } finally {
        env.NODE_ENV = previous;
    }
};

describe("next.config", () => {
    it("loads and exposes headers", async () => {
        expect(nextConfig).toBeDefined();

        if (typeof nextConfig.headers === "function") {
            const headers = await nextConfig.headers();
            expect(Array.isArray(headers)).toBe(true);
            expect(headers[0]?.headers).toBeDefined();
        }
    });

    it("caches content-hashed _next/static assets as immutable for a year in production", async () => {
        if (typeof nextConfig.headers !== "function") {return;}

        const headers = await withNodeEnv("production", () => nextConfig.headers!());
        const staticRule = headers.find((rule) =>
            rule.source.includes("/_next/static"),
        );

        const cacheControl = staticRule?.headers.find(
            (header) => header.key === "Cache-Control",
        );

        expect(cacheControl?.value).toBe(
            "public, max-age=31536000, immutable",
        );
    });

    it("does not let the public-asset rule downgrade hashed font caching", async () => {
        if (typeof nextConfig.headers !== "function") {return;}

        const headers = await withNodeEnv("production", () => nextConfig.headers!());
        const publicRule = headers.find(
            (rule) =>
                rule.source.includes("ttf") &&
                !rule.source.includes("/_next/static"),
        );

        // The public-asset rule must exclude `/_next/*` so it cannot override
        // the immutable Cache-Control applied to content-hashed fonts.
        expect(publicRule?.source).toContain("(?!_next/)");

        const cacheControl = publicRule?.headers.find(
            (header) => header.key === "Cache-Control",
        );

        expect(cacheControl?.value).toContain("max-age=31536000");
    });

    it("applies baseline security headers to every route", async () => {
        if (typeof nextConfig.headers !== "function") {return;}

        const headers = await nextConfig.headers();
        const catchAllRule = headers.find((rule) => rule.source === "/:path((?!preview/|api/preview).*)");

        expect(catchAllRule).toBeDefined();

        const contentTypeOptions = catchAllRule?.headers.find(
            (header) => header.key === "X-Content-Type-Options",
        );
        expect(contentTypeOptions?.value).toBe("nosniff");

        // Caching is scoped to the asset rules (§4.1); the security set must not
        // emit a Cache-Control that would override the immutable rule above.
        const cacheControl = catchAllRule?.headers.find(
            (header) => header.key === "Cache-Control",
        );
        expect(cacheControl).toBeUndefined();
    });

    it("sends no long-lived Cache-Control in development (dev chunk URLs are reused)", async () => {
        if (typeof nextConfig.headers !== "function") {return;}

        const headers = await withNodeEnv("development", () => nextConfig.headers!());
        const cacheHeaders = headers.flatMap((rule) => rule.headers).filter((header) => header.key === "Cache-Control");

        expect(cacheHeaders).toEqual([]);
    });

    it("lets only the Contentful web app frame the preview routes", async () => {
        if (typeof nextConfig.headers !== "function") {return;}

        const headers = await withNodeEnv("production", () => nextConfig.headers!());
        const find = (source: string, key: string) =>
            headers.find((rule) => rule.source === source)?.headers.find((header) => header.key === key)?.value;

        const catchAll = "/:path((?!preview/|api/preview).*)";
        expect(find(catchAll, "X-Frame-Options")).toBe("DENY");
        expect(find(catchAll, "Content-Security-Policy")).toContain("frame-ancestors 'none'");

        for (const source of ["/preview/:path*", "/api/preview"]) {
            expect(find(source, "X-Frame-Options")).toBeUndefined();
            expect(find(source, "Content-Security-Policy")).toContain("frame-ancestors 'self' https://app.contentful.com");
        }
    });
});
