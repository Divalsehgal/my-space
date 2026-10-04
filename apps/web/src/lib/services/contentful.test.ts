import { GraphQLClient } from 'graphql-request';

jest.mock('graphql-request', () => ({
    GraphQLClient: jest.fn(),
}));

describe('contentful service', () => {
    it('requests richer fields for the blog listing query', async () => {
        const request = jest.fn().mockResolvedValue({ blogPageCollection: { items: [] } });
        (GraphQLClient as unknown as jest.Mock).mockImplementation(() => ({ request }));

        const { getContentfulPosts } = await import('./contentful');

        await getContentfulPosts();

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
});
