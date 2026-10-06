import "server-only";

import { timingSafeEqual } from "node:crypto";
import { draftMode } from "next/headers";

/** Where a draft blog post is previewed; only reachable with draft mode on. */
export const blogPreviewPath = (slug: string) => `/preview/blogs/${encodeURIComponent(slug)}`;

/**
 * Preview routes are open in development for convenience. In production they
 * require draft mode, which is only switched on by `/api/preview` with the
 * shared CONTENTFUL_PREVIEW_SECRET — everyone else gets a 404.
 */
export async function isPreviewAllowed(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  const { isEnabled } = await draftMode();
  return isEnabled;
}

/** True when `candidate` matches CONTENTFUL_PREVIEW_SECRET; always false if none is configured. */
export function isValidPreviewSecret(candidate: string | null): boolean {
  const expected = process.env.CONTENTFUL_PREVIEW_SECRET ?? "";
  if (!expected || !candidate) {
    return false;
  }
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
