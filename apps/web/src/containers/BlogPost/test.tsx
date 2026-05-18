import { render, screen } from "@testing-library/react";
import BlogPost from "./index";
import type { ContentfulPost } from "@/types";

jest.mock("@/features/blog/ContentfulRenderer", () => ({
  renderContentfulRichText: jest.fn(() => (
    <div data-testid="rich-content">Rendered rich content</div>
  )),
  extractToc: jest.fn(() => []),
}));

const post: ContentfulPost = {
  id: "post-1",
  title: "Testing Server Container",
  slug: "testing-server-container",
  date: "2026-01-11T00:00:00.000Z",
  description: "desc",
  tags: ["testing", "nextjs"],
  content: {} as never,
  cover: "",
};

describe("BlogPost container", () => {
  it("renders post details and rich content", () => {
    render(<BlogPost post={post} />);

    expect(
      screen.getByRole("heading", { name: post.title, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("testing")).toBeInTheDocument();
    expect(screen.getByText("nextjs")).toBeInTheDocument();
    expect(screen.getByTestId("rich-content")).toBeInTheDocument();
  });
});
