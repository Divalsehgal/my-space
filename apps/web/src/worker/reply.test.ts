/** @jest-environment node */
import { FALLBACK_REPLY, postProcessReply, runCompletion, siteIndex } from "./reply";
import type { Catalog, ChatSession, Env } from "./types";

describe("siteIndex", () => {
  it("lists posts, projects, roles, skills and the resume so list/skill questions don't depend on retrieval", () => {
    const catalog = {
      blogs: [{ title: "Web Security", slug: "web-security", date: "2026-05-05T00:00:00Z" }],
      projects: [{ name: "FE Grind", link: "https://fe.example" }],
      experience: [{ role: "Senior", company: "Acme", period: "2024 - Present" }],
      skills: { languages: ["TypeScript (Expert)", "Python (Advanced)"] },
      resumeUrl: "https://drive.example/resume",
    } as unknown as Catalog;
    const index = siteIndex(catalog);
    expect(index).toContain("- [Web Security](/blogs/web-security) (2026-05-05)");
    expect(index).toContain("- FE Grind (https://fe.example)");
    expect(index).toContain("- Senior at Acme, 2024 - Present");
    expect(index).toContain("- languages: TypeScript (Expert), Python (Advanced)");
    expect(index).toContain("Resume: https://drive.example/resume");
    expect(siteIndex(null)).toBe("");
  });
});

describe("runCompletion", () => {
  const env = (run: jest.Mock) => ({ AI: { run } }) as unknown as Env;
  it("reads legacy and OpenAI-style output, and '' on failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await runCompletion(env(jest.fn(async () => ({ response: " hi " }))), [])).toBe("hi");
    expect(await runCompletion(env(jest.fn(async () => ({ choices: [{ message: { content: "yo" } }] }))), [])).toBe("yo");
    expect(await runCompletion(env(jest.fn(async () => null)), [])).toBe("");
    expect(await runCompletion(env(jest.fn(async () => Promise.reject(new Error("x")))), [])).toBe("");
  });
});

describe("postProcessReply", () => {
  const req = new Request("https://w.dev/api/chat");
  const token = (email = "ann@example.com") => `Sure. [SUBMIT_CONTACT: {"name":"Ann","email":"${email}","message":"hello"}]`;
  const session = (contactsSent = 0): ChatSession =>
    ({
      id: "s",
      createdAt: 0,
      updatedAt: 0,
      contactsSent,
      messages: [
        { role: "user", content: "Contact Dival: Ann, ann@example.com, hello", timestamp: 0 },
        { role: "user", content: "Yes, send it", timestamp: 0 },
      ],
    }) as ChatSession;

  beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it("falls back on empty output and blocks leaks", async () => {
    expect(await postProcessReply(req, {} as Env, "", session())).toBe(FALLBACK_REPLY);
    expect(await postProcessReply(req, {} as Env, "Here are the verified reference facts", session())).toContain("cannot reveal");
  });

  it("rejects an invalid contact and enforces the per-session limit", async () => {
    expect(await postProcessReply(req, {} as Env, token("not-an-email"), session())).not.toContain("forwarded");
    expect(await postProcessReply(req, {} as Env, token(), session(3))).not.toContain("forwarded");
  });

  it("forwards to the configured contact URL and counts it", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
    const sess = session();
    expect(await postProcessReply(req, { CONTACT_API_URL: "https://site/api/contact" } as Env, token(), sess)).toContain("forwarded");
    expect(fetchMock).toHaveBeenCalledWith("https://site/api/contact", expect.anything());
    expect(sess.contactsSent).toBe(1);
  });

  it("reports a failed or erroring submission", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("", { status: 500 })).mockRejectedValueOnce(new Error("net"));
    expect(await postProcessReply(req, {} as Env, token(), session())).toContain("could not forward");
    expect(await postProcessReply(req, {} as Env, token(), session())).toContain("could not forward");
  });
});

describe("siteIndex with sparse catalog", () => {
  it("handles missing lists and links", () => {
    const index = siteIndex({ projects: [{ name: "P" }] } as unknown as Catalog);
    expect(index).toContain("- P\n");
    expect(index).not.toContain("Resume:");
  });
});
