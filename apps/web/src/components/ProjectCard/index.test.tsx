import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectCard, { screenshotUrl } from "./index";
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

  it("renders a live demo button for the project link", () => {
    renderWithTracking(<ProjectCard project={baseProject} />);

    const live = screen.getByRole("link", { name: "Open the Awesome App live demo" });
    expect(live).toHaveAttribute("href", "https://example.com/app");
    expect(live).toHaveTextContent("Live demo");
  });

  it("renders both live and GitHub buttons when link and repo are provided", () => {
    const both = { ...baseProject, repo: "https://github.com/me/awesome" };
    renderWithTracking(<ProjectCard project={both} />);

    expect(screen.getByRole("link", { name: "Open the Awesome App live demo" })).toHaveAttribute("href", "https://example.com/app");
    expect(screen.getByRole("link", { name: "View the Awesome App source code on GitHub" })).toHaveAttribute("href", "https://github.com/me/awesome");
  });

  it("renders only the GitHub button when link is absent", () => {
    const repoProject = { ...baseProject, link: undefined, repo: "https://github.com/repo" };
    renderWithTracking(<ProjectCard project={repoProject} />);

    const links = screen.getByTestId("action").querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://github.com/repo");
  });

  it("treats a GitHub link as the source instead of a live demo", () => {
    const githubLink = { ...baseProject, link: "https://github.com/me/awesome", repo: undefined };
    renderWithTracking(<ProjectCard project={githubLink} />);

    expect(screen.queryByRole("link", { name: /live demo/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View the Awesome App source code on GitHub" })).toHaveAttribute("href", "https://github.com/me/awesome");
  });

  it("does not render action button if neither link nor repo is provided", () => {
    const noLinksProject = { ...baseProject, link: undefined, repo: undefined };
    renderWithTracking(<ProjectCard project={noLinksProject} />);
    
    const actionContainer = screen.getByTestId("action");
    expect(actionContainer).toBeEmptyDOMElement();
  });

  it("serves remote project images unoptimized so any host works", () => {
    const remote = { ...baseProject, image: "https://front-end-grind.vercel.app/og-image.png" };
    renderWithTracking(<ProjectCard project={remote} />);

    const img = screen.getByTestId("visual").querySelector("img");
    expect(img).toHaveAttribute("src", "https://front-end-grind.vercel.app/og-image.png");
  });

  it("builds a screenshot URL for the live preview", () => {
    const url = new URL(screenshotUrl("https://example.com/app"));
    expect(url.hostname).toBe("api.microlink.io");
    expect(url.searchParams.get("url")).toBe("https://example.com/app");
    expect(url.searchParams.get("embed")).toBe("screenshot.url");
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
