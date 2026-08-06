import nextConfig from "./next.config";

jest.mock("@dival-sehgal/next-config", () => ({}));

jest.mock("@ducanh2912/next-pwa", () => ({
    __esModule: true,
    default: () => (config: unknown) => config,
}));

jest.mock("@next/bundle-analyzer", () => ({
    __esModule: true,
    default: () => (config: unknown) => config,
}));



describe("next.config", () => {
    it("loads and exposes headers", async () => {
        expect(nextConfig).toBeDefined();

        if (typeof nextConfig.headers === "function") {
            const headers = await nextConfig.headers();
            expect(Array.isArray(headers)).toBe(true);
            expect(headers[0]?.headers).toBeDefined();
        }
    });
});
