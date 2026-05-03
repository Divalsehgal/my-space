import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExperienceSection from "./index";
import { usePortfolioContext } from "@/context/PortfolioContext";

// Mock the context
jest.mock("@/context/PortfolioContext", () => ({
  usePortfolioContext: jest.fn(),
}));

// Mock Carousel to just render the items map
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

// Mock ExperienceCard
jest.mock("@/components/ExperienceCard", () => {
  return function MockExperienceCard({ experience }: unknown) {
    return <div data-testid={`exp-card-${experience.id}`}>{experience.role}</div>;
  };
});

describe("ExperienceSection Container", () => {
  beforeEach(() => {
    (usePortfolioContext as jest.Mock).mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty carousel when there is no experience data", () => {
    render(<ExperienceSection />);
    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getByTestId("carousel-mock")).toBeEmptyDOMElement();
  });

  it("renders experience items in the carousel", () => {
    (usePortfolioContext as jest.Mock).mockReturnValue({
      experience: [
        { id: "exp-1", role: "Software Engineer" },
        { id: "exp-2", role: "Senior Developer" },
      ],
    });

    render(<ExperienceSection />);
    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getByTestId("exp-card-exp-1")).toHaveTextContent("Software Engineer");
    expect(screen.getByTestId("exp-card-exp-2")).toHaveTextContent("Senior Developer");
  });
});
