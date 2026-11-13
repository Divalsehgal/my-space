import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Blogs, { generateMetadata } from "./page";
import { getContentfulPosts } from "@/lib/services/contentful";
import { getViewCounts } from "@/lib/services/analytics";
import { resolveServer, stubProps } from "@/test-utils/server";

jest.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
jest.mock("@/lib/services/contentful", () => ({ getContentfulPosts: jest.fn() }));
jest.mock("@/lib/services/analytics", () => ({ getViewCounts: jest.fn(async () => ({ p: 3 })) }));
jest.mock("@/containers/BlogListings", () => jest.requireActual("@/test-utils/server").stub("BlogListings"));
jest.mock("@/components/Breadcrumbs", () => jest.requireActual("@/test-utils/server").stub("Breadcrumbs"));
jest.mock("@/components/JsonLd", () => jest.requireActual("@/test-utils/server").stub("JsonLd"));

describe("Blogs page", () => {
  it("lists posts with view counts and Blog JSON-LD", async () => {
    (getContentfulPosts as jest.Mock).mockResolvedValue([{ slug: "p", title: "Post", date: "" }]);
    render(await resolveServer(Blogs()));
    expect(stubProps(screen.getByTestId("BlogListings")).initialViewCounts).toEqual({ p: 3 });
    expect(getViewCounts).toHaveBeenCalledWith(["p"]);
    const [posting] = stubProps(screen.getByTestId("JsonLd")).data.blogPost;
    expect(posting.datePublished).toBeUndefined();
    expect(generateMetadata().alternates).toEqual({ canonical: "/blogs" });
  });

  it("handles a missing post list", async () => {
    (getContentfulPosts as jest.Mock).mockResolvedValue(null);
    render(await resolveServer(Blogs()));
    expect(stubProps(screen.getByTestId("BlogListings")).posts).toEqual([]);
  });
});
