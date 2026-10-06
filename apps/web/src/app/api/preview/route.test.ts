import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getContentfulPostItemBySlug } from "@/lib/services/contentful";
import { GET } from "./route";
import { GET as disable } from "./disable/route";

jest.mock("next/headers", () => ({ draftMode: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/lib/services/contentful", () => ({ getContentfulPostItemBySlug: jest.fn() }));
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({ json: async () => data, status: init?.status ?? 200 })),
  },
}));

const draft = { enable: jest.fn(), disable: jest.fn() };
const env = process.env as Record<string, string | undefined>;
// The routes only read `request.url` (jsdom has no Request global).
const request = (query: string) => ({ url: `https://site.test/api/preview?${query}` }) as Request;

describe("preview API", () => {
  const original = env.CONTENTFUL_PREVIEW_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    env.CONTENTFUL_PREVIEW_SECRET = "s3cret";
    jest.mocked(draftMode).mockResolvedValue(draft as never);
  });
  afterAll(() => {
    env.CONTENTFUL_PREVIEW_SECRET = original;
  });

  it("rejects a wrong secret without enabling draft mode", async () => {
    const res = await GET(request("secret=nope&slug=hello"));
    expect(res?.status).toBe(401);
    expect(draft.enable).not.toHaveBeenCalled();
  });

  it("requires a slug", async () => {
    const res = await GET(request("secret=s3cret"));
    expect(res?.status).toBe(400);
  });

  it("404s for an unknown post", async () => {
    jest.mocked(getContentfulPostItemBySlug).mockResolvedValueOnce(null);
    const res = await GET(request("secret=s3cret&slug=missing"));
    expect(res?.status).toBe(404);
    expect(draft.enable).not.toHaveBeenCalled();
  });

  it("enables draft mode and redirects to the preview page", async () => {
    jest.mocked(getContentfulPostItemBySlug).mockResolvedValueOnce({ slug: "hello" } as never);
    await GET(request("secret=s3cret&slug=hello"));
    expect(getContentfulPostItemBySlug).toHaveBeenCalledWith("hello", true);
    expect(draft.enable).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/preview/blogs/hello");
  });

  it("disables draft mode and returns to the published post", async () => {
    await disable({ url: "https://site.test/api/preview/disable?slug=hello" } as Request);
    expect(draft.disable).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/blogs/hello");

    await disable({ url: "https://site.test/api/preview/disable" } as Request);
    expect(redirect).toHaveBeenLastCalledWith("/blogs");
  });
});
