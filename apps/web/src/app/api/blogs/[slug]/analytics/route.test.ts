import { GET } from './route';
import { getAnalytics } from '@/lib/services/analytics';
import { isOwnerModeConfigured, isOwnerSession } from '@/lib/owner';

jest.mock('@/lib/services/analytics', () => ({ getAnalytics: jest.fn() }));
jest.mock('@/lib/owner', () => ({
  OWNER_SESSION_COOKIE: 'owner_session',
  isOwnerModeConfigured: jest.fn(),
  isOwnerSession: jest.fn(),
}));
jest.mock('next/server', () => ({
  NextResponse: { json: jest.fn((data, init) => ({ data, status: init?.status ?? 200 })) },
}));

const get = (slug = 'post') =>
  GET({ cookies: { get: () => ({ value: 'sess' }) } } as never, { params: Promise.resolve({ slug }) }) as unknown as Promise<{
    data: Record<string, unknown>;
    status: number;
  }>;

describe('GET /api/blogs/[slug]/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isOwnerModeConfigured as jest.Mock).mockReturnValue(true);
    (isOwnerSession as jest.Mock).mockReturnValue(true);
    (getAnalytics as jest.Mock).mockResolvedValue({ totalViews: 3 });
  });

  it('returns 503 when owner mode is not configured', async () => {
    (isOwnerModeConfigured as jest.Mock).mockReturnValue(false);
    expect((await get()).status).toBe(503);
  });

  it('returns 401 without an owner session', async () => {
    (isOwnerSession as jest.Mock).mockReturnValue(false);
    expect((await get()).status).toBe(401);
  });

  it('returns 400 for an empty slug', async () => {
    expect((await get('')).status).toBe(400);
  });

  it('returns the analytics for the slug', async () => {
    const res = await get('post');
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ slug: 'post', totalViews: 3 });
  });

  it('returns 500 when analytics lookup throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (getAnalytics as jest.Mock).mockRejectedValue(new Error('boom'));
    expect((await get()).status).toBe(500);
  });
});
