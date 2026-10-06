import { draftMode } from "next/headers";
import { blogPreviewPath, isPreviewAllowed, isValidPreviewSecret } from "./preview";

jest.mock("next/headers", () => ({ draftMode: jest.fn() }));

const env = process.env as Record<string, string | undefined>;

describe("preview access", () => {
  const original = { secret: env.CONTENTFUL_PREVIEW_SECRET, nodeEnv: env.NODE_ENV };
  afterEach(() => {
    env.CONTENTFUL_PREVIEW_SECRET = original.secret;
    env.NODE_ENV = original.nodeEnv;
  });

  it("builds an encoded preview path", () => {
    expect(blogPreviewPath("a b")).toBe("/preview/blogs/a%20b");
  });

  it("rejects every secret when none is configured", () => {
    delete env.CONTENTFUL_PREVIEW_SECRET;
    expect(isValidPreviewSecret("")).toBe(false);
    expect(isValidPreviewSecret(null)).toBe(false);
  });

  it("accepts only the exact secret", () => {
    env.CONTENTFUL_PREVIEW_SECRET = "preview-secret";
    expect(isValidPreviewSecret("preview-secret")).toBe(true);
    expect(isValidPreviewSecret("preview")).toBe(false);
    expect(isValidPreviewSecret(null)).toBe(false);
  });

  it("is open outside production without draft mode", async () => {
    env.NODE_ENV = "development";
    await expect(isPreviewAllowed()).resolves.toBe(true);
    expect(draftMode).not.toHaveBeenCalled();
  });

  it("requires draft mode in production", async () => {
    env.NODE_ENV = "production";
    jest.mocked(draftMode).mockResolvedValueOnce({ isEnabled: false } as never);
    await expect(isPreviewAllowed()).resolves.toBe(false);
    jest.mocked(draftMode).mockResolvedValueOnce({ isEnabled: true } as never);
    await expect(isPreviewAllowed()).resolves.toBe(true);
  });
});
