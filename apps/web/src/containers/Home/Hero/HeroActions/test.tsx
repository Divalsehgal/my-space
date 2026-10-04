import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import HeroActions from "./index";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import { renderWithTracking } from "@/test-utils/render";

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
    renderWithTracking(<HeroActions />);
    
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("View Resume")).toBeInTheDocument();
  });

  it("renders with dynamic data passed as props", () => {
    const mockData = {
      primaryCtaHref: "/primary-link",
      secondaryCtaHref: "/secondary-link",
      resumeUrl: "/resume-link",
    };

    renderWithTracking(<HeroActions data={mockData} />);
    
    // Labels come from translations; hrefs still come from the config.
    expect(screen.getByText("Projects")).toHaveAttribute("href", "/primary-link");
    expect(screen.getByText("Contact")).toHaveAttribute("href", "/secondary-link");
    expect(screen.getByText("View Resume")).toHaveAttribute("href", "/resume-link");
  });

  it("calls trackInteraction properly on Resume click", () => {
    renderWithTracking(<HeroActions />);
    
    const resumeBtn = screen.getByText("View Resume");
    fireEvent.click(resumeBtn);
    
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.RESUME_VIEW, { label: "Hero Resume Button" });
  });

  it("calls trackInteraction properly on other button clicks", () => {
    renderWithTracking(<HeroActions />);
    
    const viewProjectsBtn = screen.getByText("Projects");
    fireEvent.click(viewProjectsBtn);
    
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.NAV_CLICK, { 
      label: "Projects", 
      href: "#projects", 
      location: "navbar" 
    });
  });

  it("handles missing href in trackInteraction (fallback to empty string)", () => {
    const mockData = {
      primaryCtaHref: "", // empty string to trigger fallback
    };

    renderWithTracking(<HeroActions data={mockData} />);
    
    const btn = screen.getByText("Projects");
    fireEvent.click(btn);
    
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.NAV_CLICK, { 
      label: "Projects", 
      href: "", 
      location: "navbar" 
    });
  });
});
