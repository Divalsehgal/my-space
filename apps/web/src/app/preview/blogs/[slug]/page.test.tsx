import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BlogPostPreviewPage from "./page";
import { getContentfulPostItemBySlug, getContentfulPosts } from "@/lib/services/contentful";
import { isPreviewAllowed } from "@/lib/preview";
import { stubProps } from "@/test-utils/server";

jest.mock("next/navigation", () => ({ notFound: jest.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));
jest.mock("@/lib/services/contentful", () => ({ getContentfulPosts: jest.fn(), getContentfulPostItemBySlug: jest.fn() }));
jest.mock("@/lib/preview", () => ({ isPreviewAllowed: jest.fn() }));
jest.mock("@/containers/BlogPostPreview", () => jest.requireActual("@/test-utils/server").stub("BlogPostPreview"));
jest.mock("@/components/LivePreviewProvider", () => jest.requireActual("@/test-utils/server").stub("LivePreviewProvider"));
jest.mock("@/components/AuthorBio", () => jest.requireActual("@/test-utils/server").stub("AuthorBio"));
jest.mock("@/components/RelatedPosts", () => jest.requireActual("@/test-utils/server").stub("RelatedPosts"));

const page = (slug = "a b") => BlogPostPreviewPage({ params: Promise.resolve({ slug }) });

describe("preview page", () => {
  beforeEach(() => {
    (isPreviewAllowed as jest.Mock).mockResolvedValue(true);
    (getContentfulPosts as jest.Mock).mockResolvedValue([{ slug: "a b" }, { slug: "c" }]);
    (getContentfulPostItemBySlug as jest.Mock).mockResolvedValue({ title: "Draft" });
  });

  it("renders the draft with an exit link and other posts", async () => {
    render(await page());
    expect(screen.getByRole("link")).toHaveAttribute("href", "/api/preview/disable?slug=a%20b");
    expect(stubProps(screen.getByTestId("RelatedPosts")).posts).toEqual([{ slug: "c" }]);
    expect(getContentfulPostItemBySlug).toHaveBeenCalledWith("a b", true);
  });

  it("404s when preview is not allowed", async () => {
    (isPreviewAllowed as jest.Mock).mockResolvedValue(false);
    await expect(page()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("404s for a missing draft", async () => {
    (getContentfulPostItemBySlug as jest.Mock).mockResolvedValue(null);
    await expect(page()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
