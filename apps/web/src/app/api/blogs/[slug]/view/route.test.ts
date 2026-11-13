import { GET, POST } from './route';
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

describe('POST /api/blogs/[slug]/view edge cases', () => {
  const redisMock = jest.requireMock('@/lib/redis');
  const ownerMock = jest.requireMock('@/lib/owner');
  const request = (headers: Record<string, string> = {}, visitor?: string) =>
    ({ headers: new Headers(headers), cookies: { get: () => (visitor ? { value: visitor } : undefined) } }) as never;
  const postWith = (req: never, slug = 'real-post') => POST(req, { params: Promise.resolve({ slug }) });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (getContentfulPostTitles as jest.Mock).mockResolvedValue([{ title: 'Real', slug: 'real-post' }]);
    (getViews as jest.Mock).mockResolvedValue(5);
    (recordView as jest.Mock).mockResolvedValue(true);
    redisMock.redis.incr.mockResolvedValue(1);
  });
  afterEach(() => {
    redisMock.isRedisConfigured = true;
    ownerMock.isOwnerSession = () => false;
  });

  it('rejects an empty slug', async () => {
    expect((await postWith(request(), '')).status).toBe(400);
  });

  it('reports when analytics storage is not configured', async () => {
    redisMock.isRedisConfigured = false;
    expect(await (await postWith(request())).json()).toMatchObject({ recorded: false, reason: 'analytics-not-configured' });
  });

  it('returns the count without recording for the owner', async () => {
    ownerMock.isOwnerSession = () => true;
    expect(await (await postWith(request())).json()).toEqual({ success: true, views: 5, owner: true });
    expect(recordView).not.toHaveBeenCalled();
  });

  it('rate limits by IP and sets the window only on the first hit', async () => {
    redisMock.redis.incr.mockResolvedValue(11);
    expect((await postWith(request({ 'x-real-ip': '9.9.9.9' }))).status).toBe(429);
    expect(redisMock.redis.expire).not.toHaveBeenCalled();
  });

  it('fails open when the rate limiter errors, and skips it with no IP', async () => {
    redisMock.redis.incr.mockRejectedValue(new Error('down'));
    expect((await postWith(request({ 'x-forwarded-for': '1.1.1.1' }, 'v'))).status).toBe(200);
    await postWith(request({ referer: 'https://g.co', 'x-vercel-ip-country': 'IN', 'user-agent': 'UA' }, 'v'));
    expect(recordView).toHaveBeenLastCalledWith(expect.objectContaining({ ip: null, referrer: 'https://g.co', country: 'IN' }));
  });

  it('issues a visitor cookie to a new visitor', async () => {
    const res = (await postWith(request())) as unknown as { cookies: { set: jest.Mock } };
    expect(res.cookies.set).toHaveBeenCalledWith(expect.objectContaining({ name: 'visitor_id', httpOnly: true }));
  });

  it('returns 500 when recording throws', async () => {
    (recordView as jest.Mock).mockRejectedValue(new Error('boom'));
    expect((await postWith(request({}, 'v'))).status).toBe(500);
  });
});

describe('GET /api/blogs/[slug]/view', () => {
  const get = (slug: string) => GET({} as never, { params: Promise.resolve({ slug }) });

  it('returns the view count, 400 for no slug and 500 on error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (getViews as jest.Mock).mockResolvedValue(3);
    expect(await (await get('a')).json()).toEqual({ views: 3 });
    expect((await get('')).status).toBe(400);
    (getViews as jest.Mock).mockRejectedValue(new Error('x'));
    expect((await get('a')).status).toBe(500);
  });
});
