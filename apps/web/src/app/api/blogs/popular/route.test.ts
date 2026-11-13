import { GET } from './route';
import { getPopularPosts } from '@/lib/services/analytics';

jest.mock('@/lib/services/analytics', () => ({ getPopularPosts: jest.fn() }));
jest.mock('next/server', () => ({
  NextResponse: { json: jest.fn((data, init) => ({ data, status: init?.status ?? 200 })) },
}));

const get = (query = '') =>
  GET({ url: `https://x.test/api/blogs/popular${query}` } as never) as unknown as Promise<{
    data: Record<string, unknown>;
    status: number;
  }>;

describe('GET /api/blogs/popular', () => {
  beforeEach(() => (getPopularPosts as jest.Mock).mockReset().mockResolvedValue([]));

  it.each([
    ['', 5],
    ['?limit=3', 3],
    ['?limit=999', 20],
    ['?limit=-4', 1],
    ['?limit=abc', 5],
  ])('clamps limit %s to %i', async (query, limit) => {
    const res = await get(query);
    expect(res.status).toBe(200);
    expect(getPopularPosts).toHaveBeenCalledWith(limit);
  });

  it('returns 500 when the lookup throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (getPopularPosts as jest.Mock).mockRejectedValue(new Error('boom'));
    expect((await get()).status).toBe(500);
  });
});
