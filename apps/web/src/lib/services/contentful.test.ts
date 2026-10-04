import { GraphQLClient } from 'graphql-request';

jest.mock('graphql-request', () => ({
    GraphQLClient: jest.fn(),
}));

type ContentfulModule = typeof import('./contentful');
const ENV = { ...process.env };
const ClientMock = GraphQLClient as unknown as jest.Mock;

function load(env: Record<string, string | undefined> = { CONTENTFUL_SPACE_ID: 'space', CONTENTFUL_ACCESS_TOKEN: 'token', CONTENTFUL_PREVIEW_ACCESS_TOKEN: 'preview' }) {
    process.env = { ...ENV, ...env };
    const request = jest.fn();
    const previewRequest = jest.fn();
    ClientMock.mockReset();
    ClientMock.mockImplementationOnce(() => ({ request })).mockImplementationOnce(() => ({ request: previewRequest }));
    let mod!: ContentfulModule;
    jest.isolateModules(() => {
        mod = jest.requireActual('./contentful');
    });
    return { mod, request, previewRequest };
}

const item = {
    sys: { id: '1', firstPublishedAt: '2024-01-01' },
    title: 'Hello',
    slug: 'hello',
    body: { json: { nodeType: 'document', content: [] } },
};

describe('contentful service', () => {
    let errorSpy: jest.SpyInstance;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        errorSpy.mockRestore();
        warnSpy.mockRestore();
    });

    afterAll(() => {
        process.env = ENV;
    });

    it('requests richer fields for the blog listing query', async () => {
        const { mod, request } = load();
        request.mockResolvedValue({ blogPageCollection: { items: [] } });

        await mod.getContentfulPosts();

        expect(request).toHaveBeenCalled();
        const query = request.mock.calls[0][0] as string;
        expect(query).not.toContain('excerpt');
        expect(query).toContain('body');
        expect(query).not.toContain('image');
        // Embedded-asset links cost ~1000 per item; the list query must skip
        // them so it can fetch well past 10 posts under the complexity cap.
        expect(query).not.toContain('links');
        expect(request.mock.calls[0][1]).toEqual(expect.objectContaining({ limit: 100 }));
    });

    it('warns when env vars are missing', () => {
        load({ CONTENTFUL_SPACE_ID: undefined, CONTENTFUL_ACCESS_TOKEN: undefined, CONTENTFUL_PREVIEW_ACCESS_TOKEN: undefined });
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('missing'));
    });

    it('refuses management tokens', () => {
        expect(() => load({ CONTENTFUL_SPACE_ID: 's', CONTENTFUL_ACCESS_TOKEN: 'CFPAT-abc' })).toThrow('CONTENTFUL_ACCESS_TOKEN is a Contentful management');
    });

    it('configures delivery and preview clients with cache tags', async () => {
        load();
        const fetchMock = jest.fn().mockResolvedValue('res');
        global.fetch = fetchMock as unknown as typeof fetch;

        const [deliveryEndpoint, deliveryOptions] = ClientMock.mock.calls[0];
        const [, previewOptions] = ClientMock.mock.calls[1];
        expect(deliveryEndpoint).toBe('https://graphql.contentful.com/content/v1/spaces/space');
        expect(deliveryOptions.headers).toEqual({ Authorization: 'Bearer token' });
        expect(previewOptions.headers).toEqual({ Authorization: 'Bearer preview' });

        await deliveryOptions.fetch('u', { method: 'POST' });
        expect(fetchMock).toHaveBeenLastCalledWith('u', { method: 'POST', next: { tags: ['contentful'] } });
        await previewOptions.fetch('u', { method: 'POST' });
        expect(fetchMock).toHaveBeenLastCalledWith('u', { method: 'POST', next: { tags: ['contentful-preview'], revalidate: 0 } });
    });

    it('routes preview requests to the preview client', async () => {
        const { mod, request, previewRequest } = load();
        previewRequest.mockResolvedValue({ blogPageCollection: { items: [item] } });
        const posts = await mod.getContentfulPosts(5, true);
        expect(request).not.toHaveBeenCalled();
        expect(previewRequest.mock.calls[0][1]).toEqual({ limit: 5, preview: true });
        expect(posts.map((p) => p.slug)).toEqual(['hello']);
    });

    it('getContentfulPosts returns [] for empty data and errors', async () => {
        const { mod, request } = load();
        request.mockResolvedValueOnce(null);
        await expect(mod.getContentfulPosts()).resolves.toEqual([]);
        request.mockRejectedValueOnce(new Error('boom'));
        await expect(mod.getContentfulPosts()).resolves.toEqual([]);
        expect(errorSpy).toHaveBeenCalled();
    });

    it('getContentfulPostTitles keeps items with slugs', async () => {
        const { mod, request } = load();
        request.mockResolvedValueOnce({ blogPageCollection: { items: [{ title: 'A', slug: 'a' }, null, { title: 'B', slug: '' }] } });
        await expect(mod.getContentfulPostTitles()).resolves.toEqual([{ title: 'A', slug: 'a' }]);
        request.mockResolvedValueOnce({});
        await expect(mod.getContentfulPostTitles()).resolves.toEqual([]);
        request.mockRejectedValueOnce(new Error('boom'));
        await expect(mod.getContentfulPostTitles()).resolves.toEqual([]);
    });

    it('getLatestContentfulPost maps the first item or returns null', async () => {
        const { mod, request } = load();
        request.mockResolvedValueOnce({ blogPageCollection: { items: [item] } });
        await expect(mod.getLatestContentfulPost()).resolves.toEqual(expect.objectContaining({ slug: 'hello' }));
        request.mockResolvedValueOnce({ blogPageCollection: { items: [] } });
        await expect(mod.getLatestContentfulPost()).resolves.toBeNull();
        request.mockRejectedValueOnce(new Error('boom'));
        await expect(mod.getLatestContentfulPost()).resolves.toBeNull();
    });

    it('getContentfulPostBySlug maps the match or returns null', async () => {
        const { mod, request } = load();
        request.mockResolvedValueOnce({ blogPageCollection: { items: [item] } });
        await expect(mod.getContentfulPostBySlug('hello')).resolves.toEqual(expect.objectContaining({ id: '1' }));
        expect(request.mock.calls[0][1]).toEqual({ slug: 'hello', preview: false });
        request.mockResolvedValueOnce({ blogPageCollection: { items: [] } });
        await expect(mod.getContentfulPostBySlug('x')).resolves.toBeNull();
        request.mockResolvedValueOnce({});
        await expect(mod.getContentfulPostBySlug('x')).resolves.toBeNull();
        request.mockRejectedValueOnce(new Error('boom'));
        await expect(mod.getContentfulPostBySlug('x')).resolves.toBeNull();
    });
});
