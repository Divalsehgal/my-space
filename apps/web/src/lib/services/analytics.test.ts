import { recordView, getViews, getViewCounts, getAnalytics, getPopularPosts } from './analytics';
import { redis } from '../redis';

jest.mock('../redis', () => ({ redis: { set: jest.fn(), get: jest.fn(), pipeline: jest.fn(), scan: jest.fn() } }));

const r = redis as unknown as Record<'set' | 'get' | 'pipeline' | 'scan', jest.Mock>;

function makePipeline(execResult: unknown[] | Error = []) {
  const p = {
    incr: jest.fn(),
    hincrby: jest.fn(),
    pfadd: jest.fn(),
    zincrby: jest.fn(),
    get: jest.fn(),
    pfcount: jest.fn(),
    hgetall: jest.fn(),
    zrange: jest.fn(),
    exec: jest.fn(() => (execResult instanceof Error ? Promise.reject(execResult) : Promise.resolve(execResult))),
  };
  r.pipeline.mockReturnValue(p);
  return p;
}

const view = { slug: 'post', ip: '1.1.1.1', userAgent: 'Mozilla', visitorId: 'v1' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('recordView', () => {
  it('ignores bots', async () => {
    expect(await recordView({ ...view, userAgent: 'Googlebot/2.1' })).toBe(false);
    expect(r.set).not.toHaveBeenCalled();
  });

  it('records a unique view with referrer and country', async () => {
    r.set.mockResolvedValue('OK');
    const p = makePipeline();
    expect(await recordView({ ...view, referrer: 'https://www.google.com/search', country: 'IN' })).toBe(true);
    expect(p.incr).toHaveBeenCalledWith('views:total:post');
    expect(p.zincrby).toHaveBeenCalledWith('referrers:post', 1, 'google.com');
    expect(p.zincrby).toHaveBeenCalledWith('geo:post', 1, 'IN');
  });

  it('keeps a non-URL referrer as-is and skips unknown country', async () => {
    r.set.mockResolvedValue('OK');
    const p = makePipeline();
    await recordView({ slug: 'post', ip: null, userAgent: null, visitorId: null, referrer: 'android-app', country: 'unknown' });
    expect(p.zincrby).toHaveBeenCalledTimes(1);
    expect(p.zincrby).toHaveBeenCalledWith('referrers:post', 1, 'android-app');
  });

  it('skips referrer tracking when there is none', async () => {
    r.set.mockResolvedValue('OK');
    const p = makePipeline();
    await recordView(view);
    expect(p.zincrby).not.toHaveBeenCalled();
  });

  it('returns false for a repeat view', async () => {
    r.set.mockResolvedValue(null);
    expect(await recordView(view)).toBe(false);
  });

  it('returns false when Redis fails', async () => {
    r.set.mockRejectedValue(new Error('down'));
    expect(await recordView(view)).toBe(false);
  });
});

describe('getViews', () => {
  it('returns the stored count or 0', async () => {
    r.get.mockResolvedValueOnce(7).mockResolvedValueOnce(null);
    expect(await getViews('a')).toBe(7);
    expect(await getViews('a')).toBe(0);
  });

  it('returns 0 on error', async () => {
    r.get.mockRejectedValue(new Error('down'));
    expect(await getViews('a')).toBe(0);
  });
});

describe('getViewCounts', () => {
  it('returns {} for no slugs', async () => {
    expect(await getViewCounts(['', ''])).toEqual({});
  });

  it('dedupes slugs and maps counts', async () => {
    makePipeline(['4', null]);
    expect(await getViewCounts(['a', 'b', 'a'])).toEqual({ a: 4, b: 0 });
  });

  it('returns zeros on error', async () => {
    makePipeline(new Error('down'));
    expect(await getViewCounts(['a'])).toEqual({ a: 0 });
  });
});

describe('getAnalytics', () => {
  it('parses the pipeline results', async () => {
    makePipeline([9, 5, { '2026-01-01': '3' }, { '2026-01': '9' }, ['google.com', '4'], ['IN', '6']]);
    expect(await getAnalytics('post')).toEqual({
      total: 9,
      uniqueVisitors: 5,
      daily: { '2026-01-01': 3 },
      monthly: { '2026-01': 9 },
      topReferrers: [{ source: 'google.com', count: 4 }],
      countries: [{ country: 'IN', count: 6 }],
    });
  });

  it('defaults empty results', async () => {
    makePipeline([null, null, null, null, null, null]);
    expect(await getAnalytics('post')).toMatchObject({ total: 0, daily: {}, topReferrers: [] });
  });

  it('returns empty analytics on error', async () => {
    makePipeline(new Error('down'));
    expect(await getAnalytics('post')).toEqual({
      total: 0,
      uniqueVisitors: 0,
      daily: {},
      monthly: {},
      topReferrers: [],
      countries: [],
    });
  });
});

describe('getPopularPosts', () => {
  it('scans every page, sorts by views and limits', async () => {
    r.scan.mockResolvedValueOnce(['3', ['views:total:a']]).mockResolvedValueOnce(['0', ['views:total:b', 'views:total:c']]);
    makePipeline([1, 5, null]);
    expect(await getPopularPosts(2)).toEqual([
      { slug: 'b', views: 5 },
      { slug: 'a', views: 1 },
    ]);
  });

  it('returns [] when there are no keys', async () => {
    r.scan.mockResolvedValue(['0', []]);
    expect(await getPopularPosts()).toEqual([]);
  });

  it('returns [] on error', async () => {
    r.scan.mockRejectedValue(new Error('down'));
    expect(await getPopularPosts()).toEqual([]);
  });
});
