import { isOwnerModeConfigured, isOwnerSecret, isOwnerSession, ownerSessionToken } from "./index";

describe("owner session", () => {
  const original = process.env.ADMIN_VIEW_SECRET;
  afterEach(() => {
    process.env.ADMIN_VIEW_SECRET = original;
  });

  it("is disabled without a configured secret", () => {
    delete process.env.ADMIN_VIEW_SECRET;
    expect(isOwnerModeConfigured()).toBe(false);
    expect(ownerSessionToken()).toBeNull();
    expect(isOwnerSecret("")).toBe(false);
    expect(isOwnerSession("anything")).toBe(false);
  });

  it("accepts only the exact secret", () => {
    process.env.ADMIN_VIEW_SECRET = "correct horse battery staple";
    expect(isOwnerSecret("correct horse battery staple")).toBe(true);
    expect(isOwnerSecret("correct horse battery")).toBe(false);
    expect(isOwnerSecret("")).toBe(false);
  });

  it("issues a session token that is not the secret and verifies it", () => {
    process.env.ADMIN_VIEW_SECRET = "s3cret-value";
    const token = ownerSessionToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(token).not.toContain("s3cret");
    expect(isOwnerSession(token)).toBe(true);
    expect(isOwnerSession("s3cret-value")).toBe(false);
    expect(isOwnerSession(undefined)).toBe(false);
  });

  it("invalidates sessions when the secret is rotated", () => {
    process.env.ADMIN_VIEW_SECRET = "first";
    const token = ownerSessionToken();
    process.env.ADMIN_VIEW_SECRET = "second";
    expect(isOwnerSession(token)).toBe(false);
  });
});
