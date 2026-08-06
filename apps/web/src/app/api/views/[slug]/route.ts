import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

// Initialize Redis only if the environment variables are present
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!redis) {
    // If Redis is not configured, just return a dummy count so the UI doesn't break
    return NextResponse.json({ viewCount: 0 });
  }

  try {
    const cookies = request.cookies;
    
    // Check for admin opt-out cookie
    const adminSecret = process.env.ADMIN_VIEW_SECRET;
    const hasAdminCookie = 
      adminSecret && 
      cookies.get("ADMIN_VIEW_SECRET")?.value === adminSecret;

    const redisKey = `post:views:${slug}`;

    if (hasAdminCookie) {
      // Admin view: skip incrementing, just get the current count
      const viewCount = await redis.pfcount(redisKey);
      return NextResponse.json({ viewCount });
    }

    // Determine reader ID for deduplication
    let readerId = cookies.get("_reader_id")?.value;
    let isNewReader = false;
    
    if (!readerId) {
      // Generate a new random ID for this visitor
      readerId = crypto.randomBytes(16).toString("hex");
      isNewReader = true;
    }

    // Add reader to HyperLogLog for this slug
    await redis.pfadd(redisKey, readerId);

    // Get the updated unique count
    const viewCount = await redis.pfcount(redisKey);

    const response = NextResponse.json({ viewCount });

    // Set the cookie if it's a new reader so future visits are deduplicated
    if (isNewReader) {
      response.cookies.set("_reader_id", readerId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        // Expire in 1 year
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (error) {
    console.error("Error tracking view:", error);
    // Return 0 or null rather than failing the whole page
    return NextResponse.json({ viewCount: 0 }, { status: 500 });
  }
}
