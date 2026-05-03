import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Hero from "./index";
import { trackInteraction } from "@/utils/analytics";
import { usePortfolioContext } from "@/context/PortfolioContext";

// Mock utilities and context
jest.mock("@/utils/analytics", () => ({
  trackInteraction: jest.fn(),
}));

jest.mock("@/context/PortfolioContext", () => ({
  usePortfolioContext: jest.fn(),
}));

// Mock framer-motion
jest.mock("framer-motion", () => {
  const actualFramerMotion = jest.requireActual("framer-motion");
  return {
    ...actualFramerMotion,
    useScroll: () => ({ scrollY: 0 }),
    useTransform: () => 0,
    motion: {
      div: ({ style, className, children, ...props }: any) => (
        <div data-testid="motion-div" style={style} className={className} {...props}>{children}</div>
      ),
    },
  };
});

// Mock decorative backgrounds
jest.mock("@/components/BackgroundPattern", () => function MockBackgroundPattern() { return <div data-testid="bg-pattern" />; });
jest.mock("@/components/ParticlesBackground", () => function MockParticlesBackground() { return <div data-testid="particles-bg" />; });

describe("Hero Container", () => {
  beforeEach(() => {
    (usePortfolioContext as jest.Mock).mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders with default fallback text when context is empty", () => {
    render(<Hero />);
    
    expect(screen.getByText("Dival Sehgal")).toBeInTheDocument();
    expect(screen.getByText("Full-Stack Engineer")).toBeInTheDocument();
    
    // Default Buttons
    expect(screen.getByText("View Projects")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Resume")).toBeInTheDocument();
  });

  it("renders with dynamic data from PortfolioContext", () => {
    (usePortfolioContext as jest.Mock).mockReturnValue({
      hero: {
        title: "Test Title",
        subtitle: "Test Subtitle",
        badge: { enabled: true, label: "Available for Hire" },
        primaryCtaLabel: "Custom CTA",
      },
    });

    render(<Hero />);
    
    expect(screen.getByText("Available for Hire")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    expect(screen.getByText("Custom CTA")).toBeInTheDocument();
  });

  it("calls trackInteraction properly on Resume click", () => {
    render(<Hero />);
    
    const resumeBtn = screen.getByText("Resume");
    fireEvent.click(resumeBtn);
    
    expect(trackInteraction).toHaveBeenCalledWith("resume_view", { label: "Hero Resume Button" });
  });

  it("calls trackInteraction properly on other button clicks", () => {
    render(<Hero />);
    
    const viewProjectsBtn = screen.getByText("View Projects");
    fireEvent.click(viewProjectsBtn);
    
    expect(trackInteraction).toHaveBeenCalledWith("nav_click", { 
      label: "View Projects", 
      href: "#projects", 
      location: "navbar" 
    });
  });

  it("handles missing href in trackInteraction (fallback to empty string)", () => {
    (usePortfolioContext as jest.Mock).mockReturnValue({
      hero: {
        primaryCtaLabel: "No Href",
        primaryCtaHref: "", // empty string to trigger || "" branch in index.tsx
      },
    });

    render(<Hero />);
    
    const btn = screen.getByText("No Href");
    fireEvent.click(btn);
    
    expect(trackInteraction).toHaveBeenCalledWith("nav_click", { 
      label: "No Href", 
      href: "", 
      location: "navbar" 
    });
  });
});
