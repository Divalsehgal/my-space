import { NextResponse } from "next/server";
import { verifyRequest } from "@contentful/node-apps-toolkit";

/**
 * Shared plumbing for the routes the Contentful quiz app calls
 * (/api/contentful/*): CORS for its cross-origin calls and verification of
 * Contentful's request signature (CONTENTFUL_APP_SIGNING_SECRET).
 */

const SIGNATURE_TTL_SECONDS = 60;

// The app is served from Contentful's own domain, so the browser preflights these cross-origin calls.
// Any origin is allowed because access is controlled by the signature, not by cookies.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export const APP_STATUS = { FORBIDDEN: 403, CONFLICT: 409, BAD_GATEWAY: 502 } as const;

export const appReply = (body: unknown, status: number) => NextResponse.json(body, { status, headers: CORS_HEADERS });

export const appPreflight = () => new Response(null, { status: 204, headers: CORS_HEADERS });

/** Whether the request carries a valid, fresh signature from the quiz app over this exact body. */
export function isSignedByApp(req: Request, body: string): boolean {
  const secret = process.env.CONTENTFUL_APP_SIGNING_SECRET;
  if (!secret) { return false; }
  try {
    return verifyRequest(
      secret,
      { method: "POST", path: new URL(req.url).pathname, headers: Object.fromEntries(req.headers), body },
      SIGNATURE_TTL_SECONDS,
    );
  } catch {
    // Expired, malformed or unsigned requests make verifyRequest throw.
    return false;
  }
}

/** Reads and verifies the body; returns the raw JSON text, or the 403 reply to send instead. */
export async function readSignedBody(req: Request): Promise<string | Response> {
  const raw = await req.text();
  return isSignedByApp(req, raw) ? raw : appReply({ error: "Request is not signed by the quiz app." }, APP_STATUS.FORBIDDEN);
}
