import { createQuizQuestions } from "./createQuizQuestions";

// import.meta.env is Vite-only; the URL module is replaced so Jest never loads it.
jest.mock("./backendUrl", () => ({ backendUrl: () => "/api" }));

const payload = {
  questions: [
    {
      questionText: "Q?",
      explanation: "E",
      options: [
        { text: "a", isCorrect: true },
        { text: "b", isCorrect: false },
        { text: "c", isCorrect: false },
        { text: "d", isCorrect: false },
      ],
    },
  ],
};

/** Minimal stand-in for a fetch Response (jsdom has neither fetch nor Response). */
const respond = (status: number, body: unknown, contentType = "application/json") => {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    headers: { get: (name: string) => (name.toLowerCase() === "content-type" ? contentType : null) },
    json: () => Promise.resolve(JSON.parse(text)),
    text: () => Promise.resolve(text),
  } as unknown as Response);
};

const mockFetch = (impl: () => Promise<Response>) => {
  const fn = jest.fn(impl);
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
};

describe("createQuizQuestions", () => {

  it("posts the questions and returns the server message", async () => {
    const fetchMock = mockFetch(() => respond(201, { message: "Created 1 question(s)." }));
    await expect(createQuizQuestions("quiz-1", payload, true)).resolves.toBe("Created 1 question(s).");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toMatch(/\/contentful\/create-quiz-questions$/);
    expect(JSON.parse(String(init?.body))).toMatchObject({ quizId: "quiz-1", publish: true, questions: [{ questionText: "Q?" }] });
  });

  it("surfaces the server's error message", async () => {
    mockFetch(() => respond(400, { error: "Quiz JSON is invalid." }));
    await expect(createQuizQuestions("quiz-1", payload, false)).rejects.toThrow("Quiz JSON is invalid.");
  });

  it("falls back to the response text for non-JSON errors", async () => {
    mockFetch(() => respond(502, "Bad gateway", "text/plain"));
    await expect(createQuizQuestions("quiz-1", payload, false)).rejects.toThrow("Bad gateway");
  });
});
