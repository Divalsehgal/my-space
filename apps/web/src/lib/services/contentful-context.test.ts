import { contentfulToPlainText, getContentfulPostsForContext } from './contentful-context';
import { fetchContentful } from './contentful';
import type { ContentfulRichText } from '@/types/contentful';

jest.mock('./contentful', () => ({ fetchContentful: jest.fn() }));

const body = {
  json: {
    content: [
      { nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'Hello' }, { nodeType: 'text' }] },
      { nodeType: 'heading-2', content: [{ nodeType: 'text', value: '  world.  ' }] },
      { nodeType: 'hr' },
    ],
  },
} as unknown as ContentfulRichText;

describe('contentfulToPlainText', () => {
  it('flattens nested text nodes', () => {
    expect(contentfulToPlainText(body)).toBe('Hello world.');
  });

  it('returns "" for empty input', () => {
    expect(contentfulToPlainText(undefined as never)).toBe('');
  });
});

describe('getContentfulPostsForContext', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => undefined));

  it('maps posts to context entries', async () => {
    (fetchContentful as jest.Mock).mockResolvedValue({
      blogPageCollection: { items: [{ title: 'T', slug: 's', body, sys: { firstPublishedAt: '2026-01-01' } }] },
    });
    const [post] = await getContentfulPostsForContext(1);
    expect(post).toMatchObject({ title: 'T', slug: 's', date: '2026-01-01', content: 'Hello world.' });
    expect(fetchContentful).toHaveBeenCalledWith(expect.any(String), { limit: 1 });
  });

  it('returns [] for a missing collection', async () => {
    (fetchContentful as jest.Mock).mockResolvedValue(null);
    expect(await getContentfulPostsForContext()).toEqual([]);
  });

  it('returns [] when the fetch throws', async () => {
    (fetchContentful as jest.Mock).mockRejectedValue(new Error('down'));
    expect(await getContentfulPostsForContext()).toEqual([]);
  });
});
