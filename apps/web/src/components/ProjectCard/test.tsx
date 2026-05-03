import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectCard from "./index";
import { trackEvent } from "@/utils/analytics";

// Mock the analytics utility
jest.mock("@/utils/analytics", () => ({
  trackEvent: jest.fn(),
}));

// Mock the GlassCard component to simplify this test and isolate ProjectCard logic
jest.mock("../GlassCard", () => {
  return function MockGlassCard(props: { visual: React.ReactNode, title: React.ReactNode, description: React.ReactNode, action: React.ReactNode }) {
    return (
      <div data-testid="mock-glass-card">
        <div data-testid="visual">{props.visual}</div>
        <div data-testid="title">{props.title}</div>
        <div data-testid="description">{props.description}</div>
        <div data-testid="action">{props.action}</div>
      </div>
    );
  };
});

describe("ProjectCard Component", () => {
  const baseProject = {
    id: "proj-1",
    name: "Awesome App",
    description: "An awesome application",
    techStack: ["React", "TypeScript"],
    image: "/awesome.png",
    link: "https://example.com/app",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly by passing props to GlassCard", () => {
    render(<ProjectCard project={baseProject} />);
    
    expect(screen.getByTestId("mock-glass-card")).toBeInTheDocument();
    expect(screen.getByTestId("title")).toHaveTextContent("Awesome App");
    expect(screen.getByTestId("description")).toHaveTextContent("An awesome application");
  });

  it("renders action button with project link when provided", () => {
    render(<ProjectCard project={baseProject} />);
    
    const actionContainer = screen.getByTestId("action");
    const linkButton = actionContainer.querySelector("a");
    
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute("href", "https://example.com/app");
    expect(linkButton).toHaveTextContent("View Project Details");
  });

  it("renders action button with project repo when link is absent", () => {
    const repoProject = { ...baseProject, link: undefined, repo: "https://github.com/repo" };
    render(<ProjectCard project={repoProject} />);
    
    const actionContainer = screen.getByTestId("action");
    const linkButton = actionContainer.querySelector("a");
    
    expect(linkButton).toHaveAttribute("href", "https://github.com/repo");
  });

  it("does not render action button if neither link nor repo is provided", () => {
    const noLinksProject = { ...baseProject, link: undefined, repo: undefined };
    render(<ProjectCard project={noLinksProject} />);
    
    const actionContainer = screen.getByTestId("action");
    expect(actionContainer).toBeEmptyDOMElement();
  });

  it("calls trackEvent when the action button is clicked", () => {
    render(<ProjectCard project={baseProject} />);
    
    const actionContainer = screen.getByTestId("action");
    const linkButton = actionContainer.querySelector("a");
    
    // Simulate click
    if (linkButton) {
      fireEvent.click(linkButton);
    }
    
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("click", "Project", { label: "Awesome App" });
  });

  it("renders with placeholder image if project image is missing", () => {
    const noImageProject = { ...baseProject, image: undefined };
    render(<ProjectCard project={noImageProject} />);
    
    const visualContainer = screen.getByTestId("visual");
    const img = visualContainer.querySelector("img");
    expect(img?.getAttribute("src")).toContain("placeholder-project.jpg");
  });
});
