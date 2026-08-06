import { getSecurityHeaders } from "./security";

describe("getSecurityHeaders", () => {
    it("returns a strong CSP and HSTS policy in production", () => {
        const headers = getSecurityHeaders("production");
        const cspHeader = headers.find((header) => header.key === "Content-Security-Policy");
        const hstsHeader = headers.find((header) => header.key === "Strict-Transport-Security");

        expect(cspHeader).toBeDefined();
        expect(cspHeader?.value).toContain("default-src 'self'");
        expect(hstsHeader).toBeDefined();
        expect(hstsHeader?.value).toContain("max-age=31536000");
    });

    it("does not include HSTS in development", () => {
        const headers = getSecurityHeaders("development");
        const hstsHeader = headers.find((header) => header.key === "Strict-Transport-Security");

        expect(hstsHeader).toBeUndefined();
    });
});
