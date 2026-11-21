/** @jest-environment node */
import { generateQuestions, normalize } from "./quiz-generate";

const sections = [
  { heading: "Intro", text: "Caching keeps a copy of a response close to the reader." },
  { heading: "Headers", text: "The max-age directive says how long a cached copy stays fresh." },
];

const raw = (questionText: string, sourceQuote: string) => ({
  questionText,
  options: [
    { text: "Right", isCorrect: true },
    { text: "Wrong 1", isCorrect: false },
    { text: "Wrong 2", isCorrect: false },
    { text: "Wrong 3", isCorrect: false },
  ],
  explanation: "Because the post says so.",
  difficulty: "easy",
  sourceQuote,
});

const answer = (questions: unknown[]) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ questions }) }] } }] }), { status: 200 });
const status = (code: number, body: unknown = {}) => new Response(JSON.stringify(body), { status: code });

const mockFetch = (...replies: (Response | Error)[]) => {
  const fn = jest.fn(async () => {
    const reply = replies.shift();
    if (!reply) { throw new Error("unexpected call"); }
    if (reply instanceof Error) { throw reply; }
    return reply;
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
};
const modelsCalled = (fn: jest.Mock) => fn.mock.calls.map(([url]) => String(url).match(/models\/([^:]+)/)?.[1]);

describe("generateQuestions", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "key";
    process.env.GEMINI_MODEL = "m1,m2";
  });

  it("asks once for the whole post and keeps only verified, new questions", async () => {
    const fetchMock = mockFetch(
      answer([
        raw("What does max-age control?", "The max-age directive says how long a cached copy stays fresh."),
        raw("Invented?", "This sentence is not in the post at all."),
        raw("Too short quote?", "Caching"),
        raw("What is caching?", "Caching keeps a copy of a response close to the reader."),
        { questionText: "Malformed" },
      ]),
    );
    const { questions, dropped } = await generateQuestions({ title: "Post", sections, existing: ["What is caching?"], count: 5 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject({ questionText: "What does max-age control?", section: "Headers" });
    expect(questions[0].options.filter((option) => option.isCorrect)).toHaveLength(1);
    expect(dropped).toBe(4);
    const prompt = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(prompt.contents[0].parts[0].text).toContain("- What is caching?");
  });

  it("switches model on overload, retirement or a hung request", async () => {
    process.env.GEMINI_MODEL = "a,b,c,d";
    const calls = mockFetch(status(503), status(404), new Error("timeout"), answer([]));
    await generateQuestions({ title: "Post", sections, existing: [], count: 2 });
    expect(modelsCalled(calls)).toEqual(["a", "b", "c", "d"]);
  });

  it("retries the same model after a rate limit, waiting as Gemini suggests", async () => {
    const calls = mockFetch(status(429, { error: { details: [{ retryDelay: "0s" }] } }), answer([]));
    await generateQuestions({ title: "Post", sections, existing: [], count: 2 });
    expect(modelsCalled(calls)).toEqual(["m1", "m1"]);
  });

  it("fails with the last error when every model fails, and on a bad request", async () => {
    mockFetch(status(503), status(503));
    await expect(generateQuestions({ title: "Post", sections, existing: [], count: 2 })).rejects.toThrow("Gemini m2 is overloaded (503).");
    mockFetch(status(400, { error: "bad" }));
    await expect(generateQuestions({ title: "Post", sections, existing: [], count: 2 })).rejects.toThrow("Gemini request failed (400)");
    delete process.env.GEMINI_API_KEY;
    await expect(generateQuestions({ title: "Post", sections, existing: [], count: 2 })).rejects.toThrow("Missing GEMINI_API_KEY.");
  });
});

describe("normalize", () => {
  it("ignores case, punctuation and Markdown", () => {
    expect(normalize("**Max-Age**, says `how` long!")).toBe("max age says how long");
  });
});
