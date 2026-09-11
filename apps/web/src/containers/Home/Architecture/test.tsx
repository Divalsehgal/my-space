import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Architecture from ".";
import type { ArchitectureConfig } from "@/features/portfolio";
import { ThemeContextProvider } from "@/context/ThemeContext";

// React Flow measures its container via ResizeObserver, which jsdom doesn't
// implement. Scoped to this file only - not added to the shared jest-config
// setup, since no other suite needs it.
beforeAll(() => {
  global.ResizeObserver = class {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  };
});

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeContextProvider>{component}</ThemeContextProvider>);
};

describe("Architecture Container", () => {
  it("renders nothing when there is no data", () => {
    const { container } = renderWithTheme(<Architecture />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the nodes array is empty", () => {
    const { container } = renderWithTheme(<Architecture data={{ nodes: [], edges: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the diagram with nodes and title when provided", () => {
    const data: ArchitectureConfig = {
      title: "How it's built",
      nodes: [
        { id: "frontend", position: { x: 0, y: 0 }, type: "frontend", data: { label: "Next.js" } },
        {
          id: "cms",
          position: { x: 0, y: 150 },
          type: "external",
          data: { label: "Contentful", description: "Headless CMS for content." },
        },
      ],
      edges: [{ id: "e1", source: "frontend", target: "cms", label: "fetches" }],
    };

    renderWithTheme(<Architecture data={data} />);

    expect(screen.getByText("How it's built")).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("Contentful")).toBeInTheDocument();
  });

  it("shows a node's description when it is clicked", () => {
    const data: ArchitectureConfig = {
      nodes: [
        {
          id: "cms",
          position: { x: 0, y: 0 },
          type: "external",
          data: { label: "Contentful", description: "Headless CMS for content." },
        },
      ],
      edges: [],
    };

    renderWithTheme(<Architecture data={data} />);

    expect(screen.queryByText("Headless CMS for content.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Contentful"));

    expect(screen.getByText("Headless CMS for content.")).toBeInTheDocument();
  });
});
