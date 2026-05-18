import { render, screen, fireEvent } from "@testing-library/react";
import BlogPageContent from "./index";
import type { ContentfulPost } from "@/types";

jest.mock("@/components/Carousel", () => {
  return function MockCarousel() {
    return <div data-testid="carousel">Carousel</div>;
  };
});

const posts: ContentfulPost[] = [
  {
    id: "1",
    title: "React Performance Patterns",
    slug: "react-performance-patterns",
    date: "2026-03-01T00:00:00.000Z",
    description: "A guide to optimize rendering paths.",
    tags: ["react", "performance"],
    content: {} as never,
    cover: "",
  },
  {
    id: "2",
    title: "GraphQL Caching Basics",
    slug: "graphql-caching-basics",
    date: "2026-03-03T00:00:00.000Z",
    description: "Understand caching layers in GraphQL stacks.",
    tags: ["graphql", "backend"],
    content: {} as never,
    cover: "",
  },
];

describe("BlogListings container", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  it("renders empty state for no posts", () => {
    render(<BlogPageContent posts={[]} />);

    expect(screen.getByRole("heading", { name: "Blog" })).toBeInTheDocument();
    expect(screen.getByText(/no posts found/i)).toBeInTheDocument();
  });

  it("filters posts by search query", () => {
    render(<BlogPageContent posts={posts} />);

    const input = screen.getByPlaceholderText(/search posts/i);
    fireEvent.change(input, { target: { value: "graphql" } });

    expect(screen.getByText(/graphql caching basics/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/react performance patterns/i)
    ).not.toBeInTheDocument();
  });
});
