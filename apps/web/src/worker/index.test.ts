/** @jest-environment node */
import worker from "./index";
import type { Env } from "./types";

const encoder = new TextEncoder();

/** A Workers AI `stream: true` body that yields the given tokens. */
function modelStream(tokens: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      tokens.forEach((t) => controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`)));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

function makeEnv(tokens: string[], kvSeed: Record<string, unknown> = {}) {
  const kv = new Map<string, string>(Object.entries(kvSeed).map(([k, v]) => [k, JSON.stringify(v)]));
  const env = {
    AI: {
      run: jest.fn(async (model: string, options: { stream?: boolean }) => {
        if (model.includes("bge")) {return { data: [[0.1]] };}
        return options.stream ? modelStream(tokens) : { response: "" };
      }),
    },
    VECTORIZE: { query: jest.fn(async () => ({ matches: [{ score: 0.9, metadata: { text: "Fact", title: "Post", url: "/blogs/post" } }] })) },
    CHAT_SESSIONS: {
      get: jest.fn(async (key: string) => (kv.has(key) ? JSON.parse(kv.get(key)!) : null)),
      put: jest.fn(async (key: string, value: string) => void kv.set(key, value)),
      delete: jest.fn(async (key: string) => void kv.delete(key)),
    },
    CHAT_RATE_LIMITER: { limit: jest.fn(async () => ({ success: true })) },
  } as unknown as Env;
  return { env, kv };
}

async function send(env: Env, message: string, cookie?: string) {
  const pending: Promise<unknown>[] = [];
  const res = await worker.fetch(
    new Request("https://w.dev/api/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: `chatbot_session=${cookie}` } : {}) },
    }),
    env,
    { waitUntil: (p) => pending.push(p) },
  );
  const text = await res.text();
  await Promise.all(pending);
  const events = text.split("\n\n").filter(Boolean).map((line) => line.replace(/^data: /, "")).map((d) => (d === "[DONE]" ? d : JSON.parse(d)));
  return { res, events };
}

const SID = "sess_00000000-0000-4000-8000-000000000000";

describe("worker /api/chat", () => {
  beforeEach(() => jest.spyOn(console, "info").mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it("streams tokens as separate events, then sources and DONE, and saves the session", async () => {
    const { env, kv } = makeEnv(["Dival ", "builds ", "web apps."]);
    const { res, events } = await send(env, "What does Dival build?");
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    expect(events).toEqual([
      { response: "Dival " }, { response: "builds " }, { response: "web apps." },
      { sources: [{ title: "Post", url: "/blogs/post" }] },
      "[DONE]",
    ]);
    const sid = /chatbot_session=([^;]+)/.exec(res.headers.get("Set-Cookie") ?? "")?.[1];
    expect(JSON.parse(kv.get(sid!)!).messages.map((m: { content: string }) => m.content)).toEqual(["What does Dival build?", "Dival builds web apps."]);
  });

  it("refuses to send a contact message the user never confirmed", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch");
    const { env } = makeEnv(["Done! ", '[SUBMIT_CONTACT: {"name":"X","email":"x@evil.co","message":"spam"}]']);
    const { events } = await send(env, "Tell me about his blog");
    expect(events).toContainEqual({ replace: expect.stringContaining("confirm") });
    expect(JSON.stringify(events)).not.toContain("SUBMIT_CONTACT");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forwards a confirmed contact message and reports the real result", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    const session = { id: SID, createdAt: 1, updatedAt: 1, messages: [{ role: "user", content: "Contact Dival: Ann, ann@example.com, hello", timestamp: 1 }] };
    const { env } = makeEnv(['[SUBMIT_CONTACT: {"name":"Ann","email":"ann@example.com","message":"hello"}]'], { [SID]: session });
    const { events } = await send(env, "Yes, send it", SID);
    expect(events).toContainEqual({ replace: expect.stringContaining("forwarded to Dival") });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("ignores forged session cookies that point at other KV keys", async () => {
    const { env } = makeEnv(["Hi."], { "catalog:v1": { blogs: [] } });
    const { res } = await send(env, "Hello Dival", "catalog:v1");
    // Only the legitimate cached catalog read; never loaded or saved as a session.
    expect(env.CHAT_SESSIONS.get).not.toHaveBeenCalledWith("catalog:v1", { type: "json" });
    expect(env.CHAT_SESSIONS.put).not.toHaveBeenCalledWith("catalog:v1", expect.anything(), expect.anything());
    expect(res.headers.get("Set-Cookie")).toMatch(/chatbot_session=sess_/);
  });

  it("returns a static refusal for off-topic questions without calling the model", async () => {
    const { env } = makeEnv([]);
    (env.VECTORIZE.query as jest.Mock).mockResolvedValue({ matches: [] });
    const { events } = await send(env, "best pizza near me");
    expect(events[0]).toEqual({ response: expect.stringContaining("I can only help") });
    expect(env.AI.run).not.toHaveBeenCalledWith(expect.stringContaining("llama"), expect.anything());
  });
});

describe("worker /api/history", () => {
  it("DELETE removes the session and expires the cookie", async () => {
    const { env, kv } = makeEnv([], { [SID]: { id: SID, messages: [] } });
    const res = await worker.fetch(new Request("https://w.dev/api/history", { method: "DELETE", headers: { Cookie: `chatbot_session=${SID}` } }), env, { waitUntil: () => undefined });
    expect(res.status).toBe(200);
    expect(kv.has(SID)).toBe(false);
    expect(res.headers.get("Set-Cookie")).toContain("Max-Age=0");
  });
});
