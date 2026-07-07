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
        expect(query).toContain('image');
        expect(query).toContain('body');
    });
});
