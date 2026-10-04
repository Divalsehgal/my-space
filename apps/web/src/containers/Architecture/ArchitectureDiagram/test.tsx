import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ArchitectureDiagram from "./index";
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

const nodes = [
  { id: "frontend", position: { x: 0, y: 0 }, type: "frontend" as const, data: { label: "Next.js" } },
  {
    id: "cms",
    position: { x: 0, y: 150 },
    type: "external" as const,
    data: { label: "Contentful", description: "Headless CMS for content." },
  },
];

const edges = [{ id: "e1", source: "frontend", target: "cms", label: "fetches" }];

describe("ArchitectureDiagram Component", () => {
  it("renders every node", () => {
    renderWithTheme(<ArchitectureDiagram nodes={nodes} edges={edges} />);

    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("Contentful")).toBeInTheDocument();
  });

  it("shows a node's description when it is clicked", () => {
    renderWithTheme(<ArchitectureDiagram nodes={nodes} edges={edges} />);

    expect(screen.queryByText("Headless CMS for content.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Contentful"));

    expect(screen.getByText("Headless CMS for content.")).toBeInTheDocument();
  });

});
