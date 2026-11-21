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

const sign = jest.fn(() => Promise.resolve({ "x-contentful-signature": "sig" }));

describe("createQuizQuestions", () => {

  it("posts the questions and returns the server message", async () => {
    const fetchMock = mockFetch(() => respond(201, { message: "Created 1 question(s)." }));
    await expect(createQuizQuestions({ quizId: "quiz-1" }, payload, true, sign)).resolves.toEqual({ message: "Created 1 question(s)." });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toMatch(/\/contentful\/create-quiz-questions$/);
    expect(JSON.parse(String(init?.body))).toMatchObject({ quizId: "quiz-1", publish: true, questions: [{ questionText: "Q?" }] });
    // The exact path and body sent are the ones that were signed.
    expect(sign).toHaveBeenCalledWith(expect.objectContaining({ method: "POST", path: "/api/contentful/create-quiz-questions", body: init?.body }));
    expect(init?.headers).toMatchObject({ "Content-Type": "application/json", "x-contentful-signature": "sig" });
  });

  it("surfaces the server's error message", async () => {
    mockFetch(() => respond(400, { error: "Quiz JSON is invalid." }));
    await expect(createQuizQuestions({ quizId: "quiz-1" }, payload, false, sign)).rejects.toThrow("Quiz JSON is invalid.");
  });

  it("falls back to the response text for non-JSON errors", async () => {
    mockFetch(() => respond(502, "Bad gateway", "text/plain"));
    await expect(createQuizQuestions({ quizId: "quiz-1" }, payload, false, sign)).rejects.toThrow("Bad gateway");
  });
});

describe("createQuizQuestions with a blog", () => {
  it("sends the blog to link and reports whether it was linked", async () => {
    const fetchMock = mockFetch(() => respond(200, { message: "ok", linkedBlog: true }));
    await expect(createQuizQuestions({ quizId: "quiz-1", blogId: "blog-1" }, payload, false, sign)).resolves.toEqual({ message: "ok", linkedBlog: true });
    const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body).toMatchObject({ quizId: "quiz-1", blogId: "blog-1" });
  });
});

describe("createQuizQuestions error shapes", () => {
  it("uses the first validation detail, then the default message", async () => {
    mockFetch(() => respond(400, { details: ["Option text is required."] }));
    await expect(createQuizQuestions({ quizId: "q" }, payload, false, sign)).rejects.toThrow("Option text is required.");
    mockFetch(() => respond(400, {}));
    await expect(createQuizQuestions({ quizId: "q" }, payload, false, sign)).rejects.toThrow("Failed to create quiz questions.");
  });

  it("reports the status when the error body is unreadable", async () => {
    mockFetch(() => respond(500, "not json"));
    await expect(createQuizQuestions({ quizId: "q" }, payload, false, sign)).rejects.toThrow("Server error: 500");
  });

  it("rejects an unparseable success body", async () => {
    mockFetch(() => respond(200, "not json"));
    await expect(createQuizQuestions({ quizId: "q" }, payload, false, sign)).rejects.toThrow("Invalid response from server");
  });

  it("explains a signing failure", async () => {
    const fetchMock = mockFetch(() => respond(200, {}));
    const failingSign = jest.fn(() => Promise.reject({ message: "No signing secret" }));
    await expect(createQuizQuestions({ quizId: "q" }, payload, false, failingSign)).rejects.toThrow("Contentful could not sign the request (is request verification enabled for this app?): No signing secret");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
