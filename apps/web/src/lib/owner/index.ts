import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Owner mode, verified on the server only. The owner signs in once at /owner
 * with ADMIN_VIEW_SECRET; the browser then holds an httpOnly cookie carrying
 * an HMAC of a fixed label — never the secret itself — which API routes check.
 * Nothing about the secret is ever sent to client code.
 */
export const OWNER_SESSION_COOKIE = "owner_session";
/** Non-sensitive, JS-readable hint so client code can skip analytics for the owner. */
export const OWNER_FLAG_COOKIE = "owner_mode";
export { SECONDS_PER_YEAR as OWNER_COOKIE_MAX_AGE } from "@dival-sehgal/utils/time";

const secret = () => process.env.ADMIN_VIEW_SECRET || "";

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** True when owner mode can be used at all (a secret is configured). */
export function isOwnerModeConfigured(): boolean {
  return secret().length > 0;
}

/** The session token for the configured secret; rotating the secret signs everyone out. */
export function ownerSessionToken(): string | null {
  const key = secret();
  return key ? createHmac("sha256", key).update("owner-session:v1").digest("hex") : null;
}

/** Constant-time check of a secret typed by the owner. */
export function isOwnerSecret(candidate: string): boolean {
  const key = secret();
  return key.length > 0 && safeEqual(candidate, key);
}

/** Constant-time check of a session cookie value. */
export function isOwnerSession(value: string | undefined | null): boolean {
  const token = ownerSessionToken();
  return Boolean(token && value && safeEqual(value, token));
}
