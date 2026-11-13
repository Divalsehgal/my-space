import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BlogPostPage, { generateMetadata, generateStaticParams } from "./page";
import { getContentfulPostBySlug, getContentfulPosts } from "@/lib/services/contentful";
import { notFound } from "next/navigation";
import { resolveServer, stubProps } from "@/test-utils/server";

jest.mock("next/navigation", () => ({ notFound: jest.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));
jest.mock("@/lib/services/contentful", () => ({ getContentfulPosts: jest.fn(), getContentfulPostBySlug: jest.fn() }));
jest.mock("@/containers/BlogPost", () => jest.requireActual("@/test-utils/server").stub("BlogPost"));
jest.mock("@/components/Breadcrumbs", () => jest.requireActual("@/test-utils/server").stub("Breadcrumbs"));

const content = { json: { content: [{ nodeType: "paragraph", content: [{ nodeType: "text", value: "two words" }] }] } };
const full = { slug: "b", title: "B", description: "Desc", date: "2026-01-01", publishedAt: "2026-02-01", tags: ["js"], cover: "/c.png", content };
const bare = { slug: "b", title: "B", description: "", date: "", publishedAt: "", tags: [], content: undefined };
const posts = [{ slug: "a" }, { slug: "b" }, { slug: "c" }, { slug: "d" }, { slug: "e" }];
const params = (slug = "b") => ({ params: Promise.resolve({ slug }) });

describe("blog post route", () => {
  beforeEach(() => (getContentfulPosts as jest.Mock).mockResolvedValue(posts));

  it("generates a path per post", async () => {
    expect(await generateStaticParams()).toEqual(posts.map(({ slug }) => ({ slug })));
  });

  it("builds full metadata for a post", async () => {
    (getContentfulPostBySlug as jest.Mock).mockResolvedValue(full);
    const meta = await generateMetadata(params());
    expect(meta).toMatchObject({ title: "B", description: "Desc", twitter: { images: ["/c.png"] } });
    expect(meta.openGraph).toMatchObject({ publishedTime: "2026-01-01", modifiedTime: "2026-02-01" });
  });

  it("falls back to defaults for a sparse post and a missing one", async () => {
    (getContentfulPostBySlug as jest.Mock).mockResolvedValue(bare);
    const meta = await generateMetadata(params());
    expect(meta.description).toBeTruthy();
    expect(meta.twitter).toMatchObject({ images: ["/og-image.jpg"] });
    (getContentfulPostBySlug as jest.Mock).mockResolvedValue(null);
    expect((await generateMetadata(params())).title).toBeTruthy();
  });

  it("renders the post with wrap-around related posts and JSON-LD", async () => {
    (getContentfulPostBySlug as jest.Mock).mockResolvedValue(full);
    const { container } = render(await resolveServer(await BlogPostPage(params("b"))));
    expect(stubProps(screen.getByTestId("BlogPost")).relatedPosts.map((p: { slug: string }) => p.slug)).toEqual(["c", "d", "e"]);
    const jsonLd = JSON.parse(container.querySelector("script")!.innerHTML);
    expect(jsonLd).toMatchObject({ keywords: "js", wordCount: 2, image: "/c.png" });
  });

  it("wraps to the start for the last post and fills sparse JSON-LD", async () => {
    (getContentfulPostBySlug as jest.Mock).mockResolvedValue({ ...bare, slug: "e" });
    const { container } = render(await resolveServer(await BlogPostPage(params("e"))));
    expect(stubProps(screen.getByTestId("BlogPost")).relatedPosts.map((p: { slug: string }) => p.slug)).toEqual(["a", "b", "c"]);
    const jsonLd = JSON.parse(container.querySelector("script")!.innerHTML);
    expect(jsonLd.keywords).toBeUndefined();
    expect(jsonLd.wordCount).toBeUndefined();
  });

  it("404s for an unknown post", async () => {
    (getContentfulPostBySlug as jest.Mock).mockResolvedValue(null);
    await expect(BlogPostPage(params("x"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
