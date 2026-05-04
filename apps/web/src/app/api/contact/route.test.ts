import { POST } from './route';
import { createContactSubmission } from '@/lib/services/notion';

// Mock the notion service
jest.mock('@/lib/services/notion', () => ({
    createContactSubmission: jest.fn(),
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

describe('Contact API Route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if required fields are missing', async () => {
        const req = {
            json: async () => ({ name: 'Dival' }),
        } as unknown as Request;

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Missing required fields');
    });

    it('should call createContactSubmission and return success on valid input', async () => {
        (createContactSubmission as jest.Mock).mockResolvedValue(undefined);

        const payload = {
            name: 'Test User',
            email: 'test@example.com',
            message: 'Hello Dival!',
        };

        const req = {
            json: async () => payload,
        } as unknown as Request;

        const response = await POST(req);
        const data = await response.json();

        expect(createContactSubmission).toHaveBeenCalledWith(payload);
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('should return 500 if createContactSubmission fails', async () => {
        (createContactSubmission as jest.Mock).mockRejectedValue(new Error('Notion error'));

        const req = {
            json: async () => ({
                name: 'Test User',
                email: 'test@example.com',
                message: 'Hello Dival!',
            }),
        } as unknown as Request;

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('Failed to submit');
    });
});
