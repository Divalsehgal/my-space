
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExperienceCard from "./index";

interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  description: { text: string }[];
  techStack: string[];
}

jest.mock("../GlassCard", () => {
  return function MockGlassCard(props: { title: string; subtitle?: string; description: unknown; tags: string[] }) {
    return (
      <div data-testid="mock-glass-card">
        <div data-testid="title">{props.title}</div>
        <div data-testid="subtitle">{props.subtitle}</div>
        <div data-testid="description">
          {typeof props.description === "string" 
            ? props.description 
            : JSON.stringify(props.description)}
        </div>
        <div data-testid="tags">{JSON.stringify(props.tags)}</div>
      </div>
    );
  };
});

describe("ExperienceCard Component", () => {
  const mockExperience: Experience = {
    id: "exp-1",
    role: "Senior Engineer",
    company: "Tech Corp",
    period: "2020 - Present",
    description: [
      { text: "Built cool things" }
    ],
    techStack: ["React", "Node.js"],
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly by passing formatted props to GlassCard", () => {
    render(<ExperienceCard experience={mockExperience} />);
    
    expect(screen.getByTestId("mock-glass-card")).toBeInTheDocument();
    
    // The role is the heading; the company sits under it
    expect(screen.getByTestId("title")).toHaveTextContent("Senior Engineer");
    expect(screen.getByTestId("subtitle")).toHaveTextContent("Tech Corp");
    
    // Checks tags
    expect(screen.getByTestId("tags")).toHaveTextContent('["React","Node.js"]');
  });
});
