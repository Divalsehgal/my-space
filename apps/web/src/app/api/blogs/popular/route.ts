import { NextRequest, NextResponse } from 'next/server';
import { getPopularPosts } from '@/lib/services/analytics';

const DEFAULT_LIMIT = 5;
const DECIMAL = 10;

const MAX_LIMIT = 20;

/**
 * GET /api/blogs/popular?limit=5
 * Returns the most popular blog posts sorted by total view count.
 * Public endpoint — no authentication required.
 *
 * Query params:
 *   limit — max number of posts to return (default 5, max 20)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = Math.min(
      Math.max(1, Number.parseInt(limitParam ?? '', DECIMAL) || DEFAULT_LIMIT),
      MAX_LIMIT
    );

    const posts = await getPopularPosts(limit);

    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    console.error('API Error fetching popular posts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
