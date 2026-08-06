import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics } from '@/lib/services/analytics';

const ADMIN_VIEW_SECRET = process.env.ADMIN_VIEW_SECRET;

/**
 * GET /api/blogs/[slug]/analytics
 * Returns full analytics breakdown for a blog post:
 * total views, unique visitors, daily/monthly breakdown,
 * top referrers, and country distribution.
 *
 * Protected — requires the admin_view_secret cookie to match ADMIN_VIEW_SECRET env var.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // ── Auth check ──────────────────────────────────────────────────
    if (!ADMIN_VIEW_SECRET) {
      return NextResponse.json(
        { error: 'Analytics endpoint is not configured. Set ADMIN_VIEW_SECRET env var.' },
        { status: 503 }
      );
    }

    const ownerCookie = req.cookies.get('admin_view_secret')?.value;
    if (!ownerCookie || ownerCookie !== ADMIN_VIEW_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const analytics = await getAnalytics(slug);

    return NextResponse.json({ slug, ...analytics }, { status: 200 });
  } catch (error) {
    console.error('API Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
