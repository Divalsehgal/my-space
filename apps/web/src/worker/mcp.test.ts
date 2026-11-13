/** @jest-environment node */
import { mcp } from "./mcp";
import type { Env } from "./types";

const catalog = {
  profile: { name: "Dival Sehgal", role: "Engineer", summary: "", location: "Bengaluru" },
  experience: [],
  projects: [],
  skills: {},
  blogs: [{ title: "A", slug: "a", date: "2026-01-01", description: "", url: "https://x/blogs/a" }, { title: "B", slug: "b", date: "2025-01-01", description: "", url: "https://x/blogs/b" }],
  socials: [],
  updatedAt: "",
};

const env = {
  AI: { run: jest.fn(async () => ({ data: [[0.1]] })) },
  VECTORIZE: { query: jest.fn(async () => ({ matches: [{ score: 0.9, metadata: { text: "Knows React", type: "skills" } }] })) },
  CHAT_SESSIONS: { get: jest.fn(async () => catalog) },
} as unknown as Env;

const rpc = (body: unknown, method = "POST") =>
  mcp(new Request("https://w.dev/mcp", { method, body: method === "POST" ? JSON.stringify(body) : undefined, headers: { "Content-Type": "application/json" } }), env);

describe("mcp", () => {
  it("negotiates the protocol version and lists read-only tools", async () => {
    const init = await (await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } })).json();
    expect(init.result).toMatchObject({ protocolVersion: "2025-03-26", capabilities: { tools: {} } });

    const list = await (await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" })).json();
    expect(list.result.tools.map((t: { name: string }) => t.name)).toEqual(["search_portfolio", "get_profile", "list_blog_posts"]);
  });

  it("calls tools", async () => {
    const search = await (await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "search_portfolio", arguments: { query: "react" } } })).json();
    expect(search.result.content[0].text).toContain("Knows React");

    const posts = await (await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "list_blog_posts", arguments: { limit: 1 } } })).json();
    expect(JSON.parse(posts.result.content[0].text)).toHaveLength(1);

    const missing = await (await rpc({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "search_portfolio", arguments: {} } })).json();
    expect(missing.result.isError).toBe(true);
  });

  it("handles notifications, unknown methods, bad JSON and GET", async () => {
    expect((await rpc({ jsonrpc: "2.0", method: "notifications/initialized" })).status).toBe(202);
    expect((await (await rpc({ jsonrpc: "2.0", id: 6, method: "nope" })).json()).error.code).toBe(-32601);
    const bad = await mcp(new Request("https://w.dev/mcp", { method: "POST", body: "{" }), env);
    expect(bad.status).toBe(400);
    expect((await rpc(undefined, "GET")).status).toBe(405);
  });
});

describe("mcp edge cases", () => {
  const call = (name: string, args?: unknown) => rpc({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name, arguments: args } }).then((r) => r.json());
  const get = env.CHAT_SESSIONS.get as jest.Mock;
  afterEach(() => get.mockImplementation(async () => catalog));

  it("returns the profile, pings and falls back to the default protocol version", async () => {
    expect(JSON.parse((await call("get_profile")).result.content[0].text)).toMatchObject({ name: "Dival Sehgal" });
    expect((await (await rpc({ jsonrpc: "2.0", id: 1, method: "ping" })).json()).result).toEqual({});
    const init = await (await rpc({ jsonrpc: "2.0", id: 1, method: "initialize" })).json();
    expect(init.result.protocolVersion).toBeTruthy();
  });

  it("reports an empty search, a missing catalog and an unknown tool", async () => {
    (env.VECTORIZE.query as jest.Mock).mockResolvedValueOnce({ matches: [] });
    expect((await call("search_portfolio", { query: "zzz", limit: 2 })).result.content[0].text).toContain("No relevant");
    get.mockRejectedValue(new Error("kv"));
    expect((await call("get_profile")).result.isError).toBe(true);
    expect((await call("list_blog_posts")).result.isError).toBe(true);
    expect((await call("nope")).error.message).toContain("Unknown tool");
  });

  it("answers batches and rejects malformed requests", async () => {
    const res = await (await rpc([{ jsonrpc: "2.0", id: 1, method: "ping" }, { jsonrpc: "1.0", id: 2, method: "ping" }, null])).json();
    expect(res).toHaveLength(3);
    expect(res[1].error.code).toBe(-32600);
    expect(res[2]).toMatchObject({ id: null, error: { code: -32600 } });
  });
});
