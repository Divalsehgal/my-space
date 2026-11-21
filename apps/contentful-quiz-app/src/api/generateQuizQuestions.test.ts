import { generateQuizQuestions } from "./generateQuizQuestions";

jest.mock("./backendUrl", () => ({ backendUrl: () => "/api" }));

const sign = jest.fn(() => Promise.resolve({ "x-contentful-signature": "sig" }));

const respond = (status: number, body: unknown) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response);

describe("generateQuizQuestions", () => {
  it("posts the blog and count to the signed generate route", async () => {
    const result = { questions: [], dropped: 1, existingCount: 0 };
    const fetchMock = jest.fn(() => respond(200, result));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await expect(generateQuizQuestions("blog-1", 6, sign)).resolves.toEqual(result);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toMatch(/\/api\/contentful\/generate-quiz$/);
    expect(JSON.parse(String(init.body))).toEqual({ blogId: "blog-1", count: 6 });
    expect(sign).toHaveBeenCalledWith(expect.objectContaining({ path: "/api/contentful/generate-quiz" }));
  });

  it("uses its own fallback error message", async () => {
    globalThis.fetch = jest.fn(() => respond(502, {})) as unknown as typeof fetch;
    await expect(generateQuizQuestions("blog-1", 6, sign)).rejects.toThrow("Failed to generate questions.");
  });
});
