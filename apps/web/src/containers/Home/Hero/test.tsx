import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Hero from "./index";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";

// Mock utilities
jest.mock("@/utils/analytics", () => {
  const actual = jest.requireActual("@/utils/analytics");
  return {
    ...actual,
    trackInteraction: jest.fn(),
  };
});

// Mock decorative backgrounds
jest.mock("@/components/BackgroundPattern", () => function MockBackgroundPattern() { return <div data-testid="bg-pattern" />; });
jest.mock("@/components/ParticlesBackground", () => function MockParticlesBackground() { return <div data-testid="particles-bg" />; });

describe("Hero Container", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders with default fallback text when data is empty", () => {
    render(<Hero />);
    
    expect(screen.getByText("Dival Sehgal")).toBeInTheDocument();
    expect(screen.getByText("Full-Stack Engineer")).toBeInTheDocument();
    
    // Default Buttons
    expect(screen.getByText("View Projects")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Resume")).toBeInTheDocument();
  });

  it("renders with dynamic data passed as props", () => {
    const mockData = {
      title: "Test Title",
      subtitle: "Test Subtitle",
      primaryCtaLabel: "Custom CTA",
    };

    render(<Hero data={mockData} />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    expect(screen.getByText("Custom CTA")).toBeInTheDocument();
  });

  it("calls trackInteraction properly on Resume click", () => {
    render(<Hero />);
    
    const resumeBtn = screen.getByText("Resume");
    fireEvent.click(resumeBtn);
    
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.RESUME_VIEW, { label: "Hero Resume Button" });
  });

  it("calls trackInteraction properly on other button clicks", () => {
    render(<Hero />);
    
    const viewProjectsBtn = screen.getByText("View Projects");
    fireEvent.click(viewProjectsBtn);
    
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.NAV_CLICK, { 
      label: "View Projects", 
      href: "#projects", 
      location: "navbar" 
    });
  });

  it("handles missing href in trackInteraction (fallback to empty string)", () => {
    const mockData = {
      title: "Test Title",
      subtitle: "Test Subtitle",
      primaryCtaLabel: "No Href",
      primaryCtaHref: "", // empty string to trigger fallback
    };

    render(<Hero data={mockData} />);
    
    const btn = screen.getByText("No Href");
    fireEvent.click(btn);
    
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.NAV_CLICK, { 
      label: "No Href", 
      href: "", 
      location: "navbar" 
    });
  });
});
