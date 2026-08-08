import { NextRequest, NextResponse } from 'next/server';
import { recordView, getViews } from '@/lib/services/analytics';
import { redis, isRedisConfigured } from '@/lib/redis';
import crypto from 'node:crypto';

// View recording depends on request cookies/headers and must never be cached
// or statically optimized.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ADMIN_VIEW_SECRET = process.env.ADMIN_VIEW_SECRET;

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip') || null;
}

async function isRateLimited(ip: string): Promise<boolean> {
  const rlKey = `ratelimit:view:${ip}`;
  try {
    const requests = await redis.incr(rlKey);
    if (requests === 1) {
      await redis.expire(rlKey, 60);
    }
    return requests > 10;
  } catch (error) {
    console.error('Rate limit redis error', error);
    return false;
  }
}

/**
 * GET /api/blogs/[slug]/view
 * Returns the current total view count for a blog post.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const views = await getViews(slug);
    return NextResponse.json({ views }, { status: 200 });
  } catch (error) {
    console.error('API Error fetching views:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/blogs/[slug]/view
 * Records a unique view for a blog post.
 * - Skips recording if the owner's admin_view_secret cookie is present (server-side owner check).
 * - Rate limited to 10 requests/minute per IP.
 * - Deduplicates using a visitor_id cookie + IP + User-Agent hash (24h window).
 * - Increments total, daily, and monthly counters in Redis.
 * - Tracks unique visitors via HyperLogLog.
 * - Tracks referrer sources and country/geo data.
 * Returns the updated total view count.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Fail fast with a clear signal when analytics storage isn't configured,
    // instead of silently pretending the view was recorded.
    if (!isRedisConfigured) {
      return NextResponse.json(
        { success: false, views: 0, recorded: false, reason: 'analytics-not-configured' },
        { status: 200 },
      );
    }

    // ── Server-side owner check ──────────────────────────────────────
    // If the admin_view_secret cookie matches the env var, this is the
    // site owner — return the count without recording the view.
    if (ADMIN_VIEW_SECRET) {
      const ownerCookie = req.cookies.get('admin_view_secret')?.value;
      if (ownerCookie && ownerCookie === ADMIN_VIEW_SECRET) {
        const views = await getViews(slug);
        return NextResponse.json({ success: true, views, owner: true }, { status: 200 });
      }
    }

    const ip = getClientIp(req);
    if (ip && await isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const userAgent = req.headers.get('user-agent');
    const referrer = req.headers.get('referer') || null;
    const country = req.headers.get('x-vercel-ip-country') || null;

    let visitorId = req.cookies.get('visitor_id')?.value;
    let newVisitorId = false;

    if (!visitorId) {
      visitorId = crypto.randomUUID();
      newVisitorId = true;
    }

    const recorded = await recordView({
      slug,
      ip,
      userAgent,
      visitorId,
      referrer,
      country,
    });

    // Fetch updated total and return it
    const views = await getViews(slug);
    const response = NextResponse.json({ success: true, views, recorded }, { status: 200 });

    // 5. Set the visitor_id cookie if it was just generated
    if (newVisitorId) {
      response.cookies.set({
        name: 'visitor_id',
        value: visitorId,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    return response;
  } catch (error) {
    console.error('API Error in view recording:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
