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

    it.each([
        [{ name: 1, email: 'a@b.co', message: 'Hi' }, 'Invalid field types'],
        [{ name: '  ', email: 'a@b.co', message: 'Hi' }, 'Missing required fields'],
        [{ name: 'x'.repeat(121), email: 'a@b.co', message: 'Hi' }, 'exceed the allowed length'],
        [{ name: 'A', email: 'a@b.co', message: 'x'.repeat(5001) }, 'exceed the allowed length'],
        [{ name: 'A', email: 'a b@c.co', message: 'Hi' }, 'Invalid email'],
        [{ name: 'A', email: 'a@@c.co', message: 'Hi' }, 'Invalid email'],
        [{ name: 'A', email: 'a@.co', message: 'Hi' }, 'Invalid email'],
        [{ name: 'A', email: 'a@co.', message: 'Hi' }, 'Invalid email'],
        [{ name: 'A', email: 'a@bc', message: 'Hi' }, 'Invalid email'],
    ])('rejects %j with 400', async (body, error) => {
        const response = await POST({ json: async () => body } as unknown as Request);
        expect(response.status).toBe(400);
        expect((await response.json()).error).toContain(error);
        expect(createContactSubmission).not.toHaveBeenCalled();
    });

    it('treats a null body as missing fields', async () => {
        const response = await POST({ json: async () => null } as unknown as Request);
        expect(response.status).toBe(400);
    });

    it('trims fields before submitting', async () => {
        (createContactSubmission as jest.Mock).mockResolvedValue(undefined);
        await POST({ json: async () => ({ name: ' A ', email: ' a@b.co ', message: ' Hi ' }) } as unknown as Request);
        expect(createContactSubmission).toHaveBeenCalledWith({ name: 'A', email: 'a@b.co', message: 'Hi' });
    });

    it('returns 500 when the body is not JSON', async () => {
        const response = await POST({ json: async () => { throw new SyntaxError('bad'); } } as unknown as Request);
        expect(response.status).toBe(500);
    });
});
