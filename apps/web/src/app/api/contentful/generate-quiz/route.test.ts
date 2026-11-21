/** @jest-environment node */
import { signRequest } from "@contentful/node-apps-toolkit";
import { OPTIONS, POST } from "./route";
import { contentfulRequest } from "@/lib/contentful/quiz-import";
import { generateQuestions } from "@/lib/contentful/quiz-generate";

jest.mock("@/lib/contentful/quiz-import", () => ({
  ...jest.requireActual("@/lib/contentful/quiz-import"),
  getManagementConfig: () => ({ spaceId: "s", accessToken: "t", environmentId: "master" }),
  contentfulRequest: jest.fn(),
}));
jest.mock("@/lib/contentful/quiz-generate", () => ({ generateQuestions: jest.fn() }));

const SECRET = "a".repeat(64);
const ROUTE_URL = "https://site.test/api/contentful/generate-quiz";
const richText = (value: string) => ({ nodeType: "document", content: [{ nodeType: "paragraph", content: [{ nodeType: "text", value }] }] });

const signedRequest = (body: string) => {
  const headers = { "content-type": "application/json" };
  const signature = signRequest(SECRET, { method: "POST", path: new URL(ROUTE_URL).pathname, headers, body }, Date.now());
  return new Request(ROUTE_URL, { method: "POST", headers: { ...headers, ...signature }, body });
};

const blog = (fields: Record<string, unknown>) => ({
  sys: { id: "blog-1", version: 1, contentType: { sys: { id: "blogPage" } } },
  fields: { title: { "en-US": "Caching" }, ...fields },
});

describe("POST /api/contentful/generate-quiz", () => {
  beforeEach(() => {
    process.env.CONTENTFUL_APP_SIGNING_SECRET = SECRET;
    jest.clearAllMocks();
  });

  it("rejects unsigned requests before touching Contentful or Gemini", async () => {
    const res = await POST(new Request(ROUTE_URL, { method: "POST", body: JSON.stringify({ blogId: "blog-1" }) }));
    expect(res.status).toBe(403);
    expect(contentfulRequest).not.toHaveBeenCalled();
    expect(generateQuestions).not.toHaveBeenCalled();
  });

  it("drafts questions from the blog, skipping ones its quiz already has", async () => {
    (contentfulRequest as jest.Mock)
      .mockResolvedValueOnce(blog({ body: { "en-US": richText("Caching keeps copies.") }, quiz: { "en-US": { sys: { id: "quiz-1" } } } }))
      .mockResolvedValueOnce({ sys: { id: "quiz-1" }, fields: { questionEntries: { "en-US": [{ sys: { id: "q1" } }] } } })
      .mockResolvedValueOnce({ items: [{ sys: { id: "q1" }, fields: { questionText: { "en-US": richText("Old question?") } } }] });
    (generateQuestions as jest.Mock).mockResolvedValue({ questions: [{ questionText: "New?" }], dropped: 1 });
    const res = await POST(signedRequest(JSON.stringify({ blogId: "blog-1", count: 99 })));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ questions: [{ questionText: "New?" }], dropped: 1, existingCount: 1 });
    expect(generateQuestions).toHaveBeenCalledWith({
      title: "Caching",
      sections: [{ heading: "Caching", text: "Caching keeps copies." }],
      existing: ["Old question?"],
      count: 10,
    });
  });

  it("explains what is wrong with the request or the blog", async () => {
    expect((await POST(signedRequest("{"))).status).toBe(400);
    expect((await POST(signedRequest(JSON.stringify({})))).status).toBe(400);

    (contentfulRequest as jest.Mock).mockResolvedValueOnce({ sys: { id: "x", version: 1, contentType: { sys: { id: "quizComponent" } } } });
    expect((await POST(signedRequest(JSON.stringify({ blogId: "x" })))).status).toBe(400);

    (contentfulRequest as jest.Mock).mockResolvedValueOnce(blog({}));
    expect(await (await POST(signedRequest(JSON.stringify({ blogId: "blog-1" })))).json()).toEqual({ error: "This blog has no body text to generate questions from." });
  });

  it("reports when nothing passed the checks, and Gemini failures", async () => {
    (contentfulRequest as jest.Mock).mockResolvedValue(blog({ body: { "en-US": richText("Text.") } }));
    (generateQuestions as jest.Mock).mockResolvedValueOnce({ questions: [], dropped: 3 });
    expect((await POST(signedRequest(JSON.stringify({ blogId: "blog-1" })))).status).toBe(502);

    jest.spyOn(console, "error").mockImplementation(() => undefined);
    (generateQuestions as jest.Mock).mockRejectedValueOnce(new Error("Gemini m1 is overloaded (503)."));
    const res = await POST(signedRequest(JSON.stringify({ blogId: "blog-1" })));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Gemini m1 is overloaded (503)." });
  });

  it("answers the CORS preflight", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
