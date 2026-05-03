import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Breadcrumbs from "./index";

// Mock next/link to render as a normal anchor tag
jest.mock("next/link", () => {
  return function MockLink({ children, href, className }: any) {
    return (
      <a href={href} className={className} data-testid={`link-${href}`}>
        {children}
      </a>
    );
  };
});

// Mock FluidContainer
jest.mock("../FluidContainer", () => {
  return function MockFluidContainer({ children }: { children: React.ReactNode }) {
    return <div data-testid="fluid-container">{children}</div>;
  };
});

describe("Breadcrumbs Component", () => {
  const mockItems = [
    { label: "Blog", href: "/blog" },
    { label: "Current Post", href: "/blog/current-post" },
  ];

  it("always renders the Home link", () => {
    render(<Breadcrumbs items={[]} />);
    
    const homeLink = screen.getByTestId("link-/");
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveTextContent("Home");
  });

  it("renders breadcrumb items correctly", () => {
    render(<Breadcrumbs items={mockItems} />);
    
    // First item should be a link
    const firstItemLink = screen.getByTestId("link-/blog");
    expect(firstItemLink).toBeInTheDocument();
    expect(firstItemLink).toHaveTextContent("Blog");

    // Last item should NOT be a link, it should be a span
    expect(screen.queryByTestId("link-/blog/current-post")).not.toBeInTheDocument();
    
    const lastItemText = screen.getByText("Current Post");
    expect(lastItemText).toBeInTheDocument();
    expect(lastItemText.tagName).toBe("SPAN");
    expect(lastItemText).toHaveAttribute("aria-current", "page");
  });

  it("applies custom class name to nav element", () => {
    const { container } = render(<Breadcrumbs items={[]} className="custom-breadcrumbs" />);
    
    const nav = container.querySelector("nav");
    expect(nav).toHaveClass("custom-breadcrumbs");
  });
});
