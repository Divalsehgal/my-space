import { POST } from './route';
import { revalidatePath, revalidateTag } from 'next/cache';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn(), revalidateTag: jest.fn() }));
jest.mock('next/server', () => ({
  NextResponse: { json: jest.fn((data, init) => ({ data, status: init?.status ?? 200 })) },
}));

const post = (body: unknown) =>
  POST({ json: async () => body } as Request) as unknown as Promise<{ data: Record<string, unknown>; status: number }>;

describe('POST /api/revalidate', () => {
  const env = process.env;
  const fetchMock = jest.fn(() => Promise.resolve({}));

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...env, REVALIDATION_SECRET: 's3cret', CHATBOT_SEED_SECRET: 'seed' };
    global.fetch = fetchMock as never;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterAll(() => {
    process.env = env;
  });

  it('rejects a wrong secret', async () => {
    expect((await post({ secret: 'nope' })).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects when no secret is configured', async () => {
    delete process.env.REVALIDATION_SECRET;
    expect((await post({ secret: undefined })).status).toBe(401);
  });

  it('revalidates the default tag without seeding', async () => {
    const res = await post({ secret: 's3cret' });
    expect(res.data).toMatchObject({ revalidated: true, tag: 'portfolio', aiSeeded: false });
    expect(revalidateTag).toHaveBeenCalledWith('portfolio', 'page');
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('revalidates blog paths and seeds the chatbot for contentful', async () => {
    const res = await post({ secret: 's3cret', tag: 'contentful' });
    expect(res.data).toMatchObject({ tag: 'contentful', aiSeeded: true });
    expect(revalidatePath).toHaveBeenCalledWith('/blogs/[slug]', 'page');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/seed'),
      expect.objectContaining({ headers: { Authorization: 'Bearer seed' } }),
    );
  });

  it('logs a failed seed request without failing', async () => {
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('down')));
    await post({ secret: 's3cret', tag: 'contentful' });
    await new Promise((r) => setTimeout(r, 0));
    expect(console.error).toHaveBeenCalledWith('Automated AI Seeding failed:', expect.any(Error));
  });

  it('skips seeding when the seed secret is missing', async () => {
    delete process.env.CHATBOT_SEED_SECRET;
    const res = await post({ secret: 's3cret', tag: 'contentful' });
    expect(res.data.aiSeeded).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 500 on a malformed body', async () => {
    const res = (await POST({ json: async () => Promise.reject(new Error('bad')) } as unknown as Request)) as unknown as {
      status: number;
    };
    expect(res.status).toBe(500);
  });
});
