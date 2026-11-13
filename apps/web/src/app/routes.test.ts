import { GET as llmsTxt } from './llms.txt/route';
import { GET as llmsFullTxt } from './llms-full.txt/route';
import sitemap from './sitemap';
import robots from './robots';
import { getContentfulPosts } from '@/lib/services/contentful';
import { getContentfulPostsForContext } from '@/lib/services/contentful-context';

jest.mock('@/features/portfolio', () => {
  const actual = jest.requireActual('@/features/portfolio');
  return { ...actual, portfolioService: { getConfig: jest.fn(async () => ({ config: actual.PortfolioConfigSchema.parse({}) })) } };
});
jest.mock('@/lib/services/contentful', () => ({ getContentfulPosts: jest.fn() }));
jest.mock('@/lib/services/contentful-context', () => ({ getContentfulPostsForContext: jest.fn() }));

// jsdom has no Response; the routes only need the body and headers back.
global.Response = class {
  constructor(public body: string, public init: ResponseInit) {}
} as never;

const post = { title: 'Hello', slug: 'hello', description: 'Desc', date: '2026-01-01', publishedAt: '2026-02-01' };

describe('metadata routes', () => {
  beforeEach(() => {
    (getContentfulPosts as jest.Mock).mockResolvedValue([post]);
    (getContentfulPostsForContext as jest.Mock).mockResolvedValue([{ ...post, content: 'Body text' }]);
  });

  it('serves llms.txt with the post list', async () => {
    const res = (await llmsTxt()) as unknown as { body: string; init: ResponseInit };
    expect(res.body).toContain('Hello');
    expect(res.init.headers).toEqual({ 'Content-Type': 'text/plain; charset=utf-8' });
  });

  it('serves llms-full.txt with post bodies', async () => {
    const res = (await llmsFullTxt()) as unknown as { body: string };
    expect(res.body).toContain('Body text');
    expect(getContentfulPostsForContext).toHaveBeenCalledWith(100);
  });

  it('builds the sitemap with listing lastmod from the newest post', async () => {
    const entries = await sitemap();
    expect(entries.map((e) => e.url.replace(/^https?:\/\/[^/]+/, ''))).toEqual(['', '/blogs', '/blogs/hello']);
    expect(entries[0].lastModified).toEqual(new Date('2026-02-01'));
  });

  it('leaves listing lastmod unset with no posts', async () => {
    (getContentfulPosts as jest.Mock).mockResolvedValue([]);
    const entries = await sitemap();
    expect(entries).toHaveLength(2);
    expect(entries[0].lastModified).toBeUndefined();
  });

  it('falls back to the post date when publishedAt is missing', async () => {
    (getContentfulPosts as jest.Mock).mockResolvedValue([{ ...post, publishedAt: undefined }]);
    expect((await sitemap())[2].lastModified).toEqual(new Date('2026-01-01'));
  });

  it('serves robots rules with the sitemap', () => {
    expect(robots().sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
