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

const JSON_HEADERS = { "Content-Type": "application/json" };
const call = (env: Env, path: string, init: RequestInit = {}, base = "https://w.dev") =>
  worker.fetch(new Request(`${base}${path}`, init.body === undefined ? init : { headers: JSON_HEADERS, ...init }), env, { waitUntil: () => undefined });

describe("worker /api/chat edge cases", () => {
  beforeEach(() => {
    jest.spyOn(console, "info").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it("rejects non-POST, bad JSON and empty messages", async () => {
    const { env } = makeEnv([]);
    expect((await call(env, "/api/chat")).status).toBe(405);
    expect((await call(env, "/api/chat", { method: "POST", body: "{" })).status).toBe(400);
    expect((await call(env, "/api/chat", { method: "POST", body: "null" })).status).toBe(400);
    expect((await call(env, "/api/chat", { method: "POST", body: JSON.stringify({ message: 5 }) })).status).toBe(400);
  });

  it("rejects a non-JSON content type, which a cross-site form could send without a preflight", async () => {
    const { env } = makeEnv([]);
    const res = await call(env, "/api/chat", { method: "POST", body: JSON.stringify({ message: "hi" }), headers: { "Content-Type": "text/plain" } });
    expect(res.status).toBe(415);
    expect(env.CHAT_SESSIONS.put).not.toHaveBeenCalled();
  });

  it("streams a refusal for a blocked message", async () => {
    const { env } = makeEnv([]);
    const { events } = await send(env, "x".repeat(5000));
    expect(events[0]).toEqual({ response: expect.stringContaining("concise") });
  });

  it("rate limits with the binding", async () => {
    const { env } = makeEnv([]);
    (env.CHAT_RATE_LIMITER!.limit as jest.Mock).mockResolvedValue({ success: false });
    const { events } = await send(env, "What does Dival build?");
    expect(events[0]).toEqual({ response: expect.stringContaining("wait a minute") });
  });

  it("falls back to a KV counter without the binding, and fails open on errors", async () => {
    const { env, kv } = makeEnv(["Hi."]);
    delete (env as Partial<Env>).CHAT_RATE_LIMITER;
    await send(env, "What does Dival build?");
    const key = [...kv.keys()].find((k) => k.startsWith("rate:chat:"))!;
    kv.set(key, JSON.stringify("20"));
    (env.CHAT_SESSIONS.get as jest.Mock).mockImplementationOnce(async () => "20");
    expect((await send(env, "What does Dival build?")).events[0]).toEqual({ response: expect.stringContaining("wait a minute") });
    (env.CHAT_SESSIONS.get as jest.Mock).mockRejectedValueOnce(new Error("kv down"));
    expect((await send(env, "What does Dival build?")).events[0]).not.toEqual({ response: expect.stringContaining("wait a minute") });
  });

  it("replaces a leaking stream with the private-data reply", async () => {
    const { env } = makeEnv(["Here are the VERIFIED REFERENCE FACTS"]);
    const { events } = await send(env, "What does Dival build?");
    expect(events).toContainEqual({ replace: expect.stringContaining("cannot reveal") });
    expect(events).not.toContainEqual(expect.objectContaining({ sources: expect.anything() }));
  });

  it("falls back to a buffered completion when the stream is empty", async () => {
    const { env } = makeEnv([]);
    (env.AI.run as jest.Mock).mockImplementation(async (model: string, options: { stream?: boolean }) => {
      if (model.includes("bge")) {return { data: [[0.1]] };}
      return options.stream ? modelStream([]) : { choices: [{ message: { content: "Buffered answer." } }] };
    });
    const { events } = await send(env, "What does Dival build?");
    expect(events).toContainEqual({ replace: "Buffered answer." });
  });

  it("replaces the answer with the fallback when the model throws", async () => {
    const { env } = makeEnv([]);
    (env.AI.run as jest.Mock).mockImplementation(async (model: string) => {
      if (model.includes("bge")) {return { data: [[0.1]] };}
      throw new Error("model down");
    });
    const { events } = await send(env, "What does Dival build?");
    expect(events.at(-2)).toEqual({ replace: expect.any(String) });
  });

  it("tells the model when no facts were retrieved", async () => {
    const { env } = makeEnv(["Hi."]);
    (env.VECTORIZE.query as jest.Mock).mockResolvedValue({ matches: [] });
    await send(env, "What projects has Dival built?");
    const chatCall = (env.AI.run as jest.Mock).mock.calls.find(([model]) => !model.includes("bge"));
    expect(chatCall[1].messages[0].content).toContain("No matching verified facts");
  });

  it("uses a Lax cookie over plain http", async () => {
    const { env } = makeEnv(["Hi."]);
    const res = await call(env, "/api/chat", { method: "POST", body: JSON.stringify({ message: "What does Dival build?" }) }, "http://localhost");
    await res.text();
    expect(res.headers.get("Set-Cookie")).toContain("SameSite=Lax");
  });
});

describe("worker routing", () => {
  beforeEach(() => jest.spyOn(console, "info").mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it("answers preflight, health and unknown paths", async () => {
    const { env } = makeEnv([]);
    expect((await call(env, "/api/chat", { method: "OPTIONS" })).status).toBe(200);
    expect(await (await call(env, "/api/health")).json()).toEqual({ status: "ok" });
    expect((await call(env, "/nope")).status).toBe(404);
    expect((await call(env, "/api/seed")).status).toBe(405);
  });

  it("returns stored history with sources, and an empty list without a session", async () => {
    const session = { id: SID, messages: [{ role: "assistant", content: "A", sources: [{ title: "T", url: "/u" }] }, { role: "user", content: "Q" }] };
    const { env } = makeEnv([], { [SID]: session });
    const res = await call(env, "/api/history", { headers: { Cookie: `chatbot_session=${SID}` } });
    expect(await res.json()).toEqual({ messages: [{ role: "assistant", content: "A", sources: [{ title: "T", url: "/u" }] }, { role: "user", content: "Q" }] });
    expect(await (await call(env, "/api/history")).json()).toEqual({ messages: [] });
  });

  it("DELETE without a session sets no cookie", async () => {
    const { env } = makeEnv([]);
    const res = await call(env, "/api/history", { method: "DELETE" });
    expect(res.headers.get("Set-Cookie")).toBeNull();
  });

  it("rate limits /mcp", async () => {
    const { env } = makeEnv([]);
    (env.CHAT_RATE_LIMITER!.limit as jest.Mock).mockResolvedValue({ success: false });
    expect((await call(env, "/mcp", { method: "POST", body: "{}" })).status).toBe(429);
  });

  it("serves /mcp when under the limit", async () => {
    const { env } = makeEnv([]);
    const res = await call(env, "/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) });
    expect(res.status).toBe(200);
  });
});
