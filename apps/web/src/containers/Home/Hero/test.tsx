import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Hero from "./index";
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

// GSAP choreography is visual only; render the copy as-is.
jest.mock("./HeroStage", () => function MockHeroStage({ children }: { children: React.ReactNode }) { return <div>{children}</div>; });

describe("Hero Container", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the translated name, subtitle and actions", () => {
    renderWithTracking(<Hero />);
    
    expect(screen.getByText("Dival Sehgal")).toBeInTheDocument();
    expect(screen.getByText(/^Senior Software Engineer specialising/)).toBeInTheDocument();
    
    // Default Buttons
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("View Resume")).toBeInTheDocument();
  });

  it("folds the bio under the subtitle without repeating its opening paragraph", () => {
    renderWithTracking(<Hero />);

    expect(document.querySelector("details#about summary")).toHaveTextContent("About Me");
    expect(screen.getByText(/^Recently I've been orchestrating/)).toBeInTheDocument();
    expect(screen.queryByText(/^I'm a Senior Software Engineer with/)).not.toBeInTheDocument();
  });

  it("renders the social links", () => {
    renderWithTracking(<Hero socials={[{ label: "GitHub", href: "https://github.com/x", icon: "github" }]} />);

    expect(screen.getByLabelText("GitHub")).toHaveAttribute("href", "https://github.com/x");
  });

  it("takes links (not copy) from the config", () => {
    renderWithTracking(<Hero data={{ primaryCtaHref: "/work", resumeUrl: "/cv.pdf" }} />);

    expect(screen.getByText("Projects")).toHaveAttribute("href", "/work");
    expect(screen.getByText("View Resume")).toHaveAttribute("href", "/cv.pdf");
  });

  it("puts the portrait at the front of the deck", () => {
    renderWithTracking(<Hero highlights={{ skills: ["React"] }} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Dival Sehgal/);
    expect(screen.getByAltText("Portrait of Dival Sehgal")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("calls trackInteraction properly on Resume click", () => {
    renderWithTracking(<Hero />);
    
    const resumeBtn = screen.getByText("View Resume");
    fireEvent.click(resumeBtn);
    
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.RESUME_VIEW, { label: "Hero Resume Button" });
  });

  it("calls trackInteraction properly on other button clicks", () => {
    renderWithTracking(<Hero />);
    
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

    renderWithTracking(<Hero data={mockData} />);
    
    const btn = screen.getByText("Projects");
    fireEvent.click(btn);
    
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.NAV_CLICK, { 
      label: "Projects", 
      href: "", 
      location: "navbar" 
    });
  });
});
