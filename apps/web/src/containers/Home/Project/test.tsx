import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectSection from "./index";

// Mock Carousel
jest.mock("@/components/Carousel", () => {
  return function MockCarousel({ items, renderItem }: unknown) {
    return (
      <div data-testid="carousel-mock">
        {items.map((item: unknown, i: number) => (
          <div key={i}>{renderItem(item)}</div>
        ))}
      </div>
    );
  };
});

// Mock ProjectCard
jest.mock("@/components/ProjectCard", () => {
  return function MockProjectCard({ project }: unknown) {
    return <div data-testid={`proj-card-${project.id}`}>{project.name}</div>;
  };
});

describe("ProjectSection Container", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty carousel when there is no project data", () => {
    render(<ProjectSection />);
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByTestId("carousel-mock")).toBeEmptyDOMElement();
  });

  it("renders project items in the carousel", () => {
    const mockItems = [
      { id: "p-1", name: "AI Agent", description: "AI stuff" },
      { id: "p-2", name: "Web App", description: "Web stuff" },
    ];

    render(<ProjectSection items={mockItems} />);
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByTestId("proj-card-p-1")).toHaveTextContent("AI Agent");
    expect(screen.getByTestId("proj-card-p-2")).toHaveTextContent("Web App");
  });
});
