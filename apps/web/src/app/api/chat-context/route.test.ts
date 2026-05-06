import { GET } from './route';
import { portfolioService } from '@/features/portfolio';
import { getContentfulPostsForContext } from '@/lib/services/contentful-context';

// Mock services
jest.mock('@/features/portfolio', () => ({
    portfolioService: {
        getConfig: jest.fn(),
    },
}));

jest.mock('@/lib/services/contentful-context', () => ({
    getContentfulPostsForContext: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((data, init) => ({
            json: async () => data,
            status: init?.status || 200,
        })),
    },
}));

describe('Chat Context API Route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should aggregate portfolio and blog data correctly', async () => {
        const mockConfig = { hero: { title: 'Lead Engineer' }, about: { facts: ['India'] }, experience: [], projects: [] };
        const mockPosts = [
            { title: 'Post 1', content: 'Desc 1', slug: 'post-1' }
        ];

        (portfolioService.getConfig as jest.Mock).mockResolvedValue({ config: mockConfig });
        (getContentfulPostsForContext as jest.Mock).mockResolvedValue(mockPosts);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.portfolio).toEqual(mockConfig);
        expect(data.blogs).toHaveLength(1);
        expect(data.blogs[0].title).toBe('Post 1');
    });

    it('should return 500 if one of the services fails', async () => {
        (portfolioService.getConfig as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch context');
    });
});
