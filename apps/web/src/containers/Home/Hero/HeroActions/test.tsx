import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import HeroActions from "./index";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";

// Mock utilities
jest.mock("@/utils/analytics", () => {
  const actual = jest.requireActual("@/utils/analytics");
  return {
    ...actual,
    trackInteraction: jest.fn(),
  };
});

describe("HeroActions Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders with default fallback text when data is empty", () => {
    render(<HeroActions />);
    
    expect(screen.getByText("View Projects")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Resume")).toBeInTheDocument();
  });

  it("renders with dynamic data passed as props", () => {
    const mockData = {
      primaryCtaLabel: "Custom primary",
      primaryCtaHref: "/primary-link",
      secondaryCtaLabel: "Custom secondary",
      secondaryCtaHref: "/secondary-link",
      resumeLabel: "Custom Resume",
      resumeUrl: "/resume-link",
    };

    render(<HeroActions data={mockData} />);
    
    expect(screen.getByText("Custom primary")).toBeInTheDocument();
    expect(screen.getByText("Custom secondary")).toBeInTheDocument();
    expect(screen.getByText("Custom Resume")).toBeInTheDocument();

    expect(screen.getByText("Custom primary")).toHaveAttribute("href", "/primary-link");
    expect(screen.getByText("Custom secondary")).toHaveAttribute("href", "/secondary-link");
    expect(screen.getByText("Custom Resume")).toHaveAttribute("href", "/resume-link");
  });

  it("calls trackInteraction properly on Resume click", () => {
    render(<HeroActions />);
    
    const resumeBtn = screen.getByText("Resume");
    fireEvent.click(resumeBtn);
    
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.RESUME_VIEW, { label: "Hero Resume Button" });
  });

  it("calls trackInteraction properly on other button clicks", () => {
    render(<HeroActions />);
    
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
      primaryCtaLabel: "No Href",
      primaryCtaHref: "", // empty string to trigger fallback
    };

    render(<HeroActions data={mockData} />);
    
    const btn = screen.getByText("No Href");
    fireEvent.click(btn);
    
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.NAV_CLICK, { 
      label: "No Href", 
      href: "", 
      location: "navbar" 
    });
  });
});
