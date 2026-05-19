/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExperienceSection from "./index";

// Mock Carousel to just render the items map
jest.mock("@/components/Carousel", () => {
  return function MockCarousel({ items, renderItem }: any) {
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
  return function MockExperienceCard({ experience }: any) {
    return <div data-testid={`exp-card-${experience.id}`}>{experience.role}</div>;
  };
});

describe("ExperienceSection Container", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty carousel when there is no experience data", () => {
    render(<ExperienceSection />);
    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getByTestId("carousel-mock")).toBeEmptyDOMElement();
  });

  it("renders experience items in the carousel", () => {
    const mockItems = [
      { id: "exp-1", role: "Software Engineer", company: "Company A", period: "2020-2022", description: [] },
      { id: "exp-2", role: "Senior Developer", company: "Company B", period: "2022-Present", description: [] },
    ];

    render(<ExperienceSection items={mockItems} />);
    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getByTestId("exp-card-exp-1")).toHaveTextContent("Software Engineer");
    expect(screen.getByTestId("exp-card-exp-2")).toHaveTextContent("Senior Developer");
  });
});
