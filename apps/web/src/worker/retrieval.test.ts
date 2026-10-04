import { faq } from "./retrieval";
import type { ChatMessage, Env } from "./types";

function makeEnv(embedding: unknown, matches: unknown[] = []) {
  const run = jest.fn().mockResolvedValue(embedding);
  const query = jest.fn().mockResolvedValue({ matches });
  const env = { AI: { run }, VECTORIZE: { query } } as unknown as Env;
  return { env, run, query };
}

const prior: ChatMessage[] = [
  { role: "user", content: "Tell me about the Stack Game project", timestamp: 1 },
  { role: "assistant", content: "It is a game.", timestamp: 2 },
];

describe("faq", () => {
  it("returns relevant match text, dropping low-score and empty matches", async () => {
    const { env, query } = makeEnv({ data: [[0.1, 0.2]] }, [
      { score: 0.9, metadata: { text: "A" } },
      { score: 0.1, metadata: { text: "too weak" } },
      { metadata: { text: "B" } },
      { score: 0.8, metadata: {} },
    ]);
    await expect(faq(env, "What does Dival work on these days?", [])).resolves.toBe("A\n\nB");
    expect(query).toHaveBeenCalledWith([0.1, 0.2], { topK: 5, returnMetadata: "all" });
  });

  it("enriches short follow-ups with the prior user turn and active blog path", async () => {
    const { env, run } = makeEnv({ data: [[1]] });
    await faq(env, "why?", prior, "/blogs/hello");
    expect(run).toHaveBeenCalledWith(expect.any(String), {
      text: ["Tell me about the Stack Game project\nwhy?\nCurrent blog page: /blogs/hello"],
    });
  });

  it("does not enrich long standalone questions", async () => {
    const { env, run } = makeEnv({ data: [[1]] });
    const q = "Which companies has Dival worked for previously";
    await faq(env, q, prior);
    expect(run.mock.calls[0][1]).toEqual({ text: [q] });
  });

  it("returns empty string without embedding data or on errors", async () => {
    await expect(faq(makeEnv({}).env, "hello there", [])).resolves.toBe("");
    const env = { AI: { run: jest.fn().mockRejectedValue(new Error("boom")) } } as unknown as Env;
    await expect(faq(env, "hello there", [])).resolves.toBe("");
  });
});
