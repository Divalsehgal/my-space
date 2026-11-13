import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BlogPostPreview from ".";
import { useContentfulLiveUpdates } from "@contentful/live-preview/react";

jest.mock("@contentful/live-preview/react", () => ({ useContentfulLiveUpdates: jest.fn((item) => ({ ...item, title: "Live title" })) }));
jest.mock("@/lib/contentful/mappers", () => ({ mapContentfulPost: jest.fn((item) => ({ title: item.title })) }));
jest.mock("@/containers/BlogPost/BlogPostArticle", () => function MockArticle({ post, trackViews, children }: { post: { title: string }; trackViews: boolean; children: React.ReactNode }) {
  return <article data-track={String(trackViews)}><h1>{post.title}</h1>{children}</article>;
});

describe("BlogPostPreview", () => {
  it("renders the live draft without tracking views", () => {
    render(<BlogPostPreview initialItem={{ title: "Draft" } as never}><p>bio</p></BlogPostPreview>);
    expect(screen.getByRole("heading", { name: "Live title" })).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveAttribute("data-track", "false");
    expect(screen.getByText("bio")).toBeInTheDocument();
    expect(useContentfulLiveUpdates).toHaveBeenCalledWith({ title: "Draft" }, expect.objectContaining({ query: expect.anything() }));
  });
});
