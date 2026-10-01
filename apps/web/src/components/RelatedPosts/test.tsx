import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import RelatedPosts from "./index";
import type { ContentfulPost } from "@/types";

const post = (slug: string, title: string) =>
  ({ slug, title, description: `${title} summary` }) as ContentfulPost;

describe("RelatedPosts", () => {
  it("links to each related post", () => {
    render(<RelatedPosts posts={[post("web-security", "Web Security"), post("next-js-guide", "Next Js Guide")]} />);
    expect(screen.getByRole("link", { name: "Web Security" })).toHaveAttribute("href", "/blogs/web-security");
    expect(screen.getByRole("link", { name: "Next Js Guide" })).toHaveAttribute("href", "/blogs/next-js-guide");
  });

  it("renders nothing without posts", () => {
    const { container } = render(<RelatedPosts posts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
