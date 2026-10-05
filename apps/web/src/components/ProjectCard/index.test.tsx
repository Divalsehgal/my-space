import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectCard from "./index";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import { renderWithTracking } from "@/test-utils/render";

// Mock the analytics utility
jest.mock("@/utils/analytics", () => {
  const actual = jest.requireActual("@/utils/analytics");
  return {
    ...actual,
    trackInteraction: jest.fn(),
  };
});

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
    renderWithTracking(<ProjectCard project={baseProject} />);
    
    expect(screen.getByTestId("mock-glass-card")).toBeInTheDocument();
    expect(screen.getByTestId("title")).toHaveTextContent("Awesome App");
    expect(screen.getByTestId("description")).toHaveTextContent("An awesome application");
  });

  it("renders action button with project link when provided", () => {
    renderWithTracking(<ProjectCard project={baseProject} />);
    
    const actionContainer = screen.getByTestId("action");
    const linkButton = actionContainer.querySelector("a");
    
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute("href", "https://example.com/app");
    expect(linkButton).toHaveTextContent("See how it works");
    expect(linkButton).toHaveAttribute("aria-label", "See how Awesome App works");
  });

  it("renders action button with project repo when link is absent", () => {
    const repoProject = { ...baseProject, link: undefined, repo: "https://github.com/repo" };
    renderWithTracking(<ProjectCard project={repoProject} />);
    
    const actionContainer = screen.getByTestId("action");
    const linkButton = actionContainer.querySelector("a");
    
    expect(linkButton).toHaveAttribute("href", "https://github.com/repo");
  });

  it("does not render action button if neither link nor repo is provided", () => {
    const noLinksProject = { ...baseProject, link: undefined, repo: undefined };
    renderWithTracking(<ProjectCard project={noLinksProject} />);
    
    const actionContainer = screen.getByTestId("action");
    expect(actionContainer).toBeEmptyDOMElement();
  });

  it("calls trackEvent when the action button is clicked", () => {
    renderWithTracking(<ProjectCard project={baseProject} />);
    
    const actionContainer = screen.getByTestId("action");
    const linkButton = actionContainer.querySelector("a");
    
    // Simulate click
    if (linkButton) {
      fireEvent.click(linkButton);
    }
    
    expect(trackInteraction).toHaveBeenCalledTimes(1);
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.PROJECT_CLICK, {
      projectName: "Awesome App",
      linkType: "live",
    });
  });

  it("renders with placeholder image if project image is missing", () => {
    const noImageProject = { ...baseProject, image: undefined };
    renderWithTracking(<ProjectCard project={noImageProject} />);
    
    const visualContainer = screen.getByTestId("visual");
    const img = visualContainer.querySelector("img");
    expect(img?.getAttribute("src")).toContain("placeholder-project.jpg");
  });
});
