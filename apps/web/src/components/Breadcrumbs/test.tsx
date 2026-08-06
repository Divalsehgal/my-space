import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Breadcrumbs from "./index";

// Mock next/link to render as a normal anchor tag
jest.mock("next/link", () => {
  return function MockLink({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
    return (
      <a href={href} className={className} data-testid={`link-${href}`}>
        {children}
      </a>
    );
  };
});

// Mock FluidContainer
jest.mock("../FluidContainer", () => {
  return function MockFluidContainer({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
      <div data-testid="fluid-container" className={className}>
        {children}
      </div>
    );
  };
});

jest.mock("../ParticlesBackground", () => {
  return function MockParticlesBackground({ className }: { className?: string }) {
    return <div data-testid="breadcrumbs-particles" className={className} />;
  };
});

describe("Breadcrumbs Component", () => {
  const mockItems = [
    { label: "Blog", href: "/blog" },
    { label: "Current Post", href: "/blog/current-post" },
  ];

  it("always renders the Home link", () => {
    render(<Breadcrumbs items={[]} />);

    expect(screen.getByRole("navigation", { name: "breadcrumb" })).toBeInTheDocument();

    const homeLink = screen.getByTestId("link-/");
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveTextContent("Home");
  });

  it("renders breadcrumb items correctly", () => {
    render(<Breadcrumbs items={mockItems} />);

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);

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

  it("renders disabled breadcrumb items as non-interactive", () => {
    render(<Breadcrumbs items={[{ label: "Archive", href: "/archive", disabled: true }, ...mockItems]} />);

    const disabledItem = screen.getByText("Archive");
    expect(disabledItem.tagName).toBe("SPAN");
    expect(disabledItem).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByTestId("link-/archive")).not.toBeInTheDocument();
  });

  it("applies custom class name to nav element", () => {
    const { container } = render(<Breadcrumbs items={[]} className="custom-breadcrumbs" />);

    const nav = container.querySelector("nav");
    expect(nav).toHaveClass("custom-breadcrumbs");
  });

  it("scopes the particle background to the breadcrumb area", () => {
    render(<Breadcrumbs items={[]} />);

    expect(screen.getByTestId("breadcrumbs-particles")).toBeInTheDocument();
  });
});
