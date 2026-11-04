import { POST } from './route';
import { recordView, getViews } from '@/lib/services/analytics';
import { getContentfulPostTitles } from '@/lib/services/contentful';

jest.mock('@/lib/services/analytics', () => ({ recordView: jest.fn(), getViews: jest.fn() }));
jest.mock('@/lib/services/contentful', () => ({ getContentfulPostTitles: jest.fn() }));
jest.mock('@/lib/redis', () => ({ isRedisConfigured: true, redis: { incr: jest.fn(async () => 1), expire: jest.fn() } }));
jest.mock('@/lib/owner', () => ({ OWNER_SESSION_COOKIE: 'owner_session', isOwnerSession: () => false }));
// No Next runtime in Jest: run the cached function directly.
jest.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }));
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({ json: async () => data, status: init?.status || 200, cookies: { set: jest.fn() } })),
  },
}));

const post = (slug: string) => {
  const req = { headers: new Headers({ 'x-forwarded-for': '1.2.3.4' }), cookies: { get: () => ({ value: 'visitor' }) } };
  return POST(req as never, { params: Promise.resolve({ slug }) });
};

describe('POST /api/blogs/[slug]/view', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getContentfulPostTitles as jest.Mock).mockResolvedValue([{ title: 'Real', slug: 'real-post' }]);
    (getViews as jest.Mock).mockResolvedValue(5);
  });

  it('records a view for a published post', async () => {
    const response = await post('real-post');
    expect(response.status).toBe(200);
    expect(recordView).toHaveBeenCalledWith(expect.objectContaining({ slug: 'real-post' }));
  });

  it('returns 404 and writes nothing for an unknown slug', async () => {
    const response = await post('made-up');
    expect(response.status).toBe(404);
    expect(recordView).not.toHaveBeenCalled();
  });

  it('still records views when the post list could not be loaded', async () => {
    (getContentfulPostTitles as jest.Mock).mockResolvedValue([]);
    await post('real-post');
    expect(recordView).toHaveBeenCalled();
  });
});
