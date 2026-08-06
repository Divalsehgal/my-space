import { NextRequest, NextResponse } from 'next/server';
import { getViews } from '@/lib/services/analytics';

const MAX_SLUGS = 50;

/**
 * GET /api/blogs/views?slugs=slug1,slug2,slug3
 * Returns view counts for multiple blog posts in a single request.
 * Used by the blog listing page to show view counts on all cards.
 * Capped at 50 slugs per request to prevent abuse.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slugsParam = searchParams.get('slugs');

    if (!slugsParam) {
      return NextResponse.json({ error: 'slugs query param is required' }, { status: 400 });
    }

    const slugs = slugsParam.split(',').map((s) => s.trim()).filter(Boolean);

    if (slugs.length === 0) {
      return NextResponse.json({ views: {} });
    }

    if (slugs.length > MAX_SLUGS) {
      return NextResponse.json(
        { error: `Too many slugs. Maximum is ${MAX_SLUGS}.` },
        { status: 400 }
      );
    }

    // Fetch all view counts concurrently
    const counts = await Promise.all(slugs.map((slug) => getViews(slug)));

    const views: Record<string, number> = {};
    slugs.forEach((slug, i) => {
      views[slug] = counts[i];
    });

    return NextResponse.json({ views }, { status: 200 });
  } catch (error) {
    console.error('API Error fetching bulk views:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
