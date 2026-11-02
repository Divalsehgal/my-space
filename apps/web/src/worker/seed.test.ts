/** @jest-environment node */
import { buildCatalog, buildChunks, type ChatContext } from "./chunks";
import { CATALOG_KEY, MANIFEST_KEY, runSeed } from "./seed";
import type { Env } from "./types";

const context: ChatContext = {
  profile: { name: "Dival Sehgal", role: "Engineer", summary: "Builds things.", about: "About me.", contactIntro: "Say hi." },
  portfolio: {
    experience: [
      { company: "Acme", role: "Senior", period: "2024 - Present", description: [{ text: "Shipped." }], techStack: ["React"] },
      { company: "Acme", role: "Senior", period: "2022 - 2024", description: [{ text: "Earlier." }] },
    ],
    projects: [{ name: "FE Grind", description: "Practice", techStack: ["Vite"], link: "https://fe.example", repo: "https://gh.example" }],
    skills: { languages: [{ name: "TypeScript", level: "Expert" }], frontend: { frameworks: [{ name: "React" }] } },
    socials: [{ label: "GitHub", href: "https://github.com/x" }],
    contact: { email: "d@example.com" },
    resumeUrl: "/cv.pdf",
  },
  blogs: [{ title: "Web Security", slug: "web-security", description: "XSS and CSP.", content: "First sentence. Second sentence.", date: "2026-05-05T00:00:00Z" }],
};

describe("buildChunks", () => {
  it("indexes skills, project links, socials and resume with stable, unique ids", () => {
    const chunks = buildChunks(context);
    const ids = chunks.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["exp-acme-senior", "exp-acme-senior-2", "proj-fe-grind", "skills-overview", "skills-languages", "skills-frontend-frameworks", "blog-web-security-0", "info-contact"]));
    const byId = Object.fromEntries(chunks.map((c) => [c.id, c]));
    expect(byId["skills-languages"].content).toContain("TypeScript (Expert)");
    expect(byId["proj-fe-grind"]).toMatchObject({ metadata: { title: "FE Grind", url: "https://fe.example" } });
    expect(byId["proj-fe-grind"].content).toContain("Source: https://gh.example");
    expect(byId["blog-web-security-0"].metadata).toMatchObject({ title: "Web Security", url: "/blogs/web-security" });
    expect(byId["info-contact"].content).toEqual(expect.stringContaining("GitHub (https://github.com/x)"));
    expect(byId["info-contact"].content).toContain("Resume: /cv.pdf");
  });

  it("indexes long posts beyond the first ~10k characters", () => {
    const content = Array.from({ length: 1000 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
    const chunks = buildChunks({ ...context, blogs: [{ ...context.blogs[0], content }] }).filter((c) => c.metadata.type === "blog");
    expect(chunks.length).toBeGreaterThan(8);
    expect(chunks.at(-1)?.content).toContain("Sentence number 999");
  });
});

describe("buildCatalog", () => {
  it("keeps a compact structured copy", () => {
    const catalog = buildCatalog(context);
    expect(catalog.skills).toEqual({ languages: ["TypeScript (Expert)"], "frontend frameworks": ["React"] });
    expect(catalog.blogs[0]).toMatchObject({ slug: "web-security", url: "https://divalsehgal.vercel.app/blogs/web-security" });
  });
});

describe("runSeed", () => {
  function makeEnv(manifest: Record<string, string> | null) {
    const kv = new Map<string, string>(manifest ? [[MANIFEST_KEY, JSON.stringify(manifest)]] : []);
    const env = {
      AI: { run: jest.fn(async (_model: string, { text }: { text: string[] }) => ({ data: text.map(() => [0.1]) })) },
      VECTORIZE: { upsert: jest.fn(), deleteByIds: jest.fn(), query: jest.fn() },
      CHAT_SESSIONS: {
        get: jest.fn(async (key: string) => (kv.has(key) ? JSON.parse(kv.get(key)!) : null)),
        put: jest.fn(async (key: string, value: string) => void kv.set(key, value)),
      },
    } as unknown as Env;
    return { env, kv };
  }

  beforeEach(() => {
    globalThis.fetch = jest.fn(async () => new Response(JSON.stringify(context))) as unknown as typeof fetch;
  });

  it("first run embeds everything and purges legacy positional ids", async () => {
    const { env, kv } = makeEnv(null);
    const result = await runSeed(env);
    expect(result.upserted).toBe(result.count);
    expect((env.VECTORIZE.deleteByIds as jest.Mock).mock.calls.flat(2)).toEqual(expect.arrayContaining(["blog-0-0", "proj-0"]));
    expect(JSON.parse(kv.get(CATALOG_KEY)!).profile.name).toBe("Dival Sehgal");
  });

  it("re-runs embed only changed chunks and delete only removed ones", async () => {
    const first = makeEnv(null);
    await runSeed(first.env);
    const manifest = { ...JSON.parse(first.kv.get(MANIFEST_KEY)!), "blog-old-post-0": "x", "info-about": "stale" };

    const { env } = makeEnv(manifest);
    const result = await runSeed(env);
    expect(result).toMatchObject({ upserted: 1, deleted: 1 });
    expect(env.VECTORIZE.upsert).toHaveBeenCalledWith([expect.objectContaining({ id: "info-about" })]);
    expect(env.VECTORIZE.deleteByIds).toHaveBeenCalledWith(["blog-old-post-0"]);
  });
});
